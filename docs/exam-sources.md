# Exam sources and currency

Every certification we sell, the exact blueprint version its bank is written
against, and what the certifying body currently tests.

**Why the version column exists.** This table used to list only the exam and the
body's domain ("PMP | PMI | pmi.org"). With no version string and no date,
nothing could be grepped and nothing could expire — so a bank could drift onto a
retired outline and the file would still look correct. CipherExam shipped a
retired PMP outline as its default for four weeks that way, and an audit on
8 August 2026 found three more certifications in the same state. Never add a row
without a version and a date.

Automated monitoring lives in `functions/src/examWatch.ts`, with one source per
certification registered by `seedExamSources`. It emails on any change and on any
source it cannot fetch.

Last full audit: **8 August 2026**.

| Exam | Body | Our bank targets | Currently tested | Status |
|---|---|---|---|---|
| PMP | PMI | **ECO July 2026** | ECO July 2026 | ✅ current |
| PMP (retired bank) | PMI | ECO 2021 | — | ⛔ retired, unpublished (superseded 9 Jul 2026) |
| Security+ | CompTIA | **SY0-701** | SY0-701 | ✅ current — V8 draft objectives published, recheck Oct 2026 |
| CSM | Scrum Alliance | **CSM Learning Objectives Jan 2022 · Scrum Guide Nov 2020** | same | ✅ current |
| Six Sigma Green Belt | ASQ | **CSSGB BoK 2022** | CSSGB BoK 2022 | ⚠️ content current; Firestore blueprint weights wrong |
| CIA Part 1 | IIA | **2025 syllabus** | 2025 syllabus | ⚠️ blueprint sums to 95%, five domains vs the IIA's four |
| PgMP | PMI | PgMP ECO (undated) | **PgMP ECO March 2024** | ⚠️ domain labels renamed in the 2024 revision |
| ITIL 4 Foundation | PeopleCert | **syllabus v4.2.0 (Mar 2025)** | ITIL 4 still bookable until 31 Dec 2027 | ⚠️ ITIL Foundation **V5** launched Feb 2026 and is now the flagship |
| SHRM-CP | SHRM | **BASK 2024** | **BASK 2026** (from 1 May 2026) | ⛔ stale — bank still tests "Global Mindset", abolished and merged into "Inclusive Mindset" |
| CPP | PayrollOrg | **2019 KSA outline** | 2019 KSA until 4 Sep 2026, **new outline from 5 Sep 2026** | ⛔ expires in weeks; tax basis also turns over annually |
| Network+ | CompTIA | **N10-008** | **N10-009** (since 20 Jun 2024) | ⛔ **RETIRED** — not for sale |
| A+ Core 2 | CompTIA | **220-1102** | **220-1202** (V15, since 25 Mar 2025) | ⛔ **RETIRED** — not for sale |

## Retired banks

Network+ (N10-008) and A+ Core 2 (220-1102) target exam codes CompTIA no longer
administers — N10-008 since December 2024, 220-1102 since 25 September 2025.
Both are flagged `retired: true` in `web/src/config/exams.ts`, which removes them
from `SELLABLE_EXAMS` and from the Exam Pass purchase dropdown, and both were
removed from the homepage ticker.

They are deliberately **not** relabelled to the current codes. Renaming a bank
from N10-008 to N10-009 without re-authoring it against the V9 objectives turns a
stale bank into a false claim — the same mistake as calling a 2021-outline PMP
bank "2026-ready". Re-enabling either means new content, then a new exam id with
`supersededBy` pointing at it, following the PMP precedent.

## Recheck triggers

- **CPP — before 5 Sep 2026.** A new content outline takes effect and the tax
  basis moves. This is the nearest deadline.
- **Security+ — Oct 2026.** V8 draft objectives are published; vendor consensus
  points at a preview around then.
- **ITIL 4 — before 31 Dec 2027.** Sunset date. V5 is already the flagship.
- **Everything else — quarterly**, or whenever `examWatch` sends an alert.
