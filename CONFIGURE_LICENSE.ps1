# FormEase License Automation Script
# Use this to update your Project ID across both the Portal and the Main App

$newProjectId = Read-Host "Enter your new Firebase Project ID (e.g. formease-licensing-v2)"

if (-not $newProjectId) {
    Write-Host "Error: Project ID cannot be empty." -ForegroundColor Red
    exit
}

Write-Host "Updating G7 Special App..." -ForegroundColor Cyan
$activationPage = "app/src/pages/ActivationPage.tsx"
(Get-Content $activationPage) -replace 'const projectId = ".*"; // TODO: Change this', "const projectId = '$newProjectId'; // TODO: Change this" | Set-Content $activationPage

Write-Host "Updating License Portal..." -ForegroundColor Cyan
$portalFirebase = "license-portal/src/lib/firebase.ts"
(Get-Content $portalFirebase) -replace 'projectId: ".*"', "projectId: `"$newProjectId`"" | Set-Content $portalFirebase

Write-Host "`nSuccess! Both systems are now pointing to: $newProjectId" -ForegroundColor Green
Write-Host "You can now run START_LICENSE_PORTAL.bat to begin." -ForegroundColor Green
