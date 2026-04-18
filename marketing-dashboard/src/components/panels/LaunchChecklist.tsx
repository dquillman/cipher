import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Target, ListChecks, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketingData } from '../../hooks/useMarketingData.ts';
import { seedChecklist, toggleChecklistItem, reseedChecklist } from '../../services/checklistService.ts';
import { ProgressBar } from '../ui/ProgressBar.tsx';
import { currentDay } from '../../lib/dateUtils.ts';
import { DEFAULT_CONFIG } from '../../types/config.ts';

export function LaunchChecklist() {
  const { checklist } = useMarketingData();
  const todayNum = currentDay(DEFAULT_CONFIG.launchDate);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reseeding, setReseeding] = useState(false);

  const handleReseed = async () => {
    if (!confirm('This will delete all checklist data and re-seed from the template. Completion status will be lost. Continue?')) return;
    setReseeding(true);
    await reseedChecklist();
    setReseeding(false);
  };

  useEffect(() => { seedChecklist(); }, []);

  const weeks = [1, 2, 3, 4];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">30-Day Launch Checklist</h2>
        <div className="flex items-center gap-4">
          <div className="w-48">
            <ProgressBar
              value={checklist.filter((c) => c.completed).length}
              max={checklist.length}
              label="Overall"
            />
          </div>
          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50"
          >
            {reseeding ? 'Re-seeding...' : 'Re-seed'}
          </button>
        </div>
      </div>

      {weeks.map((week) => {
        const items = checklist.filter((c) => c.week === week);
        const completed = items.filter((c) => c.completed).length;
        const days = [...new Set(items.map((i) => i.day))].sort((a, b) => a - b);

        return (
          <div key={week} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-brand-300">Week {week}</h3>
              <span className="text-xs text-slate-400">{completed}/{items.length}</span>
            </div>
            <ProgressBar value={completed} max={items.length} showCount={false} />

            {days.map((day) => (
              <div key={day} className="space-y-1">
                <p className={`text-xs font-medium uppercase tracking-wide mt-3 ${day === todayNum ? 'text-accent-400' : 'text-slate-500'}`}>
                  Day {day} {day === todayNum ? '← Today' : ''}
                </p>
                {items
                  .filter((i) => i.day === day)
                  .map((item) => {
                    const isExpanded = expandedId === item.id;
                    return (
                      <div key={item.id} className={`rounded-lg transition-colors ${item.completed ? 'bg-emerald-500/10' : 'bg-slate-800/40'}`}>
                        {/* Header row */}
                        <div className="flex items-start gap-3 p-2.5">
                          <button
                            onClick={() => toggleChecklistItem(item.id, !item.completed, item.task)}
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              item.completed
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-slate-600 hover:border-brand-400'
                            }`}
                          >
                            {item.completed && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="flex-1 text-left flex items-start gap-2 min-w-0"
                          >
                            <span className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {item.task}
                            </span>
                            <span className="shrink-0 mt-0.5 text-slate-500">
                              {isExpanded
                                ? <ChevronDown className="w-4 h-4" />
                                : <ChevronRight className="w-4 h-4" />}
                            </span>
                          </button>
                        </div>

                        {/* Expandable details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-10 pb-4 space-y-4">
                                {/* Benefit */}
                                {item.benefit && (
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Sparkles className="w-3.5 h-3.5 text-accent-400" />
                                      <span className="text-xs font-semibold uppercase tracking-wide text-accent-400">Why This Matters</span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{item.benefit}</p>
                                  </div>
                                )}

                                {/* Steps */}
                                {item.steps && item.steps.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <ListChecks className="w-3.5 h-3.5 text-brand-400" />
                                      <span className="text-xs font-semibold uppercase tracking-wide text-brand-400">Exact Steps</span>
                                    </div>
                                    <ol className="space-y-1.5 pl-4">
                                      {item.steps.map((step: string, idx: number) => (
                                        <li key={idx} className="text-sm text-slate-300 leading-relaxed list-decimal marker:text-slate-500">
                                          {step}
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}

                                {/* Expected Outcome */}
                                {item.expectedOutcome && (
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Expected Outcome</span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{item.expectedOutcome}</p>
                                  </div>
                                )}

                                {!item.benefit && !item.steps && !item.expectedOutcome && (
                                  <p className="text-sm text-slate-500 italic">No details available. Click Re-seed to update all items with expanded details.</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
