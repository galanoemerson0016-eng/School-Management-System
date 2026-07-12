@echo off
set "PATH=%~dp0.node-portable;%~dp0.git-portable\cmd;%~dp0gh-cli\bin;%PATH%"
echo ====================================================
echo   FormEase Pro - Firebase Update Deployer
echo ====================================================
echo.
echo This will push your latest metadata (latest.yml)
echo to Firebase Hosting.
echo.
echo Make sure you have already uploaded the .exe to GitHub!
echo.
pause

cd /d "%~dp0update-server"
call firebase deploy --only hosting

echo.
echo ====================================================
echo   DEPLOYMENT COMPLETE!
echo ====================================================
pause

