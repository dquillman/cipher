import { useNavigate } from 'react-router-dom';
import { X, Check, Star } from 'lucide-react';
import { useEffect } from 'react';
import { ConversionIntentService } from '../services/ConversionIntentService';

interface SubscriptionUpsellModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: 'daily_limit' | 'pro_feature';
}

import { useMarketingCopy } from '../hooks/useMarketingCopy';

export default function SubscriptionUpsellModal({ isOpen, onClose, reason = 'pro_feature' }: SubscriptionUpsellModalProps) {
    const navigate = useNavigate();
    const copy = useMarketingCopy();

    // EC-111: Track when the upsell modal is shown
    useEffect(() => {
        if (isOpen) {
            ConversionIntentService.emit('upsell_modal_shown', { feature: reason });
            if (reason === 'daily_limit') {
                ConversionIntentService.emit('limit_reached');
            }
        }
    }, [isOpen, reason]);

    if (!isOpen) return null;

    const messages = {
        daily_limit: {
            title: "Daily Limit Reached",
            description: "You've completed your 5 free questions for today. Upgrade to Pro for unlimited practice.",
        },
        pro_feature: {
            title: copy.pro_value_primary,
            description: copy.pro_value_secondary,
        }
    };

    const content = messages[reason];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl relative overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
                        <Star className="w-8 h-8 text-white fill-white" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">{content.title}</h2>
                    <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                        {content.description}
                    </p>

                    <ul className="text-left space-y-3 mb-8 bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-green-400" />
                            <span>Unlimited Daily Quizzes</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-green-400" />
                            <span>Advanced Analytics & Charts</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-green-400" />
                            <span>Full Exam Simulators</span>
                        </li>
                    </ul>

                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                ConversionIntentService.emit('upsell_modal_cta', { feature: reason });
                                navigate('/app/pricing');
                            }}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25"
                        >
                            Upgrade to Pro
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-slate-400 hover:text-white font-medium transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
