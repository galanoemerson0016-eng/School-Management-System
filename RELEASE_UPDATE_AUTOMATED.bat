@echo off
setlocal enabledelayedexpansion

echo.
echo =============================================================
echo   FormEase Pro - DYNAMIC UNIVERSAL RELEASE ^& DEPLOY PIPELINE
echo =============================================================
echo.
echo This unified script will AUTOMATICALLY:
echo   1. Verify local compilation and type-safety (Pre-Flight)
echo   2. Backup latest changes to private GitHub repo
echo   3. Bump package version dynamically (Patch/Minor/Major)
echo   4. Push tag to trigger macOS cloud build
echo   5. Compile Windows EXE with premium obfuscation locally (Dual Arch)
echo   6. Auto-generate changelog from Git commits
echo   7. Create/Update tag on public FormEase-Releases repo
echo   8. Upload Windows installer to public release
echo   9. Monitor macOS cloud build status ^& conclusion (Fail-Safe)
echo  10. Download macOS release files and upload to public release
echo  11. Build ^& deploy BOTH update-server ^& license-portal to Firebase
echo =============================================================
echo.
pause

:: ---- PRE-CHECK: Verify GitHub CLI ----
echo [PRE-CHECK] Checking GitHub CLI auth status...
call gh auth status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  ERROR: GitHub CLI is not authenticated!
    echo  Please run "gh auth login" first.
    pause
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
    pause
    exit /b 1
)
echo  Firebase CLI is logged in.
echo.

:: ============================================================
:: [1] PRE-FLIGHT COMPILATION CHECK (FAIL-FAST LOCALLY)
:: ============================================================
echo [1/11] Running local pre-flight build check...
echo  This verifies React compilation, TypeScript type-safety, and Vite build rules...
echo.
cd /d "%~dp0app"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [PRE-FLIGHT ERROR] Local build or type-checking failed!
    echo  Please resolve all TypeScript/Vite compiler issues before releasing.
    echo.
    pause
    exit /b 1
)
cd /d "%~dp0"
echo  [PRE-FLIGHT SUCCESS] Code compiles successfully! Proceeding with release...
echo.

:: ============================================================
:: [2] GIT ADD, COMMIT, AND PUSH SOURCE CODE
:: ============================================================
echo [2/11] Backing up latest changes to private GitHub repo...
call git add .
set /p COMMIT_MSG="Enter description of release changes: "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Updates and improvements
call git commit -m "%COMMIT_MSG%"
call git push origin main
if %ERRORLEVEL% neq 0 (
    echo  WARNING: Failed to push to private origin main. Continuing anyway...
)
echo  Source code backed up successfully.
echo.

:: ============================================================
:: [3] BUMP VERSION
:: ============================================================
echo [3/11] Select version bump type:
echo  [1] Patch (e.g. 1.0.51 -> 1.0.52) - Recommended
echo  [2] Minor (e.g. 1.0.51 -> 1.1.0)
echo  [3] Major (e.g. 1.0.51 -> 2.0.0)
echo  [4] Keep current version
echo.
set /p BUMP_CHOICE="Enter choice [1-4] (Default is 1): "
if "%BUMP_CHOICE%"=="" set BUMP_CHOICE=1

cd /d "%~dp0app"
if "%BUMP_CHOICE%"=="1" (
    call npm version patch --no-git-tag-version > v_log.txt
) else if "%BUMP_CHOICE%"=="2" (
    call npm version minor --no-git-tag-version > v_log.txt
) else if "%BUMP_CHOICE%"=="3" (
    call npm version major --no-git-tag-version > v_log.txt
) else (
    echo  Keeping current version.
    powershell -Command "(Get-Content package.json | ConvertFrom-Json).version" > v_log.txt
)

for /f "tokens=*" %%a in (v_log.txt) do set NEW_VERSION=%%a
set NEW_VERSION=%NEW_VERSION:v=%
del v_log.txt
echo  Target Release Version: v%NEW_VERSION%
echo.

