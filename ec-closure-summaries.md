# EC Closure Summaries — Session 2026-03-04

---

## EC-030: Wrong-Answer Flash Too Harsh

**Status:** CLOSED — Fixed
**Commit:** `4ce6304`
**Files Changed:** `web/src/pages/Quiz.tsx`

**Problem:** Incorrect answer selection triggered an abrupt red flash that was jarring and anxiety-inducing, undermining the calm learning environment.

**Solution:**
- Replaced instant red flash with a gentle 500ms CSS transition (`transition-colors duration-500 ease-in-out`)
- Subdued incorrect styling: `border-red-500/60 bg-red-500/5` with muted text `text-red-300/80`
- Added check/cross result icons inside the radio dot for clear visual feedback
- Added `motion-reduce:transition-none` to respect `prefers-reduced-motion` accessibility preference

**Impact:** Incorrect answers now feel instructive rather than punitive, aligning with spaced-repetition best practices for low-anxiety feedback loops.

---

## EC-028 / EC-009: Mobile Navigation Missing

**Status:** CLOSED — Fixed
**Commit:** `4ce6304`
**Files Changed:** `web/src/components/MobileNav.tsx` (new), `web/src/App.tsx`, `web/index.html`

**Problem:** Mobile users had no persistent navigation. The sidebar was desktop-only, leaving mobile users stranded after landing on a page.

**Solution:**
- Created `MobileNav` bottom tab bar with 5 icons: Dashboard, Quiz, Stats, Plans, Settings
- Active tab highlighted with brand color and scale animation
- Hidden on desktop (`md:hidden`), shown only on mobile
- Added `viewport-fit=cover` meta tag for iPhone notch/safe-area support
- Added `pb-20` bottom padding on main content to prevent nav overlap

**Impact:** Mobile users now have full app navigation matching native app UX patterns. Critical for the 60%+ mobile user base.

---

## EC-130: Friction Event Logging

**Status:** CLOSED — Fixed
**Commit:** `4ce6304`
**Files Changed:** `web/src/services/FrictionEventService.ts` (new), `firestore.rules`

**Problem:** No visibility into user friction points — slow loads, quiz abandonment, paywall hits, and validation errors were invisible to the team.

**Solution:**
- Created `FrictionEventService` with fire-and-forget Firestore writes
- Event types: `slow_load`, `quiz_abandon`, `paywall_hit`, `validation_error`, `error_boundary`
- Session-level dedup prevents noise (same event type only logged once per session)
- Metadata includes `page`, `duration`, `detail`, and `sessionId`
- Firestore rules added for `friction_events` collection (user-scoped write, no read)

**Impact:** Product team can now query friction hotspots and prioritize UX fixes with real data instead of guesswork.

---

## EC-111: Conversion Intent Tracking

**Status:** CLOSED — Fixed
**Commit:** `4ce6304`
**Files Changed:** `web/src/services/ConversionIntentService.ts` (new), `web/src/components/SubscriptionUpsellModal.tsx`, `web/src/pages/Pricing.tsx`, `firestore.rules`

**Problem:** No tracking of conversion-intent signals — couldn't tell which users were close to converting or what triggered purchase consideration.

**Solution:**
- Created `ConversionIntentService` tracking three signal types:
  - `pricing_view` — user visited Pricing page
  - `upsell_interaction` — user opened upsell modal (with trigger source)
  - `daily_limit_hit` — user hit the free-tier question cap
- Session-level dedup per signal type
- Wired into `SubscriptionUpsellModal` (on open) and `Pricing` page (on mount)
- Firestore rules added for `conversion_intent` collection

**Impact:** Enables conversion funnel analysis and targeted re-engagement for high-intent free users.

---

## EC-109: Usage Heatmap on Stats Page

**Status:** CLOSED — Fixed
**Commit:** `29ee25f`
**Files Changed:** `web/src/components/analytics/UsageHeatmap.tsx` (new), `web/src/pages/Stats.tsx`

**Problem:** Users had no visual representation of their study consistency over time. Daily streaks were invisible.

