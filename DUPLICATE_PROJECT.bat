@echo off
set "PATH=%~dp0.node-portable;%~dp0.git-portable\cmd;%~dp0gh-cli\bin;%PATH%"
setlocal enabledelayedexpansion

:: Define source and destination
set "SOURCE=%~dp0"
:: Remove trailing backslash if present
if "%SOURCE:~-1%"=="\" set "SOURCE=%SOURCE:~0,-1%"

echo.
echo ============================================================
echo          FormEase Project Duplicator (Safe Copy)
echo ============================================================
echo.
echo Source: %SOURCE%
echo.
set /p "DEST_NAME=Enter new folder name (e.g. FormEase_Backup): "

if "%DEST_NAME%"=="" (
    echo Error: Destination name cannot be empty.
    pause
    exit /b
)

:: Get parent directory
for %%I in ("%SOURCE%\..") do set "PARENT=%%~fI"
set "DEST=%PARENT%\%DEST_NAME%"

echo.
echo Target Destination: %DEST%
echo.
echo This will copy the project EXCLUDING node_modules and build artifacts
echo to avoid "Path Too Long" errors and save space.
echo.
pause

:: Use robocopy for robust copying
:: /E - Copy subdirectories, including empty ones
:: /XD - Exclude directories
:: /XF - Exclude files
robocopy "%SOURCE%" "%DEST%" /E /XD node_modules .git .vscode dist _mac_temp _mac_artifacts macOS_Installers /XF *.exe *.dmg *.zip /R:1 /W:1

echo.
echo ============================================================
echo Copy Complete! 
echo.
echo Note: You will need to run "npm install" in the new 
echo project sub-folders (app, license-portal, etc.) to 
echo restore dependencies.
echo ============================================================
pause

