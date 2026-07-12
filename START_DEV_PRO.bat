@echo off
set "PATH=%~dp0.node-portable;%~dp0.git-portable\cmd;%~dp0gh-cli\bin;%PATH%"
REM FormEase Pro - Development Server
REM Runs on port 3003

echo.
echo ============================================
echo FormEase Pro - Development Server
echo ============================================
echo.
echo This is the FormEase Pro development server
echo.
echo Server URL: http://localhost:3003
echo.

cd /d "%~dp0app"
if not exist "node_modules" (
    echo [INFO] First time setup: Installing dependencies for main application...
    call npm install
)
call npm run dev -- --port 3003

pause

