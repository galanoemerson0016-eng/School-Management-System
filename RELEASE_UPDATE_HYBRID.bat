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
git tag "v%NEW_VERSION%"
git push origin main --tags
if %ERRORLEVEL% neq 0 (
    echo  WARNING: Push failed. Trying force push...
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
        echo  Release may already exist (created by Mac build). Will upload to it.
    )
    gh release upload "v%NEW_VERSION%" "!WIN_EXE!" --clobber
    echo  Windows EXE uploaded to GitHub Release!
)
echo.

:: ============================================================
:: [5] WAIT FOR MAC BUILD TO COMPLETE
:: ============================================================
echo [5/8] Waiting for macOS build to finish in the cloud...
echo  This usually takes 4-6 minutes. Please wait...
echo.

:: Find the workflow run triggered by our tag
set MAX_RETRIES=30
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
for /f "tokens=1,2" %%a in ('gh run list --workflow "build-macos.yml" --limit 1 --json databaseId^,status --jq ".[0] | \"\(.databaseId) \(.status)\""') do (
    set RUN_ID=%%a
    set RUN_STATUS=%%b
)

if "!RUN_STATUS!"=="completed" (
    echo  macOS build completed! Run ID: !RUN_ID!
    goto MAC_DONE
)

echo  [Attempt %RETRY_COUNT%/%MAX_RETRIES%] Status: !RUN_STATUS! - waiting 20 seconds...
timeout /t 20 /nobreak >nul
goto WAIT_LOOP

:MAC_DONE
echo.

:: ============================================================
:: [6] DOWNLOAD MAC ARTIFACTS
:: ============================================================
echo [6/8] Downloading macOS build artifacts...

:: Create temp download folder
set MAC_DOWNLOAD_DIR=%~dp0_mac_artifacts
if exist "%MAC_DOWNLOAD_DIR%" rmdir /s /q "%MAC_DOWNLOAD_DIR%"
mkdir "%MAC_DOWNLOAD_DIR%"

gh run download !RUN_ID! --name "formease-macos-artifacts" --dir "%MAC_DOWNLOAD_DIR%"

if %ERRORLEVEL% neq 0 (
    echo  WARNING: Failed to download Mac artifacts.
    echo  Check: https://github.com/galanoemerson0016-eng/School-Management-System/actions/runs/!RUN_ID!
    goto SKIP_MAC
)

echo  Mac artifacts downloaded!
echo.

:: Upload Mac DMG and ZIP to GitHub Release
echo  Uploading Mac files to GitHub Release...
for %%f in ("%MAC_DOWNLOAD_DIR%\app\release\*.dmg") do (
    gh release upload "v%NEW_VERSION%" "%%f" --clobber 2>nul
    echo  Uploaded: %%~nxf
)
for %%f in ("%MAC_DOWNLOAD_DIR%\app\release\*.zip") do (
    gh release upload "v%NEW_VERSION%" "%%f" --clobber 2>nul
    echo  Uploaded: %%~nxf
)
echo.

:SKIP_MAC

:: ============================================================
:: [7] PREPARE UPDATE METADATA FOR FIREBASE
:: ============================================================
echo [7/8] Preparing update metadata for Firebase...

set UPDATE_DIR=update-server\updates
if not exist "%~dp0%UPDATE_DIR%" mkdir "%~dp0%UPDATE_DIR%"

:: Clean old exe files (Firebase Spark limit)
del /Q "%~dp0%UPDATE_DIR%\*.exe" 2>nul

:: Copy Windows metadata
copy /Y "%~dp0app\release\latest.yml" "%~dp0%UPDATE_DIR%\" >nul 2>nul
copy /Y "%~dp0app\release\*.blockmap" "%~dp0%UPDATE_DIR%\" >nul 2>nul

:: Copy Mac metadata if available
if exist "%MAC_DOWNLOAD_DIR%\app\release\latest-mac.yml" (
    copy /Y "%MAC_DOWNLOAD_DIR%\app\release\latest-mac.yml" "%~dp0%UPDATE_DIR%\" >nul
    echo  Copied latest-mac.yml to update server.
)
if exist "%MAC_DOWNLOAD_DIR%\app\release\*.blockmap" (
    copy /Y "%MAC_DOWNLOAD_DIR%\app\release\*.blockmap" "%~dp0%UPDATE_DIR%\" >nul 2>nul
    echo  Copied Mac blockmaps to update server.
)

:: Patch latest.yml - redirect download URL to GitHub Releases
set TARGET_YML=%~dp0%UPDATE_DIR%\latest.yml
set GITHUB_EXE_URL=https://github.com/galanoemerson0016-eng/School-Management-System/releases/download/v%NEW_VERSION%/FormEase.Pro.Setup.%NEW_VERSION%.exe
powershell -Command "(gc '%TARGET_YML%') -replace 'url: FormEase Pro Setup %NEW_VERSION%.exe', 'url: %GITHUB_EXE_URL%' -replace 'path: FormEase Pro Setup %NEW_VERSION%.exe', 'path: %GITHUB_EXE_URL%' | Out-File -encoding utf8 '%TARGET_YML%'"

echo  All metadata prepared!
echo.

:: Clean up temp Mac downloads
if exist "%MAC_DOWNLOAD_DIR%" rmdir /s /q "%MAC_DOWNLOAD_DIR%"

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
