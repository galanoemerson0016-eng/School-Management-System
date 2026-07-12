@echo off
set "PATH=%~dp0.node-portable;%~dp0.git-portable\cmd;%~dp0gh-cli\bin;%PATH%"
setlocal enabledelayedexpansion

echo ========================================================
echo   FormEase Pro - FINISH MAC DEPLOYMENT ONLY
echo ========================================================
echo.
echo Use this if the main script timed out or if you just 
echo need to sync the latest Mac build to Firebase.
echo.

:: Get current version from package.json
cd /d "%~dp0app"
for /f "tokens=2 delims=:, " %%a in ('findstr /i "\"version\":" package.json') do set NEW_VERSION=%%a
set NEW_VERSION=%NEW_VERSION:"=%
cd /d "%~dp0"

echo Current Version: v%NEW_VERSION%
echo.

:: [5] WAIT FOR MAC BUILD TO COMPLETE
echo [1/4] Checking macOS build status...
set RUN_ID=
set RUN_STATUS=
for /f "usebackq tokens=*" %%a in (`gh run list --workflow "build-macos.yml" --limit 1 --json databaseId --jq ".[0].databaseId" 2^>nul`) do set RUN_ID=%%a
for /f "usebackq tokens=*" %%a in (`gh run list --workflow "build-macos.yml" --limit 1 --json status --jq ".[0].status" 2^>nul`) do set RUN_STATUS=%%a

if "!RUN_STATUS!" neq "completed" (
    echo  ERROR: Mac build is still !RUN_STATUS!. 
    echo  Please wait a few minutes and run this script again.
    pause
    exit /b 1
)

:: [6] DOWNLOAD MAC ARTIFACTS
echo [2/4] Downloading macOS build artifacts...
set MAC_INSTALLERS_DIR=%~dp0macOS_Installers\v%NEW_VERSION%
if not exist "%MAC_INSTALLERS_DIR%" mkdir "%MAC_INSTALLERS_DIR%"
set MAC_TEMP_DIR=%~dp0_mac_temp
if exist "%MAC_TEMP_DIR%" rmdir /s /q "%MAC_TEMP_DIR%"
mkdir "%MAC_TEMP_DIR%"

gh run download !RUN_ID! --name "formease-macos-artifacts" --dir "%MAC_TEMP_DIR%" --no-progress
if %ERRORLEVEL% neq 0 (
    echo  WARNING: Failed to download from run. Trying Release...
    gh release download "v%NEW_VERSION%" --pattern "*.dmg" --dir "%MAC_INSTALLERS_DIR%" --clobber --no-progress 2>nul
    gh release download "v%NEW_VERSION%" --pattern "latest-mac.yml" --dir "%MAC_TEMP_DIR%" --clobber --no-progress 2>nul
) else (
    move /Y "%MAC_TEMP_DIR%\app\release\*.dmg" "%MAC_INSTALLERS_DIR%\" >nul 2>nul
)

:: [7] PREPARE UPDATE METADATA
echo [3/4] Patching metadata for Firebase...
set UPDATE_DIR=update-server\updates
if exist "%MAC_TEMP_DIR%\app\release\latest-mac.yml" (
    copy /Y "%MAC_TEMP_DIR%\app\release\latest-mac.yml" "%~dp0%UPDATE_DIR%\" >nul
) else if exist "%MAC_TEMP_DIR%\latest-mac.yml" (
    copy /Y "%MAC_TEMP_DIR%\latest-mac.yml" "%~dp0%UPDATE_DIR%\" >nul
)

set GITHUB_URL=https://github.com/galanoemerson0016-eng/School-Management-System/releases/download/v%NEW_VERSION%
if exist "%~dp0%UPDATE_DIR%\latest-mac.yml" (
    set MAC_YML=%~dp0%UPDATE_DIR%\latest-mac.yml
    powershell -Command "(gc '!MAC_YML!') -replace 'url: FormEase Pro-', 'url: %GITHUB_URL%/FormEase.Pro-' -replace 'path: FormEase Pro-', 'path: %GITHUB_URL%/FormEase.Pro-' | Out-File -encoding utf8 '!MAC_YML!'"
    echo  Mac metadata patched.
)

:: [8] DEPLOY TO FIREBASE
echo [4/4] Deploying to Firebase Hosting...
cd /d "%~dp0update-server"
call firebase deploy --only hosting

echo.
echo ========================================================
echo   MAC DEPLOYMENT COMPLETE for v%NEW_VERSION%
echo ========================================================
pause

