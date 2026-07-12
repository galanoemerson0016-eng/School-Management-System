@echo off
set "PATH=%~dp0.node-portable;%~dp0.git-portable\cmd;%~dp0gh-cli\bin;%PATH%"
setlocal enabledelayedexpansion

echo.
echo ========================================================
echo   FORMEASE PRO - GITHUB BACKUP TOOL
echo ========================================================
echo.

:: [0] Check if Git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed or not in your PATH.
    echo Please install Git from https://git-scm.com/
    echo.
    pause
    exit /b
)

:: [1] Check if there are actually changes
:: We check the file size of the status output
git status --short > "%temp%\git_status.txt"
for %%I in ("%temp%\git_status.txt") do set SIZE=%%~zI

if %SIZE% equ 0 (
    echo [INFO] No new changes detected.
    echo Your code is already safely backed up on GitHub!
    echo.
    echo (Make some changes to your files first if you want to save a new version)
    echo.
    pause
    exit /b
)

:: [2] Show what changed
echo The following files have been modified and will be saved:
echo --------------------------------------------------------
git status --short
echo --------------------------------------------------------
echo.

:: [3] Ask for a commit message
set "MESSAGE="
set /p MESSAGE="Enter a short description of your changes: "

if "!MESSAGE!"=="" (
    set MESSAGE=Update at %DATE% %TIME%
)

:: [4] Run the Git commands
echo.
echo [1/3] Preparing files...
git add .

echo [2/3] Saving locally (Committing)...
git commit -m "!MESSAGE!"

echo [3/3] Uploading to GitHub (Pushing)...
git push origin main

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Something went wrong while uploading. 
    echo 1. Check your internet connection.
    echo 2. Make sure you are logged into GitHub (run 'gh auth login').
    echo.
    pause
    exit /b
)

echo.
echo ========================================================
echo   SUCCESS! Your work is now safely saved on GitHub.
echo ========================================================
echo.

:: [5] Open the website
echo Opening your GitHub commits history...
start https://github.com/galanoemerson0016-eng/School-Management-System/commits/main

echo.
echo Done! You can close this window now.
pause
exit /b

