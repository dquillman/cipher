"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
// Safe init — no-op if already initialized (e.g. when imported alongside index.ts)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "exam-coach-ai-platform",
    });
}
console.log("Connected project:", admin.app().options.projectId);
const db = admin.firestore();
const EMV_QUESTIONS = [
    {
        id: "emv-sample-001",
        type: "emv",
        examId: "7qmPagj9A6RpkC0CwGkY",
        domain: "Process",
        stem: "A project manager is performing quantitative risk analysis on two response " +
            "strategies for a critical-path activity. Strategy A\u2014outsource the component\u2014has " +
            "a 60% probability of saving $50,000. Strategy B\u2014build an in-house production " +
            "line\u2014has a 30% probability of saving $120,000. Using expected monetary value " +
            "analysis, which strategy should the project manager recommend?",
        options: [
            "Outsource the component",
            "Build an in-house production line",
        ],
        correctAnswer: 1,
        scenarios: [
            { label: "Outsource the component", probability: 0.6, impact: 50000 },
            { label: "Build an in-house production line", probability: 0.3, impact: 120000 },
        ],
        correctLabel: "Build an in-house production line",
        explanation: "EMV(A) = 0.6 \u00d7 $50,000 = $30,000. EMV(B) = 0.3 \u00d7 $120,000 = $36,000. " +
            "Option B provides the higher expected monetary value. When comparing risk " +
            "response strategies, select the option with the highest expected value if " +
            "the organization is risk-neutral.",
        difficulty: "Medium",
    },
    {
        id: "emv-sample-002",
        type: "emv",
        examId: "7qmPagj9A6RpkC0CwGkY",
        domain: "Process",
        stem: "During quantitative risk analysis, a project manager identifies two positive " +
            "risks. Opportunity A has a 40% probability of generating $80,000 in additional " +
            "revenue. Opportunity B has a 70% probability of generating $40,000 in additional " +
            "revenue. Which opportunity has the higher expected monetary value?",
        options: [
            "Opportunity A",
            "Opportunity B",
        ],
        correctAnswer: 0,
        scenarios: [
            { label: "Opportunity A", probability: 0.4, impact: 80000 },
            { label: "Opportunity B", probability: 0.7, impact: 40000 },
        ],
        correctLabel: "Opportunity A",
        explanation: "EMV(A) = 0.4 \u00d7 $80,000 = $32,000. EMV(B) = 0.7 \u00d7 $40,000 = $28,000. " +
            "Opportunity A has the higher expected monetary value at $32,000. Even though " +
            "Opportunity B is more likely, its lower impact results in a smaller EMV.",
        difficulty: "Easy",
    },
    {
        id: "emv-sample-003",
        type: "emv",
        examId: "7qmPagj9A6RpkC0CwGkY",
        domain: "Process",
        stem: "A project manager is assessing two threats to a construction project. " +
            "Risk A\u2014foundation delay\u2014has a 25% probability with an estimated cost " +
            "impact of -$200,000. Risk B\u2014material shortage\u2014has a 50% probability " +
            "with an estimated cost impact of -$60,000. Which risk has the greater " +
            "negative expected monetary value?",
        options: [
            "Risk A (foundation delay)",
            "Risk B (material shortage)",
        ],
        correctAnswer: 0,
        scenarios: [
            { label: "Risk A (foundation delay)", probability: 0.25, impact: -200000 },
            { label: "Risk B (material shortage)", probability: 0.5, impact: -60000 },
        ],
        correctLabel: "Risk A (foundation delay)",
        explanation: "EMV(A) = 0.25 \u00d7 -$200,000 = -$50,000. EMV(B) = 0.5 \u00d7 -$60,000 = -$30,000. " +
            "Risk A has the greater negative EMV at -$50,000, meaning it represents " +
            "the larger expected loss. When prioritizing threats, address the risk with " +
            "the most negative EMV first.",
        difficulty: "Medium",
    },
    {
        id: "emv-sample-004",
        type: "emv",
        examId: "7qmPagj9A6RpkC0CwGkY",
        domain: "Process",
        stem: "A project team is evaluating three vendor proposals for a software integration. " +
            "Vendor X offers a solution with a 50% probability of saving $60,000. " +
            "Vendor Y offers a solution with a 30% probability of saving $150,000. " +
            "Vendor Z offers a solution with a 80% probability of saving $30,000. " +
            "Using EMV analysis, which vendor should the project manager select?",
        options: [
            "Vendor X",
            "Vendor Y",
            "Vendor Z",
        ],
        correctAnswer: 1,
        scenarios: [
            { label: "Vendor X", probability: 0.5, impact: 60000 },
            { label: "Vendor Y", probability: 0.3, impact: 150000 },
            { label: "Vendor Z", probability: 0.8, impact: 30000 },
        ],
        correctLabel: "Vendor Y",
        explanation: "EMV(X) = 0.5 \u00d7 $60,000 = $30,000. EMV(Y) = 0.3 \u00d7 $150,000 = $45,000. " +
            "EMV(Z) = 0.8 \u00d7 $30,000 = $24,000. Vendor Y has the highest EMV at $45,000. " +
            "When multiple options exist, calculate EMV for each and select the highest value, " +
            "assuming a risk-neutral decision framework.",
        difficulty: "Hard",
    },
    {
        id: "emv-sample-005",
        type: "emv",
        examId: "7qmPagj9A6RpkC0CwGkY",
        domain: "Process",
        stem: "A project manager must choose between two contract types for a procurement. " +
            "A fixed-price contract has a 70% probability of keeping costs at $500,000. " +
            "A time-and-materials contract has a 45% probability of completing at $400,000. " +
            "Based on expected monetary value, which contract type minimizes expected cost?",
        options: [
            "Fixed-price contract",
            "Time-and-materials contract",
        ],
        correctAnswer: 1,
        scenarios: [
            { label: "Fixed-price contract", probability: 0.7, impact: 500000 },
            { label: "Time-and-materials contract", probability: 0.45, impact: 400000 },
        ],
        correctLabel: "Time-and-materials contract",
        explanation: "EMV(Fixed-price) = 0.7 \u00d7 $500,000 = $350,000. " +
            "EMV(T&M) = 0.45 \u00d7 $400,000 = $180,000. " +
            "The time-and-materials contract has the lower expected cost at $180,000. " +
            "In procurement decisions, EMV helps compare contract options by weighting " +
            "probable cost outcomes.",
        difficulty: "Medium",
    },
    {
        id: "emv-sample-006",
        type: "emv",
        examId: "7qmPagj9A6RpkC0CwGkY",
        domain: "Process",
        stem: "An organization is deciding between two technology investments for a portfolio " +
            "of projects. Investment A\u2014cloud migration\u2014has a 55% probability of yielding " +
            "$90,000 in operational savings. Investment B\u2014on-premises upgrade\u2014has a 75% " +
            "probability of yielding $60,000 in operational savings. Which investment has " +
            "the higher expected monetary value?",
        options: [
            "Cloud migration",
            "On-premises upgrade",
        ],
        correctAnswer: 0,
        scenarios: [
            { label: "Cloud migration", probability: 0.55, impact: 90000 },
            { label: "On-premises upgrade", probability: 0.75, impact: 60000 },
        ],
        correctLabel: "Cloud migration",
        explanation: "EMV(Cloud) = 0.55 \u00d7 $90,000 = $49,500. " +
            "EMV(On-prem) = 0.75 \u00d7 $60,000 = $45,000. " +
            "Cloud migration has the higher EMV at $49,500. A higher probability does not " +
            "always mean a better expected outcome\u2014EMV accounts for both likelihood and " +
            "magnitude of the payoff.",
        difficulty: "Easy",
    },
    {
        id: "emv-sample-007",
        type: "emv",
        examId: "7qmPagj9A6RpkC0CwGkY",
        domain: "Process",
        stem: "A project manager is evaluating risk responses using a decision tree. " +
            "Response A\u2014accept the risk\u2014has a 20% probability of a -$300,000 impact " +
            "and an 80% probability of $0 impact. Response B\u2014mitigate the risk at a cost " +
            "of $40,000\u2014reduces the probability to 5% with the same -$300,000 impact " +
            "if it occurs. Comparing net EMV, which response should the project manager choose?",
        options: [
            "Accept the risk",
            "Mitigate the risk",
        ],
        correctAnswer: 1,
        scenarios: [
            { label: "Accept the risk", probability: 0.2, impact: -300000 },
            { label: "Mitigate the risk", probability: 0.05, impact: -300000 },
        ],
        correctLabel: "Mitigate the risk",
        explanation: "EMV(Accept) = 0.2 \u00d7 -$300,000 = -$60,000. " +
            "EMV(Mitigate) = 0.05 \u00d7 -$300,000 = -$15,000, plus the $40,000 mitigation " +
            "cost gives a net of -$55,000. Mitigation yields a better net outcome (-$55,000 " +
            "vs -$60,000). In decision-tree analysis, compare total expected costs including " +
            "the cost of the response itself.",
        difficulty: "Hard",
    },
];
async function main() {
    for (const q of EMV_QUESTIONS) {
        const docRef = db.collection("questions").doc(q.id);
        await docRef.set(q);
        console.log(`\u2714 Inserted "${q.id}"`);
    }
    console.log(`\nDone. ${EMV_QUESTIONS.length} EMV questions written.`);
}
main()
    .then(() => process.exit(0))
    .catch((err) => {
    console.error("Failed to insert EMV questions:", err);
    process.exit(1);
});
//# sourceMappingURL=addEmvQuestion.js.map