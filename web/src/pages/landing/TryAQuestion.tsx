import { useState } from "react";

/**
 * "Try a Question" widget — per-LP interactive question with a reveal answer.
 *
 * v1: question + answer + reasoning are passed in as props (illustrative,
 *     AI-generated, NOT from any real exam — explicitly labeled).
 * v2 (future): fetch a real question from Firestore tagged for the cert,
 *     show the same reveal pattern. Requires Firestore schema decisions.
 */
export interface QuestionOption {
  letter: string;
  text: string;
}

export interface TryAQuestionProps {
  examName: string;
  domainLabel: string;
  prompt: string;
  options: QuestionOption[];
  correctLetter: string;
  reasoning: string;
  bloomsLevel: string;
}

export default function TryAQuestion({
  examName,
  domainLabel,
  prompt,
  options,
  correctLetter,
  reasoning,
  bloomsLevel,
}: TryAQuestionProps) {
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="mx-auto my-12 max-w-3xl px-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Try a {examName} question
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Live preview — no signup
          </span>
        </div>
        <p className="mb-4 text-xs italic text-gray-500">
          (Illustrative — not from any real exam.) Domain: {domainLabel}
        </p>
        <p className="text-lg font-medium leading-relaxed text-gray-900">{prompt}</p>

        <div className="mt-5 space-y-2">
          {options.map((opt) => {
            const isSelected = selected === opt.letter;
            const isCorrect = opt.letter === correctLetter;
            let stateClass = "border-gray-200 bg-white hover:border-brand-300";
            if (revealed) {
              if (isCorrect) stateClass = "border-success-500 bg-emerald-50";
              else if (isSelected) stateClass = "border-red-400 bg-red-50";
              else stateClass = "border-gray-200 bg-gray-50 opacity-70";
            } else if (isSelected) {
              stateClass = "border-brand-500 bg-brand-50";
            }
            return (
              <button
                key={opt.letter}
                type="button"
                onClick={() => !revealed && setSelected(opt.letter)}
                disabled={revealed}
                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${stateClass} ${
                  revealed ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border border-gray-300 text-xs font-bold">
                  {opt.letter}
                </span>
                <span className="text-gray-800">{opt.text}</span>
                {revealed && isCorrect && (
                  <span className="ml-auto text-xs font-bold text-success-500">✓ Correct</span>
                )}
                {revealed && isSelected && !isCorrect && (
                  <span className="ml-auto text-xs font-bold text-red-500">Your pick</span>
                )}
              </button>
            );
          })}
        </div>

        {!revealed && (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={!selected}
            className="mt-6 inline-flex items-center rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reveal answer & reasoning
          </button>
        )}

        {revealed && (
          <>
            <div className="mt-6 rounded-lg border-l-4 border-brand-500 bg-brand-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Exam Lens</p>
              <p className="mt-2 text-base leading-relaxed text-gray-800">{reasoning}</p>
              <p className="mt-3 text-xs text-gray-600">
                Bloom's level: <span className="font-semibold">{bloomsLevel}</span>
              </p>
            </div>

            {/* "What happens next inside CipherExam" — shows the adaptive product experience */}
            <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                What happens next inside CipherExam
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-600">→</span>
                  <span>Adaptive routing: your next question targets your weakest domain — not the next chapter in a book.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-600">→</span>
                  <span>This {examName} question gets saved to your weak-points list for spaced-repetition review before exam day.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-600">→</span>
                  <span>Every wrong answer in the bank is explained the same way — why it was crafted to bait you, not just that it's wrong.</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
