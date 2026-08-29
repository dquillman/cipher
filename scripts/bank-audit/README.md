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

---

## Replacing the Security+ bank (added 2026-08-29)

`seed/security-plus-replacements.json` holds 50 questions written against the
SY0-701 objectives, weighted to close the gaps the quarantine leaves:

| Domain | Written | Post-swap total | Needed for a 90Q mock |
|---|---|---|---|
| Security Program Management | 20 | 21 | 18 |
| Threats, Vulnerabilities, Mitigations | 12 | 23 | 20 |
| General Security Concepts | 10 | 13 | 11 |
| Security Operations | 8 | 29 | 25 |
| Security Architecture | 0 | 19 | 16 |

Every domain clears its mock requirement, and the bank stays at 105.

### Run it

    cd scripts/bank-audit
    npm init -y && npm i firebase-admin
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"

    node swap-security-plus.mjs            # dry run — prints the plan
    node swap-security-plus.mjs --apply    # execute

Inserts the 50 new questions first, then quarantines the 50 old ones, so a
failure part-way leaves the bank larger rather than smaller. It refuses to run
twice (it checks for the `authored-2026-08-secplus-rebuild` source first) and
reads every document back afterwards instead of trusting the writes.

Full reversal: `node swap-security-plus.mjs --undo --apply`

### On the authoring

Written to match the `authored-2026-08-eco-refresh` pattern already in the
Network+ and A+ banks: a scenario stem of roughly 250-350 characters, four
plausible options, an objective code, and an explanation that says why the key
is right *and* why each distractor fails. Voice is the security analyst and
practitioner, not the project manager — that register is what went wrong in the
bank being replaced.

The answer key is distributed 13/13/12/12 across positions A-D. First draft had
all 50 correct answers at index 0, which would have let a candidate score 100%
by always picking A; the shuffle in the build step fixes that, and three
explanations that referred to options by position were rewritten to refer to
them by content.

These are unreviewed by a subject matter expert. Read the dry-run output before
applying.
