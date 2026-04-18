# Multi-Exam Playbook — Every Change Made for CSM Support

This is the complete, ordered list of every change made to bring the platform
from PMP-only to multi-exam. Follow these same steps for each new exam.

---

## Phase 1: Exam Configuration System

### 1.1 — CREATED `web/src/config/exams.ts`
Central exam registry. Every exam gets an entry here.

```ts
export type ExamConfig = {
    id: string;                // canonical ID (e.g., "pmp", "csm")
    name: string;              // display name
    domains: string[];         // exam knowledge domains
    firestoreIds: string[];    // all Firestore doc IDs that map to this exam
    fullMock?: {               // simulator config (omit if same as default 50q/60m)
        questionCount: number;
        durationMinutes: number;
    };
};

export const EXAMS: Record<string, ExamConfig> = {
    pmp: {
        id: "pmp",
        name: "Project Management Professional",
        domains: ["People", "Process", "Business Environment"],
        firestoreIds: ["default-exam", "7qmPagj9A6RpkC0CwGkY"],
        fullMock: { questionCount: 180, durationMinutes: 230 },
    },
    // ADD NEW EXAMS HERE
};

export const DEFAULT_EXAM_ID = "pmp";

export function isExam(examId: string | undefined, configId: string): boolean {
    // checks canonical ID + all firestoreIds aliases
}
```

**To add a new exam:** Add an entry to the `EXAMS` object. That's it for config.

### 1.2 — MODIFIED `web/src/contexts/ExamContext.tsx`
- Fallback exam ID changed from hard-coded `"default-exam"` to `EXAMS[DEFAULT_EXAM_ID].firestoreIds[0]`
- ExamContext loads `name`, `domains`, `bankVersion` from Firestore `exams/{examId}` doc dynamically
- No exam-specific logic in this file — it's fully generic

### 1.3 — MODIFIED `web/src/services/ExamMetadata.ts`
- Replaced duplicated PMP domain arrays with shared constant
- Registered domains under canonical ID + all `firestoreIds` using spread
- Fuzzy match fallback uses `DEFAULT_EXAM_ID` instead of hard-coded string

---

## Phase 2: Remove Hard-Coded PMP References

### 2.1 — MODIFIED `web/src/pages/Quiz.tsx`
- `isPMPExam` now uses `isExam(examId, DEFAULT_EXAM_ID)` instead of string comparison
- `effectiveId` fallback uses config-derived ID
- Weakest domain default: `examDomains[0] || 'Process'` instead of hard-coded `'Process'`
- All `FrictionEventService` calls now include `examId` in metadata
- All `UsageEventService` calls now pass `examId` as third argument
- Tutor breakdown call now passes `examId: activeExamId`

### 2.2 — MODIFIED `web/src/services/smartQuiz.ts`
- Replaced hard-coded `['People', 'Process']` fallback with `getExamDomains(examId).slice(0, 2)`

### 2.3 — MODIFIED `web/src/types/StudyPlan.ts`
- `domain` field widened from `'People' | 'Process' | 'Business Environment' | 'Mixed'` to `string`

### 2.4 — MODIFIED `web/src/pages/planner/StudySchedule.tsx`
- localStorage key uses `DEFAULT_EXAM_ID` template literal
- Modal text uses dynamic `examName` instead of hard-coded "PMP"

### 2.5 — MODIFIED `web/src/pages/planner/SetupPlanner.tsx`
- Fallback uses config-derived Firestore ID

### 2.6 — MODIFIED `web/src/seed.ts`
- `"default-exam"` references replaced with config-derived constant

### 2.7 — MODIFIED `web/src/hooks/useSimulator.ts`
- Full-mock config reads from current exam's `EXAMS[x].fullMock` (not hard-coded PMP)
- Falls back to 50 questions / 60 minutes for exams without `fullMock`
- Navigation state includes `examId` in both success and error paths

---

## Phase 3: examId Propagation to Telemetry

### 3.1 — MODIFIED `web/src/services/UsageEventService.ts`
- Added optional `examId` parameter to `emit()` method

### 3.2 — MODIFIED `web/src/services/FrictionEventService.ts`
- Added `examId?: string` to `FrictionMeta` interface

### 3.3 — MODIFIED `web/src/services/ConversionIntentService.ts`
- Added `examId?: string` to `IntentMeta` interface

---

## Phase 4: Global Header with Exam Selector

### 4.1 — CREATED `web/src/components/layout/AppHeader.tsx`
- Shared sticky top bar for all authenticated pages
- Contains ExamSelector dropdown + Upgrade link
- Accepts optional `children` for page-specific extras

