@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   FormEase Pro - Project Cleanup Utility
echo ========================================================
echo.
echo This script will remove:
echo   1. Temporary build files (dist, release, temp)
echo   2. Old Mac installers (optional)
echo   3. Firebase cached update metadata
echo.
set /p CONFIRM="Are you sure you want to proceed? (Y/N): "
if /i "%CONFIRM%" neq "Y" exit /b 0

echo.
echo [1/4] Cleaning app build folders...
if exist "app\dist" (
    rmdir /s /q "app\dist"
    echo  Removed app\dist
)
if exist "app\release" (
    rmdir /s /q "app\release"
    echo  Removed app\release
)

echo [2/4] Cleaning temporary release folders...
if exist "_mac_artifacts" (
    rmdir /s /q "_mac_artifacts"
    echo  Removed _mac_artifacts
)
if exist "_mac_temp" (
    rmdir /s /q "_mac_temp"
    echo  Removed _mac_temp
)

echo [3/4] Cleaning update server cache...
if exist "update-server\updates" (
    :: We only delete .blockmap files as we can regenerate them.
    :: We keep .yml files as they are tiny.
    del /q "update-server\updates\*.blockmap" 2>nul
    echo  Cleaned update-server blockmaps.
)

echo [4/4] Optional: Clean old macOS installers...
echo.
echo Your current macOS_Installers folder:
dir /b macOS_Installers 2>nul
echo.
set /p CLEAN_MAC="Do you want to delete ALL old Mac installers? (Y/N): "
if /i "%CLEAN_MAC%"=="Y" (
    if exist "macOS_Installers" (
        rmdir /s /q "macOS_Installers"
        mkdir "macOS_Installers"
        echo  Removed all macOS installers.
    )
)

echo.
echo ========================================================
echo   CLEANUP COMPLETE!
echo   Space has been reclaimed.
echo ========================================================
pause
