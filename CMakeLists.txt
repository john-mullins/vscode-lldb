cmake_minimum_required(VERSION 3.10)

include(cmake/CopyFiles.cmake)

set(LLDB_ROOT $ENV{LLDB_ROOT} CACHE PATH "Root of LLDB build directory")
if (NOT LLDB_ROOT)
    message(FATAL_ERROR "LLDB_ROOT not set." )
endif()

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY_DEBUG "${OUTPUT_DIRECTORY}")
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY_RELEASE "${OUTPUT_DIRECTORY}")
set(CMAKE_COMPILE_PDB_OUTPUT_DIRECTORY "${OUTPUT_DIRECTORY}")
set(CMAKE_INSTALL_PREFIX $ENV{HOME}/.vscode/extensions/vscode-lldb)

add_subdirectory(adapter2)
add_subdirectory(lldb)
add_subdirectory(debuggee)
add_subdirectory(extension)
add_subdirectory(tests)

### Test

set(MochaCommand ${CMAKE_SOURCE_DIR}/node_modules/.bin/mocha.cmd
    -u tdd
    --timeout 10000
    --exit
    --require source-map-support/register
    \${MOCHA_ARGS}
    ${CMAKE_BINARY_DIR}/tests/tests
)

add_custom_target(test_adapter
    DEPENDS tests lldb debuggee
    COMMAND ${MochaCommand}
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    USES_TERMINAL
)

add_custom_target(test_adapter2
    DEPENDS tests codelldb debuggee
    COMMAND ${CMAKE_COMMAND} -E env USE_CODELLDB=1 ${MochaCommand}
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    USES_TERMINAL
)

### Install

set(ExtensionRoot $ENV{HOME}/.vscode/extensions/vscode-lldb)
install(CODE "file(REMOVE_RECURSE \"${ExtensionRoot}\")")

install(
    FILES package.json README.md MANUAL.md CHANGELOG.md
    DESTINATION .
)
install(
    DIRECTORY adapter images syntaxes formatters
    DESTINATION .
)