### 4.2 — MODIFIED `web/src/App.tsx`
- `AppLayout` now includes `<AppHeader />` above `<Outlet />`
- Added `FreePlanBanner` component between header and content
- Banner shows `Free plan: X / 5 questions used today` with color progression
- Banner hidden for Pro users
- Color: white (0-2), amber (3-4), red (5)

### 4.3 — MODIFIED `web/src/pages/Dashboard.tsx`
- Replaced inline `<nav>` with `<AppHeader>` + children pattern
- Removed direct ExamSelector import (now comes from AppHeader)

### 4.4 — MODIFIED `web/src/components/ExamSelector.tsx`
- Responsive padding/text: `px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base`
- Exam name truncation on mobile: `truncate max-w-[120px] sm:max-w-none`
- Dropdown width: `w-[calc(100vw-2rem)] sm:w-56 max-w-[14rem]`
- Queries only `isPublished == true` exams from Firestore

---

## Phase 5: Mobile Layout Fixes

### 5.1 — MODIFIED `web/src/pages/Quiz.tsx`
- Modal: `p-4 sm:p-8`, `max-h-[90vh] overflow-y-auto`
- Headings: `text-2xl sm:text-3xl`
- Mode info bars: responsive padding + emoji sizing
- Explanation box: `p-3 sm:p-6 lg:p-10`

### 5.2 — MODIFIED `web/src/pages/Stats.tsx`
- Header: `text-xl sm:text-2xl md:text-3xl`
- Spacing: `space-y-6 md:space-y-8 pb-8`
- Domain colors now dynamic via `useMemo` + ExamContext `examDomains`
- Replaced hard-coded `DOMAIN_COLORS` map with `DOMAIN_COLOR_PALETTE` array

### 5.3 — MODIFIED `web/src/pages/SimulatorResults.tsx`
- Doughnut chart: `w-32 h-32 md:w-40 md:h-40`
- Percentage text: `text-3xl sm:text-4xl md:text-5xl`
- Stat cards: `p-4 md:p-6` with scaled icons
- Action buttons: `flex-col sm:flex-row` + `w-full sm:w-auto`
- Filter pills: `px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm`
- **Added readiness banners** above score card (green/amber/neutral based on score)
- **Added CTA buttons** per banner (Take Another Simulator / Practice Weak Domains / Start Smart Practice)

### 5.4 — MODIFIED `web/src/pages/Dashboard.tsx`
- Expired trial: `p-4 sm:p-8`
- Daily goal: `p-4 sm:p-6`
- Streak modal: `p-4 sm:p-8` + `max-h-[90vh] overflow-y-auto`
- Resume buttons: `flex-col sm:flex-row`

### 5.5 — MODIFIED `web/src/components/analytics/SpeedAccuracyChart.tsx`
- Height: `h-[240px] sm:h-[300px] md:h-[400px]`
- Min-width: `min-w-[280px] sm:min-w-[450px] md:min-w-[700px]`

### 5.6 — MODIFIED `web/src/components/analytics/RollingTrendChart.tsx`
- Compact min-width: `min-w-[240px] sm:min-w-[360px]`
- Standard min-width: `min-w-[260px] sm:min-w-[400px] md:min-w-[600px]`

---

## Phase 6: Question Provenance Badge

### 6.1 — MODIFIED `web/src/components/QuestionProvenanceBadge.tsx`
- Was hard-coded: `✔ Scenario-based • PMP-style (ECO 2021)`
- Now reads `examName` from ExamContext
- PMP → shows PMP-specific text with PMI disclaimer
- All other exams → `✔ Scenario-based • {examName} format`

---

## Phase 7: Simulator — Practice vs Full Mock

### 7.1 — MODIFIED `web/src/pages/SimulatorIntro.tsx`
- Replaced single action card with two card-style options
- **Practice Simulator** (indigo): 50 questions, ~60 minutes — always shown
- **Full Mock Exam** (purple): reads from `EXAMS[x].fullMock` — only shown when config differs from practice defaults
- Pro gate: centered lock card with Upgrade button
- Readiness gate: `window.confirm` warning on both options
- Exam Tips collapsed into slim horizontal bar
- Question count and duration are dynamic from config

### 7.2 — MODIFIED `web/src/hooks/useSimulator.ts`
- `mode === 'full-mock'` reads current exam's config via `isExam()` lookup
- Falls back to 50q/60m for exams without `fullMock` defined
- Removed hard-coded `EXAMS[DEFAULT_EXAM_ID]` reference

---

## Phase 8: Thinking Traps — Exam-Scoped

### 8.1 — MODIFIED `functions/src/tutor.ts`
- `TutorPayload` now includes optional `examId` field
- `processPatternInteraction()` requires `examId` (early-returns without it)
- Trap stats write to: `users/{uid}/examStats/{examId}/traps/{patternId}`
- Legacy `pattern_stats` path removed — no fallback
- `getWeakestPatterns()` accepts `examId` in request data
- Returns `[]` if no `examId` provided
- Reads only from `users/{uid}/examStats/{examId}/traps`

