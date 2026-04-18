
import { AlertCircle, Zap } from 'lucide-react';

export interface PatternData {
    pattern_id: string;
    pattern_name: string;
    core_rule: string;
    five_second_heuristic: string;
    mastery_score: number;
    times_seen: number;
    times_missed: number;
    domain_tags?: string[];
}

interface PatternInsightCardProps {
    pattern: PatternData;
}

export default function PatternInsightCard({ pattern }: PatternInsightCardProps) {
    const getMasteryColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
        if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
        return 'text-red-400 border-red-500/30 bg-red-500/10';
    };

    const getMasteryLabel = (score: number) => {
        if (score >= 80) return 'Mastered';
        if (score >= 50) return 'In Progress';
        return 'Needs Focus';
    };

    return (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg relative group overflow-hidden">
            {/* Background Gradient Effect */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-white/5 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />

            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-white leading-tight pr-8">
                    {pattern.pattern_name}
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getMasteryColor(pattern.mastery_score)}`}>
                    {getMasteryLabel(pattern.mastery_score)}
                </span>
            </div>

            <p className="text-slate-400 text-sm mb-4 leading-relaxed line-clamp-2">
                {pattern.core_rule}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-700/50 pt-3">
                <div className="flex items-center gap-1 group/heuristic cursor-help relative">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-medium text-slate-400 group-hover/heuristic:text-amber-300 transition-colors">Quick Fix</span>

                    {/* Tooltip-ish popover for heuristic */}
                    {pattern.five_second_heuristic && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 text-slate-200 p-3 rounded-lg border border-slate-700 shadow-xl text-xs opacity-0 group-hover/heuristic:opacity-100 pointer-events-none transition-opacity z-10">
                            <span className="block font-bold text-amber-400 mb-1">5-Second Heuristic:</span>
                            {pattern.five_second_heuristic}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <span title="Times Missed" className="flex items-center gap-1 text-red-400/80">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {pattern.times_missed}
                    </span>
                    <span title="Mastery Score" className="font-mono font-bold text-slate-300">
                        {pattern.mastery_score}%
                    </span>
                </div>
            </div>
        </div>
    );
}
