if (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Linux")
    file(GLOB_RECURSE LldbPythonFiles
        RELATIVE ${LLDB_ROOT}
        "${LLDB_ROOT}/lib/python2.7/site-packages/*"
    )
    set(LldbExecutables
        bin/lldb
        bin/lldb-server
    )
    set(LldbFiles
        lib/liblldb.so
        lib/liblldb.so.8svn
        ${LldbPythonFiles}
    )
elseif (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Darwin")
    file(GLOB_RECURSE LldbPythonFiles RELATIVE ${LLDB_ROOT}
        "${LLDB_ROOT}/lib/python2.7/site-packages/*"
    )
    set(LldbExecutables
        bin/lldb
        bin/debugserver
    )
    set(LldbFiles
        lib/liblldb.dylib
        lib/liblldb.8.0.0.dylib
        ${LldbPythonFiles}
    )
elseif (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Windows")
    file(GLOB_RECURSE LldbPythonFiles RELATIVE ${LLDB_ROOT}
        "${LLDB_ROOT}/lib/site-packages/*"
    )
    set(LldbExecutables
        bin/lldb.exe
    )
    set(LldbFiles
        bin/liblldb.dll
        ${LldbPythonFiles}
    )
else()
    message(FATAL_ERROR "${CMAKE_HOST_SYSTEM_NAME} not supported." )
endif()

foreach(File ${LldbFiles};${LldbExecutables})
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

foreach(File ${LldbExecutables})
    install(PROGRAMS ${CMAKE_CURRENT_BINARY_DIR}/${File} DESTINATION build/lldb/bin)
endforeach()

install(DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/lib DESTINATION build/lldb)
