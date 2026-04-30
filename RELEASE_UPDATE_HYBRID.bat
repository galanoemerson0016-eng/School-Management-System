@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================================
echo   FormEase Pro - FULLY AUTOMATED Multi-Platform Release
echo ========================================================
echo.
echo This script will AUTOMATICALLY:
echo   1. Bump version number
echo   2. Build Windows EXE (with obfuscation)
echo   3. Push to GitHub + Create version tag
echo   4. Upload Windows EXE to GitHub Release
echo   5. Wait for Mac build to finish in the cloud
echo   6. Download Mac artifacts automatically
echo   7. Prepare all update metadata (with GitHub redirects)
echo   8. Deploy everything to Firebase
echo.
echo ========================================================
echo.
pause

:: ---- PRE-CHECK: Ensure gh CLI is authenticated ----
echo [PRE-CHECK] Verifying GitHub CLI authentication...
call gh auth status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  GitHub CLI is not authenticated!
    echo  Running login now... Follow the prompts in your browser.
    echo.
    call gh auth login --web --git-protocol https
    if %ERRORLEVEL% neq 0 (
        echo  ERROR: GitHub authentication failed. Please try again.
        pause
        exit /b 1
    )
)
echo  GitHub CLI authenticated successfully.
echo.

cd /d "%~dp0app"

:: ============================================================
:: [1] BUMP VERSION
:: ============================================================
echo [1/8] Bumping version number...
call npm version patch --no-git-tag-version > v_log.txt
for /f "tokens=*" %%a in (v_log.txt) do set NEW_VERSION=%%a
set NEW_VERSION=%NEW_VERSION:v=%
del v_log.txt
echo  New Version: v%NEW_VERSION%
echo.

:: ============================================================
:: [2] BUILD WINDOWS EXE
:: ============================================================
echo [2/8] Building Windows Executable...
echo  This may take 2-3 minutes (applying obfuscation)...
echo.
call npm run electron:build:win
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Windows build failed!
    pause
    exit /b 1
)
echo  Windows build complete!
echo.

:: ============================================================
:: [3] GIT COMMIT, TAG, AND PUSH
:: ============================================================
echo [3/8] Pushing to GitHub and creating version tag...
cd /d "%~dp0"
call git add .
call git commit -m "Release v%NEW_VERSION%"
call git tag -f "v%NEW_VERSION%"
echo  Pushing code and tags to GitHub...
call git push origin main --tags -f
echo  Code pushed. Tag v%NEW_VERSION% created.
echo.

:: ============================================================
:: [4] CREATE GITHUB RELEASE + UPLOAD WINDOWS EXE
:: ============================================================
echo [4/8] Creating GitHub Release and uploading Windows installer...

:: Find the Windows EXE file
set WIN_EXE_NAME=
set WIN_EXE_PATH=
for %%f in ("app\release\*.exe") do (
    set WIN_EXE_PATH=%%f
    set WIN_EXE_NAME=%%~nxf
)

if "!WIN_EXE_PATH!"=="" (
    echo  WARNING: No .exe found. Skipping upload.
) else (
    echo  Creating Release v%NEW_VERSION%...
    call gh release create "v%NEW_VERSION%" --title "FormEase Pro v%NEW_VERSION%" --notes "Release v%NEW_VERSION%" --latest 2>nul
    
    echo  Uploading !WIN_EXE_NAME!...
    call gh release upload "v%NEW_VERSION%" "!WIN_EXE_PATH!" --clobber
    echo  Windows EXE uploaded successfully!
)
echo.

:: ============================================================
:: [5] WAIT FOR MAC BUILD TO COMPLETE
:: ============================================================
echo [5/8] Waiting for macOS build to finish in the cloud...
echo  This usually takes 4-6 minutes. Please wait...
echo.

set MAX_RETRIES=60
set RETRY_COUNT=0

:WAIT_LOOP
set /a RETRY_COUNT+=1
if %RETRY_COUNT% gtr %MAX_RETRIES% (
    echo  TIMEOUT: Mac build did not complete. Continuing with Windows only.
    goto SKIP_MAC
)

set RUN_ID=
set RUN_STATUS=
set RUN_BRANCH=

for /f "usebackq tokens=*" %%a in (`call gh run list --workflow "build-macos.yml" --limit 1 --json databaseId --jq ".[0].databaseId" 2^>nul`) do set RUN_ID=%%a
for /f "usebackq tokens=*" %%a in (`call gh run list --workflow "build-macos.yml" --limit 1 --json status --jq ".[0].status" 2^>nul`) do set RUN_STATUS=%%a
for /f "usebackq tokens=*" %%a in (`call gh run list --workflow "build-macos.yml" --limit 1 --json headBranch --jq ".[0].headBranch" 2^>nul`) do set RUN_BRANCH=%%a

