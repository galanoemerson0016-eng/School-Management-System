@echo off
set "PATH=%~dp0.node-portable;%~dp0.git-portable\cmd;%~dp0gh-cli\bin;%PATH%"
setlocal enabledelayedexpansion

:: Get current date and time for the folder name
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set mydate=%%c-%%a-%%b
set "mytime=%time: =0%"
set "TIMESTAMP=%mydate%_%mytime:~0,2%%mytime:~3,2%%mytime:~6,2%"

set "SOURCE=%~dp0"
if "%SOURCE:~-1%"=="\" set "SOURCE=%SOURCE:~0,-1%"

:: Default backup location (Desktop)
set "BACKUP_ROOT=%USERPROFILE%\Desktop\FormEase_Backups"
if not exist "%BACKUP_ROOT%" mkdir "%BACKUP_ROOT%"

set "DEST=%BACKUP_ROOT%\FormEase_Pro_Backup_%TIMESTAMP%"

echo.
echo ============================================================
echo          FORMEASE PRO - SECURE LOCAL BACKUP
echo ============================================================
echo.
echo Source: %SOURCE%
echo Target: %DEST%
echo.
echo This script will create a complete copy of your project.
echo It EXCLUDES 'node_modules' to save space and avoid path 
echo errors, as they can be re-installed using 'npm install'.
echo.
pause

echo.
echo [1/1] Copying files (this may take a minute)...
:: /E  : Copy subdirectories (including empty ones)
:: /R:1: Retry once on failure
:: /W:1: Wait 1 second between retries
:: /MT:8: Multi-threaded (faster)
:: /XD : Exclude these directories
robocopy "%SOURCE%" "%DEST%" /E /R:1 /W:1 /MT:8 /XD node_modules .git .vscode dist _mac_temp _mac_artifacts release

if %ERRORLEVEL% GEQ 8 (
    echo.
    echo [ERROR] Backup encountered issues. Please check if files are in use.
) else (
    echo.
    echo ============================================================
    echo   SUCCESS! Your backup is ready at:
    echo   %DEST%
    echo ============================================================
)

echo.
echo You can now close this window.
pause

