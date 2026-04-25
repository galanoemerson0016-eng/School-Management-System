@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo   FormEase Pro - Automatic Update Releaser
echo ====================================================
echo.
echo This script will:
echo 1. Bump your application version (1.0.x -^> 1.0.x+1)
echo 2. Build the new Windows Desktop App
echo 3. Prepare the update files for Firebase Hosting
echo.

cd /d "%~dp0app"

echo [1/3] Bumping version number...
call npm version patch --no-git-tag-version
echo.

echo [2/3] Building new Electron Executable...
echo This may take a few minutes...
call npm run electron:build:win
echo.

echo [3/3] Preparing Update Files...
if not exist "..\update-server" mkdir "..\update-server"
if not exist "..\update-server\updates" mkdir "..\update-server\updates"

echo Copying latest build files...
copy /Y "release\*.exe" "..\update-server\updates\" >nul
copy /Y "release\latest.yml" "..\update-server\updates\" >nul
copy /Y "release\*.blockmap" "..\update-server\updates\" >nul

echo.
echo ====================================================
echo   UPDATE READY FOR DEPLOYMENT!
echo ====================================================
echo.
echo We have copied the new update files into the folder:
echo FormEase G7 Special\update-server\updates\
echo.
echo HOW TO FINISH DEPLOYING:
echo 1. Open a terminal in the "update-server" folder.
echo 2. Make sure you are logged into Firebase (firebase login).
echo 3. Run: firebase init hosting (if you haven't yet)
echo    - Select your FormEase project (formease-app-a3e68)
echo    - Use "updates" as your public directory.
echo 4. Run: firebase deploy --only hosting
echo.
echo Once deployed, all your users' apps will automatically
echo download the new update and install it in the background!
echo ====================================================
pause
