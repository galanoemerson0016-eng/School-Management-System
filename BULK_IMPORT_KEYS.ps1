# FormEase Bulk License Importer
# This script imports keys from keys_template.csv into your Firestore project

Write-Host "FormEase Bulk Importer" -ForegroundColor Blue
Write-Host "-----------------------" -ForegroundColor Blue

# 1. Detect Project ID
$activationFile = "app/src/pages/ActivationPage.tsx"
if (Test-Path $activationFile) {
    $content = Get-Content $activationFile
    if ($content -match "const projectId = '(.*)'; // TODO") {
        $projectId = $matches[1]
        Write-Host "Detected Project ID: $projectId" -ForegroundColor Cyan
    }
}

if (-not $projectId) {
    $projectId = Read-Host "Could not detect Project ID. Please enter it manually"
}

# 2. Check for CSV
$csvFile = "keys_template.csv"
if (-not (Test-Path $csvFile)) {
    Write-Host "Error: $csvFile not found!" -ForegroundColor Red
    exit
}

$keys = Import-Csv $csvFile

Write-Host "Starting import of $($keys.Count) keys..." -ForegroundColor Yellow

foreach ($key in $keys) {
    $serial = $key.serial.Trim().ToUpper()
    $name = $key.registered_to.Trim()
    $expiry = $key.expires_at.Trim()

    # Convert expiry to ISO Timestamp if it's just a date
    if ($expiry -match "^\d{4}-\d{2}-\d{2}$") {
        $expiry = $expiry + "T00:00:00Z"
    }

    Write-Host "Importing: $serial ..." -NoNewline

    $body = @{
        fields = @{
            serial = @{ stringValue = $serial }
            status = @{ stringValue = "pending" }
            machine_id = @{ stringValue = "" }
            registered_to = @{ stringValue = $name }
            expires_at = @{ stringValue = $expiry }
            activated_at = @{ nullValue = $null }
        }
    } | ConvertTo-Json -Depth 10

    $url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/artifacts/g7-special/public/data/licenses?documentId=$serial"

    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
        Write-Host " [OK]" -ForegroundColor Green
    } catch {
        $err = $_.Exception.Message
        if ($err -like "*409*") {
            Write-Host " [SKIP - Already Exists]" -ForegroundColor Yellow
        } else {
            Write-Host " [FAILED: $err]" -ForegroundColor Red
        }
    }
}

Write-Host "`nBulk Import Complete!" -ForegroundColor Green
pause
