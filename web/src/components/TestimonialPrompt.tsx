import { useState } from 'react';
import { Star, X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { TestimonialService } from '../services/TestimonialService';

interface TestimonialPromptProps {
  /** Firestore exam ID. */
  examId: string;
  /** Human-readable exam name, e.g. "PMP". */
  examName: string;
  /** Called when user dismisses or successfully submits — parent unmounts. */
  onClose: () => void;
}

/**
 * Slide-up card that appears at bottom-right after the user answers their
 * 10th question (the activated_user milestone). Captures a 1-5 rating, an
 * optional free-form quote, and consent to share publicly.
 *
 * Non-blocking by design: lives in a fixed-position card so the user can
 * keep answering questions. Dismissing or submitting marks `ec_testimonial_
 * prompted_{uid}` in localStorage so we never re-prompt the same user.
 *
 * One submission per user — Firestore rule enforces create-only at
 * testimonials/{userId} so duplicate submissions can't overwrite the first.
 */
export default function TestimonialPrompt({ examId, examName, onClose }: TestimonialPromptProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [consentToShare, setConsentToShare] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markPrompted = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    localStorage.setItem(`ec_testimonial_prompted_${uid}`, new Date().toISOString());
    // Clear the pending signal so TestimonialPromptHost won't re-mount us.
    localStorage.removeItem(`ec_testimonial_pending_${uid}`);
  };

  const dismiss = () => {
    markPrompted();
    onClose();
  };

  const submit = async () => {
    const user = auth.currentUser;
    if (!user || rating == null) return;

    setSubmitting(true);
    setError(null);

    try {
      let utm: Record<string, string> = {};
      try { utm = JSON.parse(sessionStorage.getItem('ec_utm') || '{}'); } catch { /* ignore */ }

      await TestimonialService.submitTestimonial({
        userId: user.uid,
        userEmail: user.email ?? null,
        userDisplayName: user.displayName ?? null,
        examId,
        examName,
        rating,
        text: text.trim() || null,
        consentToShare,
        triggeredAt: 'q10',
        utmSource: utm.utm_source ?? null,
        utmCampaign: utm.utm_campaign ?? null,
        utmContent: utm.utm_content ?? null,
      });

      markPrompted();
      setSubmitted(true);
      setTimeout(onClose, 2200);
    } catch (e) {
      console.error('TestimonialPrompt submit failed', e);
      setError('Could not save — try again?');
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="decoder fixed bottom-4 right-4 z-50 w-[340px] rounded-xl border border-green-200 bg-white p-4 shadow-xl">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 size={20} />
          <span className="font-semibold">Thanks — we hear you.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="decoder fixed bottom-4 right-4 z-50 w-[360px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">How's it going so far?</p>
          <p className="mt-0.5 text-xs text-slate-600">
            You've done 10 questions on {examName}. Quick gut-check helps us tune the product.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="ml-2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHoverRating(null)}>
        {[1, 2, 3, 4, 5].map(n => {
          const filled = (hoverRating ?? rating ?? 0) >= n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className="rounded p-1 transition hover:bg-amber-50"
            >
              <Star
                size={22}
                className={filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
              />
            </button>
          );
        })}
      </div>

      {rating != null && (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="(Optional) One thing you'd tell a friend studying for this exam?"
            rows={3}
            maxLength={500}
            className="mt-3 w-full resize-none rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />

          <label className="mt-2 flex items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={consentToShare}
              onChange={e => setConsentToShare(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>OK to share my first name + quote on the CipherExam site / social.</span>
          </label>

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={dismiss}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              disabled={submitting}
            >
              Skip
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submitting ? 'Sending' : 'Send'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
