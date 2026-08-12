$target = "web/src/version.ts"
$backup = "$target.bak"

if (-not (Test-Path $target)) {
    Write-Host "ERROR: version.ts not found"
    exit 1
}

Copy-Item $target $backup -Force
Write-Host "Backup created: version.ts.bak"

$content = Get-Content $target -Raw

# Simple timestamp-based version
$timestamp = Get-Date -Format "yyyy.MM.dd.HHmm"
$newVersion = "STAGING-$timestamp"

$content = $content -replace "export const APP_VERSION = .*?;", "export const APP_VERSION = '$newVersion';"

Set-Content $target $content
Write-Host "APP_VERSION bumped to $newVersion"
