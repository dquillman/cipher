const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

const PMP_ID = '7qmPagj9A6RpkC0CwGkY';

const questions = [
    // ===== Matching Questions (drag-and-drop style) =====
    {
        examId: PMP_ID,
        type: 'matching',
        domain: 'Process',
        stem: 'Match each project management process group to its primary purpose:',
        matchPairs: [
            { term: 'Initiating', definition: 'Authorize the project and define its initial scope and stakeholders' },
            { term: 'Planning', definition: 'Establish the detailed course of action to achieve project objectives' },
            { term: 'Executing', definition: 'Complete the work defined in the project management plan' },
            { term: 'Monitoring & Controlling', definition: 'Track, review, and regulate project progress and performance' },
            { term: 'Closing', definition: 'Formally complete or close the project, phase, or contract' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'The five process groups form the project management lifecycle. Initiating defines the project and obtains authorization. Planning creates the roadmap. Executing performs the work. Monitoring & Controlling measures performance against the plan. Closing formalizes completion and captures lessons learned.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID,
        type: 'matching',
        domain: 'People',
        stem: 'Match each leadership style to the situation where it is most effective:',
        matchPairs: [
            { term: 'Servant Leadership', definition: 'Empowering self-organizing agile teams by removing impediments' },
            { term: 'Transformational', definition: 'Inspiring the team to exceed expectations through shared vision' },
            { term: 'Transactional', definition: 'Using rewards and consequences to motivate routine task completion' },
            { term: 'Laissez-faire', definition: 'Allowing highly experienced teams to work with minimal direction' },
            { term: 'Situational', definition: 'Adapting style based on the team\'s maturity and the task at hand' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Servant leadership is the preferred agile approach — leaders serve the team. Transformational leaders inspire change and innovation. Transactional leadership uses clear rewards/penalties for defined tasks. Laissez-faire works for expert teams needing autonomy. Situational leadership adapts to the team\'s development level, using directing, coaching, supporting, or delegating as needed.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID,
        type: 'matching',
        domain: 'Process',
        stem: 'Match each risk response strategy to its description for negative risks (threats):',
        matchPairs: [
            { term: 'Avoid', definition: 'Eliminate the threat by changing the project plan' },
            { term: 'Mitigate', definition: 'Reduce the probability or impact of the threat' },
            { term: 'Transfer', definition: 'Shift the negative impact to a third party (e.g., insurance)' },
            { term: 'Accept', definition: 'Acknowledge the risk without proactive action' },
            { term: 'Escalate', definition: 'Move the risk to a higher authority outside the project\'s control' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'The five threat response strategies differ in approach: Avoid changes the plan to eliminate the risk entirely. Mitigate reduces likelihood or impact through actions like prototyping or adding resources. Transfer shifts financial impact via contracts or insurance. Accept either passively acknowledges or sets aside a contingency reserve. Escalate moves risks beyond the PM\'s authority to program or portfolio level.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID,
        type: 'matching',
        domain: 'Process',
        stem: 'Match each agile artifact to its purpose:',
        matchPairs: [
            { term: 'Product Backlog', definition: 'Ordered list of everything needed in the product, owned by the product owner' },
            { term: 'Sprint Backlog', definition: 'Set of items selected for the sprint plus the plan for delivering them' },
            { term: 'Product Increment', definition: 'The sum of all completed backlog items that meets the Definition of Done' },
            { term: 'Burn-down Chart', definition: 'Visual display of remaining work versus time in a sprint or release' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Agile artifacts provide transparency. The product backlog is the single source of requirements, continuously refined and reprioritized by the PO. The sprint backlog is the team\'s plan for the current iteration. The increment is the working, potentially releasable output. Burn-down charts visualize progress toward sprint or release completion.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID,
        type: 'matching',
        domain: 'Process',
        stem: 'Match each Earned Value metric to what it measures:',
        matchPairs: [
            { term: 'Planned Value (PV)', definition: 'The authorized budget assigned to scheduled work' },
            { term: 'Earned Value (EV)', definition: 'The value of work actually performed expressed in budget terms' },
            { term: 'Actual Cost (AC)', definition: 'The total cost incurred for work performed to date' },
            { term: 'Schedule Variance (SV)', definition: 'EV − PV: negative means behind schedule' },
            { term: 'Cost Variance (CV)', definition: 'EV − AC: negative means over budget' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'EVM provides objective project performance measurement. PV is the planned spend by now. EV is the value of completed work. AC is actual spend. SV = EV − PV measures schedule performance (positive = ahead). CV = EV − AC measures cost performance (positive = under budget). These feed into CPI and SPI for trend analysis and forecasting.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID,
        type: 'matching',
        domain: 'People',
        stem: 'Match each Tuckman team development stage to its characteristic:',
        matchPairs: [
            { term: 'Forming', definition: 'Team members are polite, cautious, and dependent on the leader for direction' },
            { term: 'Storming', definition: 'Conflicts emerge as members assert different ideas and challenge authority' },
            { term: 'Norming', definition: 'Trust develops, working agreements are established, and collaboration improves' },
            { term: 'Performing', definition: 'The team operates autonomously with high productivity and mutual accountability' },
            { term: 'Adjourning', definition: 'The team disbands after completing the project and celebrates achievements' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Tuckman\'s model describes predictable team development stages. Forming is the orientation phase. Storming involves conflict (which is healthy and necessary). Norming sees the team establishing shared norms. Performing is peak effectiveness. Adjourning (added later) is the dissolution phase. PMs should recognize each stage and adjust their leadership style accordingly.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID,
        type: 'matching',
        domain: 'Business Environment',
        stem: 'Match each organizational structure to its project manager authority level:',
        matchPairs: [
            { term: 'Functional', definition: 'PM has little or no formal authority; functional manager controls resources' },
            { term: 'Weak Matrix', definition: 'PM has limited authority; acts more as a coordinator or expediter' },
            { term: 'Balanced Matrix', definition: 'PM shares authority equally with functional managers' },
            { term: 'Strong Matrix', definition: 'PM has significant authority and a full-time role; functional support is secondary' },
            { term: 'Projectized', definition: 'PM has full authority over the project team and budget' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Organizational structure directly impacts PM authority. In functional organizations, the PM has minimal power. Matrix structures range from weak (coordinator) to balanced (shared power) to strong (PM dominant). Projectized organizations give the PM full authority over team, budget, and decisions. Understanding this spectrum helps PMs navigate resource acquisition and decision-making.',
        difficulty: 'Medium',
    },

    // ===== EMV (Expected Monetary Value) Questions =====
    {
        examId: PMP_ID,
        type: 'emv',
        domain: 'Process',
        stem: 'A project team has identified a risk that could affect the project budget. Calculate the Expected Monetary Value (EMV) for each scenario to determine which requires the largest contingency reserve:',
        scenarios: [
            { label: 'Server hardware failure', probability: 0.3, impact: -50000 },
            { label: 'Vendor delivers early', probability: 0.2, impact: 20000 },
            { label: 'Key developer leaves mid-project', probability: 0.15, impact: -80000 },
            { label: 'Requirements change reduces scope', probability: 0.4, impact: 15000 },
        ],
        correctLabel: 'Server hardware failure',
        options: [],
        correctAnswer: 0,
        explanation: 'EMV = Probability × Impact. Server failure: 0.3 × -$50,000 = -$15,000. Vendor early: 0.2 × $20,000 = +$4,000. Developer leaves: 0.15 × -$80,000 = -$12,000. Scope reduction: 0.4 × $15,000 = +$6,000. The server hardware failure has the largest negative EMV (-$15,000), requiring the largest contingency reserve.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID,
        type: 'emv',
        domain: 'Process',
        stem: 'A construction project faces weather-related risks. Calculate the EMV for each scenario to determine the overall risk exposure:',
        scenarios: [
            { label: 'Heavy rain delays foundation work', probability: 0.4, impact: -30000 },
            { label: 'Material costs increase due to shortage', probability: 0.25, impact: -60000 },
            { label: 'Favorable weather allows early completion', probability: 0.3, impact: 25000 },
            { label: 'Subcontractor goes bankrupt', probability: 0.05, impact: -200000 },
        ],
        correctLabel: 'Material costs increase due to shortage',
        options: [],
        correctAnswer: 0,
        explanation: 'EMV = Probability × Impact. Rain delays: 0.4 × -$30,000 = -$12,000. Material shortage: 0.25 × -$60,000 = -$15,000. Early completion: 0.3 × $25,000 = +$7,500. Subcontractor bankruptcy: 0.05 × -$200,000 = -$10,000. Material cost increase has the largest negative EMV (-$15,000). Total risk exposure: -$12,000 + -$15,000 + $7,500 + -$10,000 = -$29,500.',
        difficulty: 'Hard',
    },
    {
        examId: PMP_ID,
        type: 'emv',
        domain: 'Process',
        stem: 'A software migration project has identified these risk events. Use EMV analysis to determine which risk the team should prioritize:',
        scenarios: [
            { label: 'Data corruption during migration', probability: 0.1, impact: -150000 },
            { label: 'User adoption slower than planned', probability: 0.5, impact: -20000 },
            { label: 'Legacy system outage extends timeline', probability: 0.35, impact: -40000 },
            { label: 'New system performs better than expected', probability: 0.6, impact: 10000 },
        ],
        correctLabel: 'Data corruption during migration',
        options: [],
        correctAnswer: 0,
        explanation: 'EMV = Probability × Impact. Data corruption: 0.1 × -$150,000 = -$15,000. Slow adoption: 0.5 × -$20,000 = -$10,000. Legacy outage: 0.35 × -$40,000 = -$14,000. Better performance: 0.6 × $10,000 = +$6,000. Data corruption has the largest negative EMV (-$15,000), though legacy outage is close (-$14,000). Prioritize data corruption mitigation first.',
        difficulty: 'Medium',
    },
];

async function main() {
    console.log(`Seeding ${questions.length} PMP mixed-type questions...`);

    const batch = db.batch();
    for (const q of questions) {
        const ref = db.collection('questions').doc();
        batch.set(ref, {
            ...q,
            isPublished: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'seed-pmp-mixed-v1',
        });
        const typeLabel = q.type.toUpperCase();
        console.log(`  + [${typeLabel}] ${q.domain} | ${q.stem.substring(0, 55)}...`);
    }

    await batch.commit();
    console.log(`\nDone! ${questions.length} PMP questions added (7 matching, 3 EMV).`);
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
