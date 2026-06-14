@echo off
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
call npm run dev -- --port 3003

pause
