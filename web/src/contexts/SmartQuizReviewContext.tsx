import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ReviewState {
    open: boolean;
    loading: boolean;
    isPartial: boolean;
    isPro: boolean;
    reviewText?: string;
}

interface SmartQuizReviewContextType {
    state: ReviewState;
    openReview: (opts: { isPartial: boolean; isPro: boolean }) => void;
    setReviewText: (text: string) => void;
    setLoading: (loading: boolean) => void;
    closeReview: () => void;
}

const SmartQuizReviewContext = createContext<SmartQuizReviewContextType>(null!);

export function useSmartQuizReview() {
    return useContext(SmartQuizReviewContext);
}

export function SmartQuizReviewProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ReviewState>({
        open: false,
        loading: false,
        isPartial: false,
        isPro: false,
        reviewText: undefined,
    });

    const openReview = useCallback((opts: { isPartial: boolean; isPro: boolean }) => {
        setState({
            open: true,
            loading: opts.isPro,
            isPartial: opts.isPartial,
            isPro: opts.isPro,
            reviewText: undefined,
        });
    }, []);

    const setReviewText = useCallback((text: string) => {
        setState(prev => ({ ...prev, reviewText: text, loading: false }));
    }, []);

    const setLoading = useCallback((loading: boolean) => {
        setState(prev => ({ ...prev, loading }));
    }, []);

    const closeReview = useCallback(() => {
        setState(prev => ({ ...prev, open: false }));
    }, []);

    return (
        <SmartQuizReviewContext.Provider value={{ state, openReview, setReviewText, setLoading, closeReview }}>
            {children}
        </SmartQuizReviewContext.Provider>
    );
}
