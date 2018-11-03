project(debuggee)

if (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Windows")
    set(WithDebugInfo /Zi)
else()
    set(WithDebugInfo -g)
endif()

# Shared [lib]debuggee2.[so|dylib|dll]
add_library(debuggee2 SHARED
    cpp/libdebuggee/libmain.cpp
)
target_compile_options(debuggee2 PRIVATE ${WithDebugInfo})

# without debug info, for testing disassembly
add_library(debuggee_nodebinfo STATIC
    cpp/no_line_info.cpp
)

# debuggee
add_executable(debuggee
    cpp/../cpp/./debuggee.cpp
)
target_compile_options(debuggee PRIVATE ${WithDebugInfo})

if (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Windows")
    target_link_libraries(debuggee debuggee_nodebinfo)
else()
    target_link_libraries(debuggee debuggee_nodebinfo dl pthread)
endif()

# rusttypes
add_custom_target(rusttypes
    COMMAND rustc ${CMAKE_CURRENT_SOURCE_DIR}/rust/types.rs -g -o rusttypes
)

add_dependencies(debuggee debuggee2 rusttypes)
