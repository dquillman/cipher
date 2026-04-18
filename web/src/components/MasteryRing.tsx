import { motion } from 'framer-motion';

interface MasteryRingProps {
    percentage: number;
    color: string;
    label: string;
    size?: number;
    strokeWidth?: number;
}

export default function MasteryRing({
    percentage,
    color,
    label,
    size = 120,
    strokeWidth = 10
}: MasteryRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background Ring */}
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        className="text-slate-700"
                    />
                    {/* Progress Ring */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                    />
                </svg>
                {/* Percentage Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold font-display text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                        {Math.round(percentage)}%
                    </span>
                </div>
            </div>
            <span className="text-sm font-bold text-slate-300 tracking-wide uppercase">{label}</span>
        </div>
    );
}
