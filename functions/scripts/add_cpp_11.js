const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

const CPP_ID = 'Vs3aNmifAJc9bYRFCxXc';

// Only the 11 NEW questions to bring CPP from 89 → 100
const questions = [
    {
        examId: CPP_ID, type: 'mcq', domain: 'Compliance/Research and Resources',
        stem: 'Under the Uniform Services Employment and Reemployment Rights Act (USERRA), an employer must reemploy a returning service member within what timeframe after the employee reports back?',
        options: [
            'Promptly, generally within two weeks for service lasting 31–180 days, based on the duration of the military service period',
            'Within 90 calendar days regardless of the length of military service, providing a standard reemployment window for all returning veterans',
            'Within 6 months of the employee\'s discharge date, allowing the employer adequate time to restructure staffing and create a suitable position',
            'No specific timeframe is required under USERRA as long as the employer eventually offers a comparable position to the returning service member',
        ],
        correctAnswer: 0,
        explanation: 'USERRA requires prompt reemployment of returning service members. For service of 31–180 days, the employee must apply within 14 days and be promptly reemployed. For service over 180 days, the employee has 90 days to apply. The employee must be restored to the position they would have attained had they remained continuously employed (the "escalator" principle).',
        difficulty: 'Hard',
    },
    {
        examId: CPP_ID, type: 'mcq', domain: 'Compliance/Research and Resources',
        stem: 'An employer receives a federal tax levy (IRS Form 668-W) for an employee. Which statement about processing this levy is correct?',
        options: [
            'The employer withholds a flat 25% of disposable earnings, applying the same percentage limit that governs ordinary creditor garnishments under federal law',
            'The levy only applies to future wages and cannot attach to any wages already earned but not yet paid at the time the levy is received by the employer',
            'The employer must calculate the exempt amount using the employee\'s filing status and number of exemptions claimed on the levy form',
            'The employer must wait 30 calendar days before beginning to withhold, providing the employee time to negotiate a payment arrangement with the IRS',
        ],
        correctAnswer: 2,
        explanation: 'When processing an IRS levy (Form 668-W), the employer uses Publication 1494 to determine the exempt amount based on the employee\'s filing status and number of exemptions claimed on Part 3 of the levy. All earnings above the exempt amount must be remitted to the IRS. The levy is continuous and attaches to wages already earned but not yet paid. There is no 30-day waiting period.',
        difficulty: 'Medium',
    },
    {
        examId: CPP_ID, type: 'mcq', domain: 'Compliance/Research and Resources',
        stem: 'Under the Davis-Bacon Act, contractors on federal construction projects over $2,000 must pay workers at least:',
        options: [
            'The federal minimum wage of $7.25 per hour, which serves as the universal baseline compensation floor for all federally funded project work',
            'The locally prevailing wage and fringe benefit rates as determined by the U.S. Department of Labor for that geographic area',
            'A rate negotiated between the contractor and the labor union representing the workers on the specific federal construction project',
            'The state minimum wage rate, since state wage laws supersede all federal prevailing wage requirements on publicly funded construction contracts',
        ],
        correctAnswer: 1,
        explanation: 'The Davis-Bacon Act requires contractors and subcontractors on federal construction contracts over $2,000 to pay laborers and mechanics the locally prevailing wages and fringe benefits as determined by the Department of Labor. These rates often exceed the federal minimum wage and vary by trade classification and geographic location. Payroll professionals must ensure correct reporting on certified payroll (WH-347).',
        difficulty: 'Medium',
    },
    {
        examId: CPP_ID, type: 'mcq', domain: 'Compliance/Research and Resources',
        stem: 'Which federal law prohibits employers from terminating an employee solely because their wages have been garnished for any single indebtedness?',
        options: [
            'The Fair Debt Collection Practices Act (FDCPA), which regulates how third-party debt collectors communicate with debtors and their employers',
            'The Equal Pay Act (EPA), which addresses wage discrimination based on gender and prohibits adverse employment actions related to compensation disputes',
            'The Employee Retirement Income Security Act (ERISA), which governs fiduciary responsibilities and participant protections in employer-sponsored benefit plans',
            'Title III of the Consumer Credit Protection Act (CCPA), which provides employment protection for workers subject to wage garnishment orders',
        ],
        correctAnswer: 3,
        explanation: 'Title III of the CCPA (15 U.S.C. § 1674) prohibits an employer from discharging an employee because their earnings have been subject to garnishment for any single indebtedness. However, this protection does not extend to garnishments for a second or subsequent debt. Some states provide broader protections against discharge for multiple garnishments. Violations can result in fines and reinstatement.',
        difficulty: 'Easy',
    },
    {
        examId: CPP_ID, type: 'mcq', domain: 'Calculation of the Paycheck',
        stem: 'An employee who is paid biweekly has a dependent care FSA election of $5,000 per year. What is the per-pay-period pre-tax deduction?',
        options: [
            '$208.33 ($5,000 ÷ 24 pay periods), using the semimonthly pay frequency divisor to calculate each periodic deduction from the employee gross pay',
            '$192.31 ($5,000 ÷ 26 pay periods), reflecting the standard biweekly allocation for annual dependent care flexible spending account elections',
            '$416.67 ($5,000 ÷ 12 pay periods), applying a monthly frequency divisor that distributes the annual election evenly across twelve calendar months',
            '$250.00 ($5,000 ÷ 20 pay periods), based on a custom pay schedule that excludes holiday weeks and other non-standard payroll processing periods',
        ],
        correctAnswer: 1,
        explanation: 'Biweekly pay frequency means 26 pay periods per year (52 weeks ÷ 2). The dependent care FSA annual limit of $5,000 divided by 26 pay periods equals $192.31 per pay period. Common errors include using 24 (semimonthly) or 12 (monthly) as the divisor. The $5,000 limit applies per household regardless of pay frequency.',
        difficulty: 'Easy',
    },
    {
        examId: CPP_ID, type: 'mcq', domain: 'Calculation of the Paycheck',
        stem: 'An employee\'s Roth 401(k) contribution differs from a traditional pre-tax 401(k) contribution in that the Roth contribution:',
        options: [
            'Reduces both federal income tax and FICA tax withholding, providing a greater immediate tax benefit than the traditional pre-tax contribution',
            'Is excluded from Social Security and Medicare wages, lowering the employee\'s FICA tax obligation during the current contribution year',
            'Is deductible on the employee\'s personal tax return, allowing a dollar-for-dollar reduction in adjusted gross income at the time of filing',
            'Is made with after-tax dollars and does not reduce current federal or state income tax withholding on the employee\'s paycheck',
        ],
        correctAnswer: 3,
        explanation: 'Roth 401(k) contributions are made on an after-tax basis — they do not reduce current federal or state income tax withholding. However, qualified distributions in retirement are tax-free. In contrast, traditional pre-tax 401(k) contributions reduce current income tax but are taxed upon distribution. Both Roth and traditional 401(k) contributions remain subject to FICA taxes.',
        difficulty: 'Medium',
    },
    {
        examId: CPP_ID, type: 'mcq', domain: 'Calculation of the Paycheck',
        stem: 'When calculating the regular rate for an employee who receives a shift differential, the shift differential premium is:',
        options: [
            'Included in the regular rate calculation for determining overtime pay, because it is additional compensation for hours worked during a specific shift',
            'Excluded from the regular rate under FLSA because shift premiums are considered discretionary bonus payments at the sole discretion of management',
            'Added on top of overtime pay as a separate line item, paid at the full differential rate without being factored into the base overtime computation',
            'Only included if the shift differential exceeds 10% of the base hourly rate, as the FLSA provides a de minimis threshold for premium pay inclusions',
        ],
        correctAnswer: 0,
        explanation: 'Under the FLSA, shift differentials must be included in the regular rate of pay when calculating overtime. The regular rate encompasses all remuneration for employment, including shift premiums. For example, if an employee earns $20/hour plus a $3 shift differential and works 45 hours, the regular rate is ($20 × 45 + relevant differentials) ÷ 45, and overtime is 1.5× that rate for hours over 40.',
        difficulty: 'Medium',
    },
    {
        examId: CPP_ID, type: 'mcq', domain: 'Calculation of the Paycheck',
        stem: 'Under the IRS cents-per-mile valuation method for personal use of an employer-provided vehicle, the taxable fringe benefit is calculated by:',
        options: [
            'Using the vehicle\'s original purchase price divided by its expected useful life to determine an annual depreciation amount allocated to the employee',
            'Applying the Annual Lease Value table based on the vehicle\'s fair market value and then prorating for personal versus business usage days',
            'Multiplying the IRS standard mileage rate by the number of personal miles driven by the employee during the reporting period',
            'Subtracting the employee\'s commuting distance from total miles driven and multiplying the remainder by a flat per-mile reimbursement rate',
        ],
        correctAnswer: 2,
        explanation: 'The cents-per-mile method values personal use of an employer-provided vehicle by multiplying the IRS standard mileage rate by the total personal miles driven. This method is available only if the vehicle\'s fair market value does not exceed a specified limit (adjusted annually) and is regularly used in the employer\'s business. The employee must maintain adequate records of personal versus business mileage.',
        difficulty: 'Hard',
    },
    {
        examId: CPP_ID, type: 'mcq', domain: 'Core Payroll Concepts',
        stem: 'Under the Portal-to-Portal Act, which of the following travel activities is generally NOT compensable under the FLSA?',
        options: [
            'Travel between job sites during the workday when an employee is assigned to multiple locations by the employer during a single shift',
            'Travel from a hotel to a temporary worksite during an overnight out-of-town business assignment required by the employer',
            'Travel from the employer\'s primary office to a client location when the trip occurs during regular working hours as part of assigned duties',
            'An employee\'s ordinary daily commute from home to the regular fixed worksite using their personal vehicle under normal circumstances',
        ],
        correctAnswer: 3,
        explanation: 'The Portal-to-Portal Act (1947) amended the FLSA to exclude ordinary home-to-work commuting from compensable time. However, travel between job sites during the workday, travel during overnight business trips that occurs during regular working hours, and employer-directed travel to client sites are generally compensable. The key distinction is that normal commuting benefits the employee, while other travel benefits the employer.',
        difficulty: 'Medium',
    },
    {
        examId: CPP_ID, type: 'mcq', domain: 'Core Payroll Concepts',
        stem: 'Under IRC Section 3509, when an employer misclassifies an employee as an independent contractor, the employer\'s liability for federal employment taxes is:',
        options: [
            'Zero, because the worker already paid self-employment taxes on the income and therefore no additional employment tax obligation exists for the employer',
            'A reduced percentage of the income tax and FICA that should have been withheld, provided the employer filed required information returns',
            'The full amount of both the employee and employer share of FICA plus the full amount of income tax that should have been withheld from each payment',
            'A flat penalty of $500 per misclassified worker per quarter, assessed regardless of the total wages paid or the number of quarters the misclassification persisted',
        ],
        correctAnswer: 1,
        explanation: 'IRC Section 3509 provides reduced tax rates for employers who misclassify employees as independent contractors, if they filed required Forms 1099. The reduced rates are approximately 1.5% of wages for income tax (instead of full withholding) and 20% of the employee FICA share. If no 1099s were filed, the rates double. This relief does not apply to intentional misclassification cases.',
        difficulty: 'Easy',
    },
    {
        examId: CPP_ID, type: 'mcq', domain: 'Core Payroll Concepts',
        stem: 'A de minimis fringe benefit under IRC Section 132(a)(4) is excludable from an employee\'s income because:',
        options: [
            'It is provided equally to all employees regardless of position, meeting the nondiscrimination requirements that govern all employer-provided fringe benefits',
            'It is mandated by federal law as a required workplace benefit, and all legally required benefits are automatically excluded from taxable income',
            'Its value is so small that accounting for it would be unreasonable or administratively impractical for the employer to track and report',
            'It is funded entirely from the employee\'s after-tax payroll deductions, so the amount has already been included in the employee\'s gross taxable wages',
        ],
        correctAnswer: 2,
        explanation: 'Under IRC Section 132(a)(4), a de minimis fringe benefit is any property or service whose value is so small that accounting for it would be unreasonable or administratively impractical. Examples include occasional personal use of a company copier, holiday gifts of low value, occasional meal money, and local telephone calls. Cash and cash equivalents (gift cards) generally cannot be de minimis regardless of amount.',
        difficulty: 'Medium',
    },
];

function shuffleOptions(q) {
    const opts = [...q.options];
    const correctText = opts[q.correctAnswer];
    for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return { ...q, options: opts, correctAnswer: opts.indexOf(correctText) };
}

(async () => {
    const shuffled = questions.map(shuffleOptions);
    const batchSize = 500;
    for (let i = 0; i < shuffled.length; i += batchSize) {
        const batch = db.batch();
        shuffled.slice(i, i + batchSize).forEach(q => {
            const ref = db.collection('questions').doc();
            batch.set(ref, q);
        });
        await batch.commit();
    }
    console.log(`Added ${shuffled.length} NEW CPP questions (no deletions)`);
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
