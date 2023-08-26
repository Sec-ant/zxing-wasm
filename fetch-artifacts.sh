#!/usr/bin/env bash

# Define variables
ZXING_WASM_READER_SAVE_PATH="reader"
ZXING_WASM_READER=$ZXING_WASM_REPO_URL/$ZXING_WASM_PATH/$ZXING_WASM_READER_NAME
ZXING_WASM_WRITER_SAVE_PATH="writer"
ZXING_WASM_WRITER=$ZXING_WASM_REPO_URL/$ZXING_WASM_PATH/$ZXING_WASM_WRITER_NAME
ZXING_WASM_FULL_SAVE_PATH="full"
ZXING_WASM_FULL=$ZXING_WASM_REPO_URL/$ZXING_WASM_PATH/$ZXING_WASM_FULL_NAME

# Function to get progress bar
get_progress_bar() {
  local progress=$1
  local length=$2
  local completed=$((progress * length / 100))
  local remaining=$((length - completed))
  printf "[%-${completed}s%${remaining}s]" '' ''
}

# Function to get total progress
get_total_progress() {
  local total=$1
  local completed=$2
  local progress=$((completed * 100 / total))
  echo "Total progress: $(get_progress_bar $progress 20) $progress%"
}

# Download Reader files in the background
curl --silent --create-dirs --output-dir "src/$ZXING_WASM_READER_SAVE_PATH" -L# "$ZXING_WASM_READER.js" -o "zxing_reader.js" &
curl --silent --create-dirs --output-dir "public/$ZXING_WASM_READER_SAVE_PATH" -L#O "$ZXING_WASM_READER.wasm" &

# Download Writer files in the background
curl --silent --create-dirs --output-dir "src/$ZXING_WASM_WRITER_SAVE_PATH" -L# "$ZXING_WASM_WRITER.js" -o "zxing_writer.js" &
curl --silent --create-dirs --output-dir "public/$ZXING_WASM_WRITER_SAVE_PATH" -L#O "$ZXING_WASM_WRITER.wasm" &

# Download Full files in the background
curl --silent --create-dirs --output-dir "src/$ZXING_WASM_FULL_SAVE_PATH" -L# "$ZXING_WASM_FULL.js" -o "zxing_full.js" &
curl --silent --create-dirs --output-dir "public/$ZXING_WASM_FULL_SAVE_PATH" -L#O "$ZXING_WASM_FULL.wasm" &

# Wait for all the background jobs to finish
total=6 # number of files to download
completed=0
while [[ $(jobs -r | wc -l) -gt 0 ]]; do
  new_completed=$(($total - $(jobs -r | wc -l)))
  if [[ $new_completed -gt $completed ]]; then
    completed=$new_completed
    clear
    get_total_progress $total $completed
  fi
  sleep 0.1
done

# Create symbolic links
ln -srf "public/$ZXING_WASM_READER_SAVE_PATH/$ZXING_WASM_READER_NAME.wasm" "src/$ZXING_WASM_READER_SAVE_PATH/"
ln -srf "public/$ZXING_WASM_WRITER_SAVE_PATH/$ZXING_WASM_WRITER_NAME.wasm" "src/$ZXING_WASM_WRITER_SAVE_PATH/"
ln -srf "public/$ZXING_WASM_FULL_SAVE_PATH/$ZXING_WASM_FULL_NAME.wasm" "src/$ZXING_WASM_FULL_SAVE_PATH/"

# Display completion message
clear
echo "Download completed successfully!"
