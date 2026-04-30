$version = "1.0.31"
$base = "https://github.com/galanoemerson0016-eng/School-Management-System/releases/download/v$version"
$path = "update-server\updates\latest.yml"

if (!(Test-Path "update-server\updates")) {
    New-Item -ItemType Directory -Force -Path "update-server\updates"
}

Copy-Item -Path "app\release\latest.yml" -Destination "update-server\updates\" -Force
Copy-Item -Path "app\release\*.blockmap" -Destination "update-server\updates\" -Force

(Get-Content $path) | ForEach-Object {
    if ($_ -match '^(url|path):') {
        $parts = $_ -split ': '
        $newVal = $parts[1] -replace ' ', '.'
        if ($_ -match '^url:') {
            "url: $base/$newVal"
        } else {
            "path: $newVal"
        }
    } else {
        $_
    }
} | Set-Content $path -Encoding UTF8
