import { useExam } from '../contexts/ExamContext';
import { isExam, PMP_EXAM_ID, PMP_2026_EXAM_ID } from '../config/exams';

// The PMI non-affiliation disclaimer is a trademark/legal requirement, not a
// nicety: it must render for EVERY PMP bank (retired 2021 outline and live
// 2026 outline alike), so both branches below are built from the same base.
const PMI_DISCLAIMER = "This product is not affiliated with or endorsed by PMI®.";

export default function QuestionProvenanceBadge() {
    const { selectedExamId, examName } = useExam();
    const isPMP2021 = isExam(selectedExamId, PMP_EXAM_ID);
    const isPMP2026 = isExam(selectedExamId, PMP_2026_EXAM_ID);
    const isPMP = isPMP2021 || isPMP2026;

    // The July 2026 ECO superseded the 2021 outline, so the retired bank has to
    // say so rather than implying it still matches the live exam. No cutover
    // date is stated in user-facing copy: the July 2026 ECO PDF does not print
    // one, so only the supersession itself is asserted here.
    const outlineText = isPMP2026
        ? "the PMI® PMP Examination Content Outline (ECO) – July 2026, the outline currently in effect"
        : "the PMI® PMP Examination Content Outline (ECO, 2021), which has been superseded by the July 2026 ECO";

    const tooltipText = isPMP
        ? "How these questions are written\n\n" +
          `These are original, scenario-based questions written to reflect the decision-making style outlined in ${outlineText}.\n\n` +
          "They emphasize situational judgment, leadership decisions, and real-world tradeoffs across People, Process, and Business Environment contexts.\n\n" +
          PMI_DISCLAIMER
        : "How these questions are written\n\n" +
          `These are original, scenario-based questions designed to match the ${examName || 'exam'} format and test real-world application of key concepts.`;

    const label = isPMP2026
        ? '✔ Scenario-based • PMP-style (ECO July 2026)'
        : isPMP2021
        ? '✔ Scenario-based • PMP-style (ECO 2021 — superseded outline)'
        : `✔ Scenario-based • ${examName || 'Exam'} format`;

    return (
        <p
            className="text-xs text-slate-500 text-center cursor-default select-none"
            title={tooltipText}
        >
            {label}
        </p>
    );
}
