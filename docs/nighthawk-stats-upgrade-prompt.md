# NightHawk Stats Upgrade — Claude Prompt

You are working inside the Exam Coach (EC) web app (React + Vite + TypeScript + Recharts v3).

## Goal for NightHawk

Upgrade the Stats page charts to:

- Force Y-axis 0–100 on all charts.
- Overlay translucent vertical bars for per-quiz scores alongside the existing rolling accuracy line.
- Keep the existing rolling domain accuracy computation (last 50 answers per domain) unchanged.
- Do NOT modify Firestore schema.
- Do NOT break Falcon behavior.
- Do NOT modify any computation logic in `performanceTrendService.ts`.

## Current State

### Rolling domain trends

Produced by `PerformanceTrendService.getAllDomainTrends()` in:
- `web/src/services/performanceTrendService.ts`

Uses `computeRollingAverage()` which returns `TrendDataPoint[]`:

```ts
interface TrendDataPoint {
  date: string;           // formatted "Jan 5"
  timestamp: number;      // epoch ms
  rollingAverage: number; // 0-100
  windowSize: number;     // actual window (may be < 50 early on)
}
```

### Chart component

- `web/src/components/analytics/RollingTrendChart.tsx`
- Currently uses categorical XAxis with `dataKey="date"` and `allowDuplicatedCategory={true}`
- Has unique indexing via `_idx` field added in `useMemo`
- Custom tooltip reads from `payload[0].payload`
- `useMemo` is positioned BEFORE early returns (Rules of Hooks compliance)

### Quiz run data

Stored in `quizRuns/{uid}/runs` with fields:
- `examId`, `quizType`, `mode`, `status`, `completedAt`
- `results.score` (number of correct answers)
- `results.domainResults` (Record<string, { correct, total }>)
- `answers[]` (array of per-question answers)
- `snapshot.questionIds[]` (question IDs for this run)

### Stats page

- `web/src/pages/Stats.tsx`
- Currently calls `PerformanceTrendService.getRollingOverallTrend()` and `.getAllDomainTrends()`
- Renders one overall chart + three domain mini-charts
- Does NOT currently fetch raw quiz run data

---

## Required Changes

### 1. Switch from `LineChart` to `ComposedChart`

Recharts requires `ComposedChart` (not `LineChart`) to render both `<Line>` and `<Bar>` in the same chart. Update the import and component in `RollingTrendChart.tsx`:

```tsx
import { ComposedChart, Line, Bar, XAxis, YAxis, ... } from 'recharts';

<ComposedChart data={chartData}>
  <Line dataKey="rollingAverage" ... />
  <Bar dataKey="quizScore" ... />
</ComposedChart>
```

### 2. Force YAxis 0–100

```tsx
<YAxis domain={[0, 100]} />
```

No dynamic scaling. This is already partially in place; confirm it's enforced.

### 3. Keep categorical XAxis

Do NOT switch to a time-based axis. The current categorical approach with `allowDuplicatedCategory={true}` and unique `_idx` keys is stable and avoids the `expandDomainResults` timestamp clustering problem (all synthetic records from one run share the same timestamp — on a time axis they collapse to a single pixel).

Keep:
```tsx
<XAxis
  dataKey="date"
  allowDuplicatedCategory={true}
  interval="preserveStartEnd"
/>
```

### 4. Add quiz score bars via sparse dataset merging

The rolling trend data has one point per answered question (~200 points). Quiz scores have one point per completed run (~15 runs). These have different granularity.

**Strategy:** Inject `quizScore` into the existing rolling trend array at the data point whose timestamp is closest to each quiz run's `completedAt`. Most entries will have `quizScore: undefined` — Recharts simply skips rendering a bar for those. Only ~15 entries will have a `quizScore` value, producing ~15 visible bars.

Create a merge function (can live in `RollingTrendChart.tsx` or a new util):

```ts
function mergeQuizScores(
  trendData: TrendDataPoint[],
  quizRuns: { completedAt: number; scorePercent: number }[]
): (TrendDataPoint & { quizScore?: number })[] {
  // Clone trend data
  const merged = trendData.map(d => ({ ...d, quizScore: undefined as number | undefined }));

  // For each quiz run, find the closest trend point by timestamp
  // and attach its score percentage
  for (const run of quizRuns) {
    let closestIdx = 0;
    let closestDiff = Infinity;
    for (let i = 0; i < merged.length; i++) {
      const diff = Math.abs(merged[i].timestamp - run.completedAt);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = i;
      }
    }
    // Only set if not already taken (first match wins)
    if (merged[closestIdx].quizScore === undefined) {
      merged[closestIdx].quizScore = run.scorePercent;
    }
  }

  return merged;
}
```

