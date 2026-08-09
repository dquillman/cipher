# Exam currency roadmap

Written 2026-08-08, after the July 2026 PMP ECO remediation (PR #51).

The PMP incident was not "we missed an announcement". PMI published the new
Exam Content Outline, cut over on **9 July 2026**, and CipherExam kept serving a
bank built to the retired outline as its default for four weeks. The detection
machinery we already had *fired* and nothing happened.

This roadmap is ordered by leverage, not by size. Phase 1 is the one that stops
this class of failure recurring across all eleven certifications; everything
after it is cleanup and capability.

---

## Phase 0 — finish the shipped change

Status: code merged, Firestore migrated, deploy pending.

- [ ] Deploy hosting with the **full** build (`npm --prefix web run build` —
      tsc → vite → sitemap → prerender). `deploy.ps1` and `deploy-web.sh` both
      run bare `vite build` and will drop `_catchall.html` and every prerendered
      page. See `cipher-deploy-gotchas`.
- [ ] Deploy `generateSmartQuizReview` **by name**. A bare functions deploy from
      this repo will offer to delete migraine-tracker's `askMyData`.
- [ ] Verify live: new session defaults to the 2026 bank; the retired bank is
      absent from the picker; `fbevents.js` appears exactly once and `fbq` is a
      function.

---

## Phase 1 — make outline changes impossible to miss

**This is the fix that mattered.** Everything in the PMP remediation was a
symptom; this is the cause. Evidence from production on 2026-08-08:

| Source | State |
|---|---|
| `pmp-examination-content-outline.pdf` | `status: changed`, detected **2 Aug 2026** — and never surfaced to a human |
| `pmp-exam-updates` page | `status: manual_review`, `lastChangeDetectedAt: never`, **403 on every run** |
| The other 9 certifications | **No watcher at all** |

Three independent defects, each sufficient on its own to cause the incident.

1. **Route the signal to a human.** `performExamUpdateCheck` sets
   `status: 'changed'` on a Firestore doc and stops. Nothing reads it. Send an
   email (Resend is already wired for lead magnets and drip) and surface a
   banner in the admin view. A detected change should be impossible to ignore.
2. **Fix the 403.** The function sends a Googlebot User-Agent, which pmi.org
   rejects. A normal desktop browser UA fetches both the page and the PDF
   without issue — verified 2026-08-07 while downloading the 2026 ECO. Also
   treat a source that has *never* succeeded as a hard failure, not a quiet
   `manual_review`.
3. **Watch the right URL, and watch all of them.** The PMP source still points
   at the 2021 PDF. Register a source per certification — CompTIA objectives
   pages, Scrum Guide, SHRM BASK, ASQ BoK, IIA Standards, ITIL, APA, and both
   PMI outlines — and store the exam id alongside so an alert names the bank it
   threatens.
4. **Store what changed, not just that it changed.** A content hash tells you
   nothing actionable. Keep the previous extracted text and diff it, so the
   alert can say "domain weightings changed" rather than "bytes differ".

Effort: small. Value: this is the difference between finding out in four weeks
and finding out in seven days.

---

## Phase 2 — audit the other ten certifications

The PMP staleness was found by accident. Nothing suggests it is unique, and one
mismatch is already confirmed:

- **Network+** — the homepage ticker advertises **N10-009**; `exams.ts` and the
  citation both say **N10-008**, which CompTIA has retired. One of the two is
  wrong and it is almost certainly the config.
- **Security+ SY0-701**, **A+ 220-1102**, **ITIL 4**, **SHRM BASK**, **ASQ
  CSSGB**, **IIA Standards (2025)**, **APA CPP**, **Scrum Guide 2020**,
  **PgMP** — each needs the same treatment the PMP got: fetch the current
  official objectives, compare domain names and weightings against the Firestore
  exam doc's `blueprint`, and compare the actual per-domain question
  distribution against it.

Do this once as a batch audit, then let Phase 1 keep it true. Output should be a
table per exam: objectives version we claim, objectives version that is current,
our bank's distribution, the official weighting.

Effort: one focused pass per exam, parallelisable.

---

## Phase 3 — entitlement lineage

Right now existing users are **deliberately stranded** on the retired PMP bank.
Moving them is a one-line change that would revoke paid access, because
`isPassActiveFor` matches `pass.examId` by strict equality and five gates depend
on it (`App.tsx`, `MockExamGuard`, `Quiz`, `SimulatorIntro`, `BloomHeatmap`).

Two options, in preference order:

1. **Lineage-aware entitlement (preferred).** Give an exam a `supersedes` /
   `supersededBy` link and match a pass against the whole lineage. A pass bought
   for "PMP" then covers whatever the current PMP bank is, permanently. This
   fixes the *next* outline change too, not just this one.
2. **One-off pass rewrite.** A server-side migration that rewrites `examId` on
   pass documents from the retired bank to the 2026 bank. Simpler, but the same
   work falls due again at the next cutover.

Only after entitlements are safe should the client migrate `selectedExamId`.
Order matters: passes first, selection second. Doing it the other way round is
exactly the bug the critic caught.

Effort: medium. Blocks nothing today, but blocks moving anyone off the retired
bank, and every day it waits is a user studying a dead outline by default.

---

## Phase 4 — the six unsupported question formats

The 2026 ECO names **eight** item types. We render two of them (multiple-choice
single response, matching) plus two CipherExam-specific formats (EMV, PBQ).
`QuestionType` deliberately admits only what has a renderer — adding members
without one converts a compile error into a silent mis-scoring bug.

Sequenced by value per unit of work:

| # | Format | Work | Why this order |
|---|---|---|---|
| 1 | **Multiple-response** | `correctAnswers: number[]`, checkbox renderer, all-or-nothing scoring | Cheapest real ECO coverage. No new content pipeline — existing scenarios can be rewritten to have two right answers. |
| 2 | **Case / scenario sets** | New `stimulus` document, `stimulusId` on questions, a renderer showing stimulus + linked items, section handling in the simulator | Flagged NEW by PMI, and the first break falls after this section, so it shapes exam-day pacing. Biggest schema change; highest candidate value. |
| 3 | **Graphic-based** | Exhibit image on the question + renderer | Flagged NEW. Generate charts programmatically (burndown, EVM S-curve, RAM, network diagram) rather than sourcing images — cheaper and consistent. |
| 4 | **Pull-down list** | `<select>` renderer | Trivial once the type plumbing exists. |
| 5 | **Enhanced matching** | Images in match targets | Extends existing matching rather than new machinery. |
| 6 | **Point and click** | Image + hotspot geometry + hit testing | Most work, least frequent. Last. |

Ship 1 and 2 together as the meaningful milestone; 3–6 are incremental after the
type plumbing exists. Until then the compare page's honest disclosure of the gap
stays accurate and should not be softened.

---

## Phase 5 — content depth on the 2026 bank

The bank is correctly weighted and genuinely 2026-flavoured (AI in 17.5% of
questions, sustainability 8.8%, governance 18.6%). Two gaps:

- **No task-level tagging.** All 194 questions carry a domain and nothing else.
  The ECO defines **26 tasks**. Tagging each question to its task makes coverage
  auditable (are all 26 represented? the answer today is unknown) and upgrades
  the weakest-area feedback from "you're weak on People" to "you're weak on
  aligning stakeholder expectations". That is a real differentiator and it is
  mostly a classification pass over existing content.
- **Bank size.** 194 questions against a 180-question full mock means a
  candidate sees almost the entire bank in one sitting, and any retake is
  near-total recall. Target 500+ before promoting the full mock hard.

---

## Phase 6 — housekeeping

- **Network+ objectives** — resolve N10-008 vs N10-009 (Phase 2 will confirm
  which), fix config, citation, and ticker together.
- **The 20 malformed questions** in the retired bank — 13 with zero options, 6
  with two, 1 with three. Currently unpublished so unreachable; delete or repair
  whenever that bank's fate is settled.
- **E2E coverage.** The Playwright suite is three tests, two of which assert a
  CTA's href. Nothing covers the core loop. The authenticated path —
  sign up → pick exam → generate → answer → grade → review — is the one thing
  the verification run could never prove, because creating a production account
  was out of scope. A seeded test account against staging closes that hole
  permanently.
- **`questionTypes` in `exams.ts`** currently has zero readers. Either wire it
  to something (filtering generation, or driving the compare page's claims from
  config rather than prose) or drop it. Config nobody reads drifts silently.

---

## Sequencing

Phase 0 today. **Phase 1 next, before anything else** — until the watcher works,
every other phase is racing an alarm nobody can hear. Phase 2 immediately after,
because it tells you how much of the rest is on fire. Phase 3 is time-sensitive
in a quiet way: users default to the right bank now, but everyone who already
picked PMP stays on the retired one until entitlements can follow them. Phases
4–6 are product work and can be scheduled normally.
