project(debuggee)

# Shared libdebuggee.[so|dylib|dll]
add_library(libdebuggee SHARED
    cpp/libdebuggee/libmain.cpp
)
target_compile_options(libdebuggee PRIVATE -g)
set_target_properties(libdebuggee PROPERTIES OUTPUT_NAME "debuggee")

# without debug info, for testing disassembly
add_library(debuggee_nodebinfo STATIC
    cpp/no_line_info.cpp
)

# debuggee
add_executable(debuggee
    cpp/../cpp/./debuggee.cpp
)
target_compile_options(debuggee PRIVATE -g)
target_link_libraries(debuggee
    debuggee_nodebinfo
    dl
    pthread
)


# rusttypes
add_custom_target(rusttypes
    COMMAND rustc ${CMAKE_CURRENT_SOURCE_DIR}/rust/types.rs -g -o rusttypes
)

add_dependencies(debuggee libdebuggee rusttypes)
