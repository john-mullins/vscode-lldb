add_custom_target(extension ALL
    COMMAND ${CMAKE_SOURCE_DIR}/node_modules/.bin/tsc --project ${CMAKE_CURRENT_SOURCE_DIR} --outDir ${CMAKE_CURRENT_BINARY_DIR}
)
