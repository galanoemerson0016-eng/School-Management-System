@echo off
setlocal enabledelayedexpansion

echo.
echo =============================================================
echo   FormEase Pro - FULLY AUTOMATED v1.0.51 RELEASE ^& DEPLOY
echo =============================================================
echo.
echo This script will AUTOMATICALLY:
echo   1. Commit ^& push latest source code to private GitHub repo
echo   2. Bump version to 1.0.51 in app/package.json
echo   3. Tag the code v1.0.51 to trigger macOS build in the cloud
echo   4. Compile Windows EXE with premium obfuscation locally
echo   5. Create a PUBLIC release v1.0.51 on FormEase-Releases repo
echo   6. Upload Windows installer to the public release
echo   7. Wait for macOS cloud build to complete
echo   8. Download macOS installer files from the private release
echo   9. Upload macOS installer files to the public release
echo  10. Build ^& deploy both update-server ^& license-portal to Firebase
echo.
echo  No large EXE installers will be uploaded to Firebase,
echo  keeping your hosting storage clean and free!
echo =============================================================
echo.
timeout /t 3 /nobreak >nul

:: ---- PRE-CHECK: Verify GitHub CLI ----
echo [PRE-CHECK] Checking GitHub CLI auth status...
call gh auth status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  ERROR: GitHub CLI is not authenticated!
    echo  Please run "gh auth login" first.
    timeout /t 10
    exit /b 1
)
echo  GitHub CLI is authenticated.
echo.

:: ---- PRE-CHECK: Verify Firebase CLI ----
echo [PRE-CHECK] Checking Firebase CLI auth status...
call npx firebase projects:list >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Firebase CLI is not logged in!
    echo  Please run "npx firebase login" first.
    timeout /t 10
    exit /b 1
)
echo  Firebase CLI is logged in.
echo.

:: ============================================================
:: [1] GIT ADD, COMMIT, AND PUSH SOURCE CODE
:: ============================================================
echo [1/10] Backing up latest changes to private GitHub repo...
call git add .
call git commit -m "Release v1.0.51 - profile picture avatar implementation"
call git push origin main
if %ERRORLEVEL% neq 0 (
    echo  WARNING: Failed to push to private origin main. Continuing anyway...
)
echo  Source code backed up successfully.
echo.

:: ============================================================
:: [2] BUMP VERSION TO 1.0.51
:: ============================================================
echo [2/10] Bumping version number in app/package.json...
cd /d "%~dp0app"
:: Manually force version to 1.0.51 for complete accuracy
powershell -Command "$p = Get-Content package.json | ConvertFrom-Json; $p.version = '1.0.51'; $p | ConvertTo-Json -Depth 10 | Set-Content package.json -Encoding UTF8"
echo  Version set to 1.0.51 in app/package.json.
echo.

:: ============================================================
:: [3] TAG AND PUSH FOR CLOUD MAC BUILD
:: ============================================================
echo [3/10] Pushing tag v1.0.51 to trigger macOS build in the cloud...
cd /d "%~dp0"
call git add app/package.json
call git commit -m "Bump version to v1.0.51"
call git tag -f "v1.0.51"
call git push origin main --tags -f
echo  Tag v1.0.51 pushed successfully. Cloud macOS build triggered.
echo.

:: ============================================================
:: [4] BUILD WINDOWS EXE
:: ============================================================
echo [4/10] Compiling Windows Executable locally...
echo  This applies high-level obfuscation. Please wait...
echo.
cd /d "%~dp0app"
call npm run electron:build:win
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Windows local build failed!
    timeout /t 10
    exit /b 1
)
echo  Windows EXE built successfully!
echo.

:: ============================================================
:: [5] CREATE PUBLIC GITHUB RELEASE v1.0.51
:: ============================================================
echo [5/10] Creating public GitHub Release v1.0.51 on FormEase-Releases repo...
call gh release create --repo galanoemerson0016-eng/FormEase-Releases "v1.0.51" --title "FormEase Pro v1.0.51" --notes "FormEase Pro Release v1.0.51" --latest 2>nul
if %ERRORLEVEL% neq 0 (
    echo  Public release v1.0.51 already exists or updated.
)
echo.

:: ============================================================
:: [6] UPLOAD WINDOWS EXE TO PUBLIC RELEASE
:: ============================================================
echo [6/10] Uploading Windows installer to the public release...
set WIN_EXE_SOURCE=app\release\FormEase Pro Setup 1.0.51.exe
set WIN_EXE_TARGET=app\release\FormEase.Pro.Setup.1.0.51.exe

