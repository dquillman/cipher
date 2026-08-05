<#
.SYNOPSIS
  Flip Cipher's Stripe integration from TEST mode to LIVE mode.

.DESCRIPTION
  Prompts for the live Stripe credentials (they are typed by you, never stored
  in git), rewrites functions/.env preserving every non-Stripe key, backs up the
  test-mode .env, rebuilds, and deploys ONLY the six Stripe-dependent functions
  by name.

  Deploying by name is mandatory: Migraine Tracker shares the
  exam-coach-ai-platform project and the "default" functions codebase, so a bare
  `firebase deploy --only functions` flags its functions as orphans.

.PARAMETER SkipDeploy
  Write .env and build, but stop before deploying.

.PARAMETER Force
  Overwrite an existing .env.test.bak backup.

.EXAMPLE
  .\functions\scripts\stripe-go-live.ps1

.EXAMPLE
  .\functions\scripts\stripe-go-live.ps1 -SkipDeploy
#>
[CmdletBinding()]
param(
    [switch]$SkipDeploy,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$FunctionsDir = Split-Path -Parent $PSScriptRoot
$RepoRoot     = Split-Path -Parent $FunctionsDir
$EnvPath      = Join-Path $FunctionsDir '.env'
$BackupPath   = Join-Path $FunctionsDir '.env.test.bak'
$ProjectId    = 'exam-coach-ai-platform'

# Every function that reads STRIPE_* at runtime. extendExamPass is excluded --
# it grants entitlement from Firestore and never calls Stripe.
$StripeFunctions = @(
    'createCheckoutSession',
    'createPortalSession',
    'stripeWebhook',
    'getSubscriptionDetails',
    'cancelSubscription',
    'createPassCheckoutSession'
)

function Read-Secret {
    param([string]$Label, [string]$Pattern, [string]$Hint)
    while ($true) {
        $secure = Read-Host -Prompt $Label -AsSecureString
        $bstr   = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        try   { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }

        $plain = $plain.Trim()
        if ($plain -match $Pattern) { return $plain }
        Write-Host "  Does not look right -- expected $Hint. Try again." -ForegroundColor Yellow
    }
}

function Read-PriceId {
    param([string]$Label)
    while ($true) {
        $value = (Read-Host -Prompt $Label).Trim()
        if ($value -match '^price_[A-Za-z0-9]+$') { return $value }
        Write-Host "  Expected a Stripe price id (price_...). Try again." -ForegroundColor Yellow
    }
}

Write-Host ''
Write-Host '=== Cipher: Stripe TEST -> LIVE ===' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path $EnvPath)) {
    throw "Not found: $EnvPath"
}

# --- Preserve every non-Stripe key already in .env (OPENAI_API_KEY, RESEND_*, ...)
$preserved = [ordered]@{}
foreach ($line in (Get-Content $EnvPath)) {
    if ($line -match '^\s*#' -or $line.Trim() -eq '') { continue }
    $split = $line.IndexOf('=')
    if ($split -lt 1) { continue }
    $key = $line.Substring(0, $split).Trim()
    $val = $line.Substring($split + 1)
    if ($key -like 'STRIPE_*') { continue }
    $preserved[$key] = $val
}

$currentMode = 'unknown'
if ((Get-Content $EnvPath -Raw) -match 'STRIPE_SECRET_KEY\s*=\s*sk_live_') { $currentMode = 'LIVE' }
elseif ((Get-Content $EnvPath -Raw) -match 'STRIPE_SECRET_KEY\s*=\s*sk_test_') { $currentMode = 'TEST' }
Write-Host "Current functions/.env Stripe mode: $currentMode"
if ($currentMode -eq 'LIVE') {
    Write-Host 'Already live. Continue only if you are rotating credentials.' -ForegroundColor Yellow
}
Write-Host ''

# --- Collect live credentials -------------------------------------------------
Write-Host 'Stripe Dashboard must be in LIVE mode (toggle top-right) for all of these.' -ForegroundColor DarkGray
Write-Host ''

