cmake_minimum_required(VERSION 3.10)
project(debuggee)

set(CMAKE_BUILD_TYPE Debug)

# Shared [lib]debuggee2.[so|dylib|dll]
add_library(debuggee2 SHARED
    cpp/libdebuggee/libmain.cpp
)

# without debug info, for testing disassembly
add_library(debuggee_nodebinfo STATIC
    cpp/no_line_info.cpp
)
if (${CMAKE_HOST_SYSTEM_NAME} STREQUAL "Windows")
    target_compile_options(debuggee_nodebinfo PRIVATE /DEBUG:None)
else()
    target_compile_options(debuggee_nodebinfo PRIVATE -g0)
endif()


# debuggee
add_executable(debuggee
    cpp/../cpp/./debuggee.cpp
)

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