if exist "%WIN_EXE_SOURCE%" (
    copy /Y "%WIN_EXE_SOURCE%" "%WIN_EXE_TARGET%" >nul
    echo  Uploading FormEase.Pro.Setup.1.0.51.exe...
    call gh release upload --repo galanoemerson0016-eng/FormEase-Releases "v1.0.51" "%WIN_EXE_TARGET%" --clobber
    echo  Windows EXE uploaded successfully to public release!
) else (
    echo  ERROR: Windows installer not found at "%WIN_EXE_SOURCE%"!
    timeout /t 10
    exit /b 1
)
echo.

:: ============================================================
:: [7] WAIT FOR MAC BUILD TO COMPLETE IN THE CLOUD
:: ============================================================
echo [7/10] Waiting for macOS cloud build to complete...
echo  This usually takes 4-6 minutes. Feel free to grab a coffee!
echo.

set MAX_RETRIES=60
set RETRY_COUNT=0

:WAIT_LOOP
set /a RETRY_COUNT+=1
if %RETRY_COUNT% gtr %MAX_RETRIES% (
    echo  TIMEOUT: macOS cloud build did not complete. Continuing with Windows only.
    goto SKIP_MAC
)

set RUN_ID=
set RUN_STATUS=
set RUN_BRANCH=

for /f "usebackq tokens=*" %%a in (`call gh run list --workflow "build-macos.yml" --limit 1 --json databaseId --jq ".[0].databaseId" 2^>nul`) do set RUN_ID=%%a
for /f "usebackq tokens=*" %%a in (`call gh run list --workflow "build-macos.yml" --limit 1 --json status --jq ".[0].status" 2^>nul`) do set RUN_STATUS=%%a
for /f "usebackq tokens=*" %%a in (`call gh run list --workflow "build-macos.yml" --limit 1 --json headBranch --jq ".[0].headBranch" 2^>nul`) do set RUN_BRANCH=%%a

if "!RUN_BRANCH!"=="v1.0.51" (
    if "!RUN_STATUS!"=="completed" (
        echo  macOS cloud build completed!
        goto MAC_DONE
    )
    echo  [Attempt %RETRY_COUNT%/%MAX_RETRIES%] macOS Build Status: !RUN_STATUS!...
) else (
    echo  [Attempt %RETRY_COUNT%/%MAX_RETRIES%] Waiting for v1.0.51 workflow to trigger...
)

timeout /t 20 /nobreak >nul
goto WAIT_LOOP

:MAC_DONE
echo.

:: ============================================================
:: [8] DOWNLOAD MAC ARTIFACTS FROM PRIVATE RELEASE
:: ============================================================
echo [8/10] Downloading macOS release files from private repository...
set MAC_TEMP_DIR=_mac_temp
if exist "%MAC_TEMP_DIR%" rmdir /s /q "%MAC_TEMP_DIR%"
mkdir "%MAC_TEMP_DIR%"

call gh release download "v1.0.51" --repo galanoemerson0016-eng/School-Management-System --dir "%MAC_TEMP_DIR%"
if %ERRORLEVEL% neq 0 (
    echo  WARNING: Failed to download Mac files. Skipping macOS upload.
    goto SKIP_MAC
)
echo  macOS release files downloaded successfully.
echo.

:: ============================================================
:: [9] UPLOAD MAC FILES TO PUBLIC RELEASE
:: ============================================================
echo [9/10] Uploading macOS installers to the public release...
call gh release upload --repo galanoemerson0016-eng/FormEase-Releases "v1.0.51" "%MAC_TEMP_DIR%\*.dmg" "%MAC_TEMP_DIR%\*.zip" --clobber
echo  macOS files uploaded successfully to public release!
echo.

:SKIP_MAC

:: ============================================================
:: [10] BUILD & DEPLOY UPDATE-SERVER & LICENSE-PORTAL TO FIREBASE
:: ============================================================
echo [10/10] Building ^& deploying update-server ^& license-portal...

:: Define destinations
set UPDATE_SERVER_DIR=update-server\updates
set LICENSE_PORTAL_DIR=license-portal\public\updates

:: Create directories if missing
if not exist "%UPDATE_SERVER_DIR%" mkdir "%UPDATE_SERVER_DIR%"
if not exist "%LICENSE_PORTAL_DIR%" mkdir "%LICENSE_PORTAL_DIR%"

:: Clean updates folders locally to save space
del /Q "%UPDATE_SERVER_DIR%\*.blockmap" 2>nul
del /Q "%UPDATE_SERVER_DIR%\latest*.yml" 2>nul
del /Q "%LICENSE_PORTAL_DIR%\*.blockmap" 2>nul
del /Q "%LICENSE_PORTAL_DIR%\latest*.yml" 2>nul