$secretKey = Read-Secret -Label 'Live secret key (Developers > API keys)' `
                         -Pattern '^sk_live_[A-Za-z0-9]+$' -Hint 'sk_live_...'

Write-Host ''
Write-Host 'Webhook endpoint (create it in LIVE mode if it does not exist yet):' -ForegroundColor DarkGray
Write-Host "  URL:    https://us-central1-$ProjectId.cloudfunctions.net/stripeWebhook"
Write-Host '  Events: checkout.session.completed, customer.subscription.deleted'
Write-Host ''

$webhookSecret = Read-Secret -Label 'Live webhook signing secret' `
                             -Pattern '^whsec_[A-Za-z0-9]+$' -Hint 'whsec_...'

Write-Host ''
Write-Host 'Live price id (Product catalog > Cipher Exam > Pricing).' -ForegroundColor DarkGray
Write-Host 'Set explicitly so checkout never falls back to a hardcoded default.' -ForegroundColor DarkGray
Write-Host 'Pro is monthly-only; the $59 90-day Exam Pass uses inline price_data' -ForegroundColor DarkGray
Write-Host 'and needs no price id here.' -ForegroundColor DarkGray
$priceMonthly = Read-PriceId -Label 'Live price id for Pro monthly ($19)'

# --- Back up and rewrite .env -------------------------------------------------
if ((Test-Path $BackupPath) -and (-not $Force)) {
    throw "Backup already exists: $BackupPath (re-run with -Force to overwrite)"
}
Copy-Item $EnvPath $BackupPath -Force
Write-Host ''
Write-Host "Backed up test-mode env -> $BackupPath" -ForegroundColor Green

$lines = @()
foreach ($key in $preserved.Keys) { $lines += "$key=$($preserved[$key])" }
$lines += "STRIPE_SECRET_KEY=$secretKey"
$lines += "STRIPE_WEBHOOK_SECRET=$webhookSecret"
$lines += "STRIPE_PRICE_MONTHLY=$priceMonthly"

# UTF-8 without BOM -- dotenv treats a BOM as part of the first key name.
[System.IO.File]::WriteAllText($EnvPath, ($lines -join "`n") + "`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Wrote live credentials -> $EnvPath" -ForegroundColor Green

# --- Build --------------------------------------------------------------------
Write-Host ''
Write-Host 'Building functions (tsc)...' -ForegroundColor Cyan
npm --prefix $FunctionsDir run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed -- .env is already live; fix the build then re-run with -SkipDeploy off.' }

if ($SkipDeploy) {
    Write-Host ''
    Write-Host 'SkipDeploy set. Deploy manually with:' -ForegroundColor Yellow
    Write-Host "  firebase deploy --only `"functions:$($StripeFunctions -join ',functions:')`" --project $ProjectId"
    return
}

# --- Deploy by name (never bare --only functions) -----------------------------
$target = 'functions:' + ($StripeFunctions -join ',functions:')
Write-Host ''
Write-Host "Deploying $($StripeFunctions.Count) Stripe functions by name..." -ForegroundColor Cyan
Push-Location $RepoRoot
try {
    firebase deploy --only $target --project $ProjectId
    if ($LASTEXITCODE -ne 0) { throw 'Deploy failed. Functions still run the previous (test-mode) revision.' }
}
finally { Pop-Location }

Write-Host ''
Write-Host '=== LIVE ===' -ForegroundColor Green
Write-Host 'Verify now:'
Write-Host '  1. Stripe Dashboard (live) > Settings > Billing > Customer portal -- must be activated'
Write-Host '     separately in live mode, or Manage Subscription throws.'
Write-Host '  2. Buy Pro on cipherexam.com with a real card; confirm users/{uid}.plan == "pro".'
Write-Host '  3. Stripe > Webhooks (live) > recent deliveries -- expect 200 on checkout.session.completed.'
Write-Host '  4. Buy a $59 Exam Pass; confirm the pass entitlement lands.'
Write-Host '  5. Refund the test purchases from the live dashboard.'
Write-Host ''
Write-Host "Rollback: Copy-Item '$BackupPath' '$EnvPath' -Force, then re-run the same deploy command."
