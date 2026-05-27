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
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-400">
            Try a {examName} question
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Live preview — no signup
          </span>
        </div>
        <p className="mb-4 text-xs italic text-slate-500">
          (Illustrative — not from any real exam.) Domain: {domainLabel}
        </p>
        <p className="text-lg font-medium leading-relaxed text-slate-100">{prompt}</p>

        <div className="mt-5 space-y-2">
          {options.map((opt) => {
            const isSelected = selected === opt.letter;
            const isCorrect = opt.letter === correctLetter;
            let stateClass = "border-slate-700 bg-slate-950 hover:border-brand-500 hover:bg-slate-900";
            if (revealed) {
              if (isCorrect) stateClass = "border-emerald-500 bg-emerald-500/10";
              else if (isSelected) stateClass = "border-red-500 bg-red-500/10";
              else stateClass = "border-slate-800 bg-slate-950 opacity-50";
            } else if (isSelected) {
              stateClass = "border-brand-500 bg-brand-500/10";
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
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border border-slate-600 text-xs font-bold text-slate-300">
                  {opt.letter}
                </span>
                <span className="text-slate-200">{opt.text}</span>
                {revealed && isCorrect && (
                  <span className="ml-auto text-xs font-bold text-emerald-400">✓ Correct</span>
                )}
                {revealed && isSelected && !isCorrect && (
                  <span className="ml-auto text-xs font-bold text-red-400">Your pick</span>
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
            className="mt-6 inline-flex items-center rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reveal answer & reasoning
          </button>
        )}

        {revealed && (
          <>
            <div className="mt-6 rounded-lg border-l-4 border-brand-500 bg-brand-500/10 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-300">Exam Lens</p>
              <p className="mt-2 text-base leading-relaxed text-slate-200">{reasoning}</p>
              <p className="mt-3 text-xs text-slate-400">
                Bloom's level: <span className="font-semibold text-slate-300">{bloomsLevel}</span>
              </p>
            </div>

            {/* "What happens next inside CipherExam" — shows the adaptive product experience */}
            <div className="mt-4 rounded-lg border border-dashed border-slate-700 bg-slate-950 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                What happens next inside CipherExam
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-400">→</span>
                  <span>Adaptive routing: your next question targets your weakest domain — not the next chapter in a book.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-400">→</span>
                  <span>This {examName} question gets saved to your weak-points list for spaced-repetition review before exam day.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-400">→</span>
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
