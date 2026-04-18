import { useExam } from '../contexts/ExamContext';
import { isExam, PMP_EXAM_ID } from '../config/exams';

export default function QuestionProvenanceBadge() {
    const { selectedExamId, examName } = useExam();
    const isPMP = isExam(selectedExamId, PMP_EXAM_ID);

    const tooltipText = isPMP
        ? "How these questions are written\n\n" +
          "These are original, scenario-based questions written to reflect the decision-making style outlined in the PMI\u00AE PMP Exam Content Outline (ECO, 2021).\n\n" +
          "They emphasize situational judgment, leadership decisions, and real-world tradeoffs across People, Process, and Business contexts.\n\n" +
          "This product is not affiliated with or endorsed by PMI\u00AE."
        : "How these questions are written\n\n" +
          `These are original, scenario-based questions designed to match the ${examName || 'exam'} format and test real-world application of key concepts.`;

    const label = isPMP
        ? '\u2714 Scenario-based \u2022 PMP-style (ECO 2021)'
        : `\u2714 Scenario-based \u2022 ${examName || 'Exam'} format`;

    return (
        <p
            className="text-xs text-slate-500 text-center cursor-default select-none"
            title={tooltipText}
        >
            {label}
        </p>
    );
}
