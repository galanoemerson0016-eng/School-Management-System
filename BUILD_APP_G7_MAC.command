#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "===================================================="
  echo "  FormEase G7 Special - macOS App Builder"
echo "===================================================="
echo

echo "Phase 1: Installing dependencies..."
cd "$SCRIPT_DIR/app"
npm install

echo
echo "Phase 2: Building and packaging macOS app..."
echo "This may take a few minutes. Please wait..."
npm run electron:build:mac

echo
echo "===================================================="
echo "  BUILD COMPLETE!"
echo "  Your macOS app files are in: app/release/"
echo "===================================================="
echo
read -rp "Press Enter to close..."