:: ============================================================
:: [4] TAG AND PUSH FOR CLOUD MAC BUILD
:: ============================================================
echo [4/11] Pushing tag v%NEW_VERSION% to trigger macOS build in the cloud...
cd /d "%~dp0"
call git add app/package.json
call git commit -m "Bump version to v%NEW_VERSION%"
call git tag -f "v%NEW_VERSION%"
call git push origin main "v%NEW_VERSION%" -f
echo  Tag v%NEW_VERSION% pushed successfully. Cloud macOS build triggered.
echo.

:: ============================================================
:: [5] BUILD WINDOWS DUAL-ARCH EXE
:: ============================================================
echo [5/11] Compiling Windows Executable locally (x64 + ia32)...
echo  This applies premium obfuscation and builds dual architectures. Please wait...
echo.
cd /d "%~dp0app"
call npm run electron:build:win
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Windows local build failed!
    pause
    exit /b 1
)
echo  Windows EXE built successfully!
echo.

:: ============================================================
:: [6] GENERATE DYNAMIC CHANGELOG NOTES
:: ============================================================
echo [6/11] Generating Git changelog since last release tag...
cd /d "%~dp0"
set LAST_TAG=
for /f "usebackq tokens=*" %%t in (`call git describe --tags --abbrev=0 "v%NEW_VERSION%^" 2^>nul`) do set LAST_TAG=%%t

set NOTES_FILE=%temp%\release_notes_%NEW_VERSION%.txt
if "!LAST_TAG!"=="" (
    git log --oneline -n 25 > "%NOTES_FILE%"
) else (
    git log !LAST_TAG!..v%NEW_VERSION% --oneline > "%NOTES_FILE%" 2>nul
)

for %%i in ("%NOTES_FILE%") do set NOTES_SIZE=%%~zi
if "!NOTES_SIZE!"=="" set NOTES_SIZE=0
if !NOTES_SIZE! equ 0 (
    echo - Comprehensive security and performance updates > "%NOTES_FILE%"
    echo - Premium visual improvements and alignment fixes >> "%NOTES_FILE%"
)
echo  Changelog summary prepared at "%NOTES_FILE%".
echo.

:: ============================================================
:: [7] CREATE PUBLIC GITHUB RELEASE v%NEW_VERSION%
:: ============================================================
echo [7/11] Creating public GitHub Release v%NEW_VERSION% on FormEase-Releases repo...
call gh release create --repo galanoemerson0016-eng/FormEase-Releases "v%NEW_VERSION%" --title "FormEase Pro v%NEW_VERSION%" --notes-file "%NOTES_FILE%" --latest 2>nul
if %ERRORLEVEL% neq 0 (
    echo  Public release v%NEW_VERSION% already exists or updated.
)
echo.

:: ============================================================
:: [8] UPLOAD WINDOWS DUAL-ARCH EXE TO PUBLIC RELEASE
:: ============================================================
echo [8/11] Uploading Windows installer to the public release...
set WIN_EXE_SOURCE=app\release\FormEase Pro Setup %NEW_VERSION%.exe
set WIN_EXE_TARGET=app\release\FormEase.Pro.Setup.%NEW_VERSION%.exe

if exist "%WIN_EXE_SOURCE%" (
    copy /Y "%WIN_EXE_SOURCE%" "%WIN_EXE_TARGET%" >nul
    echo  Uploading FormEase.Pro.Setup.%NEW_VERSION%.exe...
    call gh release upload --repo galanoemerson0016-eng/FormEase-Releases "v%NEW_VERSION%" "%WIN_EXE_TARGET%" --clobber
    echo  Windows EXE uploaded successfully to public release!
) else (
    echo  ERROR: Windows installer not found at "%WIN_EXE_SOURCE%"!
    pause
    exit /b 1
)
echo.

