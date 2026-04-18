export interface ExamDomainDefinition {
    name: string;
    weight: number;
    topics: string[];
}

/**
 * Build ExamDomainDefinition[] from domain names (sourced from Firestore via ExamContext).
 * Weights are distributed evenly. Topics are generic placeholders — the platform
 * no longer maintains hard-coded topic lists per exam.
 */
export const getExamDomains = (domains: string[]): ExamDomainDefinition[] => {
    if (!domains || domains.length === 0) return [];
    const weightPerDomain = 1 / domains.length;
    return domains.map(name => ({
        name,
        weight: weightPerDomain,
        topics: [`Review ${name} concepts`, `Practice ${name} questions`, `Advanced ${name} application`]
    }));
};
