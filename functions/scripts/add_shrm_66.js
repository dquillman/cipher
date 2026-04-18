const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

const SHRM_CP_ID = 'bpfawZDj3qalhoU4mdd3';

// Only the 66 NEW questions (no deletions)
const questions = [
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'A hiring manager insists on asking female candidates about their childcare arrangements during interviews. What should the HR professional advise?',
        options: [
            'Discontinue the question immediately because it constitutes potential sex discrimination under Title VII of the Civil Rights Act',
            'Allow the question only if male candidates are also asked about their childcare arrangements during the same round of interviews',
            'Permit the question as long as the hiring manager documents a legitimate business reason for asking about dependent care obligations',
            'Replace the childcare question with a general inquiry about the candidate\'s marital status to gather similar planning information',
        ],
        correctAnswer: 0,
        explanation: 'Questions about childcare disproportionately affect women and can constitute sex discrimination under Title VII. Even asking both genders does not make the question job-related. Marital status questions are similarly problematic under state and local laws. Interview questions must be job-related and consistent with business necessity per SHRM BASK guidelines on lawful selection practices.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An organization wants to improve its employer brand to attract passive candidates. Which tactic is most likely to produce measurable results?',
        options: [
            'Posting the same generic job description across all job boards without tailoring the content to specific candidate audiences',
            'Developing employee testimonial content and showcasing company culture across social media and career pages consistently',
            'Increasing recruiter headcount by 50% to expand outreach volume without changing the messaging or employer value proposition',
            'Eliminating the careers page from the website and relying exclusively on third-party recruiters to present the employer brand',
        ],
        correctAnswer: 1,
        explanation: 'Passive candidates evaluate employer brand through authentic content — employee testimonials, culture showcases, and social media presence convey what it is like to work at the organization. Generic postings fail to differentiate. Adding recruiters without improving messaging does not enhance brand. Removing the careers page surrenders control of the narrative. SHRM BASK emphasizes employer branding as a strategic talent acquisition lever.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Under the Immigration and Nationality Act (INA), employers must complete Form I-9 for new hires within what timeframe?',
        options: [
            'Within 30 calendar days of the employee\'s first day of work for pay to allow sufficient time for document verification',
            'Before the job offer is extended to ensure the candidate is authorized to work in the United States legally',
            'Within three business days of the employee\'s first day of work for pay as required by federal employment law',
            'Within 90 calendar days of the employee\'s start date, coinciding with the standard probationary employment period',
        ],
        correctAnswer: 2,
        explanation: 'The INA requires employers to complete Section 2 of Form I-9 within three business days of the employee\'s first day of work for pay. Section 1 must be completed by the employee on or before the first day. Completing it before the offer or waiting 30 or 90 days violates federal law. Employers who fail to comply face civil and criminal penalties.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'A company uses a pre-employment cognitive ability test that results in adverse impact against a protected group. Under the Uniform Guidelines on Employee Selection Procedures, the employer must:',
        options: [
            'Continue using the test without modification since cognitive ability tests are always considered valid selection instruments',
            'Eliminate all testing from the selection process and rely solely on unstructured interviews to evaluate candidate qualifications',
            'Demonstrate that the test is job-related and consistent with business necessity, or adopt an alternative with less adverse impact',
            'Lower the passing score only for the affected protected group to eliminate the statistical disparity in test outcomes',
        ],
        correctAnswer: 2,
        explanation: 'The Uniform Guidelines require that when a selection procedure causes adverse impact (using the four-fifths rule), the employer must demonstrate validity — that the test is job-related and consistent with business necessity. Alternatively, employers should seek equally valid alternatives with less adverse impact. Differential scoring violates Title VII. Eliminating all testing is unnecessary if validity can be shown.',
        difficulty: 'Hard',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Which of the following best describes a realistic job preview (RJP) and its primary purpose in the recruitment process?',
        options: [
            'A marketing-focused recruitment video that highlights only the positive aspects of the job to maximize candidate interest',
            'A detailed salary negotiation session conducted before the formal offer to align compensation expectations early',
            'An honest presentation of both positive and challenging aspects of the job to help candidates self-select appropriately',
            'A final-round interview technique where candidates are asked to solve hypothetical problems unrelated to the role',
        ],
        correctAnswer: 2,
        explanation: 'A realistic job preview presents both the attractive and challenging aspects of a position, allowing candidates to make informed decisions about fit. RJPs reduce early turnover by setting accurate expectations. Marketing-only approaches lead to expectation mismatches. Salary negotiation and problem-solving exercises serve different purposes. SHRM BASK identifies RJPs as an evidence-based retention tool.',
        difficulty: 'Easy',
    },

    // ===== HR Knowledge Domains — People: Employee Engagement & Retention (Q6–Q9) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Research on employee engagement consistently shows that the strongest driver of day-to-day engagement is:',
        options: [
            'The organization\'s stock price performance and quarterly financial results communicated to all employees at town hall meetings',
            'The size and location of the employee\'s physical workspace including office square footage and proximity to windows',
            'The number of company-sponsored social events and team-building activities offered throughout the calendar year',
            'The quality of the relationship between the employee and their immediate supervisor or direct manager in the workplace',
        ],
        correctAnswer: 3,
        explanation: 'Decades of engagement research (Gallup, SHRM) consistently identify the manager-employee relationship as the strongest driver of daily engagement. Managers influence recognition, development, feedback, and psychological safety. Stock performance, social events, and workspace design matter but are secondary. SHRM BASK emphasizes developing people managers as a key engagement strategy.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An organization\'s voluntary turnover rate has increased sharply among employees with two to five years of tenure. Which retention strategy most directly targets this population?',
        options: [
            'Implementing a sign-on bonus program for all new hires to improve the initial employment value proposition and attract talent',
            'Mandating that all employees with fewer than five years of tenure attend weekly motivational speakers and team rallies',
            'Increasing the employer match in the retirement plan, which primarily benefits employees closer to the end of their careers',
            'Creating clear career pathing with development opportunities and milestone-based retention incentives for mid-tenure employees',
        ],
        correctAnswer: 3,
        explanation: 'Employees at the two-to-five-year mark typically leave because they do not see a clear path forward. Career pathing, development opportunities, and milestone incentives address the root cause — stagnation. Sign-on bonuses target new hires. Retirement matches appeal to longer-tenured workers. Mandatory motivational events do not address career growth needs and may feel patronizing.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'A stay interview differs from an exit interview primarily because it:',
        options: [
            'Is conducted by an external consultant rather than an internal HR professional to ensure objectivity and candid responses',
            'Focuses on understanding what keeps current employees engaged and what might cause them to leave before they resign',
            'Uses a standardized written questionnaire that employees complete anonymously online during their annual review period',
            'Is required by federal employment law for organizations with more than 50 employees to document retention efforts',
        ],
        correctAnswer: 1,
        explanation: 'Stay interviews are proactive, one-on-one conversations with current employees to understand engagement drivers, satisfaction levels, and potential flight risks before resignation occurs. Exit interviews are reactive — conducted after the decision to leave. Stay interviews are not legally required, not necessarily anonymous questionnaires, and can be conducted by any trained manager or HR professional.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An HR professional is designing a recognition program. Which approach is most consistent with motivation theory and best practice?',
        options: [
            'Providing only annual bonuses tied to company-wide financial targets, distributed equally to all employees regardless of contribution',
            'Limiting recognition to monetary rewards because non-financial acknowledgment has no measurable impact on employee motivation',
            'Offering timely, specific recognition that includes both monetary and non-monetary elements aligned with individual preferences',
            'Recognizing only top performers publicly to create competitive pressure that motivates average and low performers to improve',
        ],
        correctAnswer: 2,
        explanation: 'Effective recognition is timely (close to the behavior), specific (identifies what the employee did well), and varied (monetary and non-monetary options accommodate different preferences). Annual-only bonuses are too infrequent. Non-monetary recognition is well-supported by research. Public recognition of only top performers can demoralize the majority. SHRM BASK recommends multi-faceted total rewards approaches.',
        difficulty: 'Medium',
    },

    // ===== HR Knowledge Domains — People: L&D (Q10–Q12) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Kirkpatrick\'s four-level model evaluates training effectiveness. Which level measures whether participants actually changed their on-the-job behavior after training?',
        options: [
            'Level 1 — Reaction, which measures participant satisfaction and perceived relevance of the training program content',
            'Level 2 — Learning, which assesses whether participants acquired the intended knowledge and skills during the program',
            'Level 3 — Behavior, which evaluates whether participants applied the learned skills and knowledge in their work setting',
            'Level 4 — Results, which measures the training program\'s impact on organizational outcomes such as productivity and quality',
        ],
        correctAnswer: 2,
        explanation: 'Level 3 (Behavior) assesses transfer of training — whether participants actually apply new skills on the job. Level 1 (Reaction) measures satisfaction. Level 2 (Learning) measures knowledge acquisition during training. Level 4 (Results) measures business impact. Most organizations measure Levels 1 and 2 but fail to evaluate Levels 3 and 4, which demonstrate true training effectiveness.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An organization wants to develop a mentoring program to accelerate leadership development. Which design element is most critical to program success?',
        options: [
            'Pairing mentors and mentees based on clear developmental goals and providing structure through regular meeting cadences',
            'Assigning mentors randomly from the company directory without considering expertise alignment or interpersonal compatibility',
            'Restricting mentoring relationships to same-department pairings to ensure mentors fully understand the mentee\'s daily work',
            'Making participation mandatory for all employees regardless of career stage, interest level, or developmental readiness',
        ],
        correctAnswer: 0,
        explanation: 'Successful mentoring programs require intentional pairing based on developmental goals, structured expectations (meeting frequency, topics), and mutual commitment. Random pairing ignores fit. Same-department restriction limits cross-functional perspective. Mandatory participation undermines the voluntary relationship that makes mentoring effective. SHRM BASK identifies structured mentoring as a key leadership development tool.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'The 70-20-10 model of learning and development suggests that the largest portion of professional learning comes from:',
        options: [
            'Formal classroom training programs and structured e-learning courses delivered through the organization\'s learning management system',
            'On-the-job experiences such as stretch assignments, cross-functional projects, and challenging work responsibilities',
            'Social learning through coaching, mentoring, peer feedback, and observing colleagues in the daily work environment',
            'Self-directed reading of textbooks, industry publications, and professional development materials outside of work hours',
        ],
        correctAnswer: 1,
        explanation: 'The 70-20-10 model holds that 70% of learning comes from on-the-job experiences (stretch assignments, projects), 20% from social learning (coaching, mentoring, feedback), and 10% from formal training (courses, workshops). This framework guides L&D investment toward experiential and social learning while maintaining formal training as a foundation. Self-directed reading falls into the 10% formal category.',
        difficulty: 'Easy',
    },

    // ===== HR Knowledge Domains — People: Total Rewards (Q13–Q15) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Under COBRA, a qualifying event that triggers continuation coverage rights for a spouse includes:',
        options: [
            'The covered employee\'s voluntary termination of employment for any reason other than gross misconduct as defined by the employer',
            'The covered employee receiving a promotion that results in a change of health plan options available at the new job level',
            'The covered employee\'s divorce or legal separation from the spouse who was enrolled in the group health plan',
            'The covered employee switching from a PPO plan to an HMO plan during the organization\'s annual open enrollment period',
        ],
        correctAnswer: 2,
        explanation: 'COBRA qualifying events for spouses include the covered employee\'s death, termination or reduction in hours, divorce or legal separation, the employee becoming entitled to Medicare, or a dependent child losing eligibility. Promotions and plan switches during open enrollment are not qualifying events. Termination is a qualifying event for the employee, but divorce specifically triggers spousal rights.',
        difficulty: 'Hard',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'A compa-ratio of 1.15 for an employee indicates that the employee:',
        options: [
            'Is paid 15% below the midpoint of their salary range, suggesting the employee may be underpaid relative to the position',
            'Is paid exactly at the midpoint of their salary range, which is the target compensation level for a fully competent performer',
            'Is paid 15% above the midpoint of their salary range, which may indicate tenure, strong performance, or pay compression issues',
            'Has received a 15% salary increase in the current fiscal year relative to their base pay at the beginning of the period',
        ],
        correctAnswer: 2,
        explanation: 'Compa-ratio (comparison ratio) is calculated as actual salary divided by range midpoint. A compa-ratio of 1.15 means the employee earns 115% of midpoint — 15% above. This may reflect long tenure, exceptional performance, or pay compression. A ratio of 0.85 would be 15% below midpoint. A ratio of 1.00 is exactly at midpoint. It does not measure annual increases.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Which compensation strategy involves setting pay rates above the market average to attract and retain top talent?',
        options: [
            'A lag strategy that intentionally sets pay below the current market rate and adjusts compensation only after market surveys confirm movement',
            'A cost-of-living adjustment (COLA) that increases all salaries by the annual inflation rate regardless of market positioning',
            'A match strategy that targets the 50th percentile of market data to pay competitively without overspending on labor costs',
            'A lead strategy that positions pay rates above the prevailing market average to gain a competitive advantage in talent acquisition',
        ],
        correctAnswer: 3,
        explanation: 'A lead compensation strategy sets pay above market rates (e.g., 75th percentile) to attract top talent and reduce turnover. A lag strategy pays below market and adjusts later. A match strategy targets market median. COLA addresses inflation, not competitive positioning. Organizations choose their strategy based on talent needs, labor market conditions, and budget. SHRM BASK covers all three positioning strategies.',
        difficulty: 'Easy',
    },

    // ===== HR Knowledge Domains — People: Diversity & Inclusion, Global Context (Q16–Q18) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An employee requests a religious accommodation to modify the standard work uniform. Under Title VII, the employer must:',
        options: [
            'Deny the request automatically because uniform policies must be applied equally to all employees without any exceptions',
            'Grant the accommodation only if the employee\'s religion is one of the major world religions specifically enumerated in Title VII',
            'Require the employee to provide a letter from a recognized religious authority certifying the sincerity of the religious belief',
            'Provide a reasonable accommodation unless doing so would cause undue hardship on the conduct of the employer\'s business',
        ],
        correctAnswer: 3,
        explanation: 'Title VII requires employers to reasonably accommodate an employee\'s sincerely held religious beliefs unless it causes undue hardship. The 2023 Groff v. DeJoy decision raised the undue hardship standard to "substantial increased costs." Blanket denial violates the law. Employers cannot require clergy letters or limit protection to major religions — sincerely held beliefs of all kinds are protected.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'When managing a globally distributed workforce, which factor creates the greatest compliance risk for HR professionals?',
        options: [
            'Differences in time zones affecting meeting schedules across global offices and regional headquarters in different countries',
            'Currency exchange rate fluctuations that affect the conversion of payroll amounts between the home and host country',
            'Preferences for different communication platforms such as email, instant messaging, or video conferencing tools across regions',
            'Varying national employment laws regarding termination, data privacy, benefits mandates, and employee representation requirements',
        ],
        correctAnswer: 3,
        explanation: 'National employment laws vary dramatically — termination protections, data privacy regulations (GDPR in EU), mandatory benefits, works councils, and notice periods all create compliance risk if HR applies home-country standards globally. Time zones and communication preferences are operational challenges, not legal risks. Currency fluctuations are financial, not compliance, concerns. SHRM BASK emphasizes understanding local legal frameworks.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An organization wants to create employee resource groups (ERGs) to support diversity and inclusion. Which best practice should guide the program design?',
        options: [
            'Restrict ERG membership exclusively to members of the identity group the ERG represents to maintain group authenticity and focus',
            'Open ERG membership to all interested employees while centering the experiences of the identity group the ERG serves',
            'Fund ERGs only through voluntary employee payroll deductions to ensure the groups are self-sustaining and employee-driven',
            'Require every employee to join at least one ERG as a condition of employment to demonstrate organizational commitment to inclusion',
        ],
        correctAnswer: 1,
        explanation: 'Best practice is to open ERGs to all employees as allies while centering the identity group\'s experiences. This promotes inclusion and cross-group understanding. Restricting membership can create exclusion and may raise legal concerns. Mandatory participation undermines authenticity. ERGs should receive organizational funding and executive sponsorship to signal institutional support. SHRM BASK recommends ERGs as a strategic D&I tool.',
        difficulty: 'Medium',
    },

    // ===== HR Knowledge Domains — Organization: Structure & Technology (Q19–Q22) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'A matrix organizational structure creates which unique HR challenge?',
        options: [
            'Employees report to a single supervisor, which simplifies performance reviews but limits exposure to cross-functional perspectives',
            'All departments operate independently with no cross-functional interaction, which requires HR to maintain separate policies for each unit',
            'Decision-making is completely decentralized to individual contributors, eliminating the need for any management oversight or coordination',
            'Employees may have dual reporting relationships, creating potential conflicts in goal-setting, performance evaluation, and resource allocation',
        ],
        correctAnswer: 3,
        explanation: 'Matrix structures assign employees to both a functional manager and a project or product manager, creating dual reporting. This complicates performance management (who evaluates?), goal alignment (competing priorities), and resource allocation (whose work takes priority?). Single reporting is a traditional hierarchy. Complete decentralization and departmental independence are not matrix characteristics.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An organization is considering implementing people analytics. Which ethical concern should HR address first?',
        options: [
            'Whether the analytics software integrates with the existing payroll system to minimize implementation costs and technical complexity',
            'Employee data privacy, informed consent, and transparency about how workforce data will be collected, used, and protected',
            'Whether the analytics vendor offers a free trial period so the organization can test the platform before making a commitment',
            'The visual design of the analytics dashboards to ensure they are appealing and easy to present to executive leadership',
        ],
        correctAnswer: 1,
        explanation: 'People analytics raises significant ethical concerns around data privacy, consent, and transparency. Employees must understand what data is collected, how it is used, and how it is protected. Regulations like GDPR impose strict requirements. System integration, dashboard design, and vendor pricing are practical concerns but are secondary to ethical obligations. SHRM BASK emphasizes ethical data stewardship.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Which HR technology application would most effectively reduce administrative burden while improving the employee experience?',
        options: [
            'A manual paper-based time tracking system that requires employees to submit physical timesheets to HR for processing each week',
            'A shared spreadsheet maintained by HR coordinators that tracks employee requests and is emailed to managers on a weekly basis',
            'A locked filing cabinet system that stores all employee documents in a secure physical location accessible only to the HR team',
            'An employee self-service portal that allows staff to update personal information, access pay stubs, and request time off',
        ],
        correctAnswer: 3,
        explanation: 'Employee self-service portals empower employees to manage routine tasks (address changes, pay stubs, PTO requests) without HR intervention, reducing administrative workload while improving responsiveness and employee satisfaction. Paper systems, filing cabinets, and shared spreadsheets are manual processes that increase errors and delays. SHRM BASK identifies HR technology as a lever for both efficiency and experience.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Organizational effectiveness is best measured by examining:',
        options: [
            'Only the number of HR policies currently documented in the employee handbook and compliance filing systems of the organization',
            'The alignment between strategic goals, operational performance, employee engagement, and customer satisfaction across the enterprise',
            'The number of meetings held per week across all departments as a proxy for internal communication and collaboration frequency',
            'The total square footage of office space the organization occupies relative to its number of full-time equivalent employees',
        ],
        correctAnswer: 1,
        explanation: 'Organizational effectiveness is a multidimensional concept encompassing strategic alignment, operational performance, employee engagement, and stakeholder satisfaction. No single metric captures it. Policy counts measure documentation, not effectiveness. Office space and meeting frequency are input measures, not outcome measures. SHRM BASK recommends a balanced scorecard approach to assessing organizational health.',
        difficulty: 'Easy',
    },

    // ===== HR Knowledge Domains — Workplace: Employment Law (Q23–Q28) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'The Age Discrimination in Employment Act (ADEA) protects employees who are:',
        options: [
            '18 years of age or older from any form of age-related employment discrimination, covering all adult workers in the labor market',
            '40 years of age or older from employment discrimination based on age in hiring, promotion, termination, and other employment decisions',
            '65 years of age or older who wish to continue working past the traditional retirement age set by their employer\'s pension plan',
            '55 years of age or older and within 10 years of the standard retirement age established by Social Security Administration guidelines',
        ],
        correctAnswer: 1,
        explanation: 'The ADEA protects individuals aged 40 and older from employment discrimination based on age. It applies to employers with 20 or more employees and covers hiring, firing, promotion, compensation, and other terms of employment. It does not protect workers under 40 and is not limited to those near retirement age. The Older Workers Benefit Protection Act (OWBPA) supplements the ADEA for benefit plans.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An employee with a documented disability requests to work from home two days per week as a reasonable accommodation under the ADA. The employer should:',
        options: [
            'Deny the request automatically because the ADA does not cover remote work arrangements as a category of reasonable accommodation',
            'Require the employee to exhaust all available FMLA leave before considering any ADA accommodation request for modified work arrangements',
            'Grant the request immediately without any discussion, documentation, or assessment of whether the job functions can be performed remotely',
            'Engage in an interactive process with the employee to determine whether the accommodation is reasonable and effective for the role',
        ],
        correctAnswer: 3,
        explanation: 'The ADA requires employers to engage in an interactive process to identify reasonable accommodations. Remote work can be a reasonable accommodation if the essential functions can be performed remotely. Automatic denial is unlawful. Granting without assessment may set problematic precedents. FMLA and ADA are separate statutes — FMLA leave is not a prerequisite for ADA accommodation. The EEOC has affirmed telework as a possible accommodation.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An employer discovers that a salaried exempt employee has been docked pay for a partial-day absence. Under the FLSA, this practice:',
        options: [
            'Is permitted as long as the deduction is proportional to the number of hours missed and properly documented in payroll records',
            'Only applies to employees earning below the FLSA salary threshold and has no effect on the exempt classification of higher-paid workers',
            'May jeopardize the employee\'s exempt status because exempt employees must generally be paid their full salary for any week in which they work',
            'Is required by federal law to ensure accurate tracking of all hours worked and maintain compliance with wage and hour regulations',
        ],
        correctAnswer: 2,
        explanation: 'Under the FLSA salary basis test, exempt employees must receive their full predetermined salary for any workweek in which they perform any work. Improper deductions for partial-day absences can destroy the salary basis and jeopardize the exemption — potentially making the employee (and similarly situated employees) eligible for overtime. Permissible deductions are narrowly defined (full-day personal absence, FMLA, etc.).',
        difficulty: 'Hard',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Under the Genetic Information Nondiscrimination Act (GINA), which of the following is prohibited?',
        options: [
            'Requiring employees to complete an annual health risk assessment that asks only about current lifestyle habits such as exercise and diet',
            'Conducting a job-related physical examination after a conditional offer of employment has been made to the candidate in writing',
            'Offering a voluntary wellness program that provides general health education materials and fitness resources to all participating employees',
            'Using an employee\'s family medical history to make decisions about hiring, promotion, job assignments, or termination of employment',
        ],
        correctAnswer: 3,
        explanation: 'GINA prohibits the use of genetic information — including family medical history — in employment decisions. It also restricts employers from requesting, requiring, or purchasing genetic information. Health risk assessments about current lifestyle are generally permissible. Voluntary wellness programs offering general health education are allowed. Post-offer physicals are permitted under the ADA. GINA protects against genetic discrimination in both employment and health insurance.',
        difficulty: 'Hard',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An employer terminates an employee one week after the employee filed a workers\' compensation claim. The employee alleges retaliation. What is the employer\'s greatest legal risk?',
        options: [
            'The close timing between the protected activity and the adverse action creates a strong inference of retaliatory motive in court',
            'Workers\' compensation claims automatically protect employees from termination for a minimum period of two years under federal law',
            'The employer will be required to reinstate the employee immediately with full back pay regardless of the circumstances of the termination',
            'The employer\'s workers\' compensation insurance premiums will be permanently revoked by the state insurance commission as a penalty',
        ],
        correctAnswer: 0,
        explanation: 'Temporal proximity between a protected activity (filing a workers\' comp claim) and an adverse action (termination) creates a strong inference of retaliation. While timing alone may not prove retaliation, it shifts the burden to the employer to show a legitimate, non-retaliatory reason. There is no automatic two-year protection, no automatic reinstatement, and no premium revocation penalty. Anti-retaliation protections are governed by state workers\' comp statutes.',
        difficulty: 'Hard',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'The Equal Pay Act requires that men and women performing substantially equal work receive equal pay unless the difference is based on:',
        options: [
            'A seniority system, a merit system, a system measuring quantity or quality of production, or any factor other than sex',
            'The hiring manager\'s subjective assessment of each candidate\'s negotiation skills demonstrated during the initial offer discussion',
            'The employee\'s prior salary history at their previous employer, which establishes the market rate for that individual worker',
            'The demographic composition of the department, allowing pay differences when the team already meets gender diversity targets',
        ],
        correctAnswer: 0,
        explanation: 'The Equal Pay Act of 1963 permits pay differences between men and women doing substantially equal work only when based on four affirmative defenses: seniority, merit, quantity/quality of production, or any factor other than sex. Subjective negotiation assessments may perpetuate existing disparities. Many states now prohibit using salary history. Demographic composition is not a legitimate pay factor.',
        difficulty: 'Medium',
    },

    // ===== HR Knowledge Domains — Workplace: Health, Safety & Security (Q29–Q32) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An employee reports feeling unsafe due to threats from a coworker. Under OSHA\'s General Duty Clause, the employer is obligated to:',
        options: [
            'Investigate the threat and take reasonable steps to protect the employee from recognized workplace violence hazards promptly',
            'Wait until a physical assault actually occurs before taking action because verbal threats alone do not constitute a recognized hazard',
            'Transfer the reporting employee to a different location rather than addressing the threatening coworker\'s behavior directly',
            'Advise the employee to obtain a personal restraining order since workplace interpersonal conflicts are outside the employer\'s scope',
        ],
        correctAnswer: 0,
        explanation: 'OSHA\'s General Duty Clause requires employers to provide a workplace free from recognized hazards, including workplace violence threats. Employers must investigate threats, take protective action, and document their response. Waiting for physical harm is negligent. Transferring only the victim penalizes the reporter. Personal restraining orders are the employee\'s right but do not absolve the employer of its duty. OSHA cites employers for failure to address known threats.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An employer is developing an emergency action plan (EAP). Which OSHA requirement must the plan include?',
        options: [
            'Procedures for emergency reporting, evacuation routes, employee headcount methods, and designation of emergency response duties',
            'Detailed instructions for employees to personally fight fires using extinguishers before calling emergency services for assistance',
            'A policy requiring all employees to shelter in place during every type of emergency regardless of the nature of the threat',
            'A statement that employees are financially responsible for replacing any personal property damaged during a workplace emergency',
        ],
        correctAnswer: 0,
        explanation: 'OSHA standard 29 CFR 1910.38 requires emergency action plans to include reporting procedures, evacuation routes and procedures, accounting for all employees after evacuation, rescue and medical duties, and the names of contacts for plan information. Employees should not be required to fight fires unless specifically trained. Shelter-in-place is one response, not universal. Employers cannot shift property damage liability to employees in emergencies.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Drug-Free Workplace Act requirements apply to which employers?',
        options: [
            'All private-sector employers in the United States regardless of size, industry, or whether they receive any form of government funding',
            'Only employers in the transportation and healthcare industries where safety-sensitive positions create elevated public risk concerns',
            'Federal contractors and grantees receiving federal contracts or grants above specified thresholds as defined in the statute',
            'Only employers with more than 500 employees that are publicly traded on a major national stock exchange in the United States',
        ],
        correctAnswer: 2,
        explanation: 'The Drug-Free Workplace Act of 1988 applies to federal contractors with contracts of $100,000 or more and all federal grantees. It requires a written policy, employee notification, drug-free awareness programs, and reporting of drug convictions. It does not mandate drug testing. The Act does not apply to all private employers, is not limited to specific industries, and has no company-size or public-trading threshold.',
        difficulty: 'Hard',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Which approach to workplace ergonomics is most effective at reducing musculoskeletal disorders (MSDs) among office workers?',
        options: [
            'Conducting individual workstation assessments and adjusting equipment to fit each employee\'s physical needs and work habits',
            'Purchasing the most expensive office furniture available on the assumption that higher cost guarantees better ergonomic design',
            'Requiring all employees to stand at their desks for the entire workday to eliminate the health risks associated with sitting',
            'Distributing a one-page ergonomics tip sheet during new hire orientation without conducting any follow-up assessments or adjustments',
        ],
        correctAnswer: 0,
        explanation: 'Effective ergonomics programs conduct individual assessments because body dimensions, work habits, and job tasks vary among employees. One-size-fits-all approaches fail. Expensive furniture is not inherently ergonomic. Standing all day creates its own MSD risks. A tip sheet without assessment and follow-up is insufficient. OSHA recommends proactive ergonomic assessments as part of a comprehensive injury prevention program.',
        difficulty: 'Easy',
    },

    // ===== HR Knowledge Domains — Workplace: Employment Law continued (Q33–Q36) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Under the National Labor Relations Act, which of the following employee activities is considered protected concerted activity?',
        options: [
            'An individual employee complaining privately to their therapist about job dissatisfaction without involving any coworker in the discussion',
            'Two or more employees discussing their wages and working conditions with the goal of improving terms for the group collectively',
            'A manager directing subordinates to sign a petition opposing unionization as a condition of receiving their next scheduled pay raise',
            'An employee sabotaging company equipment as a form of personal protest against a policy they consider unfair and unreasonable',
        ],
        correctAnswer: 1,
        explanation: 'Section 7 of the NLRA protects employees\' right to engage in concerted activity — collective action for mutual aid or protection, including discussing wages and working conditions. This applies to union and non-union workplaces alike. Individual private complaints are not concerted. Sabotage loses protection. A manager coercing signatures violates Section 8(a)(1) as employer interference with protected rights.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An employer receives an EEOC charge of discrimination. What is the employer\'s first obligation upon receipt?',
        options: [
            'Immediately terminate the charging party to eliminate the source of the complaint before the investigation proceeds further',
            'Issue a public statement denying the allegations to protect the company\'s reputation among customers and business partners',
            'Contact the charging party directly to negotiate a private settlement without involving legal counsel or the EEOC in discussions',
            'Preserve all relevant documents and records, and refrain from retaliating against the employee who filed the EEOC charge',
        ],
        correctAnswer: 3,
        explanation: 'Upon receiving an EEOC charge, the employer must implement a litigation hold (preserve all relevant documents) and ensure no retaliation occurs against the charging party. Terminating the employee is retaliation — a separate violation. Direct contact to negotiate without counsel is risky and may constitute interference. Public statements may prejudice the case. The employer will have an opportunity to submit a formal position statement to the EEOC.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Which of the following is a permissible bona fide occupational qualification (BFOQ) under Title VII?',
        options: [
            'Requiring all customer service representatives to be under age 30 because the company wants a youthful brand image in marketing',
            'Requiring all employees to be of a particular national origin because the CEO believes it creates a stronger workplace culture',
            'Refusing to hire candidates of a specific race for a leadership position based on customer preferences in a particular market',
            'Hiring only female attendants for a women\'s domestic violence shelter where gender is essential to the therapeutic environment',
        ],
        correctAnswer: 3,
        explanation: 'A BFOQ is a narrowly applied exception allowing discrimination when a characteristic is reasonably necessary to the normal operation of the business. Gender may be a BFOQ for positions in domestic violence shelters, prison guards for same-sex facilities, or certain entertainment roles. Race is never a BFOQ under Title VII. Age BFOQs are narrow (public safety roles). Customer preference is not a valid BFOQ basis.',
        difficulty: 'Hard',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Under USERRA, an employee returning from military service is entitled to:',
        options: [
            'Reemployment in the position they would have held had they remained continuously employed, with the same seniority and benefits',
            'A guaranteed promotion to the next level above their pre-service position as compensation for the time spent on military duty',
            'Unlimited job protection regardless of the length of military service, with no cumulative service limit under the federal statute',
            'Reemployment only if they return to work within 24 hours of discharge from military service, regardless of the deployment length',
        ],
        correctAnswer: 0,
        explanation: 'USERRA requires employers to reemploy returning service members in the escalator position — the job they would have attained with reasonable certainty had they remained continuously employed, including promotions, pay raises, and seniority. It does not guarantee extra promotions. The cumulative service limit is five years. Reporting timelines vary by service length (1-90 days depending on duration). USERRA applies to virtually all employers.',
        difficulty: 'Hard',
    },

    // ===== HR Knowledge Domains — Workforce Management & Planning (Q37–Q40) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An organization classifies workers as independent contractors rather than employees. Which factor most strongly indicates the workers should be classified as employees?',
        options: [
            'The workers set their own hours, use their own tools, and simultaneously provide the same services to other client organizations',
            'The organization controls when, where, and how the workers perform their duties and provides all necessary tools and equipment',
            'The workers signed a written agreement explicitly stating they are independent contractors and not employees of the organization',
            'The workers invoice the organization monthly for completed deliverables and are responsible for paying their own self-employment taxes',
        ],
        correctAnswer: 1,
        explanation: 'The IRS and Department of Labor use behavioral control, financial control, and relationship-type factors to determine classification. When the organization controls how, when, and where work is performed and provides tools, the workers are likely employees regardless of a written agreement. Setting own hours and serving multiple clients indicates contractor status. A written contract alone does not determine classification — substance over form applies.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'A contingent workforce strategy that uses temporary workers, freelancers, and gig workers provides which primary organizational benefit?',
        options: [
            'It eliminates all employer obligations under federal employment law since contingent workers are never covered by workplace statutes',
            'It removes the need for any onboarding or training since contingent workers arrive fully prepared to perform in any environment',
            'It guarantees higher quality work output because contingent workers are always more skilled than permanent full-time employees',
            'It provides workforce flexibility to scale up or down quickly in response to fluctuating business demands and project-based needs',
        ],
        correctAnswer: 3,
        explanation: 'Contingent workforce strategies provide flexibility — organizations can rapidly adjust staffing levels to meet variable demand without the fixed costs of permanent headcount. However, employer obligations are not eliminated (joint employment, OSHA, anti-discrimination laws may apply). Quality varies by individual. Contingent workers still need orientation and role-specific guidance. SHRM BASK identifies workforce flexibility as a strategic planning tool.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'Job analysis serves as the foundation for which HR functions?',
        options: [
            'Recruitment, selection, compensation, performance management, and training — virtually all core HR processes depend on it',
            'Only compensation and benefits administration, since job analysis is primarily a tool for determining appropriate pay levels',
            'Only the onboarding process, where new hires learn about job expectations during their first week of orientation activities',
            'Only workforce reduction decisions, where job analysis determines which positions are eliminated during organizational restructuring',
        ],
        correctAnswer: 0,
        explanation: 'Job analysis is the systematic study of jobs to identify duties, responsibilities, skills, and working conditions. It underpins nearly every HR function: recruitment (what to look for), selection (which criteria to assess), compensation (how to value the job), performance management (what to evaluate), and training (what skills to develop). Limiting it to any single function misses its foundational role across the HR discipline.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'HR Knowledge Domains',
        stem: 'An HR professional is calculating the cost-per-hire metric. Which costs should be included in the calculation?',
        options: [
            'Only external costs such as job board fees, recruiter agency charges, and background check expenses paid to outside vendors',
            'Only internal costs such as recruiter salaries, hiring manager interview time, and employee referral bonus payments',
            'Both internal costs (recruiter time, hiring manager time, referral bonuses) and external costs (advertising, agency fees, assessments)',
            'Only the new employee\'s first-year salary and benefits package, since that represents the total financial investment in the hire',
        ],
        correctAnswer: 2,
        explanation: 'SHRM and ANSI define cost-per-hire as total internal costs plus total external costs divided by the number of hires. Internal costs include recruiter compensation, hiring manager time, and referral bonuses. External costs include advertising, agency fees, travel, assessments, and background checks. Excluding either category understates the true cost. The new hire\'s salary is a compensation cost, not a recruiting cost.',
        difficulty: 'Medium',
    },

    // ===== Behavioral Competencies — Leadership & Navigation (Q41–Q45) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'A newly hired HR manager discovers that the department has been operating without documented standard procedures. What is the most effective leadership approach?',
        options: [
            'Immediately impose a rigid set of procedures developed without staff input and mandate compliance within one week',
            'Collaborate with the HR team to identify priority processes, co-create documentation, and implement procedures incrementally',
            'Ignore the lack of procedures since the team has functioned without them and introducing change may disrupt existing workflow',
            'Escalate the issue to the CEO and recommend disciplining the previous HR manager for failing to create documentation',
        ],
        correctAnswer: 1,
        explanation: 'Effective leaders build buy-in by involving the team in creating solutions. Co-creating procedures ensures practical relevance and ownership. Incremental implementation prevents overwhelm. Imposing rigid rules without input breeds resistance. Ignoring the gap perpetuates risk and inconsistency. Blaming the predecessor is unproductive. SHRM BASK emphasizes collaborative leadership and change management as core competencies.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'An HR professional is tasked with leading a cross-departmental project but has no direct authority over the team members. Which influence strategy is most appropriate?',
        options: [
            'Threaten to report non-participating team members to their managers for insubordination and lack of collaborative effort',
            'Build relationships, establish a shared vision, and leverage expertise credibility to motivate voluntary participation and commitment',
            'Complete the entire project independently without involving the cross-departmental team to avoid interpersonal coordination challenges',
            'Request that the CEO issue a mandate requiring all departments to comply with the HR professional\'s project directives fully',
        ],
        correctAnswer: 1,
        explanation: 'Leading without authority requires influence skills — building relationships, articulating a compelling shared vision, and establishing credibility through expertise. Threats damage relationships and trust. CEO mandates create compliance without commitment. Working alone defeats the purpose of cross-functional collaboration. SHRM BASK identifies influence, relationship management, and navigation as essential leadership competencies.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'During an organizational crisis, which leadership behavior is most important for maintaining employee trust and confidence?',
        options: [
            'Withholding all information until the crisis is fully resolved to prevent panic and speculation among the general workforce',
            'Delegating all crisis communication to the legal department to ensure every statement is legally reviewed before distribution',
            'Communicating frequently with honesty and empathy, even when the full picture is still developing and not all answers are available',
            'Focusing exclusively on financial metrics and reassuring shareholders while postponing employee communication until quarterly earnings',
        ],
        correctAnswer: 2,
        explanation: 'Trust during crisis requires frequent, honest communication that acknowledges uncertainty while demonstrating empathy and care. Information vacuums breed rumors and anxiety. Legal review is important but should not delay all communication. Prioritizing shareholders over employees during a crisis erodes internal trust. SHRM BASK emphasizes transparent crisis communication as a core leadership and navigation competency.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'An HR director notices that middle managers consistently avoid making difficult staffing decisions and instead escalate them to HR. The most effective response is to:',
        options: [
            'Accept all escalated decisions permanently to ensure consistency and relieve managers of the burden of difficult people decisions',
            'Transfer all difficult staffing decisions to an external management consulting firm that specializes in organizational workforce planning',
            'Issue a policy prohibiting managers from contacting HR about staffing matters and requiring all decisions to be made independently',
            'Coach managers on decision-making frameworks, clarify their authority, and provide support while holding them accountable for outcomes',
        ],
        correctAnswer: 3,
        explanation: 'The goal is to build managerial capability, not create dependency. Coaching on frameworks, clarifying authority boundaries, and providing support (while not taking over) develops managers\' confidence and competence. Accepting all escalations creates an unsustainable HR bottleneck. Prohibiting contact isolates managers. Outsourcing undermines internal leadership development. SHRM BASK emphasizes consultation and coaching as HR competencies.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'Servant leadership is best characterized by a leader who:',
        options: [
            'Prioritizes the growth, well-being, and empowerment of team members as the primary means to achieve organizational success',
            'Makes all decisions unilaterally to protect team members from the stress and complexity of participating in decision-making',
            'Avoids setting performance expectations because holding people accountable conflicts with the principle of serving their needs',
            'Delegates all leadership responsibilities to subordinates and removes themselves from any active role in team management',
        ],
        correctAnswer: 0,
        explanation: 'Servant leadership, as defined by Robert Greenleaf, puts the needs of followers first — focusing on their growth, autonomy, and well-being. This in turn drives organizational performance through engaged, empowered teams. It does not mean avoiding decisions, abandoning accountability, or abdicating leadership. Servant leaders actively develop others while maintaining high standards. SHRM BASK includes servant leadership in leadership models.',
        difficulty: 'Easy',
    },

    // ===== Behavioral Competencies — Ethical Practice (Q46–Q49) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'An HR professional discovers that the organization\'s background check vendor has been sharing applicant information with unauthorized third parties. What is the most appropriate action?',
        options: [
            'Immediately terminate the vendor relationship, report the breach to affected applicants, and assess legal obligations under applicable privacy laws',
            'Continue using the vendor while negotiating a discounted rate as compensation for the data sharing to offset potential legal exposure',
            'Ignore the issue because the vendor, not the employer, is solely responsible for third-party data handling under all circumstances',
            'Delay action until the next annual vendor review cycle to address the data sharing concern as part of routine contract renegotiation',
        ],
        correctAnswer: 0,
        explanation: 'Data breaches involving applicant information require immediate action. The employer has obligations under the FCRA, state data breach notification laws, and potentially GDPR. Continuing with a compromised vendor exposes the organization to liability. Employers cannot disclaim responsibility for vendor conduct with applicant data — they are accountable for their agents. Delay increases harm and legal exposure.',
        difficulty: 'Hard',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'The SHRM Code of Ethics requires HR professionals to:',
        options: [
            'Prioritize the employer\'s financial interests above all other considerations including legal compliance and employee well-being',
            'Maintain the highest standards of professional integrity, comply with applicable laws, and balance the interests of all stakeholders',
            'Follow the instructions of senior management without question to demonstrate organizational loyalty and professional deference',
            'Advocate exclusively for employee interests in every situation, even when those interests conflict with legitimate business needs',
        ],
        correctAnswer: 1,
        explanation: 'The SHRM Code of Ethics establishes that HR professionals must act with integrity, comply with laws, and serve as balanced advocates — considering the interests of employees, employers, and the profession. One-sided advocacy for either employer or employee interests violates the balanced approach. Blind obedience to management ignores the duty to challenge unethical or unlawful directives.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'An HR manager is asked to alter performance records to support a predetermined termination decision that lacks legitimate documentation. The most ethical response is to:',
        options: [
            'Comply with the request to protect the employment relationship with senior management and maintain organizational harmony',
            'Alter the records but maintain a personal backup of the original documents as insurance against potential future legal proceedings',
            'Resign immediately without reporting the request to anyone, since the situation is beyond the HR professional\'s ability to influence',
            'Refuse the request, explain the legal and ethical risks of falsifying records, and recommend building a legitimate performance record',
        ],
        correctAnswer: 3,
        explanation: 'Falsifying performance records is unethical and creates significant legal liability (wrongful termination, spoliation of evidence, fraud). The HR professional must refuse, articulate the risks clearly, and recommend a lawful path — documented performance management with clear expectations and timelines. Complying is dishonest. Altering and keeping backups is still falsification. Resignation without reporting abandons the duty to advocate for ethical conduct.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'A conflict of interest in HR decision-making is best managed by:',
        options: [
            'Disclosing the conflict, recusing yourself from the decision, and ensuring an independent party handles the matter objectively',
            'Proceeding with the decision while mentally acknowledging the conflict and promising yourself to remain as fair as possible',
            'Keeping the conflict private to avoid creating a perception of bias that could undermine confidence in the HR department',
            'Asking the conflicted party\'s close friend in the department to make the decision instead to keep the matter within the team',
        ],
        correctAnswer: 0,
        explanation: 'Conflict of interest management requires transparency — disclosure, recusal, and independent decision-making. Self-regulation is insufficient because unconscious bias affects judgment even when we try to be fair. Concealing conflicts damages credibility when discovered. Delegating to a close associate does not eliminate the conflict. SHRM BASK emphasizes disclosure and recusal as fundamental ethical practices.',
        difficulty: 'Easy',
    },

    // ===== Behavioral Competencies — DEI (Q50–Q52) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'An HR professional notices that promotion rates differ significantly by race within the organization. The most appropriate first step is to:',
        options: [
            'Implement a quota system that mandates equal promotion rates across all racial groups regardless of qualifications or performance',
            'Announce the disparity publicly before completing any analysis to demonstrate the organization\'s commitment to racial transparency',
            'Conduct a thorough analysis of promotion criteria, processes, and outcomes to identify where disparities originate in the pipeline',
            'Dismiss the data as coincidental and take no action because the organization has a written equal opportunity policy in place',
        ],
        correctAnswer: 2,
        explanation: 'Addressing promotion disparities requires root-cause analysis first — examining criteria, reviewer training, pipeline access, and process consistency. Quotas may violate Title VII. Dismissing data ignores potential systemic issues. Premature public announcements without understanding the cause can create legal exposure and undermine trust. SHRM BASK recommends data-driven approaches to identifying and eliminating barriers to equitable advancement.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'Inclusive meeting practices that ensure equitable participation include:',
        options: [
            'Allowing only senior leaders to speak during meetings and distributing notes to other attendees afterward for their information',
            'Conducting meetings exclusively in the dominant language without providing translation resources for non-native speakers on the team',
            'Scheduling all meetings at times convenient for the majority without considering time zone differences for remote team members',
            'Distributing agendas in advance, using structured turn-taking, and actively soliciting input from quieter participants during discussions',
        ],
        correctAnswer: 3,
        explanation: 'Inclusive meeting practices ensure all voices are heard. Advance agendas allow preparation. Structured turn-taking prevents dominant personalities from monopolizing discussion. Actively soliciting input from quieter participants surfaces diverse perspectives. Senior-only speaking excludes valuable input. Ignoring time zones disadvantages remote workers. Language exclusion creates barriers for non-native speakers. SHRM BASK emphasizes inclusive practices as a DEI competency.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'Intersectionality in the context of workplace DEI refers to:',
        options: [
            'The practice of assigning employees to cross-functional project teams to increase departmental collaboration and knowledge sharing',
            'The physical layout of an open-plan office where different departments share common workspace and intersect throughout the day',
            'The recognition that individuals hold multiple identity dimensions that interact to shape unique experiences of privilege and disadvantage',
            'A compensation methodology that calculates pay rates based on the intersection of job grade and geographic cost-of-living data',
        ],
        correctAnswer: 2,
        explanation: 'Intersectionality, a concept introduced by Kimberle Crenshaw, recognizes that people hold overlapping identities (race, gender, disability, sexual orientation, etc.) that interact to create unique experiences of discrimination and privilege. A Black woman\'s experience differs from a white woman\'s or a Black man\'s. Cross-functional teams, compensation models, and office layouts are unrelated concepts. SHRM BASK incorporates intersectionality into DEI competency.',
        difficulty: 'Medium',
    },

    // ===== Behavioral Competencies — Relationship Management (Q53–Q55) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'An HR business partner learns that a high-performing department manager has a pattern of yelling at team members during meetings. The most effective approach is to:',
        options: [
            'Ignore the behavior because the manager\'s performance results are strong and confrontation could damage the productive relationship',
            'Send an anonymous note to the manager suggesting they modify their communication approach without identifying yourself as the source',
            'Have a direct, private conversation with the manager about the impact of their behavior and develop an actionable improvement plan',
            'Immediately place the manager on a formal performance improvement plan without any preliminary discussion about the observed behavior',
        ],
        correctAnswer: 2,
        explanation: 'Relationship management requires courage to address difficult behaviors directly while maintaining professional respect. A private conversation allows the manager to understand the impact on their team and commit to change. Ignoring toxic behavior condones it and increases turnover risk. Anonymous notes lack accountability. Jumping to formal discipline without conversation escalates unnecessarily. SHRM BASK emphasizes direct feedback as a relationship management skill.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'Building trust with a labor union representative is best accomplished by:',
        options: [
            'Sharing confidential management strategy documents with the union representative to demonstrate openness and good faith cooperation',
            'Communicating consistently, following through on commitments, and demonstrating genuine respect for the collective bargaining relationship',
            'Agreeing to every union demand without negotiation to avoid conflict and maintain a reputation as a cooperative management partner',
            'Avoiding all direct contact with the union representative and routing every communication through the company\'s outside legal counsel',
        ],
        correctAnswer: 1,
        explanation: 'Trust in labor relations is built through consistent communication, reliability (keeping promises), and mutual respect. Sharing confidential strategy documents breaches management\'s fiduciary duty. Avoiding contact signals hostility and delays resolution. Agreeing to everything is not bargaining in good faith and is unsustainable. Effective labor relations require honest, respectful engagement within appropriate boundaries.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'Effective stakeholder management for an HR initiative requires:',
        options: [
            'Identifying key stakeholders, understanding their interests and concerns, and engaging them throughout the initiative\'s lifecycle',
            'Informing stakeholders only after the initiative is fully implemented to avoid scope creep and interference from multiple perspectives',
            'Engaging exclusively with stakeholders who are supportive and avoiding those who express concerns or potential objections',
            'Delegating all stakeholder communication to a junior HR coordinator to preserve the HR leader\'s time for strategic planning tasks',
        ],
        correctAnswer: 0,
        explanation: 'Stakeholder management involves early identification, understanding of interests and influence levels, and ongoing engagement. Proactive engagement surfaces concerns early, builds buy-in, and improves outcomes. Post-implementation notification creates resistance. Avoiding critics ignores legitimate concerns and powerful opponents. Junior staff may lack the credibility for stakeholder engagement. SHRM BASK identifies stakeholder management as essential to HR effectiveness.',
        difficulty: 'Easy',
    },

    // ===== Behavioral Competencies — Communication (Q56–Q58) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'An HR professional must communicate a new paid time off policy to a workforce that includes office, manufacturing, and remote employees. Which approach ensures maximum reach and comprehension?',
        options: [
            'Posting the policy on the company intranet only and assuming all employees check it regularly for updates and announcements',
            'Announcing the policy once during the annual holiday party and providing no written follow-up documentation for reference',
            'Sending a single text message with a link to the policy document, relying on employees to read the full details independently',
            'Using multiple channels — email, manager briefings, posted notices, and a recorded video — tailored to each group\'s primary access method',
        ],
        correctAnswer: 3,
        explanation: 'A diverse workforce requires a multi-channel communication approach. Office employees may use email and intranet. Manufacturing workers may rely on posted notices and manager briefings. Remote employees benefit from email and video. Single-channel approaches miss segments of the workforce. One-time announcements lack reinforcement. SHRM BASK emphasizes tailoring communication methods to the audience and ensuring accessibility.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'When writing an HR policy document, which principle ensures clarity and reduces the risk of misinterpretation?',
        options: [
            'Using complex legal terminology throughout to ensure the document holds up under judicial scrutiny without requiring legal review',
            'Writing in plain language, defining key terms, providing examples, and having both legal counsel and end users review the draft',
            'Copying policies verbatim from another organization in the same industry since similar businesses face identical compliance needs',
            'Making the policy as brief as possible by omitting examples and definitions to keep the document to a single page in length',
        ],
        correctAnswer: 1,
        explanation: 'Clear policy writing uses plain language accessible to all employees, defines terms to prevent confusion, provides examples to illustrate application, and undergoes dual review (legal for compliance, end users for comprehension). Excessive legal jargon reduces understanding. Omitting context creates ambiguity. Copying other companies\' policies ignores unique organizational context and may not reflect current law. SHRM BASK emphasizes clear, accessible communication.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'During a mediation session between two employees, the HR professional observes that one party becomes visibly agitated and stops participating. The most effective response is to:',
        options: [
            'Ignore the disengagement and continue the session because stopping would reward avoidant behavior and delay resolution',
            'End the mediation permanently and recommend formal disciplinary action against the disengaged party for failing to participate',
            'Call a brief recess, check in privately with the agitated party, and assess whether it is productive to resume or reschedule',
            'Ask the other party to apologize immediately to reduce the tension even if the cause of the agitation is not yet clear',
        ],
        correctAnswer: 2,
        explanation: 'Skilled mediators recognize when emotional escalation impairs productive dialogue. A brief recess allows the agitated party to regulate, provides privacy for the HR professional to understand the concern, and preserves the mediation process. Ignoring emotions produces poor outcomes. Ending permanently and disciplining is punitive. Forcing apologies without understanding the issue is premature and may escalate conflict.',
        difficulty: 'Medium',
    },

    // ===== Behavioral Competencies — Global Mindset (Q59–Q60) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'An HR professional is onboarding employees in a country where direct eye contact with authority figures is considered disrespectful. The most culturally competent approach is to:',
        options: [
            'Require all employees globally to maintain eye contact during conversations as part of a standardized professional behavior policy',
            'Insist that local employees adopt the headquarters\' cultural norms immediately upon hiring to promote a uniform corporate culture',
            'Avoid onboarding employees in that country altogether because cultural differences make effective orientation programs impossible to deliver',
            'Adapt communication expectations to respect local cultural norms while ensuring core organizational values are still clearly communicated',
        ],
        correctAnswer: 3,
        explanation: 'Cultural competence requires adapting communication approaches to respect local norms while maintaining consistent organizational values. Imposing headquarters\' norms disregards cultural context and alienates employees. Avoiding countries with different cultures is impractical and ethnocentric. Effective global HR professionals distinguish between universal values and culturally specific behaviors. SHRM BASK emphasizes global mindset as a core behavioral competency.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'When establishing compensation for employees in a new international office, the HR professional should consider:',
        options: [
            'Paying all international employees the same rate as headquarters employees to ensure global pay equity across every location',
            'Local labor market rates, cost of living, statutory benefits requirements, and prevailing compensation practices in the host country',
            'Setting compensation at the lowest possible rate that local law permits to maximize the organization\'s profit margin in the new market',
            'Allowing each local manager to set pay rates independently without any guidance, benchmarking, or oversight from corporate HR',
        ],
        correctAnswer: 1,
        explanation: 'International compensation must account for local market rates, cost of living, mandatory benefits (statutory requirements vary widely), and cultural expectations around pay. Headquarters rates may overpay or underpay relative to local markets. Minimum legal rates may fail to attract talent. Unsupervised local decisions create inconsistency and risk. SHRM BASK recommends a structured approach to global compensation that balances global consistency with local relevance.',
        difficulty: 'Medium',
    },

    // ===== Behavioral Competencies — Business Acumen (Q61–Q63) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'An HR professional is preparing a business case for investing in an applicant tracking system (ATS). Which financial metric would most effectively demonstrate the investment\'s value to the CFO?',
        options: [
            'The number of features the ATS offers compared to competing products on the market based on vendor marketing materials',
            'The projected reduction in time-to-fill and cost-per-hire based on industry benchmarks and the organization\'s current hiring data',
            'The aesthetic appeal of the user interface based on feedback from the HR team during the product demonstration session',
            'The software vendor\'s customer satisfaction ratings and online reviews from other organizations that have purchased the platform',
        ],
        correctAnswer: 1,
        explanation: 'CFOs evaluate investments through financial impact. Projected reductions in time-to-fill (lost productivity cost) and cost-per-hire (recruiting spend) translate directly into dollars. Feature counts, vendor reviews, and interface aesthetics are implementation considerations but do not demonstrate ROI. SHRM BASK emphasizes building business cases using financial metrics that resonate with executive decision-makers.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'Understanding an organization\'s profit and loss statement helps HR professionals:',
        options: [
            'Make informed decisions about headcount, compensation budgets, and benefit plan design that align with financial constraints',
            'Prepare individual employee tax returns as part of the HR department\'s expanded financial services role within the organization',
            'Replace the finance department\'s role in budget management by having HR assume full responsibility for financial planning',
            'Determine the appropriate interest rate for employee loans provided through the organization\'s voluntary financial assistance program',
        ],
        correctAnswer: 0,
        explanation: 'Financial literacy enables HR professionals to connect workforce decisions to business outcomes. Understanding revenue, expenses, and margin informs headcount planning, compensation strategy, and benefits design within financial reality. HR does not prepare individual tax returns, replace finance, or set loan rates. SHRM BASK identifies business acumen — including financial understanding — as a critical competency for strategic HR.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'An organization is considering acquiring a competitor. HR\'s most valuable contribution to the due diligence process is:',
        options: [
            'Designing the combined company\'s new logo and brand identity to reflect the merged organizational culture and values',
            'Planning the company holiday party for the newly combined workforce to build morale before the acquisition is formally completed',
            'Negotiating the acquisition price directly with the target company\'s shareholders based on HR\'s understanding of human capital value',
            'Assessing workforce risks including cultural compatibility, compensation alignment, key talent retention, and potential legal liabilities',
        ],
        correctAnswer: 3,
        explanation: 'HR due diligence in M&A assesses critical workforce factors: cultural compatibility (integration risk), compensation and benefits alignment (cost and retention implications), key talent identification (retention planning), employment law liabilities (pending claims, contracts, union agreements), and organizational structure overlap. Logo design and holiday planning are not due diligence. Price negotiation is finance and legal\'s role. SHRM BASK includes M&A as a business acumen topic.',
        difficulty: 'Hard',
    },

    // ===== Behavioral Competencies — Consultation & Analytical Aptitude (Q64–Q66) =====
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'A manager approaches HR requesting immediate termination of an employee for poor performance but has no documented warnings, coaching records, or performance reviews. The HR consultant should:',
        options: [
            'Process the termination immediately as requested because at-will employment allows termination without cause or prior documentation',
            'Suggest that the manager simply stop assigning work to the employee until they resign voluntarily from boredom and lack of engagement',
            'Advise the manager to begin a documented performance improvement process to establish a defensible record before taking adverse action',
            'Recommend promoting the employee to a different department to avoid the discomfort of a termination conversation with the worker',
        ],
        correctAnswer: 2,
        explanation: 'While at-will employment permits termination without cause, lack of documentation creates significant legal risk (disparate treatment claims, wrongful termination allegations). A performance improvement plan establishes expectations, provides opportunity to improve, and creates a defensible record. Transferring underperformers relocates the problem. Constructive discharge (forcing resignation through intolerable conditions) is itself illegal. SHRM BASK emphasizes documentation as a cornerstone of risk management.',
        difficulty: 'Medium',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'Predictive analytics in HR is most accurately described as:',
        options: [
            'Using historical workforce data and statistical models to forecast future trends such as turnover risk and hiring needs proactively',
            'Generating basic headcount reports that summarize the current number of employees by department, location, and job classification',
            'Creating organization charts that display the current reporting structure without any accompanying analysis of workforce trends',
            'Tracking time and attendance records to calculate the total number of hours worked by each employee during the current pay period',
        ],
        correctAnswer: 0,
        explanation: 'Predictive analytics uses historical data, statistical algorithms, and machine learning to identify patterns and forecast future outcomes — such as which employees are likely to leave, where skills gaps will emerge, or how many hires will be needed. Basic headcount reports, org charts, and time tracking are descriptive analytics (what happened) rather than predictive (what will happen). SHRM BASK includes analytics across the aptitude spectrum.',
        difficulty: 'Easy',
    },
    {
        examId: SHRM_CP_ID, type: 'mcq', domain: 'Behavioral Competencies',
        stem: 'When presenting workforce data to non-HR executives, the most effective analytical approach is to:',
        options: [
            'Present raw data spreadsheets with hundreds of rows so executives can draw their own conclusions from the unfiltered information',
            'Use as much HR-specific jargon as possible to demonstrate expertise and establish credibility with the executive audience',
            'Limit the presentation to a single metric to avoid overwhelming executives who may not be familiar with HR analytics concepts',
            'Translate data into clear visualizations, connect findings to business outcomes, and provide actionable recommendations for leadership',
        ],
        correctAnswer: 3,
        explanation: 'Effective data presentation for executives requires translation — converting complex data into clear visuals, connecting insights to business impact (revenue, cost, risk), and recommending specific actions. Raw data overwhelms. HR jargon alienates non-HR audiences. Single metrics lack context. SHRM BASK emphasizes that analytical aptitude includes not just analyzing data but communicating insights in business-relevant terms that drive decision-making.',
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
    console.log(`Added ${shuffled.length} NEW SHRM-CP questions (no deletions)`);
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
