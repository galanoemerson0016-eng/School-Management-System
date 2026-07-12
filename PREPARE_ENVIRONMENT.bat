@echo off
set "PATH=%~dp0.node-portable;%~dp0.git-portable\cmd;%~dp0gh-cli\bin;%PATH%"
setlocal enabledelayedexpansion

echo.
echo ========================================================
echo   FormEase Pro - Environment Preparation Script
echo ========================================================
echo.
echo This script will check for and install the necessary 
echo development tools for FormEase G7.
echo.

:: --- Check for Node.js ---
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [MISSING] Node.js is not installed.
    echo  Action: Installing Node.js (LTS) via winget...
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] Failed to install Node.js. Please install it manually from https://nodejs.org/
    ) else (
        echo  [SUCCESS] Node.js installed.
    )
) else (
    echo [OK] Node.js is already installed.
)

:: --- Check for Git ---
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [MISSING] Git is not installed.
    echo  Action: Installing Git via winget...
    winget install Git.Git --accept-package-agreements --accept-source-agreements
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] Failed to install Git. Please install it manually from https://git-scm.com/
    ) else (
        echo  [SUCCESS] Git installed.
    )
) else (
    echo [OK] Git is already installed.
)

:: --- Check for GitHub CLI ---
where gh >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [MISSING] GitHub CLI is not installed.
    echo  Action: Installing GitHub CLI via winget...
    winget install GitHub.cli --accept-package-agreements --accept-source-agreements
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] Failed to install GitHub CLI.
    ) else (
        echo  [SUCCESS] GitHub CLI installed.
    )
) else (
    echo [OK] GitHub CLI is already installed.
)

echo.
echo ========================================================
echo   SETUP COMPLETE
echo ========================================================
echo.
echo IMPORTANT: You MUST restart your terminal or computer 
echo for the changes to take effect.
echo.
echo After restarting, you can run:
echo   START_DEV_G7SPECIAL.bat
echo.
pause