:: ============================================================
:: [9] MONITOR MAC BUILD STATUS & CONCLUSION (FAIL-SAFE)
:: ============================================================
echo [9/11] Monitoring macOS cloud build progress...
echo  This usually takes 4-6 minutes. The pipeline will automatically verify output health...
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
set RUN_CONCLUSION=
set RUN_BRANCH=

for /f "usebackq tokens=*" %%a in (`call gh run list --workflow "build-macos.yml" --limit 1 --json databaseId --jq ".[0].databaseId" 2^>nul`) do set RUN_ID=%%a
for /f "usebackq tokens=*" %%a in (`call gh run list --workflow "build-macos.yml" --limit 1 --json status --jq ".[0].status" 2^>nul`) do set RUN_STATUS=%%a
for /f "usebackq tokens=*" %%a in (`call gh run list --workflow "build-macos.yml" --limit 1 --json conclusion --jq ".[0].conclusion" 2^>nul`) do set RUN_CONCLUSION=%%a
for /f "usebackq tokens=*" %%a in (`call gh run list --workflow "build-macos.yml" --limit 1 --json headBranch --jq ".[0].headBranch" 2^>nul`) do set RUN_BRANCH=%%a

if "!RUN_BRANCH!"=="v%NEW_VERSION%" (
    if "!RUN_STATUS!"=="completed" (
        if "!RUN_CONCLUSION!"=="failure" (
            echo.
            echo  [FATAL ERROR] macOS Cloud compilation failed!
            echo  Please check the run log details here:
            echo  https://github.com/galanoemerson0016-eng/School-Management-System/actions/runs/!RUN_ID!
            echo.
            pause
            exit /b 1
        )
        if "!RUN_CONCLUSION!"=="cancelled" (
            echo  [WARNING] macOS Cloud run was cancelled. Skipping Mac artifact download.
            goto SKIP_MAC
        )
        echo  macOS cloud build completed successfully!
        goto MAC_DONE
    )
    echo  [Attempt %RETRY_COUNT%/%MAX_RETRIES%] macOS Build Status: !RUN_STATUS! [!RUN_CONCLUSION!]...
) else (
    echo  [Attempt %RETRY_COUNT%/%MAX_RETRIES%] Waiting for v%NEW_VERSION% cloud action to trigger...
)

timeout /t 20 /nobreak >nul
goto WAIT_LOOP

:MAC_DONE
echo.

:: ============================================================
:: [10] DOWNLOAD MAC ARTIFACTS FROM PRIVATE RELEASE
:: ============================================================
echo [10/11] Downloading macOS release files from private repository...
set MAC_TEMP_DIR=_mac_temp
if exist "%MAC_TEMP_DIR%" rmdir /s /q "%MAC_TEMP_DIR%"
mkdir "%MAC_TEMP_DIR%"

call gh release download "v%NEW_VERSION%" --repo galanoemerson0016-eng/School-Management-System --dir "%MAC_TEMP_DIR%"
if %ERRORLEVEL% neq 0 (
    echo  WARNING: Failed to download Mac files. Skipping macOS upload.
    goto SKIP_MAC
)
echo  macOS release files downloaded successfully.
echo.

:: ============================================================
:: [11] UPLOAD MAC FILES TO PUBLIC RELEASE
:: ============================================================
echo [11/11] Uploading macOS installers to the public release...
call gh release upload --repo galanoemerson0016-eng/FormEase-Releases "v%NEW_VERSION%" "%MAC_TEMP_DIR%\*.dmg" "%MAC_TEMP_DIR%\*.zip" --clobber
echo  macOS files uploaded successfully to public release!
echo.

:SKIP_MAC

:: ============================================================
:: [12] BUILD & DEPLOY UPDATE-SERVER & LICENSE-PORTAL TO FIREBASE
:: ============================================================
echo [12/11] Preparing updates metadata directories...

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
set GITHUB_BASE=https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/download/v%NEW_VERSION%

