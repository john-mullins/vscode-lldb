if (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Linux")
    file(GLOB_RECURSE LldbPythonFiles
        RELATIVE ${LLDB_ROOT}
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
    file(GLOB_RECURSE LldbPythonFiles RELATIVE ${LLDB_ROOT}
        "${LLDB_ROOT}/lib/python2.7/site-packages/*"
    )
    set(LldbFiles
        bin/lldb
        bin/debugserver
        lib/liblldb.dylib
        lib/liblldb.8.0.0.dylib
        ${LldbPythonFiles}
    )
elseif (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Windows")
    file(GLOB_RECURSE LldbPythonFiles RELATIVE ${LLDB_ROOT}
        "${LLDB_ROOT}/lib/site-packages/*"
    )
    set(LldbFiles
        bin/lldb.exe
        bin/liblldb.dll
        ${LldbPythonFiles}
    )
else()
    message(FATAL_ERROR "${CMAKE_HOST_SYSTEM_NAME} not supported." )
endif()

foreach(File ${LldbFiles})
    if (NOT ${File} MATCHES "lldb/_lldb.*")
        set(OutputFile ${CMAKE_CURRENT_BINARY_DIR}/${File})
        add_custom_command(
            OUTPUT ${OutputFile}
            DEPENDS ${LLDB_ROOT}/${File}
            COMMAND ${CMAKE_COMMAND} -E copy_if_different ${LLDB_ROOT}/${File} ${OutputFile}
            COMMENT "Copying ${File}"
        )
        list(APPEND OutFiles ${OutputFile})
    endif()
endforeach()

add_custom_target(lldb ALL
    DEPENDS ${OutFiles}
)
