cmake_minimum_required(VERSION 3.10)

set(LLDB_ROOT $ENV{LLDB_ROOT} CACHE PATH "Root of LLDB build directory")
if (NOT LLDB_ROOT)
    message(FATAL_ERROR "LLDB_ROOT not set." )
endif()

set(CMAKE_CXX_STANDARD 11)

add_subdirectory(adapter2)
add_subdirectory(lldb)
add_subdirectory(debuggee)
add_subdirectory(extension)
add_subdirectory(tests)

### Test

set(MochaCommand ${CMAKE_SOURCE_DIR}/node_modules/mocha/bin/_mocha
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
)

add_custom_target(test_adapter2
    DEPENDS tests codelldb debuggee
    COMMAND USE_CODELLDB=1 ${MochaCommand}
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
)
