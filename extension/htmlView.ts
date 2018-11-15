import {
    commands, workspace, debug, TextDocumentContentProvider, Uri, Event, EventEmitter,
    DebugSession, DebugSessionCustomEvent, ExtensionContext
} from "vscode";
import * as adapter from './adapter';
import { Dict } from './util';

class ActiveDebugSession {
    constructor(adapter: adapter.AdapterProcess, debugSession: DebugSession) {
        this.adapter = adapter;
        this.debugSession = debugSession;
    }
    adapter: adapter.AdapterProcess;
    debugSession: DebugSession;
    previewContent: Dict<string> = {};
}

export class DebuggerHtmlView implements TextDocumentContentProvider {
    launching: [string, adapter.AdapterProcess][] = [];
    activeSessions: Dict<ActiveDebugSession> = {};
    previewContentChanged: EventEmitter<Uri> = new EventEmitter<Uri>();

    constructor(context: ExtensionContext) {
        let subscriptions = context.subscriptions;
        subscriptions.push(debug.onDidStartDebugSession(this.onStartedDebugSession, this));
        subscriptions.push(debug.onDidTerminateDebugSession(this.onTerminatedDebugSession, this));
        subscriptions.push(debug.onDidReceiveDebugSessionCustomEvent(this.onDebugSessionCustomEvent, this));
        subscriptions.push(workspace.registerTextDocumentContentProvider('debugger', this));
    }

    newSession(name: string, adapter: adapter.AdapterProcess) {
        this.launching.push([name, adapter]);
    }

    async provideTextDocumentContent(uri: Uri): Promise<string> {
        if (uri.scheme != 'debugger')
            return null; // Should not happen, as we've only registered for 'debugger'.

        let activeSession = this.activeSessions[uri.authority];
        if (!activeSession) {
            console.error('provideTextDocumentContent: Did not find an active debug session for %s', uri.toString());
            return null;
        }

        let uriString = uri.toString();
        if (activeSession.previewContent.hasOwnProperty(uriString)) {
            return activeSession.previewContent[uriString];
        }
        let result = await activeSession.debugSession.customRequest('provideContent', { uri: uriString });
        return result.content;
    }

    get onDidChange(): Event<Uri> {
        return this.previewContentChanged.event;
    }

    onStartedDebugSession(session: DebugSession) {
        if (session.type == 'lldb') {
            // VSCode does not provide a way to associate a piece of data with a DebugSession
            // being launched via vscode.startDebug, so we are saving AdapterProcess'es in
            // this.launching and then try to re-associate them with correct DebugSessions
            // once we get this notification. >:-(
            for (let i = 0; i < this.launching.length; ++i) {
                let [name, adapter] = this.launching[i];
                if (session.name == name) {
                    this.activeSessions[session.id] = new ActiveDebugSession(adapter, session);
                    this.launching.splice(i, 1);
                    return;
                }
                // Clean out entries that became stale for some reason.
                if (!adapter.isAlive) {
                    this.launching.splice(i--, 1);
                }
            }
        }
    }

    onTerminatedDebugSession(session: DebugSession) {
        if (session.type == 'lldb') {
            let activeSession = this.activeSessions[session.id];
            if (activeSession) {
                // Adapter should exit automatically when VSCode disconnects, but in case it
                // doesn't, we kill it (after giving a bit of time to shut down gracefully).
                setTimeout(() => activeSession.adapter.terminate(), 1500);
            }
            delete this.activeSessions[session.id];
        }
    }

    onDebugSessionCustomEvent(e: DebugSessionCustomEvent) {
        if (e.session.type == 'lldb') {
            if (e.event = 'displayHtml') {
                this.onDisplayHtml(e.session.id, e.body);
            }
        }
    }

    normalizeUri(uri: Uri, sessionId: string): Uri {
        if (uri.scheme && uri.scheme != 'debugger')
            return uri; // Pass through non-debugger URIs.
        return uri.with({ scheme: 'debugger', authority: sessionId });
    }

    async onDisplayHtml(sessionId: string, body: any) {
        let documentUri = this.normalizeUri(Uri.parse(body.uri), sessionId);
        for (let key in body.content) {
            let contentUri = this.normalizeUri(Uri.parse(key), sessionId);
            let content = body.content[key];
            if (content != null) {
                this.activeSessions[sessionId].previewContent[contentUri.toString()] = content;
            } else {
                delete this.activeSessions[sessionId].previewContent[contentUri.toString()];
            }
            if (contentUri.toString() != documentUri.toString()) {
                this.previewContentChanged.fire(contentUri);
            }
        }
        this.previewContentChanged.fire(documentUri);
        await commands.executeCommand('vscode.previewHtml', documentUri.toString(),
            body.position, body.title, { allowScripts: true, allowSvgs: true });
    }
}
