@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   FormEase License Portal Launcher
echo ========================================

if not exist "license-portal" (
    echo [ERROR] 'license-portal' directory not found!
    echo Please make sure you are running this from the main project folder.
    pause
    exit /b
)

cd license-portal

if not exist "node_modules" (
    echo [INFO] First time setup: Installing dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] npm install failed. Please check your internet and Node.js installation.
        pause
        exit /b
    )
)

echo [INFO] Starting development server...
call npm run dev
if !errorlevel! neq 0 (
    echo [ERROR] Failed to start server.
    pause
)
