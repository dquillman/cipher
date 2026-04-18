interface Scenario {
    label: string;
    probability: number;
    impact: number;
}

interface EmvCalculationProps {
    scenarios: Scenario[];
}

function formatCurrency(value: number): string {
    const abs = Math.abs(value);
    const formatted = abs.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    return value < 0 ? `-${formatted}` : formatted;
}

function formatPercent(value: number): string {
    return `${(value * 100).toFixed(0)}%`;
}

export default function EmvCalculation({ scenarios }: EmvCalculationProps) {
    const computed = scenarios.map(s => ({
        ...s,
        emv: s.probability * s.impact,
    }));

    const best = computed.reduce((a, b) => (b.emv > a.emv ? b : a));

    return (
        <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-5 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                EMV Calculation
            </p>
            <div className="space-y-2 font-mono text-sm">
                {computed.map((s, i) => (
                    <p key={i} className={`leading-relaxed ${s.label === best.label ? 'text-emerald-300 font-semibold' : 'text-slate-300'}`}>
                        EMV({s.label}) = {formatPercent(s.probability)} &times; {formatCurrency(s.impact)} = {formatCurrency(s.emv)}
                    </p>
                ))}
            </div>
            <p className="mt-3 text-sm text-emerald-400 font-medium">
                {best.label} has the highest expected monetary value.
            </p>
        </div>
    );
}