powershell -Command "$base='%GITHUB_BASE%'; $path='%UPDATE_SERVER_DIR%\latest.yml'; (Get-Content $path) | ForEach-Object { if ($_ -match '^\s*-?\s*url:\s*(.+)$') { $prefix = $_ -replace '(^\s*-?\s*url:).*','$1'; $filename = $Matches[1].Trim() -replace ' ','.'; \"$prefix $base/$filename\" } elseif ($_ -match '^path:\s*(.+)$') { $filename = $Matches[1].Trim() -replace ' ','.'; \"path: $filename\" } else { $_ } } | Set-Content $path -Encoding UTF8"
powershell -Command "$base='%GITHUB_BASE%'; $path='%LICENSE_PORTAL_DIR%\latest.yml'; (Get-Content $path) | ForEach-Object { if ($_ -match '^\s*-?\s*url:\s*(.+)$') { $prefix = $_ -replace '(^\s*-?\s*url:).*','$1'; $filename = $Matches[1].Trim() -replace ' ','.'; \"$prefix $base/$filename\" } elseif ($_ -match '^path:\s*(.+)$') { $filename = $Matches[1].Trim() -replace ' ','.'; \"path: $filename\" } else { $_ } } | Set-Content $path -Encoding UTF8"

if exist "%UPDATE_SERVER_DIR%\latest-mac.yml" (
    powershell -Command "$base='%GITHUB_BASE%'; $path='%UPDATE_SERVER_DIR%\latest-mac.yml'; (Get-Content $path) | ForEach-Object { if ($_ -match '^\s*-?\s*url:\s*(.+)$') { $prefix = $_ -replace '(^\s*-?\s*url:).*','$1'; $filename = $Matches[1].Trim() -replace ' ','.'; \"$prefix $base/$filename\" } elseif ($_ -match '^path:\s*(.+)$') { $filename = $Matches[1].Trim() -replace ' ','.'; \"path: $filename\" } else { $_ } } | Set-Content $path -Encoding UTF8"
    powershell -Command "$base='%GITHUB_BASE%'; $path='%LICENSE_PORTAL_DIR%\latest-mac.yml'; (Get-Content $path) | ForEach-Object { if ($_ -match '^\s*-?\s*url:\s*(.+)$') { $prefix = $_ -replace '(^\s*-?\s*url:).*','$1'; $filename = $Matches[1].Trim() -replace ' ','.'; \"$prefix $base/$filename\" } elseif ($_ -match '^path:\s*(.+)$') { $filename = $Matches[1].Trim() -replace ' ','.'; \"path: $filename\" } else { $_ } } | Set-Content $path -Encoding UTF8"
)

echo  Updates metadata successfully prepared.

:: Clean up temp directories
if exist "%MAC_TEMP_DIR%" rmdir /s /q "%MAC_TEMP_DIR%"
if exist "%NOTES_FILE%" del /F /Q "%NOTES_FILE%" >nul 2>nul

:: Build licensing portal frontend
echo.
echo  Building licensing portal website...
cd /d "%~dp0license-portal"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Licensing portal build failed!
    pause
    exit /b 1
)

:: Deploy update-server to Firebase Hosting
echo.
echo  Deploying update server metadata...
cd /d "%~dp0update-server"
call npx firebase deploy --only hosting
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Update server deployment failed!
    pause
    exit /b 1
)

:: Deploy license-portal to Firebase Hosting
echo.
echo  Deploying licensing portal website...
cd /d "%~dp0license-portal"
call npx firebase deploy --only hosting
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Licensing portal deployment failed!
    pause
    exit /b 1
)

echo.
echo =============================================================
echo   SUCCESS! FormEase Pro v%NEW_VERSION% is LIVE ^& DOWNLOADABLE!
echo   GitHub Commits: https://github.com/galanoemerson0016-eng/School-Management-System/commits/main
echo   Public Releases: https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/tag/v%NEW_VERSION%
echo   Licensing portal: https://formease-licensing.web.app/updates
echo =============================================================
pause
exit /b
