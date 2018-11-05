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

add_subdirectory(adapter2)
add_subdirectory(lldb)
add_subdirectory(extension)
add_subdirectory(tests)

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
    --timeout 10000
    --exit
    --require source-map-support/register
    \${MOCHA_ARGS}
    ${CMAKE_BINARY_DIR}/tests/tests
)

if (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Windows")
    add_custom_target(test_adapter_gnu
        DEPENDS debuggee lldb tests
        COMMAND ${CMAKE_COMMAND} -E env TARGET_DIR=${CMAKE_CURRENT_BINARY_DIR}/debuggee-gnu ${MochaCommand}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
    add_custom_target(test_adapter2_gnu
        DEPENDS debuggee codelldb tests
        COMMAND ${CMAKE_COMMAND} -E env USE_CODELLDB=1 TARGET_DIR=${CMAKE_CURRENT_BINARY_DIR}/debuggee-gnu ${MochaCommand}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
    add_custom_target(test_adapter_msvc
        DEPENDS debuggee lldb tests
        COMMAND ${CMAKE_COMMAND} -E env TARGET_DIR=${CMAKE_CURRENT_BINARY_DIR}/debuggee-msvc ${MochaCommand}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
    add_custom_target(test_adapter2_msvc
        DEPENDS debuggee codelldb tests
        COMMAND ${CMAKE_COMMAND} -E env USE_CODELLDB=1 TARGET_DIR=${CMAKE_CURRENT_BINARY_DIR}/debuggee-msvc ${MochaCommand}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
    add_custom_target(test_adapter
        DEPENDS test_adapter_gnu test_adapter_msvc)
    add_custom_target(test_adapter2
        DEPENDS test_adapter2_gnu test_adapter2_msvc)
else()
    add_custom_target(test_adapter
        DEPENDS debuggee lldb tests
        COMMAND ${CMAKE_COMMAND} -E env TARGET_DIR=${CMAKE_CURRENT_BINARY_DIR}/debuggee ${MochaCommand}
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
    add_custom_target(test_adapter2
        DEPENDS debuggee codelldb tests
        COMMAND ${CMAKE_COMMAND} -E env USE_CODELLDB=1 TARGET_DIR=${CMAKE_CURRENT_BINARY_DIR}/debuggee ${MochaCommand}
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        USES_TERMINAL WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    )
endif()

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
    PATTERN "*.pyc" EXCLUDE
)
