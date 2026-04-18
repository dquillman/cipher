import { useState } from 'react';
import { X, MessageSquare, Loader2, CheckCircle2, Upload } from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../App';
import { useLocation } from 'react-router-dom';
import { APP_VERSION } from '../version';
import { useExam } from '../contexts/ExamContext';

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    context?: Record<string, string | undefined>;
}

export default function ReportIssueModal({ isOpen, onClose, context }: ReportIssueModalProps) {
    const { user } = useAuth();
    const location = useLocation();
    const { selectedExamId, examName } = useExam();

    const [type, setType] = useState<'bug' | 'content' | 'other'>('bug');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        setLoading(true);

        try {
            let attachmentUrl = null;

            if (screenshot && storage) {
                const filename = `${Date.now()}_${uuidv4()}_${screenshot.name}`;
                const storageRef = ref(storage, `uploads/${user?.uid || 'anonymous'}/issues/${filename}`);
                await uploadBytes(storageRef, screenshot);
                attachmentUrl = await getDownloadURL(storageRef);
            }

            const environment = window.location.hostname.includes('staging')
                ? 'staging'
                : 'prod';

            const ua = navigator.userAgent;

            const deviceType = /Mobi|Android/i.test(ua)
                ? 'mobile'
                : /iPad|Tablet/i.test(ua)
                ? 'tablet'
                : 'desktop';

            const os = /Windows/i.test(ua)
                ? 'Windows'
                : /Mac/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)
                ? 'macOS'
                : /iPhone|iPad|iPod/i.test(ua)
                ? 'iOS'
                : /Android/i.test(ua)
                ? 'Android'
                : 'Unknown';

            const browser = /Edg/i.test(ua)
                ? 'Edge'
                : /Chrome/i.test(ua) && !/Edg/i.test(ua)
                ? 'Chrome'
                : /Safari/i.test(ua) && !/Chrome/i.test(ua)
                ? 'Safari'
                : /Firefox/i.test(ua)
                ? 'Firefox'
                : 'Unknown';

            await addDoc(collection(db, 'issues'), {
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || 'anonymous',
                type,
                description,
                path: location.pathname,
                timestamp: serverTimestamp(),
                status: 'new',
                version: APP_VERSION,
                attachmentUrl,
                ...(context || {}),
                appVersion: APP_VERSION,
                environment,
                route: location.pathname,
                examId: selectedExamId ?? null,
                examName: examName || null,
                userAgent: ua,
                submittedFrom: 'exam-coach',
                deviceType,
                os,
                browser,
            });

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setDescription('');
                setType('bug');
                setScreenshot(null);
                setPreviewUrl(null);
            }, 2000);
        } catch (error) {
            console.error("Error submitting issue:", error);
            alert("Failed to submit issue. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Report an Issue</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="py-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Thank You!</h3>
                                <p className="text-slate-400">Your report has been submitted successfully.</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Issue Type
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                >
                                    <option value="bug">Bug / Error</option>
                                    <option value="content">Content Issue (Question/Answer)</option>
                                    <option value="other">Feature Request / Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Please describe what happened..."
                                    rows={4}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Screenshot (Optional)
                                </label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl cursor-pointer transition-colors text-sm font-medium text-slate-300">
                                        <Upload className="w-4 h-4" />
                                        {screenshot ? 'Change Image' : 'Upload Image'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setScreenshot(file);
                                                    setPreviewUrl(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </label>
                                    {screenshot && (
                                        <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-700">
                                            <span className="text-xs text-slate-300 truncate max-w-[150px]">
                                                {screenshot.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setScreenshot(null);
                                                    setPreviewUrl(null);
                                                }}
                                                className="text-slate-500 hover:text-red-400"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {previewUrl && (
                                    <div className="mt-2 relative w-full h-32 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                                <p>Make sure to include details so we can reproduce it.</p>
                                <p>Device info, current exam{examName ? ` (${examName})` : ''}, and current page ({location.pathname}) will be included automatically.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-500 text-white font-bold py-3 rounded-xl hover:bg-brand-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                {loading ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </form>
                    )}
                </div>

            </div>
        </div>
    );
}
