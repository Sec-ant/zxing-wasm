#!/bin/bash

PATCH_FILE="./emscripten.patch"
EMSCRIPTEN_DIR="$(dirname "$(which emcc)")"

# First, check if the patch is already applied
if patch -R -p1 -s -f --dry-run -d "$EMSCRIPTEN_DIR" <"$PATCH_FILE" >/dev/null 2>&1; then
  echo "Patch already applied, skipping..."
else
  # Try to apply the patch
  if patch -p1 -d "$EMSCRIPTEN_DIR" <"$PATCH_FILE"; then
    echo "Patch applied successfully."
  else
    echo "Failed to apply patch." >&2
    exit 1
  fi
fi
