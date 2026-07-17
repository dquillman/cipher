import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { CalendarClock } from 'lucide-react';
import { auth, functions } from '../firebase';
import { useSubscription } from '../contexts/SubscriptionContext';
import { StudyPlanService } from '../services/StudyPlanService';
import { EXAMS } from '../config/exams';

/**
 * Exam Pass expiry banner (docs/exam-pass-spec.md — "Expiry UX").
 *
 * Renders on the authed Dashboard when the user holds an exam pass:
 * - From D-14: "Your pass ends <date>" with days remaining.
 * - If the study plan's exam date lands after expiry and the free extension
 *   is unused, offers the one-click free extension (extendExamPass callable).
 * - reason === 'paid_extension_required' → point at Pro ($19/mo) on /app/pricing.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(d: Date): string {
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

/** extendExamPass may return newExpiresAt as ISO string, millis, or a Timestamp-like object. */
function parseCallableDate(val: unknown): Date | null {
    if (val == null) return null;
    if (typeof val === 'string' || typeof val === 'number') {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }
    const seconds = (val as any)?.seconds ?? (val as any)?._seconds;
    if (typeof seconds === 'number') return new Date(seconds * 1000);
    return null;
}

type ExtendState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; newExpiresAt: Date | null }
    | { status: 'paid_required' }
    | { status: 'error' };

export default function PassExpiryBanner() {
    const { passEntitlement } = useSubscription();
    const [planExamDate, setPlanExamDate] = useState<Date | null>(null);
    const [extend, setExtend] = useState<ExtendState>({ status: 'idle' });

    const passExamId = passEntitlement?.examId ?? null;

    // Fetch the study plan's exam date for the covered exam (drives the free-extension offer).
    useEffect(() => {
        if (!passExamId) return;
        let cancelled = false;
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user) return;
            try {
                const plan = await StudyPlanService.getCurrentPlan(user.uid, passExamId);
                if (!cancelled && plan?.examDate instanceof Date && !isNaN(plan.examDate.getTime())) {
                    setPlanExamDate(plan.examDate);
                }
            } catch {
                // No plan / fetch failure → banner simply shows the plain expiry notice.
            }
        });
        return () => { cancelled = true; unsub(); };
    }, [passExamId]);

    if (!passEntitlement) return null;

    const now = Date.now();
    const expiresAt = passEntitlement.expiresAt;
    const msRemaining = expiresAt.getTime() - now;

    // Only for active passes inside the D-14 window.
    if (msRemaining <= 0) return null;
    const daysRemaining = Math.max(1, Math.ceil(msRemaining / DAY_MS));
    if (daysRemaining > 14) return null;

    const examName = EXAMS[passEntitlement.examId]?.name ?? 'your exam';
    const offerExtension =
        !passEntitlement.freeExtensionUsed &&
        planExamDate !== null &&
        planExamDate.getTime() > expiresAt.getTime();
    const extendedThrough = planExamDate ? new Date(planExamDate.getTime() + 7 * DAY_MS) : null;

    const handleExtend = async () => {
        setExtend({ status: 'loading' });
        try {
            const extendExamPass = httpsCallable(functions, 'extendExamPass');
            const { data }: any = await extendExamPass({});
            if (data?.eligible === true) {
                setExtend({ status: 'success', newExpiresAt: parseCallableDate(data.newExpiresAt) });
            } else if (data?.reason === 'paid_extension_required') {
                setExtend({ status: 'paid_required' });
            } else {
                setExtend({ status: 'error' });
            }
        } catch (error) {
            console.error('extendExamPass failed:', error);
            setExtend({ status: 'error' });
        }
    };

    if (extend.status === 'success') {
        const throughDate = extend.newExpiresAt ?? extendedThrough;
        return (
            <div className="flex items-start gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
                <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                <p className="text-sm text-green-300">
                    <span className="font-bold">Pass extended.</span>{' '}
                    {throughDate
                        ? <>Your {examName} pass now runs through <span className="font-semibold">{formatDate(throughDate)}</span>. Good luck on exam day.</>
                        : <>Your {examName} pass has been extended. Good luck on exam day.</>}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <p className="text-sm text-amber-200">
                    <span className="font-bold">Your pass ends {formatDate(expiresAt)}</span>
                    <span className="text-amber-300/80"> ({daysRemaining} day{daysRemaining === 1 ? '' : 's'} left)</span>
                    {offerExtension && planExamDate && extendedThrough && (
                        <> — but your exam is <span className="font-semibold">{formatDate(planExamDate)}</span>. Extend free through <span className="font-semibold">{formatDate(extendedThrough)}</span>?</>
                    )}
                    {extend.status === 'paid_required' && (
                        <>
                            {' '}Extensions used —{' '}
                            <Link to="/app/pricing" className="font-semibold text-amber-100 underline hover:text-white">
                                switch to Pro from $19/mo
                            </Link>.
                        </>
                    )}
                    {extend.status === 'error' && (
                        <span className="text-red-300"> Couldn't extend your pass — please try again.</span>
                    )}
                </p>
            </div>
            {offerExtension && extend.status !== 'paid_required' && (
                <button
                    onClick={handleExtend}
                    disabled={extend.status === 'loading'}
                    className="shrink-0 self-start rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-2 text-sm font-bold text-amber-200 transition-colors hover:bg-amber-500/30 disabled:opacity-60 sm:self-auto"
                >
                    {extend.status === 'loading' ? 'Extending…' : extend.status === 'error' ? 'Try Again' : 'Extend Free'}
                </button>
            )}
        </div>
    );
}
