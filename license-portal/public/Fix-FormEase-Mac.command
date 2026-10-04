#!/bin/bash
# ==============================================================================
#  FormEase Pro — macOS Gatekeeper Fix & 1-Click Auto-Launcher
#  Resolves: "FormEase Pro is damaged and can't be opened" on macOS Sequoia / Sonoma
# ==============================================================================

clear
echo "================================================================="
echo "   FormEase Pro — macOS Gatekeeper Quarantine Fix"
echo "================================================================="
echo ""

APP_NAME="FormEase Pro.app"
SYS_APP="/Applications/$APP_NAME"
USER_APP="$HOME/Applications/$APP_NAME"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOCAL_APP="$SCRIPT_DIR/$APP_NAME"
PARENT_APP="$SCRIPT_DIR/../$APP_NAME"

TARGET_APP=""

if [ -d "$SYS_APP" ]; then
    TARGET_APP="$SYS_APP"
elif [ -d "$USER_APP" ]; then
    TARGET_APP="$USER_APP"
elif [ -d "$LOCAL_APP" ]; then
    echo "📦 Found $APP_NAME in current folder..."
    echo "📁 Copying to /Applications for standard installation..."
    cp -R "$LOCAL_APP" /Applications/ 2>/dev/null
    if [ -d "$SYS_APP" ]; then
        TARGET_APP="$SYS_APP"
        echo "✅ Installed to /Applications successfully!"
    else
        TARGET_APP="$LOCAL_APP"
    fi
elif [ -d "$PARENT_APP" ]; then
    echo "📦 Found $APP_NAME in parent folder..."
    echo "📁 Copying to /Applications for standard installation..."
    cp -R "$PARENT_APP" /Applications/ 2>/dev/null
    if [ -d "$SYS_APP" ]; then
        TARGET_APP="$SYS_APP"
        echo "✅ Installed to /Applications successfully!"
    else
        TARGET_APP="$PARENT_APP"
    fi
fi

if [ -z "$TARGET_APP" ]; then
    echo "❌ Error: Could not find 'FormEase Pro.app' in /Applications."
    echo ""
    echo "👉 Please drag FormEase Pro into your Applications folder first,"
    echo "   then double-click this helper tool again."
    echo ""
    read -p "Press [Enter] to exit..."
    exit 1
fi

echo "🔍 Target application found at:"
echo "   $TARGET_APP"
echo ""
echo "⏳ Removing macOS Gatekeeper quarantine flags..."

# 1. First attempt user-level xattr clear
xattr -cr "$TARGET_APP" 2>/dev/null
STATUS=$?

# 2. If user-level xattr failed due to permission, elevate with sudo
if [ $STATUS -ne 0 ]; then
    echo "🔒 Administrator authorization required..."
    echo "👉 Please type your Mac user password when prompted:"
    sudo xattr -rd com.apple.quarantine "$TARGET_APP" 2>/dev/null
    sudo xattr -cr "$TARGET_APP" 2>/dev/null
fi

echo ""
echo "================================================================="
echo "   ✅ SUCCESS! FormEase Pro is now completely unlocked."
echo "   🚀 Launching application now..."
echo "================================================================="
echo ""

open "$TARGET_APP"

sleep 2
exit 0
