# EC-52 Resolution — Question Repetition Reports

**Issue:** Users report seeing repeated questions and perceive this as a bug or content limitation.

**Status:** Resolved (UX transparency improvement)
**Severity:** Downgraded to S3

---

## Root Cause Analysis

Question repetition is **expected behavior** caused by mastery enforcement. The quiz engine uses a Spaced Repetition System (SRS) that intentionally re-presents questions the user has not yet mastered (requires 2 consecutive correct answers).

Priority order for question selection:
1. **Learning** questions (previously seen, not yet mastered)
2. **New** questions (never seen)
3. **Mastered** questions (up to 30% refresh slot)

This is not a quiz engine defect. It is a UX/trust perception issue caused by insufficient transparency around why questions repeat.

---

## Changes Implemented

1. **Mastery Explanation (Results Screen):** Collapsible "How mastery works" disclosure on the quiz completion screen explains that repetition is intentional and describes the question authorship standards.

2. **Repetition Indicator:** When a question is shown that the user has previously answered, a subtle "Mastery check" label appears above the question stem. No popup, no interruption.

3. **EQV Telemetry:** Internal metric (Effective Question Variety = uniqueQuestionsSeen / totalQuestionsPresented) logged per quiz run in the `quizAttempts` collection. Not visible to users. Enables future monitoring of content variety.

---

## What Was NOT Changed

- Question selection logic (SRS algorithm) is unchanged
- Mastery threshold (2 consecutive correct) is unchanged
- Question pools are unchanged
- No new settings or toggles added

---

## Recommendation

No further action required. If repetition complaints persist after transparency improvements are live, consider expanding the question pool (separate initiative, not a bug fix).
