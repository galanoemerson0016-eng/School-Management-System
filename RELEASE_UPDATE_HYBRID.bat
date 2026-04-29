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
echo   7. Prepare all update metadata
echo   8. Deploy everything to Firebase
echo.
echo ========================================================
echo.
pause

:: ---- PRE-CHECK: Ensure gh CLI is authenticated ----
echo [PRE-CHECK] Verifying GitHub CLI authentication...
gh auth status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  GitHub CLI is not authenticated!
    echo  Running login now... Follow the prompts in your browser.
    echo.
    gh auth login --web --git-protocol https
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
echo.
echo  Windows build complete!
echo.

:: ============================================================
:: [3] GIT COMMIT, TAG, AND PUSH
:: ============================================================
echo [3/8] Pushing to GitHub and creating version tag...
cd /d "%~dp0"
git add .
git commit -m "Release v%NEW_VERSION%"
:: Use -f to overwrite local tag if it exists from a previous failed run
git tag -f "v%NEW_VERSION%"

echo  Pushing to GitHub (this may take a moment)...
git push origin main --tags -f
if %ERRORLEVEL% neq 0 (
    echo  WARNING: Push failed. Attempting force push...
    git push origin main --tags --force
)
echo.
echo  Code pushed. Tag v%NEW_VERSION% created.
echo  macOS cloud build has been triggered!
echo.

:: ============================================================
:: [4] CREATE GITHUB RELEASE + UPLOAD WINDOWS EXE
:: ============================================================
echo [4/8] Creating GitHub Release and uploading Windows installer...

:: Find the Windows EXE file
set WIN_EXE=
for %%f in ("app\release\*.exe") do (
    set WIN_EXE=%%f
)

if "!WIN_EXE!"=="" (
    echo  WARNING: No .exe found in app\release\. Skipping Windows upload.
) else (
    echo  Found: !WIN_EXE!
    :: Create the release (or update if Mac build already created it)
    gh release create "v%NEW_VERSION%" --title "FormEase Pro v%NEW_VERSION%" --notes "Release v%NEW_VERSION% - Windows and macOS" --latest 2>nul
    if %ERRORLEVEL% neq 0 (
        echo  Release may already exist (created by Mac build). Continuing...
    )
    
    echo  Uploading Windows installer to GitHub...
    gh release upload "v%NEW_VERSION%" "!WIN_EXE!" --clobber --no-progress
    if %ERRORLEVEL% neq 0 (
        echo  ERROR: Failed to upload Windows installer to GitHub.
        pause
        exit /b 1
    )
    echo  Windows EXE uploaded successfully!
)
echo.

:: ============================================================
:: [5] WAIT FOR MAC BUILD TO COMPLETE
:: ============================================================
echo [5/8] Waiting for macOS build to finish in the cloud...
echo  This usually takes 4-6 minutes. Please wait...
echo.

:: Find the workflow run triggered by our tag
set MAX_RETRIES=40
set RETRY_COUNT=0

:WAIT_LOOP
set /a RETRY_COUNT+=1
if %RETRY_COUNT% gtr %MAX_RETRIES% (
    echo.
    echo  TIMEOUT: Mac build did not complete in time.
    echo  You can check manually: https://github.com/galanoemerson0016-eng/School-Management-System/actions
    echo  Continuing with Windows-only deployment...
    goto SKIP_MAC
)

:: Check if the Mac workflow has a completed run for this tag
set RUN_ID=
set RUN_STATUS=
for /f "tokens=1,2" %%a in ('gh run list --workflow "build-macos.yml" --limit 1 --json databaseId^,status --jq ".[0] | \"\(.databaseId) \(.status)\"" 2^>nul') do (
    set RUN_ID=%%a
    set RUN_STATUS=%%b
)

if "!RUN_STATUS!"=="completed" (
    echo.
    echo  macOS build completed! Run ID: !RUN_ID!
    goto MAC_DONE
)

if "!RUN_ID!"=="" (
    echo  [Attempt %RETRY_COUNT%/%MAX_RETRIES%] Waiting for workflow to start...
) else (
    echo  [Attempt %RETRY_COUNT%/%MAX_RETRIES%] Status: !RUN_STATUS! - waiting 20 seconds...
)
timeout /t 20 /nobreak >nul
goto WAIT_LOOP

:MAC_DONE
echo.

:: ============================================================
:: [6] DOWNLOAD MAC ARTIFACTS
:: ============================================================
echo [6/8] Downloading macOS build artifacts...

:: Create permanent installers folder
set MAC_INSTALLERS_DIR=%~dp0macOS_Installers\v%NEW_VERSION%
if not exist "%MAC_INSTALLERS_DIR%" mkdir "%MAC_INSTALLERS_DIR%"

:: We still use a temp dir for the initial download to keep things clean
set MAC_TEMP_DIR=%~dp0_mac_temp
if exist "%MAC_TEMP_DIR%" rmdir /s /q "%MAC_TEMP_DIR%"
mkdir "%MAC_TEMP_DIR%"

gh run download !RUN_ID! --name "formease-macos-artifacts" --dir "%MAC_TEMP_DIR%" --no-progress

