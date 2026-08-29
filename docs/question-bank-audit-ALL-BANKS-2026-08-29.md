# All-banks question audit — 1,583 questions, 11 exams

Supersedes both earlier bank documents. Read every bank out of the client
Firestore cache (loaded each one through the app), so this covers the full
catalogue rather than the two banks that happened to be cached.

## Correcting myself: the "46% off-topic" number was not sound

The earlier figure came from asking "does this question contain any
information-security vocabulary?" That test is far too sensitive to how the
word list is written. Adding `secur` to the pattern moved Security+ from 46
off-topic to 7 — same bank, same questions. A screen whose answer swings that
much is not a screen you should quarantine content with.

Replaced it with **positive detection of the two failure modes actually
observed**, which is stable: project-management framing in a bank where that
framing does not belong, and physical-security scenarios in an infosec bank.

That correction also cleared two banks I had provisionally flagged. A+ Core 2
looked like 21% off-topic and Six Sigma like 17% under the vocabulary screen;
under the precise screen they are 1% and 6%. Those were false positives.

## Where the contamination actually is

| Bank | Questions | PM-framed | Physical-security | Verdict |
|---|---|---|---|---|
| **CompTIA Security+ (SY0-701)** | 105 | **42** | **9** | **50 of 100 scored items — bad** |
| ITIL 4 Foundation | 100 | 13 | — | borderline |
| Six Sigma Green Belt | 111 | 7 | — | minor |
| CPP | 207 | 3 | — | clean (real payroll-project scenarios) |
| CIA Part 1 | 185 | 1 | — | clean |
| SHRM-CP | 144 | 1 | — | clean |
| CompTIA Network+ | 106 | 1 | — | clean |
| CompTIA A+ Core 2 | 161 | 1 | — | clean |
| PMP / PgMP / CSM | 464 | n/a | — | PM framing is correct here |

**Security+ is the problem. Everything else is fine or nearly so.**

## The generator is not uniformly at fault

`AI-AutoLeveler` produced 283 questions, and it lives in exactly three banks:

| Bank | AI-AutoLeveler | Quality |
|---|---|---|
| Certified ScrumMaster | 100 of 100 | **clean — 0 questions lack scrum vocabulary** |
| ITIL 4 Foundation | 100 of 100 | 13% PM-framed |
| CompTIA Security+ | 83 of 105 | 40% PM-framed + 9 physical-security |

So the earlier conclusion — "AI-AutoLeveler is the defect" — was too broad. The
same generator produced a clean ScrumMaster bank. What it lacked was grounding
in the SY0-701 objectives specifically: given "Security" with no domain
anchor it drifted to corporate/physical security and to the project-management
register it evidently defaults to.

Worth noting the 9 GPT4o-sourced Security+ items are also PM-framed, which
points at the prompt rather than the model.

## The two failure modes, in the bank's own words

**Physical security in an infosec exam.** SY0-701 Domain 4 is monitoring,
alerting, vulnerability management, incident response, EDR, IAM, automation:

- "A security manager is tasked with revising the **emergency evacuation plan**."
- "During a routine security check, a **guard discovers an open door**."
- "During a security operation at a major corporate event, a **sudden protest begins outside the venue**."

**Project management with a security noun attached** — 16 of the 21 Security
Program Management items:

- "A **project manager** is tasked with conducting security audits on various vendors."
- "In a mid-project review, a security breach is reported. What should the **project manager** do first?"

The Exam Lens then explains these confidently. On `IHMSzuLvBnKZGguPRo1H`, a pure
schedule-risk question, it produced a "SECURITY TRIAD LENS" reading tying the
answer to Integrity. Fluent, and wrong. A candidate cannot tell that apart from
a real explanation, which is precisely the trust being sold.

## What to do

1. **Quarantine the 50.** `scripts/bank-audit/quarantine-list.json` holds the
   explicit IDs; `quarantine.mjs` writes `status:'quarantined'` to exactly those
   and nothing else. The app-side filter shipped to production 2026-08-29, so
   the field takes effect immediately. Fully reversible.
   That leaves Security+ with ~50 usable questions — thin for a 90-question mock
   exam, so consider pausing the full-mock option for that bank until it is
   restocked.
2. **Re-author Security+** against the SY0-701 objectives. The CSM bank shows
   the same generator does fine work when the domain is pinned down; the CPP
   `authored-2026-08-bank-topup` pass is the other model to copy.
3. **ITIL 4's 13 and Six Sigma's 7** are judgement calls — a project manager
   legitimately appears in service-management scenarios. Worth a read, not a
   bulk action.

## Method, so this is repeatable
Load each bank through the app (that populates the Firestore cache), then read
IndexedDB `firestore/[DEFAULT]/exam-coach-ai-platform/main`, store
`remoteDocumentsV14`. No admin credentials needed for the read. Only the write
needs them.

No Firestore writes have been made.
