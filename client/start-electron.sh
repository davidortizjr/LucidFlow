#!/bin/bash

# This script starts the dev server and Electron simultaneously
# On Windows, use: npm run dev:electron
# On macOS/Linux, you can use this directly

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  concurrently "npm run dev" "wait-on http://localhost:5173 && electron ."
else
  # macOS/Linux
  npm run dev:electron
fi
