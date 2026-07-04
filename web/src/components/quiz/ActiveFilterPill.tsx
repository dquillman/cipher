export interface ActiveFilters {
    domain?: string;
    bloomLevel?: string;
    bloomFallback?: boolean;
}

// Active filter pill — surfaces domain / Bloom focused drill and fallback banner
export default function ActiveFilterPill({ filters }: { filters: ActiveFilters }) {
    if (!filters.domain && !filters.bloomLevel && !filters.bloomFallback) return null;

    return (
        <div className="w-full max-w-3xl mb-4">
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                    Focused Drill
                </span>
                {filters.domain && (
                    <span className="inline-flex items-center rounded-full bg-slate-800/70 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-200">
                        Domain: <span className="font-semibold text-white ml-1">{filters.domain}</span>
                    </span>
                )}
                {filters.bloomLevel && (
                    <span className="inline-flex items-center rounded-full bg-slate-800/70 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-200">
                        Bloom: <span className="font-semibold text-white ml-1">{filters.bloomLevel}</span>
                    </span>
                )}
                <span className="text-xs text-slate-400 ml-auto">
                    Answers still count toward mastery &amp; readiness.
                </span>
            </div>
            {filters.bloomFallback && (
                <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
                    No questions matched that Bloom level in this domain yet — running the full domain instead. The Bloom filter will activate once content is tagged.
                </div>
            )}
        </div>
    );
}
