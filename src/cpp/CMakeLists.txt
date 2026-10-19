# Minimum required version and project name
cmake_minimum_required(VERSION 3.19)
project(ZXingWasm)

# Include custom cmake modules and add packages
include(${CMAKE_CURRENT_SOURCE_DIR}/../../zxing-cpp/zxing.cmake)
zxing_add_package_stb()

# Set C++ standard
set(CMAKE_CXX_STANDARD 20)

# Disable examples
set(ZXING_EXAMPLES OFF)

# Build options
if (${TARGET} MATCHES "READER")
  set(ZXING_READERS ON)
  set(ZXING_WRITERS OFF)
elseif (${TARGET} MATCHES "WRITER")
  set(ZXING_READERS OFF)
  set(ZXING_WRITERS "NEW")
else()
  set(ZXING_READERS ON)
  set(ZXING_WRITERS "NEW")
endif()
set(ZXING_EXPERIMENTAL_API ON)
set(ZXING_USE_BUNDLED_ZINT ON)

# Build environment
set(ZXING_EMSCRIPTEN_ENVIRONMENT "web,worker")

# Default build type
set(CMAKE_BUILD_TYPE "Release")

# ThinLTO and legacy codegen limit bulk-memory instructions in project code.
set(ZXING_WASM_FLAGS -flto=thin -mno-bulk-memory -mno-bulk-memory-opt -mno-nontrapping-fptoint)
add_compile_options(${ZXING_WASM_FLAGS})
add_link_options(${ZXING_WASM_FLAGS})

# Keep musl's scalar memset outside LTO to preserve its fast legacy implementation.
add_library(legacy_memset OBJECT "${EMSCRIPTEN_ROOT_PATH}/system/lib/libc/musl/src/string/memset.c")
target_compile_options(legacy_memset PRIVATE -fno-lto -fno-builtin-memset)

# Set compiler flags
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
  -fexceptions \
  -s DISABLE_EXCEPTION_CATCHING=0")

# Set linker flags
set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} \
  -lembind \
  -fexceptions \
  -s DISABLE_EXCEPTION_CATCHING=0 \
  -s ENVIRONMENT=${ZXING_EMSCRIPTEN_ENVIRONMENT} \
  -s EXPORTED_RUNTIME_METHODS=HEAPU8 \
  -s FILESYSTEM=0 \
  -s EXPORT_ES6=1 \
  -s MODULARIZE=1 \
  -s INCOMING_MODULE_JS_API=\"['ENVIRONMENT','arguments','canvas','dynamicLibraries','elementPointerLock','instantiateWasm','locateFile','monitorRunDependencies','noExitRuntime','noInitialRun','onAbort','onExit','onRuntimeInitialized','postRun','preInit','preRun','print','printErr','setStatus','statusMessage','stderr','stdin','stdout','thisProgram','wasm','websocket','wasmBinary']\" \
  -s MIN_SAFARI_VERSION=150000 \
  -s WASM_BIGINT=0 \
  -s DYNAMIC_EXECUTION=0 \
  -s EXPORT_NAME=ZXing \
  -s EXPORTED_FUNCTIONS=\"['_malloc', '_free']\" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s STACK_SIZE=5242880"
)

# Add subdirectories
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../../zxing-cpp/core ${CMAKE_BINARY_DIR}/ZXing)

# Build targets
if(${TARGET} MATCHES "READER")
  add_executable(zxing_reader ZXingWasm.cpp StbImage.cpp)
  target_compile_definitions(zxing_reader PRIVATE READER)
  target_link_libraries(zxing_reader ZXing::ZXing stb::stb)
  set_target_properties(zxing_reader PROPERTIES 
                        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../reader")
elseif(${TARGET} MATCHES "WRITER")
  add_executable(zxing_writer ZXingWasm.cpp StbImageWrite.cpp)
  target_compile_definitions(zxing_writer PRIVATE WRITER)
  target_link_libraries(zxing_writer ZXing::ZXing stb::stb)
  set_target_properties(zxing_writer PROPERTIES 
                        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../writer")
else()
  add_executable(zxing_full ZXingWasm.cpp StbImage.cpp StbImageWrite.cpp)
  target_compile_definitions(zxing_full PRIVATE READER WRITER)
  target_link_libraries(zxing_full ZXing::ZXing stb::stb)
  set_target_properties(zxing_full PROPERTIES 
                        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../full")
endif()

# Binaryen lowers newer compiler instructions to our browser-compatible profile.
execute_process(COMMAND em-config BINARYEN_ROOT
                OUTPUT_VARIABLE BINARYEN_ROOT OUTPUT_STRIP_TRAILING_WHITESPACE
                COMMAND_ERROR_IS_FATAL ANY)
find_program(WASM_OPT wasm-opt HINTS "${BINARYEN_ROOT}/bin" REQUIRED)
foreach(target zxing_reader zxing_writer zxing_full)
  if(TARGET ${target})
    target_link_libraries(${target} legacy_memset)
    set(wasm "$<TARGET_FILE_DIR:${target}>/${target}.wasm")
    add_custom_command(TARGET ${target} POST_BUILD
      COMMAND "${WASM_OPT}" "${wasm}"
              --enable-bulk-memory --enable-bulk-memory-opt
              --enable-nontrapping-float-to-int --enable-mutable-globals --enable-sign-ext
              --llvm-memory-copy-fill-lowering --llvm-nontrapping-fptoint-lowering
              -o "${wasm}"
      COMMAND "${WASM_OPT}" "${wasm}" --mvp-features
              --enable-mutable-globals --enable-sign-ext -O3 -o "${wasm}" --quiet
      COMMENT "Lowering, optimizing and validating ${target}.wasm for legacy browsers"
      VERBATIM)
  endif()
endforeach()
