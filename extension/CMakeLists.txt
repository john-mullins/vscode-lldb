file(GLOB Sources
    RELATIVE ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/*.ts)

foreach(File ${Sources})
    get_filename_component(FileName ${File} NAME)
    string(REPLACE ".ts" ".js" FileName ${FileName})
    list(APPEND Outputs ${CMAKE_CURRENT_BINARY_DIR}/${FileName})
endforeach()

add_custom_target(extension ALL
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.json ${Outputs}
)
add_custom_command(
    OUTPUT ${Outputs}
    DEPENDS ${Sources}
    COMMAND ${CMAKE_SOURCE_DIR}/node_modules/.bin/tsc --project ${CMAKE_CURRENT_SOURCE_DIR} --outDir ${CMAKE_CURRENT_BINARY_DIR}
    COMMENT "Building extension"
)

install(
    FILES ${Outputs}
    DESTINATION build/extension
)
