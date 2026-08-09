import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Structural guards on the multiple-response wiring.
 *
 * These assert on source text, which is unusual, and it is deliberate. The
 * failure mode this feature actually has is not "the scorer is wrong" — the
 * scorer is pure and exhaustively tested in scoring.test.ts / gradeAnswer.test.ts.
 * It is "one of the N places that grade an answer did not get updated", which no
 * amount of testing the scorer can catch and which a rendering test would only
 * catch for whichever path it happened to drive.
 *
 * Vitest runs in a node environment here (see vite.config.ts) with no DOM, so
 * mounting Quiz.tsx — a ~1500-line component wired to Firestore, callables,
 * routing and four contexts — is not available without adding jsdom and a
 * testing library. Guarding the invariants directly is the honest alternative:
 * it catches a fourth grading site appearing, the existing three diverging, and
 * the ARIA regression, which is the full set of things that went wrong here.
 *
 * If one of these fails, do not delete it — either route the new code through
 * the shared helper, or update the guard with a comment saying why.
 */
/**
 * Comments are stripped before any assertion runs.
 *
 * Without this, a guard like `expect(src).not.toContain('radiogroup')` fails on
 * the comment that EXPLAINS why the code avoids `role="radiogroup"` — the
 * documentation trips the rule it documents. That punishes writing down the
 * reasoning, which is the opposite of what these guards are for. Assert on code.
 */
function stripComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const read = (rel: string) =>
    stripComments(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8'));
const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;

const quiz = read('./Quiz.tsx');
const answerOptions = read('../components/quiz/AnswerOptions.tsx');
const explanationPanel = read('../components/quiz/ExplanationPanel.tsx');
const simulator = read('../hooks/useSimulator.ts');
const verbal = read('./VerbalMode.tsx');

describe('Quiz.tsx has exactly one grading site', () => {
    it('calls the shared grader from all three answer paths', () => {
        // handleSubmit, handleNext, and the Quit & Save branch. If this drops to
        // 2, a path silently stopped grading multi-response (and pbq, and
        // matching). If it rises to 4, a new path appeared that this guard has
        // not been reviewed against — check it, then bump the number.
        expect(count(quiz, 'gradeCurrentQuestion(currentQuestion)')).toBe(3);
    });

    it('builds the grader input in exactly one place', () => {
        expect(count(quiz, 'gradeAnswer({')).toBe(1);
    });

    it('grades no answer with an inline single-index comparison', () => {
        // The original defect shape: `selectedOption === currentQuestion.correctAnswer`
        // copy-pasted per call site. A multi-response question has no
        // `correctAnswer`, so this comparison marks it wrong forever without
        // throwing.
        expect(quiz).not.toContain('=== currentQuestion.correctAnswer');
    });

    it('does not reimplement multi-response scoring locally', () => {
        // All-or-nothing lives in utils/scoring.ts. An inline set comparison
        // here is how partial credit gets reintroduced by accident.
        expect(quiz).not.toContain('isMultiResponseCorrect');
    });

    it('never non-null-asserts selectedOption', () => {
        // `selectedOption!` is null for matching / pbq / multi-response.
        expect(quiz).not.toMatch(/selectedOption!(?!=)/);
    });
});

describe('Quiz.tsx resets multi-response state between questions', () => {
    it('clears the tick set in both the per-question effect and the advance path', () => {
        // One without the other leaks the previous question's ticks into the
        // next one, which grades the wrong answer with no visible symptom.
        expect(count(quiz, 'setMultiSelected([])')).toBeGreaterThanOrEqual(2);
    });
});

describe('Quiz.tsx renders multi-response through AnswerOptions', () => {
    it('passes multi mode, the tick set, and the answer key', () => {
        expect(quiz).toContain("multi={currentQuestion.type === 'multi-response'}");
        expect(quiz).toContain('selectedOptions={multiSelected}');
        expect(quiz).toContain('correctAnswers={currentQuestion.correctAnswers}');
    });

    it('gates submit on a non-empty selection via the shared predicate', () => {
        expect(quiz).toContain('canSubmitMultiResponse(multiSelected)');
    });
});

describe('AnswerOptions leaves single-select ARIA exactly as it was', () => {
    it('emits no role at all for single-select', () => {
        // A `role="radio"` with no `role="radiogroup"` ancestor is an orphaned
        // radio: screen readers announce it differently than the plain button
        // they announced before, and single-select is 100% of shipped content.
        // There is no radiogroup wrapper anywhere in this app.
        expect(answerOptions).toContain("role={multi ? 'checkbox' : undefined}");
        expect(answerOptions).not.toContain("'radio'");
        expect(answerOptions).not.toContain('radiogroup');
    });

    it('emits aria-checked only in multi mode', () => {
        expect(answerOptions).toContain('aria-checked={multi ? isSelected(i) : undefined}');
    });
});

describe('surfaces that cannot grade a format do not receive it', () => {
    it('the exam Simulator filters its bank', () => {
        // useSimulator grades `selected === q.correctAnswer` against a
        // `Record<number, number>`. An unfiltered multi-response doc there is
        // marked wrong on every attempt and SimulatorResults highlights no
        // correct option — a silent mis-grade on a full mock.
        expect(simulator).toContain('filterToSingleIndexGraded');
        expect(simulator).not.toContain('setQuestions(questionsData)');
    });

    it('Verbal mode filters its bank', () => {
        expect(verbal).toContain('filterToSingleIndexGraded');
    });
});

describe('the coach breakdown button is not offered where it does nothing', () => {
    it('ExplanationPanel gates the button on the same predicate Quiz returns early on', () => {
        expect(explanationPanel).toContain('gradesBySingleIndex(question.type)');
        expect(explanationPanel).toContain('{coachSupported && (');
        expect(quiz).toContain('if (!gradesBySingleIndex(question.type)) return;');
    });
});
