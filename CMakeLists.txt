cmake_minimum_required(VERSION 3.10)

include(cmake/CopyFiles.cmake)

set(LLDB_ROOT $ENV{LLDB_ROOT} CACHE PATH "Root of LLDB build directory")
if (NOT LLDB_ROOT)
    message(FATAL_ERROR "LLDB_ROOT not set." )
endif()

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_INSTALL_PREFIX $ENV{HOME}/.vscode/extensions/vscode-lldb CACHE PATH "Install location")

if (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Windows")
    set(NodeProgExt .cmd)
endif()

set(ExtensionRoot ${CMAKE_CURRENT_BINARY_DIR}/vscode-lldb)

add_subdirectory(adapter2)
add_subdirectory(lldb)
add_subdirectory(extension)
add_subdirectory(tests)

### Adapter and package

add_copy_files(adapter
    DESTINATION ${ExtensionRoot}/adapter
    GLOB ${CMAKE_SOURCE_DIR}/adapter/*.py
)
add_copy_files(formatters
    DESTINATION ${ExtensionRoot}/formatters
    GLOB ${CMAKE_SOURCE_DIR}/formatters/*.py
)
add_dependencies(adapter formatters)
add_copy_files(images
    DESTINATION ${ExtensionRoot}/images
    GLOB ${CMAKE_SOURCE_DIR}/images/*
)
add_copy_files(syntaxes
    DESTINATION ${ExtensionRoot}/syntaxes
    GLOB ${CMAKE_SOURCE_DIR}/syntaxes/*
)
add_copy_files(manifest
    DESTINATION ${ExtensionRoot}
    FILES package.json README.md MANUAL.md CHANGELOG.md
)

if (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Linux")
    set(StripFiles strip
                   ${ExtensionRoot}/adapter2/codelldb
                   ${ExtensionRoot}/adapter2/libcodelldb.so
                   ${ExtensionRoot}/lldb/bin/lldb
                   ${ExtensionRoot}/lldb/bin/lldb-server
                   ${ExtensionRoot}/lldb/lib/liblldb.so
                   ${ExtensionRoot}/lldb/lib/liblldb.so.8svn
                   ${ExtensionRoot}/lldb/lib/python2.7/site-packages/lldb/lldb-argdumper
                   )
endif()

add_custom_target(vspackage ALL
    DEPENDS adapter formatters images manifest lldb codelldb
    COMMAND ${StripFiles}
    COMMAND vsce package -o ${CMAKE_CURRENT_BINARY_DIR}/vscode-lldb.vsix
    WORKING_DIRECTORY ${ExtensionRoot}
)

### Debuggee

if (NOT ${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Windows")
    file(MAKE_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/debuggee)
    execute_process(
        COMMAND ${CMAKE_COMMAND} ${CMAKE_SOURCE_DIR}/debuggee -G "${CMAKE_GENERATOR}"
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/debuggee
    )
    add_custom_target(debuggee
        COMMAND ${CMAKE_COMMAND} --build ${CMAKE_CURRENT_BINARY_DIR}/debuggee
    )
else()
    # On Windows we want to check both MSVC PDB and GNU DWARF debug info kinds.
    file(MAKE_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/debuggee-msvc)
    execute_process(
        COMMAND ${CMAKE_COMMAND} ${CMAKE_SOURCE_DIR}/debuggee -G "${CMAKE_GENERATOR}" -DCMAKE_C_COMPILER=cl -DCMAKE_CXX_COMPILER=cl
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/debuggee-msvc
    )
    file(MAKE_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/debuggee-gnu)
    execute_process(
        COMMAND ${CMAKE_COMMAND} ${CMAKE_SOURCE_DIR}/debuggee -G "${CMAKE_GENERATOR}" -DCMAKE_C_COMPILER=gcc -DCMAKE_CXX_COMPILER=g++
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/debuggee-gnu
    )
    add_custom_target(debuggee
        COMMAND ${CMAKE_COMMAND} --build ${CMAKE_CURRENT_BINARY_DIR}/debuggee-msvc
        COMMAND ${CMAKE_COMMAND} --build ${CMAKE_CURRENT_BINARY_DIR}/debuggee-gnu
    )
endif()

### Tests

set(MochaCommand "${CMAKE_SOURCE_DIR}/node_modules/.bin/mocha${NodeProgExt}"
    -u tdd
    --timeout 15000
    --exit
    --require source-map-support/register
    \${MOCHA_ARGS}
    ${CMAKE_BINARY_DIR}/tests/tests
)

if (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Windows")
    add_custom_target(test_adapter_gnu
        DEPENDS debuggee adapter lldb tests
        COMMAND ${CMAKE_COMMAND} -E env TARGET_TRIPLE=x86_64-pc-windows-gnu ${MochaCommand}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
    add_custom_target(test_adapter2_gnu
        DEPENDS debuggee codelldb tests
        COMMAND ${CMAKE_COMMAND} -E env USE_CODELLDB=1 TARGET_TRIPLE=x86_64-pc-windows-gnu ${MochaCommand}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
    add_custom_target(test_adapter_msvc
        DEPENDS debuggee adapter lldb tests
        COMMAND ${CMAKE_COMMAND} -E env TARGET_TRIPLE=x86_64-pc-windows-msvc ${MochaCommand}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
    add_custom_target(test_adapter2_msvc
        DEPENDS debuggee codelldb tests
        COMMAND ${CMAKE_COMMAND} -E env USE_CODELLDB=1 TARGET_TRIPLE=x86_64-pc-windows-msvc ${MochaCommand}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
    add_custom_target(test_adapter
        DEPENDS test_adapter_gnu test_adapter_msvc)
    add_custom_target(test_adapter2
        DEPENDS test_adapter2_gnu test_adapter2_msvc)
else()
    add_custom_target(test_adapter
        DEPENDS debuggee adapter lldb tests
        COMMAND ${CMAKE_COMMAND} -E env TARGET_TRIPLE=x86_64-unknown-linux-gnu ${MochaCommand}
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
    add_custom_target(test_adapter2
        DEPENDS debuggee codelldb tests
        COMMAND ${CMAKE_COMMAND} -E env USE_CODELLDB=1 TARGET_TRIPLE=x86_64-unknown-linux-gnu ${MochaCommand}
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
endif()

### Install

install(CODE "file(REMOVE_RECURSE \"${CMAKE_INSTALL_PREFIX}/vscode-lldb\")")
install(
    DIRECTORY ${ExtensionRoot}
    DESTINATION .
)