if "!RUN_BRANCH!"=="v%NEW_VERSION%" (
    if "!RUN_STATUS!"=="completed" (
        echo  macOS build completed!
        goto MAC_DONE
    )
    echo  [Attempt %RETRY_COUNT%/%MAX_RETRIES%] Status: !RUN_STATUS!...
) else (
    echo  [Attempt %RETRY_COUNT%/%MAX_RETRIES%] Waiting for v%NEW_VERSION% workflow...
)

timeout /t 20 /nobreak >nul
goto WAIT_LOOP

:MAC_DONE
echo.

:: ============================================================
:: [6] DOWNLOAD MAC ARTIFACTS
:: ============================================================
echo [6/8] Downloading macOS build artifacts...
set MAC_TEMP_DIR=%~dp0_mac_temp
if exist "%MAC_TEMP_DIR%" rmdir /s /q "%MAC_TEMP_DIR%"
mkdir "%MAC_TEMP_DIR%"

call gh run download !RUN_ID! --name "formease-macos-artifacts" --dir "%MAC_TEMP_DIR%"
if %ERRORLEVEL% neq 0 (
    echo  WARNING: Failed to download Mac artifacts. Skipping Mac metadata.
    goto SKIP_MAC
)
echo  Mac artifacts ready!
echo.

:SKIP_MAC

:: ============================================================
:: [7] PREPARE UPDATE METADATA (WITH REDIRECTS)
:: ============================================================
echo [7/8] Preparing update metadata for Firebase...

set UPDATE_DIR=update-server\updates
if not exist "%~dp0%UPDATE_DIR%" mkdir "%~dp0%UPDATE_DIR%"

:: Clean and Copy
del /Q "%~dp0%UPDATE_DIR%\*.blockmap" 2>nul
del /Q "%~dp0%UPDATE_DIR%\latest*.yml" 2>nul
copy /Y "%~dp0app\release\latest.yml" "%~dp0%UPDATE_DIR%\" >nul
copy /Y "%~dp0app\release\*.blockmap" "%~dp0%UPDATE_DIR%\" >nul

if exist "%MAC_TEMP_DIR%\app\release\latest-mac.yml" (
    copy /Y "%MAC_TEMP_DIR%\app\release\latest-mac.yml" "%~dp0%UPDATE_DIR%\" >nul
)

:: PATCH Windows latest.yml to point to GitHub
set GITHUB_BASE=https://github.com/galanoemerson0016-eng/School-Management-System/releases/download/v%NEW_VERSION%

:: Robust PowerShell patching - handles both top-level and indented url/path lines
powershell -Command "$base='%GITHUB_BASE%'; $path='%UPDATE_DIR%\latest.yml'; (Get-Content $path) | ForEach-Object { if ($_ -match '^\s*-?\s*url:\s*(.+)$') { $prefix = $_ -replace '(^\s*-?\s*url:).*','$1'; $filename = $Matches[1].Trim() -replace ' ','.'; \"$prefix $base/$filename\" } elseif ($_ -match '^path:\s*(.+)$') { $filename = $Matches[1].Trim() -replace ' ','.'; \"path: $filename\" } else { $_ } } | Set-Content $path -Encoding UTF8"

:: PATCH Mac latest-mac.yml if exists
if exist "%~dp0%UPDATE_DIR%\latest-mac.yml" (
    powershell -Command "$base='%GITHUB_BASE%'; $path='%UPDATE_DIR%\latest-mac.yml'; (Get-Content $path) | ForEach-Object { if ($_ -match '^\s*-?\s*url:\s*(.+)$') { $prefix = $_ -replace '(^\s*-?\s*url:).*','$1'; $filename = $Matches[1].Trim() -replace ' ','.'; \"$prefix $base/$filename\" } elseif ($_ -match '^path:\s*(.+)$') { $filename = $Matches[1].Trim() -replace ' ','.'; \"path: $filename\" } else { $_ } } | Set-Content $path -Encoding UTF8"
)

echo  Update metadata patched and ready.
echo.

:: Clean up
if exist "%MAC_TEMP_DIR%" rmdir /s /q "%MAC_TEMP_DIR%"

:: ============================================================
:: [8] DEPLOY TO FIREBASE
:: ============================================================
echo [8/8] Deploying to Firebase...
cd /d "%~dp0update-server"
call firebase deploy --only hosting
echo.
echo ========================================================
echo   ALL DONE! FormEase Pro v%NEW_VERSION% is LIVE!
echo ========================================================
pause