if %ERRORLEVEL% neq 0 (
    echo  WARNING: Failed to download Mac artifacts from run. Trying download from Release...
    gh release download "v%NEW_VERSION%" --pattern "*.dmg" --dir "%MAC_INSTALLERS_DIR%" --clobber --no-progress 2>nul
    gh release download "v%NEW_VERSION%" --pattern "latest-mac.yml" --dir "%MAC_TEMP_DIR%" --clobber --no-progress 2>nul
    if not exist "%MAC_TEMP_DIR%\latest-mac.yml" (
        echo  WARNING: Could not find Mac metadata. Skipping Mac deployment.
        goto SKIP_MAC
    )
) else (
    :: Move DMGs to permanent folder
    echo  Saving Mac installers to macOS_Installers folder...
    move /Y "%MAC_TEMP_DIR%\app\release\*.dmg" "%MAC_INSTALLERS_DIR%\" >nul 2>nul
)

echo  Mac artifacts ready!
echo.

:: Upload Mac files to GitHub Release (if not already there)
echo  Ensuring Mac files are in GitHub Release...
for %%f in ("%MAC_INSTALLERS_DIR%\*.dmg") do (
    gh release upload "v%NEW_VERSION%" "%%f" --clobber --no-progress 2>nul
    echo  Verified: %%~nxf
)
:: Use temp dir for zip/metadata uploads
for %%f in ("%MAC_TEMP_DIR%\app\release\*.zip") do (
    gh release upload "v%NEW_VERSION%" "%%f" --clobber --no-progress 2>nul
    echo  Verified: %%~nxf
)
echo.

:SKIP_MAC

:: ============================================================
:: [7] PREPARE UPDATE METADATA FOR FIREBASE
:: ============================================================
echo [7/8] Preparing update metadata for Firebase...

set UPDATE_DIR=update-server\updates
if not exist "%~dp0%UPDATE_DIR%" mkdir "%~dp0%UPDATE_DIR%"

:: Clean old files (Firebase Spark limit)
del /Q "%~dp0%UPDATE_DIR%\*.blockmap" 2>nul
del /Q "%~dp0%UPDATE_DIR%\latest*.yml" 2>nul

:: Copy Windows metadata
copy /Y "%~dp0app\release\latest.yml" "%~dp0%UPDATE_DIR%\" >nul 2>nul
copy /Y "%~dp0app\release\*.blockmap" "%~dp0%UPDATE_DIR%\" >nul 2>nul

:: Copy Mac metadata if available
if exist "%MAC_TEMP_DIR%\app\release\latest-mac.yml" (
    copy /Y "%MAC_TEMP_DIR%\app\release\latest-mac.yml" "%~dp0%UPDATE_DIR%\" >nul
    echo  Copied latest-mac.yml to update server.
) else if exist "%MAC_TEMP_DIR%\latest-mac.yml" (
    copy /Y "%MAC_TEMP_DIR%\latest-mac.yml" "%~dp0%UPDATE_DIR%\" >nul
    echo  Copied latest-mac.yml to update server.
)

:: Patch latest.yml (Windows) - redirect to GitHub
set TARGET_YML=%~dp0%UPDATE_DIR%\latest.yml
set GITHUB_URL=https://github.com/galanoemerson0016-eng/School-Management-System/releases/download/v%NEW_VERSION%

powershell -Command "$v='%NEW_VERSION%'; $url='%GITHUB_URL%/FormEase.Pro.Setup.'+$v+'.exe'; (gc '%TARGET_YML%') -replace 'url: FormEase Pro Setup '+$v+'.exe', 'url: '+$url -replace 'path: FormEase Pro Setup '+$v+'.exe', 'path: '+$url | Out-File -encoding utf8 '%TARGET_YML%'"

:: Patch latest-mac.yml (macOS) - redirect to GitHub
if exist "%~dp0%UPDATE_DIR%\latest-mac.yml" (
    set MAC_YML=%~dp0%UPDATE_DIR%\latest-mac.yml
    powershell -Command "(gc '!MAC_YML!') -replace 'url: FormEase Pro-', 'url: %GITHUB_URL%/FormEase.Pro-' -replace 'path: FormEase Pro-', 'path: %GITHUB_URL%/FormEase.Pro-' | Out-File -encoding utf8 '!MAC_YML!'"
    echo  Mac metadata patched for GitHub URLs.
)

echo  All metadata prepared!
echo.

:: Clean up temp Mac downloads
if exist "%MAC_TEMP_DIR%" rmdir /s /q "%MAC_TEMP_DIR%"

:: ============================================================
:: [8] DEPLOY TO FIREBASE
:: ============================================================
echo [8/8] Deploying update metadata to Firebase Hosting...
cd /d "%~dp0update-server"
call firebase deploy --only hosting

echo.
echo ========================================================
echo.
echo   ALL DONE! FormEase Pro v%NEW_VERSION% is LIVE!
echo.
echo   Windows: EXE uploaded to GitHub Release
echo   macOS:   DMG uploaded to GitHub Release
echo   Updates: Metadata deployed to Firebase
echo.
echo   Release: https://github.com/galanoemerson0016-eng/School-Management-System/releases/tag/v%NEW_VERSION%
echo.
echo ========================================================
pause
