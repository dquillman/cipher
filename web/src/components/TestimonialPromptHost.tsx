import { Suspense, lazy, useEffect, useState } from 'react';
import { useAuth } from '../App';
// Lazy on purpose: TestimonialPrompt -> TestimonialService -> Firestore. This
// host mounts on every page including the landing page, so a static import
// here pulled the 344KB fb-firestore chunk down for logged-out visitors who
// can never see the prompt. It only renders when `pending` is set, which
// requires a signed-in user who just finished a session.
const TestimonialPrompt = lazy(() => import('./TestimonialPrompt'));

/**
 * Top-level host that survives any page navigation.
 *
 * The Quiz page can't host TestimonialPrompt itself: a 10-question session
 * triggers the prompt at Q10 *and* navigates to /results on the same click,
 * unmounting the prompt before the user can interact. Solving by hoisting to
 * the App layer with a localStorage signal as the cross-page channel.
 *
 * Signal: `ec_testimonial_pending_{uid}` = JSON({examId, examName}).
 * Dedup:  `ec_testimonial_prompted_{uid}` set when user dismisses/submits;
 *         once set, the prompt never reappears for that user.
 */
interface PendingPayload {
  examId: string;
  examName: string;
}

export default function TestimonialPromptHost() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingPayload | null>(null);

  useEffect(() => {
    if (!user) {
      setPending(null);
      return;
    }
    const uid = user.uid;
    const pendingKey = `ec_testimonial_pending_${uid}`;
    const promptedKey = `ec_testimonial_prompted_${uid}`;

    const check = () => {
      if (localStorage.getItem(promptedKey)) {
        // User already responded once — never prompt again.
        setPending(null);
        return;
      }
      const raw = localStorage.getItem(pendingKey);
      if (!raw) {
        setPending(null);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as PendingPayload;
        if (parsed && parsed.examId) setPending(parsed);
      } catch {
        localStorage.removeItem(pendingKey);
        setPending(null);
      }
    };

    check();

    // Re-check when other tabs write to localStorage (same-tab writes don't
    // fire 'storage', so Quiz.tsx also dispatches a CustomEvent — see below).
    const onStorage = (e: StorageEvent) => {
      if (e.key === pendingKey || e.key === promptedKey) check();
    };
    const onCustom = () => check();

    window.addEventListener('storage', onStorage);
    window.addEventListener('ec-testimonial-pending', onCustom);

    // Short poll as belt+suspenders for tab activations / focus changes.
    const interval = window.setInterval(check, 2500);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('ec-testimonial-pending', onCustom);
      window.clearInterval(interval);
    };
  }, [user]);

  if (!pending) return null;

  return (
    <Suspense fallback={null}>
      <TestimonialPrompt
        examId={pending.examId}
        examName={pending.examName}
        onClose={() => setPending(null)}
      />
    </Suspense>
  );
}
