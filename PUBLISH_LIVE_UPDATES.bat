@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================================
echo   FormEase Pro - Firebase Hosting Live Update Publisher
echo ========================================================
echo.
echo This script will AUTOMATICALLY:
echo   1. Locate your latest compiled Windows .exe installer
echo   2. Copy the installer, latest.yml, and blockmap to the licensing portal
echo   3. Build your licensing portal website
echo   4. Deploy everything to https://formease-licensing.web.app
echo.
echo No more 404 errors! Files will download directly from your secure site.
echo ========================================================
echo.
pause

:: ---- Locate local release files ----
echo [1/4] Scanning app release folder...
set WIN_EXE_PATH=
set WIN_EXE_NAME=
for %%f in ("app\release\*.exe") do (
    set WIN_EXE_PATH=%%f
    set WIN_EXE_NAME=%%~nxf
)

if "!WIN_EXE_PATH!"=="" (
    echo  ERROR: No built Windows installer ^(.exe^) found in app\release.
    echo  Please run "npm run electron:build:win" inside the app folder first.
    pause
    exit /b 1
)

echo  Found Windows Installer: %WIN_EXE_NAME%
echo.

:: ---- Setup destination directories ----
echo [2/4] Preparing licensing portal updates folder...
set DEST_DIR=license-portal\public\updates
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%"

:: Clean old update files to save space
del /Q "%DEST_DIR%\*" 2>nul

:: Copy files
copy /Y "app\release\latest.yml" "%DEST_DIR%\" >nul
copy /Y "app\release\*.blockmap" "%DEST_DIR%\" >nul
copy /Y "%WIN_EXE_PATH%" "%DEST_DIR%\" >nul

:: Also check if a macOS DMG exists in the mac artifacts or temp folder
if exist "_mac_temp\app\release" (
    echo  Found macOS cloud artifacts! Copying macOS DMG...
    copy /Y "_mac_temp\app\release\latest-mac.yml" "%DEST_DIR%\" >nul
    copy /Y "_mac_temp\app\release\*.dmg" "%DEST_DIR%\" >nul
    copy /Y "_mac_temp\app\release\*.zip" "%DEST_DIR%\" >nul
) else if exist "macOS_Installers" (
    echo  Found macOS Local Installers! Copying macOS DMG...
    copy /Y "macOS_Installers\*.dmg" "%DEST_DIR%\" >nul
)

echo  Installer and metadata copied successfully.
echo.

:: ---- Recompile Portal ----
echo [3/4] Building licensing portal frontend...
cd /d "%~dp0license-portal"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Licensing portal frontend build failed!
    pause
    exit /b 1
)
echo  Licensing portal compiled successfully!
echo.

:: ---- Deploy to Firebase Hosting ----
echo [4/4] Deploying to active production server...
call npx firebase deploy --only hosting
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Firebase deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   SUCCESS! FormEase Pro Update is now LIVE & DOWNLOADABLE!
echo   Download Link: https://formease-licensing.web.app/updates
echo ========================================================
pause
