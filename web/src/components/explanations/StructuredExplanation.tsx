import { parseExplanation } from '../../utils/parseExplanation';
import type { ExplanationBlock } from '../../utils/parseExplanation';

interface StructuredExplanationProps {
    explanation: string;
    title?: string;
}

function BlockRenderer({ block }: { block: ExplanationBlock }) {
    switch (block.type) {
        case 'lens': {
            // Extract the label dynamically (e.g. "PMI Decision Lens:", "SHRM Lens:", "Exam Lens:")
            const lensMatch = block.text.match(/^([\w\s&+-]*(?:Decision\s)?Lens):/i);
            const lensLabel = lensMatch ? lensMatch[1].trim() : 'Exam Lens';
            const lensBody = lensMatch ? block.text.slice(lensMatch[0].length).trim() : block.text;
            return (
                <div className="bg-emerald-950 border border-emerald-600 border-l-4 border-l-emerald-500 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{lensLabel}</p>
                    <p className="text-slate-200 text-sm leading-relaxed">{lensBody}</p>
                </div>
            );
        }
        case 'conflict':
            return (
                <div className="bg-amber-950 border border-amber-600 border-l-4 border-l-amber-500 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Why This Conflicts</p>
                    {block.paragraphs.map((text, i) => (
                        <p key={i} className="text-slate-300 text-sm leading-relaxed mb-2 last:mb-0">{text}</p>
                    ))}
                </div>
            );
        case 'pattern':
            return (
                <div className="bg-blue-950 border border-blue-600 border-l-4 border-l-blue-500 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pattern to Remember</p>
                    <p className="text-slate-200 text-sm font-medium leading-relaxed">{block.text}</p>
                </div>
            );
        case 'note':
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Note</p>
                    <p className="text-slate-300 text-sm italic leading-relaxed">{block.text}</p>
                </div>
            );
        case 'text':
            return (
                <p className="text-slate-300 text-sm leading-relaxed">{block.text}</p>
            );
    }
}

export default function StructuredExplanation({ explanation, title }: StructuredExplanationProps) {
    const blocks = parseExplanation(explanation);

    return (
        <div>
            {title && (
                <p className="font-semibold text-slate-400 text-xs uppercase tracking-wide mb-3">{title}</p>
            )}
            <div className="space-y-3">
                {blocks.map((block, idx) => (
                    <BlockRenderer key={idx} block={block} />
                ))}
            </div>
        </div>
    );
}
