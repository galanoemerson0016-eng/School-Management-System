@echo off
REM FormEase G7 Special Variant - Development Server
REM This variant includes support for custom school curricula with extra subjects like Specialization
REM Runs on a separate port (3002) to avoid conflicts with the standard FormEase G7

echo.
echo ============================================
echo FormEase G7 Special - Development Server
echo ============================================
echo.
echo This is the SPECIAL VARIANT for schools with custom curricula
echo Features: Support for additional subjects beyond standard DepEd list
echo.
echo Server URL: http://localhost:3002
echo.

cd /d "%~dp0app"
npm run dev -- --port 3002

pause
