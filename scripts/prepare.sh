#!/usr/bin/env bash

git clone --depth 1 --branch main https://github.com/emscripten-core/emsdk.git ../emsdk
cd ../emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd -

git submodule update --init
emcmake cmake -S src/cpp -B build
cmake --build build -j$(($(nproc) - 1))

curl -L https://github.com/jqlang/jq/releases/latest/download/jq-linux-amd64 -o jq
chmod a+x jq

BIOME_VERSION=$(npm -j ls | ./jq -r '.dependencies["@biomejs/biome"].version')
npm i -DE biome-cli-codesandbox@$BIOME_VERSION

npm pkg set scripts.lint="BIOME_BINARY=biome-cli-codesandbox/biome $(npm pkg get scripts.lint | ./jq -r)"
npm pkg set scripts['format:biome']="BIOME_BINARY=biome-cli-codesandbox/biome $(npm pkg get scripts['format:biome'] | ./jq -r)"
npm pkg set scripts['check:biome']="BIOME_BINARY=biome-cli-codesandbox/biome $(npm pkg get scripts['check:biome'] | ./jq -r)"

rm jq