$base = 'https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/download/v1.0.51'

$files = @(
    'update-server\updates\latest.yml',
    'license-portal\public\updates\latest.yml'
)

foreach ($path in $files) {
    if (Test-Path $path) {
        $lines = Get-Content $path
        $newLines = @()
        foreach ($line in $lines) {
            if ($line -match '^\s*-?\s*url:\s*(.+)$') {
                $prefix = $line -replace '(^\s*-?\s*url:).*','$1'
                $filename = $Matches[1].Trim() -replace ' ','.'
                $newLines += "$prefix $base/$filename"
            } elseif ($line -match '^path:\s*(.+)$') {
                $filename = $Matches[1].Trim() -replace ' ','.'
                $newLines += "path: $filename"
            } else {
                $newLines += $line
            }
        }
        $newLines | Set-Content $path -Encoding UTF8
        Write-Host "Patched: $path"
    }
}

Write-Host "Done patching latest.yml files!"
