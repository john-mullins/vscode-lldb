import * as zip from 'yauzl';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

export async function download(srcUrl: string, destPath: string) {
    return new Promise((resolve, reject) => {
        let stm = fs.createWriteStream(destPath);
        https.get(srcUrl, response => {
            response.pipe(stm);
            response.on('end', resolve);
            response.on('error', reject);
        });
    });
}

export async function zipExtract(zipPath: string, destDir: string) {
    return new Promise((resolve, reject) =>
        zip.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                reject(err)
            } else {
                zipfile.readEntry();
                zipfile.on('entry', (entry: zip.Entry) => {
                    if (entry.fileName.endsWith('/')) {
                        fs.mkdir(path.join(destDir, entry.fileName), (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                zipfile.readEntry();
                            }
                        });
                    } else {
                        zipfile.openReadStream(entry, null, (err, stream) => {
                            if (err) {
                                reject(err);
                            } else {
                                let file = fs.createWriteStream(path.join(destDir, entry.fileName));
                                stream.pipe(file);
                                stream.on('error', reject);
                                stream.on('end', () => {
                                    zipfile.readEntry()
                                });
                            }
                        });
                    }
                });
                zipfile.on('end', () => {
                    zipfile.close();
                    resolve();
                });
                zipfile.on('error', reject);
            }
        })
    );
}
