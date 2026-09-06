import { Outlet } from 'react-router-dom';
import { ExamProvider } from './contexts/ExamContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { SmartQuizReviewProvider, useSmartQuizReview } from './contexts/SmartQuizReviewContext';
import { SidebarProvider } from './contexts/SidebarContext';
import SmartQuizReviewModal from './components/SmartQuizReviewModal';

/**
 * Provider scope for the signed-in app.
 *
 * ExamProvider and SubscriptionProvider both import Firestore directly, and
 * they used to wrap the entire <Routes> tree — which meant the landing page,
 * the blog and every marketing page paid for the fb-firestore chunk to render
 * static text. No public route calls useExam() or useSubscription(); every
 * consumer is an /app/* page or an app-only component. So the providers are
 * mounted here, under /app/*, and this module is lazy so its Firestore
 * dependency loads only when someone actually enters the app.
 *
 * If a PUBLIC page ever needs useExam or useSubscription, do not move these
 * back to the top of App.tsx — that undoes the whole saving. Lift only the one
 * value that page needs, or lazily mount the provider around that page.
 */
function GlobalSmartQuizReviewModal() {
    const { state, closeReview } = useSmartQuizReview();
    return (
        <SmartQuizReviewModal
            open={state.open}
            onClose={closeReview}
            reviewText={state.reviewText}
            loading={state.loading}
            isPartial={state.isPartial}
            isPro={state.isPro}
        />
    );
}

export default function AppScope() {
    return (
        <ExamProvider>
            <SubscriptionProvider>
                <SmartQuizReviewProvider>
                    <SidebarProvider>
                        <Outlet />
                        <GlobalSmartQuizReviewModal />
                    </SidebarProvider>
                </SmartQuizReviewProvider>
            </SubscriptionProvider>
        </ExamProvider>
    );
}
