# Bank audit + quarantine scripts

Both use the Firebase Admin SDK, so they need admin credentials that Claude
does not have and must not handle. Run them yourself.

## Setup (once)

    cd scripts/bank-audit
    npm init -y && npm i firebase-admin

Then point at a service account key:

    # PowerShell
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"
    # bash
    export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json

A key can be created at
Firebase console -> Project settings -> Service accounts -> Generate new private key.
Keep it out of the repo — `scripts/bank-audit/.gitignore` already excludes *.json.

## 1. Measure the blast radius (READ ONLY, safe to run any time)

    node audit-sources.mjs

Prints, for every exam bank: total questions, a breakdown by `source`, and how
many contain no domain vocabulary at all. Writes `bank-audit-report.json`.

Nothing is modified. Run this first.

## 2. Quarantine (WRITES — dry run by default)

    node quarantine.mjs                 # dry run, prints what it would change
    node quarantine.mjs --apply         # actually writes status:'quarantined'

Reversible: `node quarantine.mjs --release --apply` clears the field again.

The app treats a missing `status` as active, so nothing changes for any
question this does not touch. Deploy the app first — the filter shipped in
`web/src/utils/questionStatus.ts` — otherwise the field is written but not yet
honoured.
