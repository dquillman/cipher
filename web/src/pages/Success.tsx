import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Success() {
    const navigate = useNavigate();

    useEffect(() => {
        // Fire confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);

        // Redirect to dashboard after 5 seconds
        const timeout = setTimeout(() => {
            navigate('/app');
        }, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-3xl border border-green-500/30 max-w-md w-full text-center space-y-6 shadow-2xl shadow-green-500/20">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/10">
                    <Check className="w-10 h-10 text-green-400" />
                </div>

                <h1 className="text-3xl font-bold text-white">Upgrade Successful!</h1>
                <p className="text-slate-400">
                    Welcome to Pro! You now have unlimited access to all features.
                </p>

                <div className="pt-4">
                    <Link
                        to="/app"
                        className="inline-block w-full py-4 rounded-xl font-bold bg-green-500 text-white hover:bg-green-400 transition-all shadow-lg shadow-green-500/25"
                    >
                        Go to Dashboard
                    </Link>
                </div>
                <p className="text-xs text-slate-500">
                    Redirecting automatically in 5 seconds...
                </p>
            </div>
        </div>
    );
}
