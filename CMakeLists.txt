cmake_minimum_required(VERSION 3.10)

set(LLDB_ROOT $ENV{LLDB_ROOT} CACHE PATH "Root of LLDB build directory")
set(CMAKE_CXX_STANDARD 11)

add_subdirectory(debuggee)
add_subdirectory(extension)
add_subdirectory(tests)

set(CMakeCmd ${CMAKE_COMMAND} -E )

if (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Linux")
    set(CodeLldbFiles
        target/debug/codelldb
        target/debug/libcodelldb.so
    )
    file(GLOB_RECURSE LldbPythonFiles RELATIVE ${LLDB_ROOT}
        "${LLDB_ROOT}/lib/python2.7/site-packages/*"
    )
    set(LldbFiles
        bin/lldb
        bin/lldb-server
        lib/liblldb.so
        lib/liblldb.so.8svn
        ${LldbPythonFiles}
    )
elseif (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Darwin")
    set(CodeLldbFiles
        target/debug/codelldb
        target/debug/libcodelldb.dylib
    )
    file(GLOB_RECURSE LldbPythonFiles RELATIVE ${LLDB_ROOT}
        "${LLDB_ROOT}/lib/python2.7/site-packages/*"
    )
    set(LldbFiles
        bin/lldb
        lib/liblldb.dylib
        ${LldbPythonFiles}
    )
elseif (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Windows")
    set(CodeLldbFiles
        target/debug/codelldb.exe
        target/debug/libcodelldb.dll
    )
    file(GLOB_RECURSE LldbPythonFiles RELATIVE ${LLDB_ROOT}
        "${LLDB_ROOT}/lib/site-packages/*"
    )
    set(LldbFiles
        bin/lldb.exe
        lib/liblldb.dll
        ${LldbPythonFiles}
    )
else()
    message(FATAL_ERROR "${CMAKE_HOST_SYSTEM_NAME} not supported." )
endif()

list(APPEND CodeLldbFiles adapter2/codelldb.py adapter2/value.py formatters/rust.py)

add_custom_target(lldb ALL)
foreach(File ${LldbFiles})
    if (NOT ${File} MATCHES "lldb/_lldb.*")
        add_custom_command(
            TARGET lldb
            MAIN_DEPENDENCY ${LLDB_ROOT}/${File}
            COMMAND ${CMakeCmd} copy_if_different ${LLDB_ROOT}/${File} ${CMAKE_CURRENT_BINARY_DIR}/lldb/${File}
        )
    endif()
endforeach()

add_custom_target(cargo_build
    COMMAND cargo build)

add_custom_target(codelldb ALL DEPENDS lldb cargo_build)
foreach(File ${CodeLldbFiles})
    get_filename_component(FileName ${File} NAME)
    add_custom_command(
        TARGET codelldb
        MAIN_DEPENDENCY ${CMAKE_SOURCE_DIR}/${File}
        COMMAND ${CMakeCmd} copy_if_different ${CMAKE_SOURCE_DIR}/${File} ${CMAKE_CURRENT_BINARY_DIR}/adapter2/${FileName}
    )
endforeach()

### Test

set(MochaArgs ${CMAKE_SOURCE_DIR}/node_modules/mocha/bin/_mocha
    -u tdd
    --timeout 10000
    --exit
    --require source-map-support/register
    \${MOCHA_ARGS}
    ${CMAKE_BINARY_DIR}/tests/tests)

add_custom_target(test_adapter
    DEPENDS tests lldb debuggee
    COMMAND ${MochaArgs} --retries 3
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
)

add_custom_target(test_adapter2
    DEPENDS tests codelldb debuggee
    COMMAND USE_CODELLDB=1 ${MochaArgs}
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
)
