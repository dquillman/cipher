import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, CheckCircle, XCircle, Brain, BarChart3, Target, TrendingUp } from 'lucide-react';

/* ─── STEP TIMINGS (ms) ────────────────────────────────────────────────── */
const STEP_DURATIONS = [2200, 3200, 2000, 6000, 3500, 2000]; // 6th = pause before loop
const TOTAL_DURATION = STEP_DURATIONS.reduce((a, b) => a + b, 0);

/* ─── TYPING ANIMATION HOOK ───────────────────────────────────────────── */
function useTyping(text: string, active: boolean, speed = 28) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!active) { setDisplayed(''); return; }
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, active, speed]);
  return displayed;
}

/* ─── ANIMATED RING ────────────────────────────────────────────────────── */
function MasteryRing({ label, pct, color, delay, active }: { label: string; pct: number; color: string; delay: number; active: boolean }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    if (!active) { setAnimPct(0); return; }
    const t = setTimeout(() => {
      let start: number | null = null;
      const dur = 1200;
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / dur, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimPct(eased * pct);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [active, pct, delay]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-800" />
          <circle
            cx="32" cy="32" r={r}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - (circ * animPct) / 100}
            style={{ transition: 'none' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {Math.round(animPct)}%
        </span>
      </div>
      <span className="text-[10px] sm:text-xs text-slate-400 text-center leading-tight max-w-[72px]">{label}</span>
    </div>
  );
}

/* ─── MAIN COMPONENT ───────────────────────────────────────────────────── */
export default function InteractiveDemo() {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    setStep(prev => (prev + 1) % STEP_DURATIONS.length);
    setElapsed(0);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 50;
        if (next >= STEP_DURATIONS[step]) {
          advance();
          return 0;
        }
        return next;
      });
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, paused, advance]);

  // Calculate overall progress for the progress bar
  const prevDurations = STEP_DURATIONS.slice(0, step).reduce((a, b) => a + b, 0);
  const overallProgress = ((prevDurations + elapsed) / TOTAL_DURATION) * 100;

  // Typing for explanation
  const explanationLines = [
    "You chose A — adding them to the next meeting.",
    "But the PMI framework emphasizes following established processes first. Before taking action, the PM should review the communications management plan to understand why the stakeholder was excluded.",
    "The correct answer is B — Review the communications management plan."
  ];
  const line1 = useTyping(explanationLines[0], step === 3, 22);
  const line2 = useTyping(explanationLines[1], step === 3 && elapsed > 800, 16);
  const line3 = useTyping(explanationLines[2], step === 3 && elapsed > 3200, 20);

  const stepLabels = ['Select Exam', 'Read Question', 'Answer', 'AI Explanation', 'Your Progress'];

  // Fade helper
  const fadeIn = (targetStep: number) =>
    step === targetStep ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none';

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Container mimicking app window */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950 shadow-2xl shadow-black/40 overflow-hidden">

        {/* Window chrome */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            </div>
            <span className="text-[11px] text-slate-500 font-mono ml-3 hidden sm:inline">cipherexam.com</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicators */}
            <div className="hidden sm:flex items-center gap-1">
              {stepLabels.map((label, i) => (
                <button
                  key={i}
                  onClick={() => { setStep(i); setElapsed(0); }}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-all duration-300 ${
                    step === i || (step === 5 && i === 4)
                      ? 'bg-brand-500/20 text-brand-300'
                      : i < step ? 'text-slate-500' : 'text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {paused && (
              <span className="text-[10px] text-amber-400/70 font-medium">PAUSED</span>
            )}
          </div>
        </div>

        {/* Demo viewport */}
        <div className="relative min-h-[340px] sm:min-h-[380px] p-4 sm:p-6 overflow-hidden">

          {/* ── STEP 0: Exam Selection ──────────────────────────────────── */}
          <div className={`absolute inset-0 p-4 sm:p-6 flex flex-col items-center justify-center transition-all duration-500 ${fadeIn(0)}`}>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-medium">Step 1 — Choose Your Exam</p>
            <div className="w-full max-w-sm">
              <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800">
                  <span className="text-sm text-slate-400">Select certification exam</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>
                <div className="divide-y divide-slate-800/50">
                  {[
                    { name: 'PMP - Project Management Professional', selected: true },
                    { name: 'CompTIA Security+', selected: false },
                    { name: 'Certified ScrumMaster (CSM)', selected: false },
                    { name: 'SHRM-CP', selected: false },
                  ].map((exam, i) => (
                    <div
                      key={i}
                      className={`px-4 py-2.5 text-sm transition-all duration-700 ${
                        exam.selected && elapsed > 800
                          ? 'bg-brand-600/20 text-brand-200 border-l-2 border-brand-500'
                          : 'text-slate-400 border-l-2 border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {exam.selected && elapsed > 800 && <CheckCircle className="w-3.5 h-3.5 text-brand-400" />}
                        {exam.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 1: Question Display ───────────────────────────────── */}
          <div className={`absolute inset-0 p-4 sm:p-6 transition-all duration-500 ${fadeIn(1)}`}>
            <div className="max-w-lg mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">PMP</span>
                <span className="text-[10px] text-slate-500">Question 7 of 10</span>
              </div>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed mb-5 font-medium">
                A project manager discovers a key stakeholder has been excluded from status meetings. What should the PM do first?
              </p>
              <div className="space-y-2">
                {[
                  { letter: 'A', text: 'Add the stakeholder to the next meeting invite' },
                  { letter: 'B', text: 'Review the communications management plan' },
                  { letter: 'C', text: 'Escalate to the project sponsor' },
                  { letter: 'D', text: 'Document the issue in the risk register' },
                ].map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900/50 text-sm text-slate-300 hover:border-slate-600 transition-all cursor-default"
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                      {opt.letter}
                    </span>
                    <span>{opt.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── STEP 2: Answer Selected (Wrong) ────────────────────────── */}
          <div className={`absolute inset-0 p-4 sm:p-6 transition-all duration-500 ${fadeIn(2)}`}>
            <div className="max-w-lg mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">PMP</span>
                <span className="text-[10px] text-slate-500">Question 7 of 10</span>
              </div>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed mb-5 font-medium">
                A project manager discovers a key stakeholder has been excluded from status meetings. What should the PM do first?
              </p>
              <div className="space-y-2">
                {[
                  { letter: 'A', text: 'Add the stakeholder to the next meeting invite', wrong: true },
                  { letter: 'B', text: 'Review the communications management plan', correct: true },
                  { letter: 'C', text: 'Escalate to the project sponsor', dim: true },
                  { letter: 'D', text: 'Document the issue in the risk register', dim: true },
                ].map((opt, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm transition-all duration-500 ${
                      opt.wrong
                        ? 'border-red-500/50 bg-red-500/10 text-red-200'
                        : opt.correct
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                        : 'border-slate-800/50 bg-slate-900/30 text-slate-500'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      opt.wrong ? 'bg-red-500/20' : opt.correct ? 'bg-emerald-500/20' : 'bg-slate-800'
                    }`}>
                      {opt.wrong ? <XCircle className="w-4 h-4 text-red-400" /> :
                       opt.correct ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                       <span className="font-bold text-slate-500">{opt.letter}</span>}
                    </span>
                    <span>{opt.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── STEP 3: AI Explanation ──────────────────────────────────── */}
          <div className={`absolute inset-0 p-4 sm:p-6 transition-all duration-500 ${fadeIn(3)}`}>
            <div className="max-w-lg mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">CipherExam Explanation</span>
              </div>

              <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 space-y-3">
                <p className="text-sm text-slate-300 leading-relaxed min-h-[20px]">
                  {line1}<span className={step === 3 && line1.length < explanationLines[0].length ? 'inline-block w-0.5 h-4 bg-brand-400 ml-0.5 animate-pulse' : 'hidden'} />
                </p>

                {elapsed > 800 && (
                  <p className="text-sm text-slate-300 leading-relaxed min-h-[40px]">
                    {line2}<span className={step === 3 && elapsed > 800 && line2.length < explanationLines[1].length ? 'inline-block w-0.5 h-4 bg-brand-400 ml-0.5 animate-pulse' : 'hidden'} />
                  </p>
                )}

                {elapsed > 3200 && (
                  <p className="text-sm text-emerald-300 font-semibold leading-relaxed min-h-[20px]">
                    {line3}<span className={step === 3 && elapsed > 3200 && line3.length < explanationLines[2].length ? 'inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 animate-pulse' : 'hidden'} />
                  </p>
                )}

                {elapsed > 4500 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-brand-500/10">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-amber-300">Key Concept: Servant Leadership + Process First</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── STEP 4: Analytics Dashboard ─────────────────────────────── */}
          <div className={`absolute inset-0 p-4 sm:p-6 transition-all duration-500 ${fadeIn(4)}`}>
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Your Readiness Dashboard</span>
              </div>

              {/* Overall readiness */}
              <div className="flex items-center gap-4 mb-6 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="relative w-14 h-14 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-800" />
                    <circle
                      cx="32" cy="32" r="26"
                      fill="none" stroke="#6366f1" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - (step === 4 ? 0.72 : 0))}
                      style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                    {step === 4 ? '72' : '0'}%
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Exam Readiness</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">+12%</span> this week
                  </div>
                </div>
              </div>

              {/* Domain rings */}
              <div className="flex justify-between gap-2 sm:gap-3">
                <MasteryRing label="People" pct={85} color="#10b981" delay={200} active={step === 4} />
                <MasteryRing label="Process" pct={68} color="#6366f1" delay={400} active={step === 4} />
                <MasteryRing label="Business" pct={74} color="#f59e0b" delay={600} active={step === 4} />
                <MasteryRing label="Agile" pct={62} color="#818cf8" delay={800} active={step === 4} />
                <MasteryRing label="Predictive" pct={78} color="#06b6d4" delay={1000} active={step === 4} />
              </div>
            </div>
          </div>

          {/* ── STEP 5: Pause (reuses step 4 visual, just a gap) ────────── */}
          <div className={`absolute inset-0 p-4 sm:p-6 transition-all duration-700 ${step === 5 ? 'opacity-40 scale-[0.97]' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex items-center justify-center h-full">
              <span className="text-xs text-slate-600 animate-pulse">Restarting demo...</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-slate-800/50">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-blue-500 transition-all duration-100 ease-linear"
            style={{ width: `${Math.min(overallProgress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