**Quiz score percentage** = `Math.round((run.results.score / run.snapshot.questionIds.length) * 100)`

Set explicit `barSize` so bars are visible among hundreds of data points:

```tsx
<Bar
  dataKey="quizScore"
  fill="#38bdf8"
  opacity={0.35}
  barSize={8}
  radius={[2, 2, 0, 0]}
/>
```

### 5. Fetch quiz runs in Stats.tsx

Stats.tsx currently only calls `PerformanceTrendService`. Add a fetch for completed non-diagnostic runs to feed the bar overlay:

```ts
// Inside the existing useEffect
const runsRef = collection(db, 'quizRuns', uid, 'runs');
const q = query(
  runsRef,
  where('status', '==', 'completed'),
  where('examId', '==', selectedExamId),
  orderBy('completedAt', 'desc'),
  limit(200)
);
const snap = await getDocs(q);
const quizScores = snap.docs
  .map(d => d.data())
  .filter(r => r.mode !== 'diagnostic' && r.quizType !== 'diagnostic')
  .map(r => ({
    completedAt: r.completedAt?.seconds ? r.completedAt.seconds * 1000 : Date.now(),
    scorePercent: r.snapshot?.questionIds?.length > 0
      ? Math.round((r.results?.score ?? 0) / r.snapshot.questionIds.length * 100)
      : 0,
  }));
```

Pass `quizScores` as a new prop to `RollingTrendChart`.

If the composite index query fails (missing index), use the same fallback pattern already in `performanceTrendService.ts`: catch, query by `status` only, filter client-side.

### 6. Update tooltip

The tooltip must handle three states at a given data point:
- Only rolling average exists (no bar)
- Only quiz score exists (no trend point — unlikely but defensive)
- Both exist

```tsx
<Tooltip
  content={({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const entry = payload[0];
    if (!entry?.payload) return null;
    const point = entry.payload;
    const avg = point.rollingAverage;
    const win = point.windowSize;
    const quiz = point.quizScore;

    return (
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
      }}>
        <p style={{ color: '#94a3b8', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
          {point.date ?? ''}
        </p>
        {avg != null && (
          <p style={{ color: '#f1f5f9', fontWeight: 600 }}>
            Rolling Avg: {avg}%
            <span style={{ color: '#94a3b8', fontWeight: 400 }}> (window: {win ?? 0})</span>
          </p>
        )}
        {quiz != null && (
          <p style={{ color: '#38bdf8', fontWeight: 600, marginTop: '0.25rem' }}>
            Quiz Score: {quiz}%
          </p>
        )}
      </div>
    );
  }}
/>
```

### 7. RollingTrendChart prop changes

Add optional `quizScores` prop:

```ts
interface RollingTrendChartProps {
  data: TrendDataPoint[];
  color: string;
  height?: number;
  loading?: boolean;
  emptyMessage?: string;
  compact?: boolean;
  quizScores?: { completedAt: number; scorePercent: number }[];  // NEW
}
```

Merge inside the existing `useMemo`:

```ts
const chartData = useMemo(() => {
  const base = data.map((d, i) => ({ ...d, _idx: i, quizScore: undefined as number | undefined }));
  if (quizScores?.length) {
    return mergeQuizScores(base, quizScores);
  }
  return base;
}, [data, quizScores]);
```

The `useMemo` MUST remain before all early returns (Rules of Hooks).

---

## Constraints

- No changes to Firestore schema
- No changes to `computeRollingAverage()` or `expandDomainResults()`
- No changes to `performanceTrendService.ts`
- No changes to `PredictionEngine.ts`
- No changes to `questionProgress` writes in `Quiz.tsx`
- Maintain strict React hook ordering — no hooks after conditional returns
- Must build clean with `npx vite build` (TypeScript strict, zero errors)
- Deploy to staging only: `firebase deploy --only hosting:staging`

## Files Modified

| File | Change |
|---|---|
| `web/src/components/analytics/RollingTrendChart.tsx` | `LineChart` → `ComposedChart`, add `<Bar>`, new `quizScores` prop, merge logic, updated tooltip |
| `web/src/pages/Stats.tsx` | Fetch quiz runs, pass `quizScores` prop to `RollingTrendChart` |

## Verification

1. `npx vite build` — zero TypeScript errors
2. Deploy to staging: `firebase deploy --only hosting:staging`
3. Stats page renders without white screen
4. Overall chart shows rolling line + quiz score bars
5. Domain mini-charts show rolling line only (no bars — `quizScores` prop omitted)
6. Tooltip shows correct rolling avg when hovering line area
7. Tooltip shows quiz score when hovering bar
8. Y-axis is 0–100 on all charts
9. No console errors
10. No "Rendered more/fewer hooks" errors