**Solution:**
- Built `UsageHeatmap` component showing a 365-day GitHub-style contribution grid
- Color intensity scales from slate (0 questions) through emerald shades (1–2, 3–5, 6–9, 10+)
- Tooltip on hover shows exact date and question count
- Day-of-week labels and month labels for orientation
- Data sourced from existing `questionMetrics` via `getQuestionHistory()`
- Placed at top of Stats page for immediate visibility

**Impact:** Creates a visual accountability loop — users can see gaps in their study pattern and are motivated to maintain streaks, driving daily engagement.

---

## EC-119: Drag-and-Drop Matching Questions

**Status:** CLOSED — Fixed
**Commit:** `d64cde2`
**Files Changed:** `web/src/components/MatchingQuestion.tsx` (new), `web/src/pages/Quiz.tsx`

**Problem:** All questions were multiple-choice. Real PMP exams include matching/drag-and-drop formats. Users weren't being prepared for these question types.

**Solution:**
- Created `MatchingQuestion` component with dual interaction modes:
  - **Desktop:** HTML5 native drag-and-drop to reorder definitions
  - **Mobile:** Tap-to-swap — tap one item, tap another to exchange positions
- Left column shows numbered terms (fixed), right column shows shuffled definitions (moveable)
- Visual feedback: drag-over highlight, tap selection highlight, grip handles
- After submit: green check for correct matches, red X for wrong, plus "Correct matches" summary
- `Question` interface extended with `type: 'matching'` and `matchPairs: {term, definition}[]`
- `shuffleMatchPairs()` utility: Fisher-Yates shuffle with correct-order mapping
- Scoring: all-or-nothing (all pairs must be correct)
- Automatic first-exposure subtype injection via existing generic system
- Submit button changes to "Check Matches" for matching questions

**Firestore schema for matching questions:**
```json
{
  "type": "matching",
  "stem": "Match each process group to its description:",
  "matchPairs": [
    { "term": "Initiating", "definition": "Defining a new project or phase" },
    { "term": "Planning", "definition": "Establishing scope and objectives" }
  ],
  "options": [],
  "correctAnswer": 0,
  "explanation": "..."
}
```

**Impact:** Users now encounter realistic PMP exam formats during practice, improving exam readiness and reducing surprise on test day.

---

*Generated: 2026-03-04 | Branch: `claude/fix-ec-issues-GNteq`*

---

# EC Closure Summaries — Session 2026-03-06

---

## EC-134: "Explain This Like I'm New" Returns Deep Dive Error

**Status:** CLOSED — Fixed
**Severity:** S2 (Blocking)
**Files Changed:** `functions/src/tutor.ts`

**Problem:** Clicking "Explain this like I'm new" in the Coach Breakdown panel always failed with a generic "Could not generate deep dive at this time" error. The feature was completely non-functional in production.

**Root Cause:** The `generateTutorDeepDive` Cloud Function checked for the OpenAI API key using only `process.env.OPENAI_API_KEY`. In production, the key is set via `functions.config().openai.key` (Firebase Runtime Config), not environment variables. The guard clause threw `failed-precondition` before the OpenAI call was ever reached.

The sibling function `generateTutorBreakdown` correctly used dual-source resolution (`functions.config()` first, `process.env` fallback), but this pattern was not carried over when `generateTutorDeepDive` was written.

**Solution:**
- Aligned `generateTutorDeepDive` API key resolution with `generateTutorBreakdown`'s dual-source pattern: `functions.config().openai?.key || process.env.OPENAI_API_KEY`
- Changed client initialization from lazy singleton `getOpenAI()` to direct `new OpenAI({ apiKey })` with the correctly resolved key
- Removed the now-unused `getOpenAI` helper (dead code cleanup)

**What Was NOT Changed:**
- Prompt content and model parameters unchanged
- `generateTutorBreakdown` unchanged
- UI components (`TutorBreakdown.tsx`, `Quiz.tsx`) unchanged — the bug was entirely server-side

**Impact:** Pro users can now use the "Explain this like I'm new" button to get simplified 5-year-old-level analogies of coach verdicts, restoring a key tutoring feature.

---

*Generated: 2026-03-06*

---

# EC Closure Summaries — Session 2026-03-07

---

## EC-139: Unified Coach Breakdown with Exam-Specific Lenses

