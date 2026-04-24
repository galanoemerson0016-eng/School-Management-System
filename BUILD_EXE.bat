@echo off
echo ====================================================
echo   FormEase G7 - Production EXE Builder
echo ====================================================
echo.
echo Phase 1: Installing dependencies...
cd /d "%~dp0app"
call npm install
echo.
echo Phase 2: Building and Packaging application...
echo This may take a few minutes. Please wait...
call npm run electron:build
echo.
echo ====================================================
echo   BUILD COMPLETE!
echo   Your EXE file is in: app\release\
echo ====================================================
pause
