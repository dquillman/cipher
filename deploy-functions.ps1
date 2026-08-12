param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging","prod")]
    [string]$env
)

Write-Host ""
Write-Host "====================================="
Write-Host " ExamCoach Safe Deploy Script"
Write-Host "====================================="
Write-Host ""

$current = firebase use

Write-Host "Active Firebase Project:"
Write-Host $current
Write-Host ""

if ($env -eq "staging") {

    Write-Host "Deploying FUNCTIONS (shared backend)" -ForegroundColor Cyan
    Write-Host "Deploying HOSTING: staging" -ForegroundColor Cyan

    firebase deploy --only functions
    firebase deploy --only hosting:staging

    exit
}

if ($env -eq "prod") {

    Write-Host ""
    Write-Host "⚠️  WARNING: PRODUCTION DEPLOY" -ForegroundColor Yellow
    Write-Host "This affects live users."
    Write-Host ""

    $confirmation = Read-Host "Type DEPLOY-PROD to continue"

    if ($confirmation -ne "DEPLOY-PROD") {
        Write-Host "Deployment cancelled." -ForegroundColor Red
        exit
    }

    firebase deploy --only functions
    firebase deploy --only hosting:prod
}
