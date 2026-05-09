@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================================
echo    FormEase Pro - HYBRID DEVELOPMENT ENVIRONMENT
echo ========================================================
echo.
echo This script starts BOTH the Main App and the License Portal
echo for integrated testing of the license management system.
echo.
echo [PORT CONFIGURATION]
echo   - Main Application:  http://localhost:3001
echo   - License Portal:    http://localhost:5173
echo.
echo ========================================================
echo.

:: Check if license-portal exists
if not exist "license-portal" (
    echo [ERROR] 'license-portal' directory not found!
    pause
    exit /b
)

echo [1/2] Starting License Portal in a new window...
start "FormEase - License Portal" cmd /c "cd /d %~dp0license-portal && title License Portal && npm run dev"

echo [2/2] Starting Main Application...
cd /d "%~dp0app"
call npm run dev -- --port 3001

pause