**Status:** CLOSED — Fixed
**Severity:** S3 (Content Quality)
**Commits:** `ad7adb8`, `8929224`, `ada132e`, `5e8493e`, `524fc00`
**Files Changed:** `web/src/config/exams.ts`, `web/src/pages/Quiz.tsx`, `web/src/components/TutorBreakdown.tsx`, `web/src/utils/parseExplanation.ts`, `web/src/components/explanations/StructuredExplanation.tsx`, `web/src/components/QuestionProvenanceBadge.tsx`, `web/src/contexts/ExamContext.tsx`, `web/src/firebase.ts`, `functions/src/tutor.ts`, `firestore.rules`

**Problem:** The colorful structured Coach Breakdown (verdict, choice analysis, exam lens) was PMP-only. All other exams got a plain text explanation. Additionally, PMP had a separate "doctrine" code path that bypassed the AI entirely in Quick mode, creating an inconsistent experience across exams. The Quick/Deep toggle did nothing because it was wired incorrectly.

**Root Causes:**
1. Structured explanation parser (`parseExplanation.ts`) was hardcoded to look for "PMI Decision Lens:" — other exam lens names were ignored
2. `EXAM_LENS` config used human-readable slug keys (`"pmp"`, `"csm"`) but `activeExamId` in the app is a Firestore auto-generated document ID (`"7qmPagj9A6RpkC0CwGkY"`) — the lens lookup always returned `null` for every exam
3. PMP Quick mode short-circuited to a doctrine display, skipping the AI-powered breakdown entirely
4. Quick/Deep toggle only persisted to localStorage for the next question — it did not re-fetch the current explanation

**Solution:**

1. **Exam-agnostic parser** — Rewrote `parseExplanation.ts` with regex patterns that match any lens name (e.g., `SHRM Competency Lens:`, `DMAIC Lens:`, `Security Triad Lens:`), plus flexible conflict/pattern/note section detection
2. **Dynamic lens label** — `StructuredExplanation.tsx` extracts the lens name from the text itself instead of hardcoding "PMI Decision Lens"
3. **Firestore ID alignment** — Changed all config keys (`EXAM_LENS`, `EXAMS`, `DEFAULT_EXAM_ID`) from slugs to actual Firestore document IDs. Added `PMP_EXAM_ID` constant for any PMP-specific checks
4. **10 exam lenses configured** — PMP, CSM, SHRM-CP, Six Sigma Green Belt, CPP, CIA Part 1, ITIL 4, CompTIA Security+, Network+, A+ Core 2
5. **Quick/Deep toggle** — Added pill toggle in TutorBreakdown header. Quick mode sends concise prompt; Deep mode sends structured prompt with exam-specific lens name and framework. Toggle immediately re-fetches the current explanation via `lastBreakdownRef`
6. **Unified PMP flow** — Removed the PMP doctrine shortcut. All exams now use the same AI-powered Coach Breakdown for both Quick and Deep modes
7. **Green correct answer** — Choice Analysis section highlights the correct option with emerald background, green badge, and green text. Wrong answers remain neutral gray
8. **Cloud Function update** — `generateTutorBreakdown` accepts `coachMode`, `lensName`, and `lensFramework` parameters. Deep mode prompt instructs structured output with exam-specific section prefixes

**Critical Side-Fix — Firestore Rules Outage:**
During this work, all exams and user data disappeared from both production and staging. Root cause: Firestore security rules were out of sync (stale deployment). The `exams` collection queries hung indefinitely on the client despite `allow read: if true` being in the rules file. Redeploying `firestore.rules` via `firebase deploy --only firestore:rules` resolved it immediately. Also wrapped `getPerformance()` init in a try/catch to prevent Performance SDK failures from cascading.

**What Was NOT Changed:**
- Firestore data schema — no migration needed
- Pattern tracking / trap persistence logic unchanged
- "Explain this like I'm new" deep dive feature unchanged
- Question rendering, scoring, and progress tracking unchanged

**Impact:** All 10 exams now get the same rich, structured Coach Breakdown experience with exam-specific framing. Users see a consistent, visually clear breakdown regardless of which certification they're studying for. The correct answer is immediately identifiable in the Choice Analysis, and users can toggle between concise (Quick) and detailed (Deep) explanations on the fly.

---

*Generated: 2026-03-07*
