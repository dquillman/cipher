interface SmartQuizReviewModalProps {
    open: boolean;
    onClose: () => void;
    reviewText?: string;
    loading: boolean;
    isPartial: boolean;
    isPro: boolean;
}

const HEADERS = ['Overall Read', 'Where You Lost Ground', 'Pattern to Watch', 'One Thing to Do Next', 'Final Word'] as const;

function parseBlock(text: string): { header: string | null; body: string } {
    const lines = text.split('\n');
    const first = lines[0].trim().replace(/^#{1,3}\s*/, '').replace(/\*\*/g, '').trim();
    const matched = HEADERS.find(h => first.toLowerCase() === h.toLowerCase());
    if (matched) return { header: matched, body: lines.slice(1).join('\n').trim() };
    return { header: null, body: text.trim() };
}

export default function SmartQuizReviewModal({ open, onClose, reviewText, loading, isPartial, isPro }: SmartQuizReviewModalProps) {
    if (!open) return null;

    const paragraphs = reviewText ? reviewText.split(/\n\s*\n/) : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800/95 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 max-w-2xl w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-7 pt-6 pb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">{isPro ? '\uD83E\uDDE0' : '\uD83D\uDD12'}</span>
                        <h2 className="text-xl font-bold text-white font-display tracking-tight">
                            {isPartial ? 'Your Progress So Far' : 'Your Smart Practice Review'}
                        </h2>
                    </div>
                    <p className="text-[0.8rem] text-slate-400/80 ml-10">
                        {isPro
                            ? 'Personalized coaching based on this quiz'
                            : 'Upgrade to Pro for personalized coaching'}
                    </p>
                </div>

                {/* Body */}
                <div className="px-7 py-6">
                    {isPro ? (
                        <div className="max-h-[30rem] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            <div className="space-y-5">
                                {loading ? (
                                    <div className="flex items-center gap-3 py-10 justify-center">
                                        <div className="h-4 w-4 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
                                        <p className="text-slate-400 text-base">Reviewing your performance...</p>
                                    </div>
                                ) : paragraphs.length > 0 ? (
                                    paragraphs.map((p, i) => {
                                        const { header, body } = parseBlock(p);

                                        const isAction = header === 'One Thing to Do Next';
                                        const isFinal = header === 'Final Word';
                                        const isOverall = header === 'Overall Read';
                                        const isMiddle = header === 'Where You Lost Ground' || header === 'Pattern to Watch';

                                        const wrapperClass = isAction
                                            ? 'rounded-xl p-5 bg-brand-500/10 border border-brand-500/30 border-l-4 border-l-brand-500'
                                            : isFinal
                                            ? 'rounded-xl p-5 bg-slate-900/40'
                                            : isOverall
                                            ? 'rounded-xl p-5 bg-slate-800/40'
                                            : isMiddle
                                            ? 'rounded-xl p-5 bg-slate-800/30'
                                            : 'rounded-xl p-5 bg-slate-800/30';

                                        const headerClass = isAction
                                            ? 'text-xs font-semibold uppercase tracking-[0.18em] text-brand-400 mb-2'
                                            : isFinal
                                            ? 'text-xs font-semibold uppercase tracking-[0.18em] text-brand-400/50 mb-2'
                                            : 'text-xs font-semibold uppercase tracking-[0.18em] text-brand-400 mb-2';

                                        const bodyClass = isFinal
                                            ? 'text-base text-slate-400/80 italic leading-7'
                                            : isAction
                                            ? 'text-base text-slate-100 leading-8'
                                            : isOverall
                                            ? 'text-[1.05rem] text-slate-200 leading-8'
                                            : 'text-base text-slate-300 leading-7';

                                        return (
                                            <div key={i} className={wrapperClass}>
                                                {header && <p className={headerClass}>{header}</p>}
                                                <p className={bodyClass}>{body || p.trim()}</p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-slate-400 text-base">Your results are saved. Coaching review will be available soon.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
                                <span className="text-3xl">{'\uD83E\uDDE0'}</span>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed mb-2">
                                Pro members get a personalized AI coaching review after every Smart Practice session.
                            </p>
                            <p className="text-slate-500 text-xs">
                                Your results are saved. Upgrade anytime to unlock coaching insights.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-7 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                    >
                        Close
                    </button>
                    {!isPro && (
                        <button
                            onClick={() => { window.location.href = '/pricing'; }}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-500 shadow-lg shadow-brand-500/20 transition-all"
                        >
                            Upgrade to Pro
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
