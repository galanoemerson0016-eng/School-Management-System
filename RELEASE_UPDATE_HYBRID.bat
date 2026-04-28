@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo   FormEase Pro - Hybrid Update Releaser (v1.0.6+)
echo ====================================================
echo.
echo This script will:
echo 1. Bump version number
echo 2. Build the OBFUSCATED app
echo 3. Prepare metadata for Firebase
echo 4. Auto-fix latest.yml for GitHub Hosting
echo.

cd /d "%~dp0app"

:: [1] Get current version and bump it
echo [1/4] Bumping version number...
call npm version patch --no-git-tag-version > v_log.txt
for /f "tokens=*" %%a in (v_log.txt) do set NEW_VERSION=%%a
:: Remove 'v' prefix if exists
set NEW_VERSION=%NEW_VERSION:v=%
del v_log.txt
echo New Version detected: %NEW_VERSION%
echo.

:: [2] Build
echo [2/4] Building new Electron Executable...
echo This will take a moment (applying obfuscation)...
call npm run electron:build:win
echo.

:: [3] Prepare Update Files
echo [3/4] Preparing Update Metadata...
set UPDATE_DIR=..\update-server\updates
if not exist "%UPDATE_DIR%" mkdir "%UPDATE_DIR%"

:: Clean old exe files from update server to avoid Firebase Spark errors
del /Q "%UPDATE_DIR%\*.exe" 2>nul

:: Copy only manifest and blockmaps
copy /Y "release\latest.yml" "%UPDATE_DIR%\" >nul
copy /Y "release\*.blockmap" "%UPDATE_DIR%\" >nul

:: [4] Auto-Fix latest.yml for GitHub
echo [4/4] Patching latest.yml for GitHub Hosting...
set TARGET_YML=%UPDATE_DIR%\latest.yml
set GITHUB_URL=https://github.com/galanoemerson0016-eng/School-Management-System/releases/download/v%NEW_VERSION%/FormEase.Pro.Setup.%NEW_VERSION%.exe

:: Simple PowerShell inline to replace the URL in latest.yml
powershell -Command "(gc '%TARGET_YML%') -replace 'url: FormEase Pro Setup %NEW_VERSION%.exe', 'url: %GITHUB_URL%' -replace 'path: FormEase Pro Setup %NEW_VERSION%.exe', 'path: %GITHUB_URL%' | Out-File -encoding utf8 '%TARGET_YML%'"

echo.
echo ====================================================
echo   READY FOR DEPLOYMENT!
echo ====================================================
echo.
echo 1. UPLOAD TO GITHUB:
echo    - Go to: https://github.com/galanoemerson0016-eng/School-Management-System/releases
echo    - Create release: v%NEW_VERSION%
echo    - Upload: app\release\FormEase Pro Setup %NEW_VERSION%.exe
echo    - RENAME on GitHub to: FormEase.Pro.Setup.%NEW_VERSION%.exe (dots instead of spaces)
echo.
echo 2. DEPLOY METADATA:
echo    - Once you have finished the GitHub upload, press any key here.
echo    - This script will automatically run the Firebase deployment.
echo.
echo ====================================================
pause

echo.
echo [FINAL STEP] Deploying to Firebase Hosting...
cd /d "%~dp0update-server"
call firebase deploy --only hosting

echo.
echo ====================================================
echo   ALL STEPS COMPLETE! YOUR UPDATE IS LIVE!
echo ====================================================
pause
