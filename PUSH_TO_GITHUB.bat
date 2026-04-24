@echo off
echo ========================================
echo   Pushing FormEase G7 to GitHub...
echo ========================================
echo.

git add .
git commit -m "Automated: Build Mac App via GitHub Actions"
git push origin main

echo.
echo ========================================
echo   DONE! 
echo   Go to your GitHub Actions tab to see the build:
echo   https://github.com/galanoemerson0016-eng/School-Management-System/actions
echo ========================================
pause
