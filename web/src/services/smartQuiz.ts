import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';




interface MasteryData {
    [domain: string]: {
        correct: number;
        total: number;
    };
}

export const SmartQuizService = {
    /**
     * Identifies domains where the user has < 60% mastery.
     */
    getWeakDomains: (masteryData: MasteryData): string[] => {
        const weakDomains: string[] = [];
        for (const [domain, stats] of Object.entries(masteryData)) {
            if (stats.total > 0) {
                const percentage = (stats.correct / stats.total) * 100;
                if (percentage < 60) {
                    weakDomains.push(domain);
                }
            }
        }
        return weakDomains;
    },

    /**
     * Generates a "Smart Quiz" focusing on weak areas and spaced repetition.
     * Returns a list of Question IDs.
     */
    /**
     * Generates a "Smart Quiz" focusing on weak areas and spaced repetition.
     * Returns a list of Question IDs.
     * 
     * @param userId 
     * @param examId 
     * @param masteryData 
     * @param maxQuestions 
     * @param excludeIds - Optional list of IDs to exclude (e.g. from Diagnostic)
     */
    generateSmartQuiz: async (userId: string, examId: string, masteryData: MasteryData, maxQuestions: number = 10, excludeIds: string[] = [], domains: string[] = []): Promise<string[]> => {
        console.log("Generating Smart Quiz for", userId, "with limit", maxQuestions, "Excluded:", excludeIds.length);
        const weakDomains = SmartQuizService.getWeakDomains(masteryData);
        let targetDomains = weakDomains;

        // If no weak domains, pick 2 random domains to focus on
        if (targetDomains.length === 0) {
            const allDomains = Object.keys(masteryData);
            if (allDomains.length > 0) {
                targetDomains = allDomains.sort(() => 0.5 - Math.random()).slice(0, 2);
            } else {
                // Fallback: use first two domains from Firestore-sourced list
                targetDomains = domains.slice(0, 2);
            }
        }

        console.log("Targeting domains:", targetDomains);

        // Calculate questions per domain (distribute maxQuestions evenly)
        const questionsPerDomain = Math.ceil(maxQuestions / targetDomains.length);

        // Fetch questions from these domains
        // LAYER 1: Session-Level Uniqueness
        const usedQuestionIds = new Set<string>();

        // Setup exclusion set for fast lookup
        const excludedSet = new Set(excludeIds);

        // We'll try to get questions from each target domain
        for (const domain of targetDomains) {
            // Stop if we have enough questions
            if (usedQuestionIds.size >= maxQuestions) break;

            try {
                // Fetch a batch to shuffle
                const batchSize = questionsPerDomain * 3; // Fetch 3x needed to allow for some randomness
                const q = query(
                    collection(db, 'questions'),
                    where('examId', '==', examId),
                    where('domain', '==', domain),
                    limit(batchSize)
                );

                const snap = await getDocs(q);
                const docs = snap.docs.map(d => d.id);

                // Shuffle candidates
                const shuffled = docs.sort(() => 0.5 - Math.random());

                // Select questions
                for (const id of shuffled) {
                    // Stop if we filled the quota for this domain
                    // (Actually we want to fill the QUIZ, so let's just check overall quiz size?)
                    // But we want to distribute, so let's respect per-domain slightly, but leniently.

                    // LAYER 1 CHECK: Intra-session duplicate
                    if (usedQuestionIds.has(id)) continue;

                    // LAYER 2 CHECK: Cross-mode Cooldown
                    if (excludedSet.has(id)) {
                        // GUARDRAIL (Layer 3): Only skip if we have plenty of candidates?
                        // For now, strict skip. We will handle exhaustion fallback later if needed globally?
                        // actually, simplified loop: just try to fill.
                        continue;
                    }

                    usedQuestionIds.add(id);

                    // Soft cap per domain to ensure variety? 
                    // Let's just break if we have ANY questions, we want to fill the set.
                }

            } catch (err) {
                console.error(`Error fetching for domain ${domain}:`, err);
            }
        }

        // LAYER 3: Pool Exhaustion Fallback
        // If we filtered too aggressively and have fewer than maxQuestions,
        // we must do a second pass allowing 'excluded' questions.
        if (usedQuestionIds.size < maxQuestions) {
            console.warn("Pool exhausted strictly. Attempting fallback with excluded items...", usedQuestionIds.size);

            // Re-fetch or re-process? 
            // Ideally we tracked 'candidates we skipped'.
            // For simplicity in this non-stateful function, we might just need to accept that
            // or we could do a brute-force fill from Simulation if needed.

            // Let's try filling with Simulation logic if really low
            if (usedQuestionIds.size < maxQuestions) {
                const needed = maxQuestions - usedQuestionIds.size;
                const simIds = await SmartQuizService.generateSimulationExam(examId, needed * 2);
                for (const id of simIds) {
                    if (!usedQuestionIds.has(id)) {
                        usedQuestionIds.add(id);
                        if (usedQuestionIds.size >= maxQuestions) break;
                    }
                }
            }
        }

        return Array.from(usedQuestionIds).sort(() => 0.5 - Math.random());
    },

    /**
     * Generates a domain-balanced diagnostic exam.
     * Selects exactly 3 questions per domain (where available) for equal representation.
     */
    generateDiagnosticExam: async (examId: string, domains: string[]): Promise<string[]> => {
        console.log("Generating Diagnostic Exam for", examId, "with domains:", domains);
        const QUESTIONS_PER_DOMAIN = 3;
        const selectedIds: string[] = [];

        // Fallback if no domains provided
        if (!domains || domains.length === 0) {
            console.warn("No domains provided for diagnostic, falling back to random selection");
            return SmartQuizService.generateSimulationExam(examId, 15);
        }

        for (const domain of domains) {
            try {
                const q = query(
                    collection(db, 'questions'),
                    where('examId', '==', examId),
                    where('domain', '==', domain),
                    limit(QUESTIONS_PER_DOMAIN * 3) // Fetch extra for randomness
                );

                const snap = await getDocs(q);
                const domainIds = snap.docs.map(d => d.id);

                // Shuffle and take up to 3
                const shuffled = domainIds.sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, QUESTIONS_PER_DOMAIN);
                selectedIds.push(...selected);
            } catch (error) {
                console.error(`Error fetching questions for domain ${domain}:`, error);
            }
        }

        // Final shuffle to mix domains
        return selectedIds.sort(() => 0.5 - Math.random());
    },

    /**
     * Generates a full 50-question simulation exam.
     * Fetches a broad set of questions and randomly selects 50.
     */
    generateSimulationExam: async (examId: string, size: number = 50): Promise<string[]> => {
        console.log("Generatign Simulation Exam for", examId);
        try {
            // 1. Fetch a large batch of question IDs (e.g. up to 150) to ensure randomness
            // Note: In production with thousands of questions, this needs a better random index strategy.
            const q = query(
                collection(db, 'questions'),
                where('examId', '==', examId),
                limit(200)
            );

            const snap = await getDocs(q);
            const allIds = snap.docs.map(doc => doc.id);

            // 2. Shuffle and slice
            const shuffled = allIds.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, size);

        } catch (error) {
            console.error("Error generating simulation:", error);
            return [];
        }
    },
    /**
     * Generates a focused quiz for a specific "Thinking Trap" (Pattern).
     * Strategy:
     * 1. Try to find questions tagged with this pattern (if supported in future).
     * 2. Fallback: Find questions in the same Domain tags.
     * 
     * ADAPTATION:
     * If masteryScore > 70 (Stable Mastery), we prioritize "harder" questions.
     * REMOVED MOCK: If difficulty is missing, we use text length as a proxy for complexity.
     */
    generateTrapQuiz: async (
        patternId: string,
        domainTags: string[],
        examId: string,
        limitCount: number = 7,
        masteryScore: number = 0
    ): Promise<string[]> => {
        console.log("Generating Trap Quiz for", patternId, "Score:", masteryScore);

        let questionIds: string[] = [];
        let pool: any[] = [];

        // 1. Fetch Candidates (Domain Fallback)
        if (domainTags && domainTags.length > 0) {
            const primaryDomain = domainTags[0];
            try {
                // Fetch potentially more to find matches
                const q = query(
                    collection(db, 'questions'),
                    where('examId', '==', examId),
                    where('domain', '==', primaryDomain),
                    limit(40) // Increased fetch limit
                );

                const snap = await getDocs(q);
                pool = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            } catch (error) {
                console.error("Error fetching trap questions:", error);
            }
        }

        // 2. Adaptive Selection
        const isStable = masteryScore > 70;

        if (isStable) {
            console.log("User has STABLE mastery. Attempting to escalate...");

            // creative error handling / heuristic:
            // If explicit difficulty is missing, assume longer questions (stem length) are more complex.
            const AVG_CHAR_LENGTH = 120;

            const hardQuestions = pool.filter(q => {
                const hasDifficulty = typeof q.difficulty === 'number';
                if (hasDifficulty) {
                    return q.difficulty > 5;
                }
                // Fallback Heuristic: Length > 1.5x average (approx 180 chars)
                return (q.stem && q.stem.length > (AVG_CHAR_LENGTH * 1.5));
            });

            if (hardQuestions.length >= 3) { // Only switch if we found a decent chunk
                console.log(`Found ${hardQuestions.length} complex questions.`);
                pool = hardQuestions;
            } else {
                console.log("Insufficient complex questions found. Using standard mix.");
            }
        }

        // 3. Select Finals
        questionIds = pool.map(q => q.id).sort(() => 0.5 - Math.random()).slice(0, limitCount);

        // 4. Final Fallback (Creative Empty Handling)
        if (questionIds.length < limitCount) {
            console.log("Pool exhausted. Filling with Simulation questions.");
            const needed = limitCount - questionIds.length;
            const fallbackIds = await SmartQuizService.generateSimulationExam(examId, needed * 2);

            // Filter duplicates without set complexity
            for (const fid of fallbackIds) {
                if (!questionIds.includes(fid)) {
                    questionIds.push(fid);
                    if (questionIds.length >= limitCount) break;
                }
            }
        }

        return questionIds;
    }
}