### 8.2 — MODIFIED `web/src/components/ThinkingTrapsCard.tsx`
- Passes `{ examId: selectedExamId }` to `getWeakestPatterns` call
- Re-fetches when `selectedExamId` changes (added to useEffect deps)
- Filters to `times_missed >= 2` before displaying
- Empty state: "No thinking traps detected yet. We'll highlight patterns once you answer more questions."

### 8.3 — MODIFIED `web/src/pages/ReadinessReport.tsx`
- Passes `{ examId: selectedExamId }` to `getWeakestPatterns` call

### 8.4 — MODIFIED `web/src/pages/Quiz.tsx`
- Passes `examId: activeExamId` in `generateTutorBreakdown` call

---

## Checklist: Adding a New Exam

When you add exam #3 (e.g., CAPM, ITIL, AZ-900), do these steps:

### Firestore (Manual)
- [ ] Create `exams/{examId}` document with: `name`, `domains[]`, `bankVersion`, `isPublished: true`
- [ ] Upload questions to `questions` collection with `examId` field matching the Firestore doc ID

### Code (Only if exam has unique simulator config)
- [ ] Add entry to `EXAMS` in `web/src/config/exams.ts`
  - Only needed if exam has `fullMock` config different from 50q/60m
  - Or if you need `firestoreIds` aliases for backward compatibility
- [ ] Add domain definitions to `web/src/services/ExamMetadata.ts` (if using static domain metadata)

### What's Already Generic (No Changes Needed)
- ExamContext loads name/domains from Firestore dynamically
- ExamSelector shows all `isPublished` exams
- Quiz engine filters questions by `examId`
- Stats/analytics filter by `selectedExamId`
- Telemetry includes `examId` in all events
- Thinking traps scoped to `examStats/{examId}/traps`
- Provenance badge shows `{examName} format`
- Simulator shows Practice option by default
- Full Mock option auto-appears when `fullMock` config exists and differs from defaults
- Readiness banners work for any exam
- Free plan banner is exam-agnostic

### Deploy
- [ ] `cd web && npx vite build` → deploy hosting
- [ ] `cd functions && npm run build` → `firebase deploy --only functions`

---

## File Inventory (28 files total)

### New Files (2)
| File | Purpose |
|------|---------|
| `web/src/config/exams.ts` | Central exam configuration registry |
| `web/src/components/layout/AppHeader.tsx` | Shared header with ExamSelector |

### Modified Files (26)
| File | What Changed |
|------|-------------|
| `web/src/App.tsx` | AppLayout + FreePlanBanner + AppHeader |
| `web/src/contexts/ExamContext.tsx` | Config-derived fallback ID |
| `web/src/components/ExamSelector.tsx` | Mobile responsive |
| `web/src/components/QuestionProvenanceBadge.tsx` | Dynamic exam name |
| `web/src/components/ThinkingTrapsCard.tsx` | Exam-scoped traps + missCount filter |
| `web/src/components/analytics/RollingTrendChart.tsx` | Mobile min-widths |
| `web/src/components/analytics/SpeedAccuracyChart.tsx` | Mobile responsive |
| `web/src/hooks/useSimulator.ts` | Current exam config lookup |
| `web/src/pages/Dashboard.tsx` | AppHeader + mobile fixes |
| `web/src/pages/Quiz.tsx` | isExam() + examId telemetry + mobile |
| `web/src/pages/ReadinessReport.tsx` | Exam-scoped trap query |
| `web/src/pages/SimulatorIntro.tsx` | Practice + Full Mock options |
| `web/src/pages/SimulatorResults.tsx` | Readiness banners + CTAs + mobile |
| `web/src/pages/Stats.tsx` | Dynamic domains/colors + mobile |
| `web/src/pages/planner/SetupPlanner.tsx` | Config-derived fallback |
| `web/src/pages/planner/StudySchedule.tsx` | Dynamic exam name |
| `web/src/seed.ts` | Config-derived IDs |
| `web/src/services/ConversionIntentService.ts` | examId in metadata |
| `web/src/services/ExamMetadata.ts` | Config-derived domains |
| `web/src/services/FrictionEventService.ts` | examId in metadata |
| `web/src/services/UsageEventService.ts` | examId parameter |
| `web/src/services/smartQuiz.ts` | Dynamic domain fallbacks |
| `web/src/types/StudyPlan.ts` | Widened domain type |
| `functions/src/tutor.ts` | Exam-scoped trap storage |
| `functions/lib/tutor.js` | Compiled output |
| `functions/lib/tutor.js.map` | Source map |