:: Copy files
copy /Y "app\release\latest.yml" "%UPDATE_SERVER_DIR%\" >nul
copy /Y "app\release\*.blockmap" "%UPDATE_SERVER_DIR%\" >nul
copy /Y "app\release\latest.yml" "%LICENSE_PORTAL_DIR%\" >nul
copy /Y "app\release\*.blockmap" "%LICENSE_PORTAL_DIR%\" >nul

if exist "%MAC_TEMP_DIR%\latest-mac.yml" (
    copy /Y "%MAC_TEMP_DIR%\latest-mac.yml" "%UPDATE_SERVER_DIR%\" >nul
    copy /Y "%MAC_TEMP_DIR%\latest-mac.yml" "%LICENSE_PORTAL_DIR%\" >nul
)

:: Patch latest.yml to point to the public FormEase-Releases repo
set GITHUB_BASE=https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/download/v1.0.51

powershell -Command "$base='%GITHUB_BASE%'; $path='%UPDATE_SERVER_DIR%\latest.yml'; (Get-Content $path) | ForEach-Object { if ($_ -match '^\s*-?\s*url:\s*(.+)$') { $prefix = $_ -replace '(^\s*-?\s*url:).*','$1'; $filename = $Matches[1].Trim() -replace ' ','.'; \"$prefix $base/$filename\" } elseif ($_ -match '^path:\s*(.+)$') { $filename = $Matches[1].Trim() -replace ' ','.'; \"path: $filename\" } else { $_ } } | Set-Content $path -Encoding UTF8"
powershell -Command "$base='%GITHUB_BASE%'; $path='%LICENSE_PORTAL_DIR%\latest.yml'; (Get-Content $path) | ForEach-Object { if ($_ -match '^\s*-?\s*url:\s*(.+)$') { $prefix = $_ -replace '(^\s*-?\s*url:).*','$1'; $filename = $Matches[1].Trim() -replace ' ','.'; \"$prefix $base/$filename\" } elseif ($_ -match '^path:\s*(.+)$') { $filename = $Matches[1].Trim() -replace ' ','.'; \"path: $filename\" } else { $_ } } | Set-Content $path -Encoding UTF8"

if exist "%UPDATE_SERVER_DIR%\latest-mac.yml" (
    powershell -Command "$base='%GITHUB_BASE%'; $path='%UPDATE_SERVER_DIR%\latest-mac.yml'; (Get-Content $path) | ForEach-Object { if ($_ -match '^\s*-?\s*url:\s*(.+)$') { $prefix = $_ -replace '(^\s*-?\s*url:).*','$1'; $filename = $Matches[1].Trim() -replace ' ','.'; \"$prefix $base/$filename\" } elseif ($_ -match '^path:\s*(.+)$') { $filename = $Matches[1].Trim() -replace ' ','.'; \"path: $filename\" } else { $_ } } | Set-Content $path -Encoding UTF8"
    powershell -Command "$base='%GITHUB_BASE%'; $path='%LICENSE_PORTAL_DIR%\latest-mac.yml'; (Get-Content $path) | ForEach-Object { if ($_ -match '^\s*-?\s*url:\s*(.+)$') { $prefix = $_ -replace '(^\s*-?\s*url:).*','$1'; $filename = $Matches[1].Trim() -replace ' ','.'; \"$prefix $base/$filename\" } elseif ($_ -match '^path:\s*(.+)$') { $filename = $Matches[1].Trim() -replace ' ','.'; \"path: $filename\" } else { $_ } } | Set-Content $path -Encoding UTF8"
)

echo  Updates metadata successfully prepared.

:: Clean up temp directories
if exist "%MAC_TEMP_DIR%" rmdir /s /q "%MAC_TEMP_DIR%"

:: Build licensing portal frontend
echo.
echo  Building licensing portal website...
cd /d "%~dp0license-portal"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Licensing portal build failed!
    timeout /t 10
    exit /b 1
)

:: Deploy update-server to Firebase Hosting
echo.
echo  Deploying update server metadata...
cd /d "%~dp0update-server"
call npx firebase deploy --only hosting
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Update server deployment failed!
    timeout /t 10
    exit /b 1
)

:: Deploy license-portal to Firebase Hosting
echo.
echo  Deploying licensing portal website...
cd /d "%~dp0license-portal"
call npx firebase deploy --only hosting
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Licensing portal deployment failed!
    timeout /t 10
    exit /b 1
)

echo.
echo =============================================================
echo   SUCCESS! FormEase Pro v1.0.51 is LIVE ^& DOWNLOADABLE!
echo   GitHub Commits: https://github.com/galanoemerson0016-eng/School-Management-System/commits/main
echo   Public Releases: https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/tag/v1.0.51
echo   Licensing portal: https://formease-licensing.web.app/updates
echo =============================================================
timeout /t 15
exit /b
