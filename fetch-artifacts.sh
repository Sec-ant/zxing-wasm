#!/usr/bin/env bash

# Reader
ZXING_WASM_READER_SAVE_PATH="reader"
ZXING_WASM_READER=$ZXING_WASM_REPO_URL/$ZXING_WASM_PATH/$ZXING_WASM_READER_NAME
curl --create-dirs --output-dir "src/$ZXING_WASM_READER_SAVE_PATH" -L# "$ZXING_WASM_READER.js" -o "zxing_reader.js"
curl --create-dirs --output-dir "public/$ZXING_WASM_READER_SAVE_PATH" -L#O "$ZXING_WASM_READER.wasm"
ln -srf "public/$ZXING_WASM_READER_SAVE_PATH/$ZXING_WASM_READER_NAME.wasm" "src/$ZXING_WASM_READER_SAVE_PATH/"

# Writer
ZXING_WASM_WRITER_SAVE_PATH="writer"
ZXING_WASM_WRITER=$ZXING_WASM_REPO_URL/$ZXING_WASM_PATH/$ZXING_WASM_WRITER_NAME
curl --create-dirs --output-dir "src/$ZXING_WASM_WRITER_SAVE_PATH" -L# "$ZXING_WASM_WRITER.js" -o "zxing_writer.js"
curl --create-dirs --output-dir "public/$ZXING_WASM_WRITER_SAVE_PATH" -L#O "$ZXING_WASM_WRITER.wasm"
ln -srf "public/$ZXING_WASM_WRITER_SAVE_PATH/$ZXING_WASM_WRITER_NAME.wasm" "src/$ZXING_WASM_WRITER_SAVE_PATH/"

# Full
ZXING_WASM_FULL_SAVE_PATH="full"
ZXING_WASM_FULL=$ZXING_WASM_REPO_URL/$ZXING_WASM_PATH/$ZXING_WASM_FULL_NAME
curl --create-dirs --output-dir "src/$ZXING_WASM_FULL_SAVE_PATH" -L# "$ZXING_WASM_FULL.js" -o "zxing_full.js"
curl --create-dirs --output-dir "public/$ZXING_WASM_FULL_SAVE_PATH" -L#O "$ZXING_WASM_FULL.wasm"
ln -srf "public/$ZXING_WASM_FULL_SAVE_PATH/$ZXING_WASM_FULL_NAME.wasm" "src/$ZXING_WASM_FULL_SAVE_PATH/"
