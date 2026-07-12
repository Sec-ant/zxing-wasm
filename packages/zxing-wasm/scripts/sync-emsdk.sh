#!/bin/bash

# Extract the current emcc version number
EMCC_VERSION=$(emcc --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1)

# Define the path to the action.yml file
ACTIONS_FILE=".github/actions/setup/action.yml"

# Use awk to update the default value of emsdk-version while preserving formatting
awk -v version="$EMCC_VERSION" '
# Check if the line contains "default:" and the version number pattern
{
  if ($1 ~ /^[[:space:]]*default:$/ && $2 ~ /^[0-9]+\.[0-9]+\.[0-9]+$/) {
    # Replace the version number while preserving the indentation
    sub(/[0-9]+\.[0-9]+\.[0-9]+/, version)
  }
  print
}
' $ACTIONS_FILE >tmpfile && mv tmpfile $ACTIONS_FILE

# Notify the user of a successful update
echo "Updated EMSDK version to $EMCC_VERSION in $ACTIONS_FILE"
