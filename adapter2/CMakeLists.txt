if (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Linux")
    set(CodeLldbFiles
        target/debug/codelldb
        target/debug/libcodelldb.so
    )
elseif (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Darwin")
    set(CodeLldbFiles
        target/debug/codelldb
        target/debug/libcodelldb.dylib
    )
elseif (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Windows")
    set(CodeLldbFiles
        target/debug/codelldb.exe
        target/debug/codelldb.dll
    )
else()
    message(FATAL_ERROR "${CMAKE_HOST_SYSTEM_NAME} not supported." )
endif()

list(APPEND CodeLldbFiles adapter2/codelldb.py adapter2/value.py formatters/rust.py)

foreach(File ${CodeLldbFiles})
    get_filename_component(FileName ${File} NAME)
    set(OutputFile ${CMAKE_CURRENT_BINARY_DIR}/${FileName})
    add_custom_command(
        OUTPUT ${OutputFile}
        DEPENDS ${CMAKE_SOURCE_DIR}/${File}
        COMMAND ${CMAKE_COMMAND} -E copy_if_different ${CMAKE_SOURCE_DIR}/${File} ${OutputFile}
        COMMENT "Copying ${File}"
    )
    list(APPEND OutFiles ${OutputFile})
endforeach()

add_custom_target(cargo_build
    COMMAND ${CMAKE_COMMAND} -E env LLDB_ROOT=${LLDB_ROOT} cargo build
    COMMENT "Running cargo build"
)

add_custom_target(codelldb ALL
    DEPENDS lldb cargo_build ${OutFiles}
)
