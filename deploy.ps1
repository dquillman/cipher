<#
.SYNOPSIS
    Deploy ExamCoach to Firebase Hosting.

.DESCRIPTION
    Deploys to the correct hosting target within the exam-coach-ai-platform project.
    Prevents the common mistake of using --project staging (no such project exists).

    Topology:
      Project:  exam-coach-ai-platform
      staging:  exam-coach-ai-platform-staging  (target: staging)
      prod:     exam-coach-ai-platform           (target: production)

    NOTE: Admin Core (admin-core-20292) deploys exclusively from the Admin-Core repo.

.PARAMETER Environment
    Target environment: staging or prod.

.PARAMETER SkipBuild
    Skip the Vite build step (use if you already built).

.EXAMPLE
    .\deploy.ps1 staging
    .\deploy.ps1 prod
    .\deploy.ps1 prod -SkipBuild
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet("staging", "prod")]
    [string]$Environment,

    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

# Map environment names to Firebase hosting targets
# NOTE: "admin" removed — Admin Core deploys exclusively from the Admin-Core repo.
$targetMap = @{
    "staging" = "staging"
    "prod"    = "production"
}

$target = $targetMap[$Environment]

# Ensure correct project is active
$currentProject = firebase use 2>&1 | Select-String -Pattern "Active Project:" | ForEach-Object { $_.ToString().Split(":")[-1].Trim() }

if ($currentProject -and $currentProject -ne "exam-coach-ai-platform") {
    Write-Host "Switching to exam-coach-ai-platform..." -ForegroundColor Yellow
    firebase use exam-coach-ai-platform
}

# Build unless skipped
if (-not $SkipBuild) {
    Write-Host "Building web..." -ForegroundColor Cyan
    Push-Location web
    # `npm run build`, NOT `vite build`. The full build is
    #   generate-sitemap -> tsc -b -> vite build -> prerender
    # and prerender.mjs is the only thing that writes dist/_catchall.html, the
    # rewrite destination for "**" on every hosting target. vite build alone,
    # with emptyOutDir, deletes the previous _catchall.html and every
    # prerendered route directory — the deploy then succeeds while every URL
    # except / returns Firebase's 404.
    npm run build
    Pop-Location

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed. Aborting deploy."
        exit 1
    }
}

# Checked even with -SkipBuild: a stale dist from an older `vite build` is
# exactly the state that ships a site where only the homepage resolves.
if (-not (Test-Path "web/dist/_catchall.html")) {
    Write-Error "ABORT: web/dist/_catchall.html is missing - prerender did not run. Every route except / would 404. Not deploying."
    exit 1
}

# Deploy
Write-Host ""
Write-Host "Deploying to $Environment (hosting target: $target)..." -ForegroundColor Green
Write-Host "Command: firebase deploy --only hosting:$target" -ForegroundColor DarkGray
Write-Host ""

firebase deploy --only hosting:$target

if ($LASTEXITCODE -eq 0) {
    $urls = @{
        "staging" = "https://exam-coach-ai-platform-staging.web.app"
        "prod"    = "https://exam-coach-ai-platform.web.app"
    }
    Write-Host ""
    Write-Host "Deployed to $Environment : $($urls[$Environment])" -ForegroundColor Green
} else {
    Write-Error "Deploy failed."
    exit 1
}
