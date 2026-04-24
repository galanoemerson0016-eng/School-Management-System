@echo off
REM FormEase G7 Special Variant - Production EXE Builder
REM Builds executable for schools with custom curricula support

echo.
echo ====================================================
echo   FormEase G7 Special - Production EXE Builder
echo ====================================================
echo.
echo This builds the SPECIAL VARIANT with custom curriculum support
echo Features: Support for additional subjects beyond standard DepEd list
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
echo.
echo   Product Name: FormEase G7 Special
echo   Variant: Custom Curriculum Support
echo ====================================================
pause
