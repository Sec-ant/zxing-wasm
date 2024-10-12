# Minimum required version and project name
cmake_minimum_required(VERSION 3.14)
project(ZXingWasm)

# Include custom cmake modules and add packages
include(${CMAKE_CURRENT_SOURCE_DIR}/../../zxing-cpp/zxing.cmake)
zxing_add_package_stb()

# Set C++ standard
set(CMAKE_CXX_STANDARD 20)
# Disable examples
option(ZXING_EXAMPLES "Build the example barcode reader/writer applications" OFF)
# Build options
option(ZXING_READERS "Build with reader support (decoders)" ON)
set(ZXING_WRITERS "OLD" CACHE STRING "Build with old and/or new writer (encoder) backend (OFF/ON/OLD/NEW/BOTH)")

# Build environment
set(ZXING_EMSCRIPTEN_ENVIRONMENT "web,worker" CACHE STRING "Optimize build for given emscripten runtime environment (web/node/shell/worker)")

# Default build type
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE "Release" CACHE STRING "Choose the type of build." FORCE)
endif()

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
  -s FILESYSTEM=0 \
  -s EXPORT_ES6=1 \
  -s USE_ES6_IMPORT_META=0 \
  -s MODULARIZE=1 \
  -s MIN_SAFARI_VERSION=130000 \
  -s DYNAMIC_EXECUTION=0 \
  -s EXPORT_NAME=ZXing \
  -s EXPORTED_FUNCTIONS=\"['_malloc', '_free']\" \
  -s ALLOW_MEMORY_GROWTH=1"
)

# Add subdirectories
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../../zxing-cpp/core ${CMAKE_BINARY_DIR}/ZXing)

# Build targets
if(ZXING_READERS AND ZXING_WRITERS)
  add_executable(zxing_full ZXingWasm.cpp)
  target_compile_definitions(zxing_full PRIVATE READER WRITER)
  target_link_libraries(zxing_full ZXing::ZXing stb::stb)
  set_target_properties(zxing_full PROPERTIES 
                        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../full")
endif()

if(ZXING_READERS)
  add_executable(zxing_reader ZXingWasm.cpp)
  target_compile_definitions(zxing_reader PRIVATE READER)
  target_link_libraries(zxing_reader ZXing::ZXing stb::stb)
  set_target_properties(zxing_reader PROPERTIES 
                        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../reader")
endif()

if(ZXING_WRITERS)
  add_executable(zxing_writer ZXingWasm.cpp)
  target_compile_definitions(zxing_writer PRIVATE WRITER)
  target_link_libraries(zxing_writer ZXing::ZXing stb::stb)
  set_target_properties(zxing_writer PROPERTIES 
                        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../writer")
endif()
