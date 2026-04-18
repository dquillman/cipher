const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

const CIA_PART1_ID = 'dtgTymjijqUr4NEIHbE1';

// Only the 100 NEW questions (no deletions)
const questions = [
    // Foundations Q1 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'An internal audit engagement work program should primarily be designed to:',
        options: [
            'Achieve the objectives of the engagement through documented procedures and testing steps',
            'Satisfy the documentation requests submitted by external regulators and oversight agencies',
            'Replicate the testing procedures used by the external audit firm in the prior fiscal year',
            'Provide a template that can be reused without modification for all future audit engagements',
        ],
        correctAnswer: 0,
        explanation: 'Work programs establish the procedures for achieving engagement objectives. They must be tailored to the specific risks and objectives of each engagement. They are not designed primarily for regulators, they should not simply replicate external audit procedures, and they require customization for each engagement rather than boilerplate reuse.',
        difficulty: 'Easy',
    },
    // Foundations Q2 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'During an engagement, an internal auditor identifies a significant control weakness. The auditor should communicate this finding to:',
        options: [
            'The external audit firm partner before informing internal management about the finding',
            'Management of the area responsible for taking corrective action on the identified weakness',
            'The media and relevant public stakeholders as part of the organization\'s transparency duties',
            'Only the audit committee, while withholding details from operational management personnel',
        ],
        correctAnswer: 1,
        explanation: 'Engagement findings should be communicated to the parties responsible for taking action — typically the management of the audited area. Per IIA Standards, results must be communicated to appropriate parties who can ensure findings are given due consideration. External auditors may be informed through coordination, but they are not the primary recipient. Public disclosure and withholding from management are both inappropriate.',
        difficulty: 'Medium',
    },
    // Foundations Q3 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'Which of the following is the most appropriate basis for developing the annual internal audit plan?',
        options: [
            'Requests from senior management about specific areas they would like audited this cycle',
            'A risk assessment that considers the organization\'s objectives, strategies, and risk exposures',
            'The schedule of engagements performed by the external audit firm during the current period',
            'A rotation schedule that ensures every department is audited once within a three-year cycle',
        ],
        correctAnswer: 1,
        explanation: 'IIA Standards require the audit plan to be based on a documented risk assessment, updated at least annually. The risk assessment considers organizational objectives, risk exposures, and stakeholder input. While management requests, external audit plans, and rotation schedules may inform planning, the primary driver must be an independent risk assessment conducted by the CAE.',
        difficulty: 'Medium',
    },
    // Foundations Q4 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'Internal audit workpapers serve primarily to:',
        options: [
            'Replace the need for formal engagement communications and final audit reports to management',
            'Document the information obtained, analyses performed, and conclusions reached during the engagement',
            'Provide evidence that can be submitted directly to courts of law as certified legal testimony',
            'Serve as the official financial records of the organization for regulatory filing requirements',
        ],
        correctAnswer: 1,
        explanation: 'Workpapers document the evidence gathered, analyses performed, and conclusions reached during an engagement. They support engagement results and demonstrate that the work was performed in accordance with the Standards. They do not replace formal communications, serve as legal testimony by default, or constitute official financial records.',
        difficulty: 'Easy',
    },
    // Foundations Q5 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'A CAE is asked by the CEO to delay issuing an audit report that contains critical findings about the CFO\'s department. The CAE should:',
        options: [
            'Comply with the CEO\'s request since the CEO is the CAE\'s administrative reporting superior',
            'Agree to delay the report but document the CEO\'s request in confidential workpapers',
            'Escalate the matter to the board or audit committee as a potential scope limitation',
            'Withdraw the findings from the report to avoid creating conflict with senior management',
        ],
        correctAnswer: 2,
        explanation: 'This situation represents a potential impairment to organizational independence and a scope limitation. The CAE must escalate to the board or audit committee, which has functional oversight of internal audit. The CAE\'s functional reporting line to the board exists precisely for situations where management attempts to influence audit results. Complying, merely documenting, or withdrawing findings would compromise independence.',
        difficulty: 'Hard',
    },
    // Foundations Q6 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'When performing a follow-up engagement, the internal auditor\'s primary objective is to determine whether:',
        options: [
            'The original audit team applied the correct sampling methodology during initial fieldwork',
            'Management has taken effective corrective action or has accepted the risk of not acting',
            'The engagement budget was sufficient to cover all planned procedures in the original audit',
            'External auditors have independently validated the original findings prior to any remediation',
        ],
        correctAnswer: 1,
        explanation: 'Follow-up engagements assess whether management has implemented corrective actions or has consciously accepted the risk of inaction. The IIA Standards require the CAE to establish a follow-up process. The focus is on the adequacy and effectiveness of management\'s response, not on revisiting the original audit methodology, budget, or external validation.',
        difficulty: 'Medium',
    },
    // Foundations Q7 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'The audit universe represents:',
        options: [
            'The complete list of all possible auditable activities, processes, programs, and entities',
            'The subset of high-risk areas that have been selected for the current annual audit plan',
            'The total number of audit staff available to perform engagements during the planning period',
            'The compilation of all audit findings issued over the past five years of engagements',
        ],
        correctAnswer: 0,
        explanation: 'The audit universe is the comprehensive inventory of all auditable units within an organization — including business processes, departments, locations, IT systems, and programs. The annual audit plan is a subset selected from the audit universe based on risk assessment. It is not a staffing metric or a historical findings repository.',
        difficulty: 'Easy',
    },
    // Foundations Q8 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'An internal auditor uses data analytics to test 100% of transactions in a purchasing cycle. This approach is most beneficial because it:',
        options: [
            'Eliminates the need for the auditor to exercise any professional judgment during the engagement',
            'Guarantees that every fraudulent transaction within the population will be correctly identified',
            'Increases audit coverage and can identify anomalies that sampling alone might not detect',
            'Allows the auditor to bypass all preliminary risk assessment and planning procedures entirely',
        ],
        correctAnswer: 2,
        explanation: 'Data analytics enables auditors to examine entire populations rather than samples, increasing coverage and revealing patterns or anomalies that might be missed through sampling. However, professional judgment is still needed to interpret results, it cannot guarantee fraud detection, and it does not replace proper planning and risk assessment. Analytics is a tool that enhances — not replaces — the audit process.',
        difficulty: 'Medium',
    },
    // Foundations Q9 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'An organization outsources its entire internal audit function to an external service provider. Which of the following statements about this arrangement is correct?',
        options: [
            'The organization is exempt from the IIA Standards because internal audit is performed externally',
            'The external service provider must report functionally to the audit committee of the organization',
            'The board no longer bears responsibility for the oversight of internal audit activities',
            'Outsourcing eliminates the need for an internal audit charter within the organization',
        ],
        correctAnswer: 1,
        explanation: 'When internal audit is outsourced, the external provider must still comply with the IIA Standards, including functional reporting to the board or audit committee. The board retains responsibility for oversight of the internal audit activity regardless of who performs it. An internal audit charter is still required to define the purpose, authority, and responsibility of the activity. Outsourcing does not diminish governance requirements.',
        difficulty: 'Hard',
    },
    // Foundations Q10 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'Engagement objectives should be established for each internal audit engagement. These objectives should:',
        options: [
            'Be identical across all engagements to ensure consistency within the internal audit function',
            'Reflect the results of a preliminary risk assessment specific to the activity under review',
            'Be determined solely by the auditee\'s management to ensure their needs are fully addressed',
            'Focus exclusively on compliance testing without considering operational efficiency factors',
        ],
        correctAnswer: 1,
        explanation: 'Per the IIA Standards, engagement objectives must reflect the results of a preliminary assessment of the risks relevant to the activity under review. Objectives vary based on each engagement\'s unique circumstances and risks. They should not be uniform across engagements, set solely by management, or limited only to compliance. The auditor uses professional judgment informed by risk assessment.',
        difficulty: 'Medium',
    },
    // Foundations Q11 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'Which of the following best describes the concept of "adding value" in internal auditing?',
        options: [
            'Providing observations, conclusions, and recommendations that help the organization improve',
            'Generating direct revenue for the internal audit department through consulting fee charges',
            'Reducing the external audit fee by performing all substantive testing on their behalf annually',
            'Increasing the number of audit findings issued each year to demonstrate audit productivity',
        ],
        correctAnswer: 0,
        explanation: 'Adding value means providing objective, relevant assurance and contributing to organizational effectiveness and efficiency. The IIA defines it as providing insights that help the organization improve operations, risk management, and governance. It is not measured by revenue generation, external audit fee reduction, or the volume of findings.',
        difficulty: 'Easy',
    },
    // Foundations Q12 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'An internal auditor is planning to use statistical sampling in a compliance engagement. The sample size should primarily be influenced by:',
        options: [
            'The total number of auditors available to perform the testing during the engagement period',
            'The desired confidence level, expected error rate, and tolerable deviation rate for the test',
            'The preferences of the auditee regarding how many items they want the auditor to examine',
            'The number of findings issued in the prior year\'s audit report for the same auditable area',
        ],
        correctAnswer: 1,
        explanation: 'Statistical sample size is determined by confidence level, expected error rate, and tolerable deviation rate. Higher confidence requires larger samples; higher expected error rates or lower tolerable deviation also increase sample size. Staffing availability, auditee preferences, and prior findings may provide context but do not drive the statistical calculation.',
        difficulty: 'Medium',
    },
    // Foundations Q13 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'The CAE presents the annual audit plan to the audit committee. A committee member requests that a specific engagement be removed because it covers an area managed by a board member\'s relative. The CAE should:',
        options: [
            'Remove the engagement to maintain a cooperative relationship with the audit committee',
            'Agree to postpone the engagement until the board member\'s relative leaves the organization',
            'Explain that removing the engagement would impair audit coverage and may constitute a scope limitation',
            'Transfer responsibility for the engagement to the external auditor without further discussion',
        ],
        correctAnswer: 2,
        explanation: 'The CAE must communicate the impact of resource limitations or scope restrictions to the board. Removing an engagement from the risk-based plan because of a personal relationship constitutes a scope limitation that should be disclosed. The CAE should explain the risk implications and document the board\'s response. Simply complying, postponing indefinitely, or transferring to external auditors does not address the governance issue.',
        difficulty: 'Hard',
    },
    // Foundations Q14 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'Which of the following is considered a consulting engagement rather than an assurance engagement?',
        options: [
            'Reviewing the design of internal controls over the accounts payable disbursement process',
            'Advising management on best practices for implementing a new enterprise resource system',
            'Testing compliance with the organization\'s established code of conduct and ethics policies',
            'Evaluating the effectiveness of the organization\'s information security control framework',
        ],
        correctAnswer: 1,
        explanation: 'Consulting engagements are advisory in nature and their scope is agreed upon with the client. Advising management on best practices for system implementation is a consulting activity. The other options — reviewing control design, testing compliance, and evaluating control effectiveness — are assurance engagements where the auditor independently assesses evidence and determines scope.',
        difficulty: 'Easy',
    },
    // Foundations Q15 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'An auditor notes that a key control operated effectively for the first nine months of the year but was bypassed during the final quarter. The engagement conclusion should:',
        options: [
            'State that the control was effective for the full year since it operated correctly most of the time',
            'Report that the control operated ineffectively throughout the entire twelve-month review period',
            'Distinguish between the periods of effective operation and the period when the control was bypassed',
            'Omit the finding entirely since the control was functioning for the majority of the audit period',
        ],
        correctAnswer: 2,
        explanation: 'Audit conclusions should accurately reflect the conditions observed. The auditor should clearly report that the control was effective for nine months but was bypassed in the final quarter, providing context about the nature and impact of the bypass. Overstating effectiveness, declaring the entire year ineffective without nuance, or omitting the finding would all misrepresent the facts.',
        difficulty: 'Medium',
    },
    // Foundations Q16 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'The IIA Standards require that the internal audit activity be free from interference in determining its scope. This requirement primarily supports:',
        options: [
            'The administrative efficiency of the internal audit department\'s daily operations and staffing',
            'Organizational independence, which ensures that audit work is conducted without undue influence',
            'The external auditor\'s ability to rely on internal audit work for their statutory audit opinion',
            'The auditee\'s right to limit the scope of testing to areas they consider relevant and material',
        ],
        correctAnswer: 1,
        explanation: 'Freedom from interference in determining scope, performing work, and communicating results is essential to organizational independence. This ensures the internal audit activity can objectively evaluate the organization without management or other parties limiting coverage. It is not primarily about administrative efficiency, external auditor reliance, or auditee preferences.',
        difficulty: 'Medium',
    },
    // Foundations Q17 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'The internal audit activity\'s role in an organization is best described as:',
        options: [
            'Approving transactions and authorizing payments to ensure accuracy and proper documentation',
            'An independent and objective function that evaluates risk management, control, and governance',
            'Preparing financial statements and ensuring they conform to applicable accounting standards',
            'Managing operational processes to achieve efficiency targets set by the board of directors',
        ],
        correctAnswer: 1,
        explanation: 'Internal audit provides independent, objective evaluation of the organization\'s risk management, control, and governance processes. It does not approve transactions (that is a management function), prepare financial statements (that is accounting), or manage operations (that is management). Internal audit\'s independence from these functions is what gives it credibility.',
        difficulty: 'Easy',
    },
    // Foundations Q18 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'During an IT audit, the internal auditor finds that the organization lacks a disaster recovery plan. The auditor\'s report should classify this as:',
        options: [
            'An observation requiring no management action since disaster recovery is an IT-only concern',
            'A low-priority finding that should be addressed only after all financial audit issues are resolved',
            'A significant finding that exposes the organization to risk of extended operational disruption',
            'A positive observation demonstrating that the organization has accepted the risk of downtime',
        ],
        correctAnswer: 2,
        explanation: 'The absence of a disaster recovery plan represents a significant control gap that exposes the organization to risk of prolonged operational disruption, data loss, and potential regulatory noncompliance. It affects the entire organization, not just IT. The auditor should communicate this as a significant finding requiring management attention and corrective action, per IIA Standards on communicating results.',
        difficulty: 'Hard',
    },
    // Foundations Q19 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'Which statement best describes the relationship between internal audit and senior management regarding corrective actions?',
        options: [
            'Internal audit has the authority to implement corrective actions directly when control weaknesses are found',
            'Senior management is responsible for deciding and implementing corrective actions based on audit findings',
            'The external audit firm determines which corrective actions management must implement after each engagement',
            'The audit committee must personally implement all corrective actions identified by the internal audit team',
        ],
        correctAnswer: 1,
        explanation: 'Management is responsible for deciding on and implementing corrective actions in response to audit findings. Internal audit\'s role is to identify issues and recommend improvements, then follow up to assess whether management has taken effective action or accepted the risk. Internal audit does not implement controls (which would impair independence), and the audit committee oversees but does not personally implement corrections.',
        difficulty: 'Medium',
    },
    // Foundations Q20 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'Supervisory review of audit workpapers is performed primarily to ensure that:',
        options: [
            'The external audit firm can avoid performing their own independent testing procedures',
            'All engagement findings result in disciplinary action against the responsible department staff',
            'Engagement objectives have been achieved and conclusions are adequately supported by evidence',
            'The auditor has spent the maximum number of budgeted hours on every testing procedure',
        ],
        correctAnswer: 2,
        explanation: 'Supervisory review ensures that engagement objectives are met, evidence supports conclusions, and workpapers comply with quality standards. It is part of the ongoing monitoring component of the QAIP. It is not intended to help external auditors avoid work, to result in disciplinary actions, or to verify that budgeted hours were fully consumed.',
        difficulty: 'Easy',
    },
    // Foundations Q21 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'An internal audit function has limited resources and cannot complete all engagements in the approved annual plan. The CAE should:',
        options: [
            'Cancel the remaining engagements without informing the audit committee of the resource constraint',
            'Hire temporary staff to complete every engagement regardless of cost or quality considerations',
            'Communicate the impact of resource limitations to senior management and the board for resolution',
            'Reduce the scope and depth of all remaining engagements equally to fit the available resources',
        ],
        correctAnswer: 2,
        explanation: 'The IIA Standards require the CAE to communicate the impact of resource limitations to senior management and the board. This allows governance bodies to make informed decisions about audit coverage, resource allocation, or risk acceptance. Canceling without disclosure, hiring regardless of quality, or uniformly reducing scope without board input are all inadequate responses.',
        difficulty: 'Medium',
    },
    // Foundations Q22 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'An internal auditor is assigned to audit the treasury function but has no experience in treasury operations. According to the IIA Standards, the auditor should:',
        options: [
            'Decline the engagement entirely since auditors must be experts in every area they audit',
            'Obtain sufficient knowledge through training or expert consultation to competently perform the work',
            'Perform the engagement without additional preparation since all business processes are similar',
            'Request that the treasury department provide a self-assessment instead of undergoing an audit',
        ],
        correctAnswer: 1,
        explanation: 'The IIA Standards require auditors to possess the knowledge, skills, and competencies needed to perform their responsibilities. When assigned to an unfamiliar area, the auditor should obtain sufficient understanding through training, research, or consultation with subject-matter experts. Auditors need not be experts in every area (they can leverage specialists), but they must achieve adequate competency. Self-assessment is not a substitute for independent audit.',
        difficulty: 'Hard',
    },
    // Foundations Q23 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'When reporting engagement results, the internal auditor should include all of the following EXCEPT:',
        options: [
            'The engagement objectives and scope of work performed during the audit engagement period',
            'Applicable conclusions, recommendations, and action plans agreed upon with management',
            'A guarantee that no other control deficiencies exist beyond those identified in the report',
            'An acknowledgment of satisfactory performance where controls are operating effectively',
        ],
        correctAnswer: 2,
        explanation: 'Audit reports should include objectives, scope, conclusions, recommendations, and management action plans. They may also acknowledge satisfactory performance. However, auditors cannot guarantee that no other deficiencies exist — audit provides reasonable, not absolute, assurance. Including such a guarantee would overstate the assurance provided and expose the organization to risk.',
        difficulty: 'Medium',
    },
    // Foundations Q24 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'The concept of "professional skepticism" in internal auditing means that the auditor should:',
        options: [
            'Assume that all management assertions are fraudulent until conclusively proven otherwise',
            'Maintain a questioning mindset and critically evaluate evidence throughout the engagement',
            'Accept all documentation provided by management at face value without further verification',
            'Limit testing to areas where management has already acknowledged known control weaknesses',
        ],
        correctAnswer: 1,
        explanation: 'Professional skepticism means maintaining a questioning mindset, being alert to conditions that may indicate misstatement or fraud, and critically evaluating evidence. It does not mean assuming everything is fraudulent (that is suspicion, not skepticism), accepting assertions at face value (that is the opposite), or limiting scope to acknowledged weaknesses (that would miss unknown issues).',
        difficulty: 'Easy',
    },
    // Foundations Q25 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'An organization recently underwent a major restructuring. The CAE should respond by:',
        options: [
            'Maintaining the existing audit plan unchanged since it was already approved by the board',
            'Waiting until the next annual planning cycle to incorporate any changes from the restructuring',
            'Reassessing risks and updating the audit plan to reflect the changed organizational environment',
            'Suspending all audit activities until the restructuring is fully completed and operations stabilize',
        ],
        correctAnswer: 2,
        explanation: 'Significant organizational changes such as restructuring alter the risk landscape. The IIA Standards require the CAE to review and adjust the audit plan as needed in response to changes in the organization\'s business, risks, operations, and priorities. Maintaining an outdated plan, waiting for the next cycle, or suspending activities would leave the organization without appropriate audit coverage during a high-risk period.',
        difficulty: 'Medium',
    },
    // Foundations Q26 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'An internal audit team is conducting a continuous auditing program using automated tools. Which of the following represents the greatest risk of this approach?',
        options: [
            'The automated tools may produce too many exceptions that require auditor judgment to evaluate',
            'Continuous auditing eliminates the need for periodic risk assessments of auditable entities',
            'Over-reliance on automated tests without validating that the underlying data is complete and accurate',
            'Continuous auditing results are always more reliable than traditional manual testing procedures',
        ],
        correctAnswer: 2,
        explanation: 'The greatest risk of continuous auditing is over-reliance on automated results without verifying data integrity. If the source data is incomplete or inaccurate, automated tests will produce misleading conclusions. Auditors must validate data completeness and accuracy before relying on automated results. Continuous auditing does not eliminate risk assessment requirements, excessive exceptions are manageable, and automated results are not inherently more reliable.',
        difficulty: 'Hard',
    },
    // Foundations Q27 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'Which of the following best describes the purpose of an engagement letter or memorandum sent before an audit begins?',
        options: [
            'To formally document the engagement objectives, scope, timing, and resource requirements',
            'To provide the auditee with a final list of all findings the auditor expects to identify',
            'To transfer legal liability for control weaknesses from the auditor to the auditee department',
            'To serve as the binding contract between the internal audit function and external regulators',
        ],
        correctAnswer: 0,
        explanation: 'An engagement letter or memorandum communicates the engagement objectives, scope, timing, and resources to the auditee before fieldwork begins. It establishes mutual understanding and expectations. It does not predict findings, transfer legal liability, or serve as a contract with regulators.',
        difficulty: 'Easy',
    },
    // Foundations Q28 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'An internal auditor observes that the accounts payable department is using an outdated procedure manual. This observation is most relevant to which engagement criteria?',
        options: [
            'The effectiveness of communication and training programs within the operational department',
            'The accuracy and timeliness of external financial reporting filed with securities regulators',
            'The physical security of assets stored in the organization\'s warehouse and distribution centers',
            'The mathematical accuracy of the general ledger balances at the end of the fiscal reporting period',
        ],
        correctAnswer: 0,
        explanation: 'An outdated procedure manual suggests that communication and training within the department may be inadequate, leading to employees following obsolete processes. This could result in errors, inefficiencies, or noncompliance. It directly relates to the effectiveness of communication and training rather than external reporting accuracy, physical asset security, or ledger mathematics.',
        difficulty: 'Medium',
    },
    // Foundations Q29 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'When the CAE determines that management has accepted a level of risk that exceeds the organization\'s risk appetite, the CAE should:',
        options: [
            'Implement controls directly to reduce the risk to an acceptable level within the department',
            'Take no action since risk acceptance decisions are exclusively management\'s responsibility',
            'Discuss the matter with senior management and, if unresolved, communicate to the board',
            'Issue a public statement to shareholders about the excessive risk level being accepted',
        ],
        correctAnswer: 2,
        explanation: 'If the CAE determines that management has accepted a risk that may be unacceptable to the organization, the Standards require discussion with senior management. If the matter is not resolved, the CAE must communicate it to the board. The CAE cannot implement controls directly (that impairs independence), cannot ignore it, and public disclosure is not the CAE\'s prerogative.',
        difficulty: 'Medium',
    },
    // Foundations Q30 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'Audit evidence is considered sufficient when it:',
        options: [
            'Includes every single document and record available in the department being audited',
            'Comes exclusively from external sources outside the organization being audited',
            'Is factual, adequate, and convincing enough that a prudent person would reach similar conclusions',
            'Has been certified by a licensed attorney as legally admissible in a court of law proceeding',
        ],
        correctAnswer: 2,
        explanation: 'Sufficient evidence is factual, adequate, and convincing enough that a prudent, informed person would reach the same conclusions as the auditor. It does not require examining every document, relying only on external sources, or obtaining legal certification. The auditor uses professional judgment to determine when enough appropriate evidence has been obtained.',
        difficulty: 'Easy',
    },
    // Foundations Q31 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'An internal audit function has been providing consulting advice to a project team for several months. The CAE now receives a request for an assurance engagement over the same project. The CAE should:',
        options: [
            'Decline the assurance engagement permanently since the consulting work creates an irreconcilable conflict',
            'Proceed with the assurance engagement using the same auditors who provided the consulting advice',
            'Evaluate whether objectivity can be maintained and assign different auditors if an impairment exists',
            'Request the external auditor to perform the assurance engagement on behalf of the internal audit team',
        ],
        correctAnswer: 2,
        explanation: 'The IIA Standards recognize that consulting engagements can create objectivity concerns for subsequent assurance work. The CAE should evaluate whether objectivity can be maintained. If the same auditors who consulted perform the assurance work, a self-review threat exists. Assigning different auditors with no involvement in the consulting can mitigate this. A blanket decline or automatic outsourcing is unnecessary if objectivity can be preserved.',
        difficulty: 'Hard',
    },
    // Foundations Q32 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'Internal audit\'s responsibility for monitoring the disposition of audit findings includes ensuring that:',
        options: [
            'All findings are reported to external regulators within thirty calendar days of identification',
            'Management\'s corrective actions are implemented or that management has accepted the residual risk',
            'The external audit firm agrees with every finding before management is required to take action',
            'Audit staff personally implement the corrective actions to guarantee timely completion of remediation',
        ],
        correctAnswer: 1,
        explanation: 'The CAE must establish and maintain a system to monitor the disposition of results communicated to management. This includes verifying that corrective actions have been effectively implemented or that senior management has accepted the risk of not acting. External regulator reporting, external auditor agreement, and auditor implementation of corrective actions are not part of this monitoring responsibility.',
        difficulty: 'Medium',
    },
    // Foundations Q33 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'Which of the following audit procedures provides the strongest evidence regarding the physical existence of inventory?',
        options: [
            'Reviewing management\'s written representations about inventory quantities and condition',
            'Recalculating the inventory balance using unit costs and quantities from the accounting system',
            'Sending a confirmation letter to the warehouse manager asking them to verify quantities',
            'Performing a physical observation and count of inventory items at the warehouse location',
        ],
        correctAnswer: 3,
        explanation: 'Physical observation and counting provides the strongest evidence of inventory existence because the auditor directly verifies the assets. Management representations are self-serving, recalculation tests mathematical accuracy but not physical existence, and confirmation from an internal manager is less reliable than independent observation. Direct evidence from the auditor\'s own observation is the most compelling.',
        difficulty: 'Easy',
    },
    // Foundations Q34 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'The IIA\'s Mission Statement declares that internal audit enhances and protects organizational value by providing:',
        options: [
            'Unlimited assurance on all aspects of operations, compliance, and financial reporting processes',
            'Risk-based and objective assurance, advice, and insight to organizational governance processes',
            'An independent replacement for external audit services at a reduced cost to the organization',
            'Legal and regulatory compliance certification services to government authorities and regulators',
        ],
        correctAnswer: 1,
        explanation: 'The IIA Mission of Internal Audit states: "To enhance and protect organizational value by providing risk-based and objective assurance, advice, and insight." It emphasizes risk-based work, objectivity, and value creation. Internal audit does not provide unlimited assurance, replace external audit, or certify compliance to regulators.',
        difficulty: 'Medium',
    },
    // Foundations Q35 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Foundations of Internal Auditing',
        stem: 'During a governance review, the CAE discovers that the audit committee lacks a member with financial expertise as required by regulations. The CAE should:',
        options: [
            'Ignore the observation since the composition of the audit committee is outside the scope of internal audit',
            'Offer to serve on the audit committee temporarily to fill the financial expertise gap until a replacement is found',
            'Report the governance deficiency to the full board and recommend that the committee composition be addressed',
            'Appoint an internal audit staff member with accounting credentials to serve on the audit committee',
        ],
        correctAnswer: 2,
        explanation: 'Internal audit has a responsibility to evaluate governance processes. A deficiency in audit committee composition is a governance matter that should be reported to the full board. The CAE should not ignore governance gaps. Neither the CAE nor audit staff should serve on the audit committee, as this would impair organizational independence. The recommendation should be directed to the appropriate governing body.',
        difficulty: 'Hard',
    },

    // ===== Domain B: Ethics and Professionalism (15%) — 15 NEW questions =====

    // Ethics Q1 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'An internal auditor learns confidential information during an engagement about an upcoming company acquisition. The auditor should:',
        options: [
            'Share the information with close friends who might benefit from the investment opportunity',
            'Protect the information and not use it for personal advantage or disclose it inappropriately',
            'Post the information anonymously on social media to promote corporate transparency values',
            'Provide the information to a competing firm to demonstrate good faith within the industry',
        ],
        correctAnswer: 1,
        explanation: 'The IIA Code of Ethics requires auditors to be prudent in the use and protection of information acquired in the course of their duties. They shall not use information for personal gain or in any manner contrary to the law or to the detriment of the organization. Sharing with friends, posting publicly, or disclosing to competitors all violate the confidentiality principle.',
        difficulty: 'Easy',
    },
    // Ethics Q2 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'An auditor is offered a permanent management position in the department they recently audited. Which ethical concern is most relevant?',
        options: [
            'The auditor\'s future objectivity regarding previous audit conclusions and recommendations issued',
            'The auditor\'s ability to maintain continuing professional education credits in their new role',
            'The potential increase in the auditor\'s compensation compared to the internal audit pay scale',
            'The impact on the internal audit department\'s travel budget if the auditor transfers departments',
        ],
        correctAnswer: 0,
        explanation: 'The primary ethical concern is objectivity. If the auditor takes a management role in a department they recently audited, they may be responsible for implementing their own recommendations or may have incentive to defend their prior conclusions. The IIA Standards require a cooling-off period or safeguards. Compensation, CPE, and travel budgets are administrative matters, not ethical concerns.',
        difficulty: 'Medium',
    },
    // Ethics Q3 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'The IIA Code of Ethics principle of integrity requires internal auditors to:',
        options: [
            'Perform their work with honesty, diligence, and a sense of responsibility to stakeholders',
            'Guarantee that every engagement will identify all material errors and instances of fraud',
            'Obtain the highest level of professional certification before conducting any audit engagement',
            'Ensure that all engagement findings are favorable to the organization\'s public reputation',
        ],
        correctAnswer: 0,
        explanation: 'Integrity under the IIA Code of Ethics means performing work with honesty, diligence, and responsibility. It establishes trust and provides the basis for reliance on the auditor\'s judgment. It does not require guaranteeing detection of all errors, mandating specific certifications, or producing favorable findings.',
        difficulty: 'Easy',
    },
    // Ethics Q4 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'An internal auditor has a significant financial investment in a company that is a major supplier to the organization. The auditor is assigned to audit the procurement function. The auditor should:',
        options: [
            'Proceed with the engagement since the investment is in the supplier, not the auditor\'s employer',
            'Disclose the financial interest to the CAE and request reassignment from the engagement',
            'Sell the investment after the engagement is completed to avoid disrupting the audit timeline',
            'Disclose the investment in the final audit report as a note appended to the conclusion section',
        ],
        correctAnswer: 1,
        explanation: 'A significant financial interest in a supplier creates a conflict of interest when auditing the procurement function that selects and manages that supplier. The auditor could be perceived as biased in evaluating the supplier relationship. Per the IIA Code of Ethics, the auditor must disclose this impairment before the engagement begins and should be reassigned. Disclosing after the fact or in the report does not prevent the impairment.',
        difficulty: 'Medium',
    },
    // Ethics Q5 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'A CAE discovers that an internal auditor on staff has been providing confidential audit information to a competitor in exchange for personal payment. The CAE should:',
        options: [
            'Issue a verbal warning and allow the auditor to continue performing engagements under supervision',
            'Take appropriate disciplinary action and report the matter to the board and legal counsel',
            'Reassign the auditor to a different engagement where the information is less commercially sensitive',
            'Wait until the annual performance review cycle to address the matter through normal channels',
        ],
        correctAnswer: 1,
        explanation: 'Selling confidential information to a competitor is a severe violation of the IIA Code of Ethics (confidentiality and integrity), organizational policy, and potentially criminal law. The CAE must take immediate disciplinary action and involve the board and legal counsel. A verbal warning, reassignment, or delayed response are inadequate given the severity of the misconduct and potential legal implications.',
        difficulty: 'Hard',
    },
    // Ethics Q6 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'Continuing professional development (CPD) is important for internal auditors because it:',
        options: [
            'Ensures that auditors maintain and enhance the knowledge and skills needed for professional practice',
            'Guarantees that every auditor will be promoted to a senior position within a specified time frame',
            'Eliminates the requirement for supervisory review of audit workpapers and engagement conclusions',
            'Allows auditors to avoid performing engagements in areas where they lack specialized experience',
        ],
        correctAnswer: 0,
        explanation: 'The IIA Standards require internal auditors to enhance their knowledge, skills, and competencies through continuing professional development. CPD helps auditors stay current with evolving risks, techniques, standards, and regulations. It does not guarantee promotion, eliminate supervisory review, or excuse auditors from challenging engagements.',
        difficulty: 'Medium',
    },
    // Ethics Q7 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'An internal auditor is pressured by management to change a finding from "significant" to "minor" in the final report. The auditor should:',
        options: [
            'Change the rating as requested to maintain a positive working relationship with management',
            'Refuse to change the rating if it is supported by evidence, and escalate to the CAE if needed',
            'Remove the finding entirely from the report to avoid any potential conflict with management',
            'Agree to change the rating but add a hidden footnote explaining the original classification',
        ],
        correctAnswer: 1,
        explanation: 'The IIA Code of Ethics requires auditors to exhibit objectivity and not subordinate their judgment to others. If the finding is supported by sufficient evidence, the auditor should not change the rating under pressure. The auditor should escalate the matter to the CAE if management persists. Changing, removing, or obscuring findings compromises the integrity and objectivity of audit reporting.',
        difficulty: 'Easy',
    },
    // Ethics Q8 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'An internal auditor who previously served as the controller for two years is asked to audit the accounting department one year after transferring to internal audit. This situation most directly creates:',
        options: [
            'A self-review threat because the auditor may be evaluating controls they previously established',
            'An advocacy threat because the auditor may be asked to represent management in regulatory matters',
            'A familiarity threat because the auditor has spent more than ten years at the same organization',
            'An intimidation threat because the current controller may attempt to pressure the former colleague',
        ],
        correctAnswer: 0,
        explanation: 'This is primarily a self-review threat — the auditor would be evaluating processes, controls, and procedures they may have designed or implemented during their time as controller. The IIA Standards recommend safeguards such as cooling-off periods (typically one year or more) and assigning different staff. While familiarity and intimidation threats may also exist, the self-review threat is most directly relevant.',
        difficulty: 'Medium',
    },
    // Ethics Q9 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'A government internal auditor discovers evidence suggesting that a senior elected official has been misusing public funds. The auditor\'s organization has a policy requiring all findings to be cleared through the official\'s office before disclosure. The auditor should:',
        options: [
            'Follow the clearing policy and submit the finding to the official\'s office as required by procedure',
            'Suppress the finding entirely to avoid political controversy and potential personal retaliation',
            'Consult with the CAE and legal counsel about appropriate reporting channels given the conflict',
            'Publish the finding immediately on a public whistleblower platform without consulting anyone',
        ],
        correctAnswer: 2,
        explanation: 'When organizational policy conflicts with ethical obligations, the auditor must seek appropriate guidance. Clearing findings through the suspected party\'s office creates an obvious conflict. The auditor should consult with the CAE and legal counsel to identify proper reporting channels that protect the investigation and the public interest. Suppressing findings or making unauthorized public disclosures are both inappropriate.',
        difficulty: 'Hard',
    },
    // Ethics Q10 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'Which of the following activities would most likely impair an internal auditor\'s objectivity?',
        options: [
            'Reviewing a contract negotiated by a department the auditor has never previously interacted with',
            'Auditing the implementation of a system that the auditor selected and recommended to management',
            'Performing a risk assessment of a newly established business unit in a region the auditor has visited',
            'Interviewing employees in a department where the auditor has no personal or financial connections',
        ],
        correctAnswer: 1,
        explanation: 'Auditing a system that the auditor personally selected and recommended creates a self-review threat that impairs objectivity. The auditor has a vested interest in finding that their own recommendation was sound. The other options do not present objectivity impairments — reviewing unfamiliar contracts, assessing new business units, and interviewing employees with no personal connections are routine audit activities.',
        difficulty: 'Easy',
    },
    // Ethics Q11 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'An internal auditor is asked to provide testimony in a legal proceeding about information obtained during an engagement. The auditor should:',
        options: [
            'Refuse to testify under all circumstances since audit information is permanently privileged',
            'Testify freely about all information without consulting the organization\'s legal counsel first',
            'Consult with legal counsel and the CAE to determine what can be disclosed under applicable law',
            'Provide only information that supports the organization\'s legal position in the court proceedings',
        ],
        correctAnswer: 2,
        explanation: 'When asked to testify, the auditor should consult with the organization\'s legal counsel and the CAE to determine what information can appropriately be disclosed under applicable laws and regulations. Audit information may or may not be privileged depending on jurisdiction. The auditor should not refuse categorically, testify without guidance, or selectively disclose only favorable information.',
        difficulty: 'Medium',
    },
    // Ethics Q12 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'An internal auditor receives an anonymous tip alleging misconduct by the CFO. The auditor should:',
        options: [
            'Investigate the allegation independently without informing anyone in the organization about the tip',
            'Dismiss the tip because anonymous allegations are inherently unreliable and cannot be substantiated',
            'Report the tip to the CAE, who should determine the appropriate course of action and escalation',
            'Confront the CFO directly with the allegations to give them an opportunity to explain immediately',
        ],
        correctAnswer: 2,
        explanation: 'Anonymous tips should be taken seriously and reported to the CAE for evaluation. The CAE is responsible for determining the appropriate response, which may include escalation to the audit committee given the seniority of the alleged perpetrator. Independent investigation without oversight, dismissal of the tip, or direct confrontation of the CFO are all inappropriate initial responses.',
        difficulty: 'Medium',
    },
    // Ethics Q13 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'The IIA Standards state that organizational independence is achieved when the CAE reports to a level within the organization that allows the internal audit activity to fulfill its responsibilities. Which of the following arrangements best achieves this independence?',
        options: [
            'The CAE reports functionally to the audit committee and administratively to the chief executive officer',
            'The CAE reports both functionally and administratively to the chief financial officer of the organization',
            'The CAE reports functionally to the chief operating officer and administratively to the board chairperson',
            'The CAE reports both functionally and administratively to the vice president of finance and accounting',
        ],
        correctAnswer: 0,
        explanation: 'Organizational independence is best achieved when the CAE reports functionally to the board or audit committee (for charter approval, plan approval, CAE evaluation) and administratively to the CEO (for day-to-day operations, budget, HR). Reporting to the CFO, COO, or VP of finance for functional matters creates a conflict since these are auditable functions. Functional reporting must go to the highest governance level.',
        difficulty: 'Hard',
    },
    // Ethics Q14 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'Which of the following behaviors violates the IIA Code of Ethics principle of competency?',
        options: [
            'Completing an engagement and communicating results within the agreed-upon timeframe and budget',
            'Undertaking an audit engagement in an area where the auditor lacks the required skills or knowledge',
            'Attending industry conferences and training sessions to maintain current knowledge and expertise',
            'Consulting with subject-matter experts when the engagement requires specialized technical knowledge',
        ],
        correctAnswer: 1,
        explanation: 'The competency principle requires auditors to apply the knowledge, skills, and experience needed in their work. Undertaking an engagement without the required competency — and without obtaining it through training or expert assistance — violates this principle. Completing work on time, attending training, and consulting experts all demonstrate appropriate competency practices.',
        difficulty: 'Easy',
    },
    // Ethics Q15 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Ethics and Professionalism',
        stem: 'An internal auditor discovers that a colleague has been falsifying time records on audit engagements. The auditor\'s ethical obligation is to:',
        options: [
            'Ignore the behavior since it does not directly affect the quality of the audit work performed',
            'Report the matter to the CAE or appropriate authority within the organization for investigation',
            'Confront the colleague privately and ask them to correct their behavior without further escalation',
            'Begin falsifying their own records to maintain consistency within the department\'s reporting system',
        ],
        correctAnswer: 1,
        explanation: 'The IIA Code of Ethics requires auditors to act with integrity and report unethical behavior. Falsifying time records is dishonest and may affect resource allocation, engagement budgets, and audit quality assessments. The auditor should report the matter to the CAE or appropriate authority. Ignoring it, handling it privately, or joining in the behavior are all inconsistent with the integrity principle.',
        difficulty: 'Medium',
    },

    // ===== Domain C: Governance (15%) — 15 NEW questions =====

    // Governance Q1 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'The primary purpose of corporate governance is to:',
        options: [
            'Maximize the short-term share price of the organization for the benefit of current investors',
            'Ensure accountability, fairness, and transparency in the organization\'s relationship with stakeholders',
            'Eliminate all organizational risk by implementing comprehensive controls across every process',
            'Consolidate all decision-making authority with the chief executive officer for operational efficiency',
        ],
        correctAnswer: 1,
        explanation: 'Corporate governance provides the structure through which organizational objectives are set and the means of achieving those objectives and monitoring performance. Its purpose is ensuring accountability, fairness, transparency, and responsibility in relationships with all stakeholders. It does not focus solely on share price, cannot eliminate all risk, and should not concentrate all authority in one individual.',
        difficulty: 'Easy',
    },
    // Governance Q2 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'In the Three Lines Model, which body has ultimate accountability for governance and oversight of the organization?',
        options: [
            'The internal audit function as the independent third line of assurance for the organization',
            'The risk management function as the second line responsible for monitoring all risk exposures',
            'The governing body, typically the board of directors, which oversees all three lines of activity',
            'The external audit firm engaged to provide the annual statutory audit opinion on financials',
        ],
        correctAnswer: 2,
        explanation: 'The Three Lines Model (IIA, 2020) designates the governing body (board of directors) as having ultimate accountability for oversight of the organization. The first line (management) owns and manages risk, the second line (risk and compliance) provides expertise and challenge, and the third line (internal audit) provides independent assurance. External audit is outside the model\'s organizational structure.',
        difficulty: 'Medium',
    },
    // Governance Q3 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'The audit committee\'s primary role in governance is to:',
        options: [
            'Oversee the organization\'s financial reporting, internal controls, and audit processes',
            'Manage the daily operations of the accounting and finance department on behalf of the board',
            'Perform the detailed testing of internal controls that would otherwise be done by auditors',
            'Negotiate and sign contracts with external service providers on behalf of the full board',
        ],
        correctAnswer: 0,
        explanation: 'The audit committee, a subcommittee of the board, provides oversight of financial reporting, internal controls, and the audit process (both internal and external). It does not manage daily operations, perform detailed control testing, or negotiate contracts. Its role is governance oversight, not management execution.',
        difficulty: 'Easy',
    },
    // Governance Q4 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'An organization\'s code of conduct is a governance mechanism that primarily serves to:',
        options: [
            'Define specific accounting policies and procedures for preparing the financial statements',
            'Establish expected behaviors and ethical standards for all employees and stakeholders',
            'Replace the need for internal audit by providing self-regulation across all departments',
            'Set the technical specifications for the organization\'s information technology infrastructure',
        ],
        correctAnswer: 1,
        explanation: 'A code of conduct establishes the expected behaviors, ethical standards, and values that guide employee conduct throughout the organization. It is a governance tool that supports the control environment by communicating expectations. It does not define accounting policies, replace internal audit, or address IT specifications.',
        difficulty: 'Medium',
    },
    // Governance Q5 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'An internal auditor is evaluating the effectiveness of the board of directors. Which of the following indicators would suggest the board governance is ineffective?',
        options: [
            'The board regularly reviews and challenges management\'s strategic plans and risk assessments',
            'Board members receive comprehensive meeting materials well in advance of each scheduled meeting',
            'The board has no independent directors and all members hold senior management positions',
            'The board maintains a formal charter that clearly defines its roles and key responsibilities',
        ],
        correctAnswer: 2,
        explanation: 'A board composed entirely of management insiders with no independent directors lacks the objectivity needed for effective governance oversight. Independent directors provide unbiased challenge and oversight of management. Regular review of strategy, advance distribution of materials, and a formal charter are all indicators of effective governance. The absence of independent directors is a significant governance deficiency.',
        difficulty: 'Hard',
    },
    // Governance Q6 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'Internal audit\'s role in the governance process includes all of the following EXCEPT:',
        options: [
            'Making final decisions on the organization\'s strategic direction and business objectives',
            'Evaluating the design and effectiveness of the organization\'s ethics and compliance programs',
            'Assessing whether IT governance supports the organization\'s strategies and overall objectives',
            'Reviewing the process by which the organization communicates values and risk information',
        ],
        correctAnswer: 0,
        explanation: 'Internal audit evaluates governance processes but does not make strategic decisions — that is the responsibility of the board and senior management. Internal audit\'s governance role includes evaluating ethics programs, assessing IT governance, reviewing communication processes, and providing assurance that governance structures are functioning effectively. Decision-making authority rests with management and the board.',
        difficulty: 'Medium',
    },
    // Governance Q7 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'A whistleblower hotline is an example of a governance mechanism designed to:',
        options: [
            'Replace the internal audit function with employee-driven monitoring of organizational processes',
            'Provide a confidential channel for reporting suspected misconduct or unethical behavior',
            'Guarantee that every reported allegation will result in termination of the accused employee',
            'Transfer liability for corporate misconduct from the organization to individual employees',
        ],
        correctAnswer: 1,
        explanation: 'A whistleblower hotline provides a confidential (often anonymous) mechanism for employees and stakeholders to report suspected misconduct, fraud, or ethical violations. It supports the governance framework by enabling early detection of issues. It does not replace internal audit, guarantee specific outcomes, or transfer legal liability.',
        difficulty: 'Easy',
    },
    // Governance Q8 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'The concept of "tone at the top" in governance refers to:',
        options: [
            'The volume and frequency of communications issued by the marketing department to customers',
            'The ethical climate established by senior leadership through their words, actions, and decisions',
            'The specific audit procedures selected by the internal audit team for each individual engagement',
            'The interest rate environment established by central banks that affects the organization\'s borrowing',
        ],
        correctAnswer: 1,
        explanation: 'Tone at the top refers to the ethical climate and culture that senior leadership creates through their behavior, decisions, communications, and actions. It is a critical element of the COSO control environment component. When leaders demonstrate integrity and ethical behavior, it sets expectations throughout the organization. It is not related to marketing communications, audit procedures, or interest rates.',
        difficulty: 'Medium',
    },
    // Governance Q9 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'An organization\'s governance framework includes a related-party transactions policy. Internal audit should evaluate whether this policy:',
        options: [
            'Prohibits all transactions between the organization and any parties related to board members',
            'Requires proper disclosure, independent review, and board approval for related-party transactions',
            'Has been approved by the organization\'s external legal counsel rather than the board of directors',
            'Applies only to transactions exceeding one million dollars in total value during the fiscal year',
        ],
        correctAnswer: 1,
        explanation: 'A sound related-party transactions policy requires disclosure of relationships, independent review of terms and conditions, and board or committee approval to ensure transactions are conducted at arm\'s length. Outright prohibition of all related-party transactions is impractical, external legal approval does not substitute for board governance, and arbitrary dollar thresholds leave lower-value conflicts unaddressed.',
        difficulty: 'Hard',
    },
    // Governance Q10 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'Which of the following is a key characteristic of effective organizational governance?',
        options: [
            'Concentrating all oversight responsibilities in a single individual for streamlined decision-making',
            'Transparency in reporting organizational performance, risks, and internal control effectiveness',
            'Minimizing board involvement in strategic decisions to allow management complete autonomy',
            'Avoiding documentation of governance processes to maintain flexibility in changing environments',
        ],
        correctAnswer: 1,
        explanation: 'Effective governance requires transparency in reporting performance, risks, and control effectiveness to stakeholders. Concentrating oversight in one person, minimizing board involvement, and avoiding documentation all undermine the governance framework. Transparency enables stakeholders to make informed decisions and hold management accountable.',
        difficulty: 'Easy',
    },
    // Governance Q11 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'In the Three Lines Model, the second line provides expertise, support, monitoring, and challenge related to managing risk. Which of the following is a typical second-line function?',
        options: [
            'An operational business unit that generates revenue and manages customer-facing processes daily',
            'The internal audit function that provides independent assurance on risk management and controls',
            'The compliance function that monitors adherence to laws, regulations, and organizational policies',
            'The board of directors that provides ultimate governance oversight over the entire organization',
        ],
        correctAnswer: 2,
        explanation: 'The second line includes functions like compliance, risk management, quality, and financial control that provide expertise, monitoring, and challenge to the first line. Operational business units are the first line, internal audit is the third line, and the board is the governing body that oversees all three lines. The compliance function\'s role in monitoring regulatory adherence is a classic second-line activity.',
        difficulty: 'Medium',
    },
    // Governance Q12 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'An organization is establishing an enterprise-wide governance framework. The most important first step is to:',
        options: [
            'Hire additional internal audit staff to monitor every governance activity across all departments',
            'Define clear roles, responsibilities, and accountability structures for the board and management',
            'Purchase governance software to automate all compliance tracking and reporting requirements',
            'Conduct a benchmarking study comparing the organization\'s practices with ten industry competitors',
        ],
        correctAnswer: 1,
        explanation: 'The foundation of any governance framework is clearly defined roles, responsibilities, and accountability structures. Without knowing who is responsible for what, other governance activities cannot function effectively. Technology, additional staff, and benchmarking may be useful later, but they cannot substitute for clear accountability as the starting point.',
        difficulty: 'Medium',
    },
    // Governance Q13 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'During a governance assessment, an internal auditor finds that the board has delegated all risk oversight to the CEO with no board-level risk committee. This arrangement is concerning because:',
        options: [
            'It complies with governance best practices since the CEO is best positioned to manage all risks',
            'It creates a concentration of authority that limits the board\'s ability to provide independent oversight',
            'It automatically violates securities laws in all jurisdictions where the organization operates',
            'It eliminates the need for internal audit to perform any risk-related assurance engagements',
        ],
        correctAnswer: 1,
        explanation: 'Delegating all risk oversight to the CEO without board-level involvement creates a concentration of authority that undermines the board\'s governance role. The board has ultimate accountability for risk oversight and should maintain active involvement through a risk committee or equivalent. This is not automatically illegal in all jurisdictions, but it represents a governance deficiency. Internal audit\'s risk assurance role continues regardless of oversight structure.',
        difficulty: 'Hard',
    },
    // Governance Q14 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'Organizational policies and procedures are governance tools that primarily serve to:',
        options: [
            'Eliminate the need for management judgment in operational decisions across all departments',
            'Provide a structured framework for consistent decision-making and organizational behavior',
            'Guarantee that the organization will never experience losses from operational risk events',
            'Replace the board\'s oversight function with automated rules that require no human intervention',
        ],
        correctAnswer: 1,
        explanation: 'Policies and procedures provide a structured framework that promotes consistent decision-making and behavior aligned with organizational objectives. They guide, but do not eliminate, management judgment. They reduce but cannot guarantee zero losses, and they complement rather than replace board oversight.',
        difficulty: 'Easy',
    },
    // Governance Q15 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Governance',
        stem: 'An effective governance structure requires appropriate information flows. Which of the following best supports governance information needs?',
        options: [
            'Restricting all management information to the CEO to prevent information overload at the board level',
            'Providing the board with timely, relevant, and accurate information on risks, performance, and controls',
            'Limiting board reporting to annual financial statements with no interim updates on organizational risks',
            'Allowing each department to determine independently what information the board should receive',
        ],
        correctAnswer: 1,
        explanation: 'Effective governance depends on the board receiving timely, relevant, and accurate information about risks, performance, and controls. This enables informed oversight and decision-making. Restricting information to the CEO, limiting reporting to annual statements, or allowing departments to self-select board information all impede the board\'s ability to fulfill its governance responsibilities.',
        difficulty: 'Medium',
    },

    // ===== Domain D: Risk Management and Control (20%) — 20 NEW questions =====

    // Risk Q1 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'Inherent risk is best defined as:',
        options: [
            'The risk that remains after management has implemented risk responses and control activities',
            'The level of risk present before any controls or mitigation actions are applied by management',
            'The risk that internal audit will fail to detect a material misstatement in financial reporting',
            'The risk that external factors will prevent the organization from achieving revenue targets',
        ],
        correctAnswer: 1,
        explanation: 'Inherent risk is the risk to an entity in the absence of any actions management might take to alter either the risk\'s likelihood or impact. It represents the raw exposure before controls are applied. Residual risk is what remains after controls. Detection risk relates to audit effectiveness. External factor risk is one type of risk but not the definition of inherent risk.',
        difficulty: 'Easy',
    },
    // Risk Q2 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'According to COSO\'s Internal Control framework, which component involves selecting and developing general and application controls over technology?',
        options: [
            'Risk assessment component which identifies and analyzes relevant risks to achieving objectives',
            'Control activities component which includes policies and procedures that help ensure management directives',
            'Monitoring activities component which evaluates the quality of internal control over a period of time',
            'Information and communication component which identifies and captures relevant quality information',
        ],
        correctAnswer: 1,
        explanation: 'Control activities include the policies, procedures, and practices that ensure management directives are carried out. This component explicitly includes technology general controls (access security, system development, change management) and application controls (input validation, processing checks). Risk assessment identifies risks, monitoring evaluates control quality, and information/communication ensures data flows appropriately.',
        difficulty: 'Medium',
    },
    // Risk Q3 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'A preventive control is designed to:',
        options: [
            'Identify and report errors or irregularities after they have already occurred in operations',
            'Stop undesirable events from occurring before they happen through proactive design measures',
            'Restore systems and data to their original state after an interruption or incident occurs',
            'Transfer the financial impact of a risk event to an insurance company or third party',
        ],
        correctAnswer: 1,
        explanation: 'Preventive controls are designed to deter or prevent undesirable events before they occur. Examples include access controls, authorization requirements, and segregation of duties. Detective controls identify issues after they happen, corrective controls restore normal operations, and risk transfer is a risk response strategy rather than a control type.',
        difficulty: 'Easy',
    },
    // Risk Q4 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'A company implements a new automated three-way matching system that compares purchase orders, receiving reports, and vendor invoices before approving payments. This is an example of:',
        options: [
            'A corrective control that repairs payment errors after they have been processed by the system',
            'A detective control that identifies payment discrepancies in the monthly reconciliation process',
            'A preventive application control that stops incorrect payments before they are processed',
            'A directive control that communicates management\'s intention regarding payment procedures',
        ],
        correctAnswer: 2,
        explanation: 'Three-way matching is a preventive application control because it stops incorrect payments before they are processed by requiring agreement among the purchase order, receiving report, and invoice. It prevents rather than detects errors. It operates at the application (transaction processing) level rather than the general IT control level. Corrective controls fix after the fact, and directive controls are policies that guide behavior.',
        difficulty: 'Medium',
    },
    // Risk Q5 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'An organization\'s risk register shows that a specific risk has high impact and high likelihood, but management decides to accept the risk without any mitigation. The internal auditor should:',
        options: [
            'Take no action since risk acceptance is an appropriate risk response under all circumstances',
            'Implement compensating controls directly to reduce the risk without management involvement',
            'Evaluate whether the accepted risk exceeds the organization\'s risk appetite and report accordingly',
            'Immediately escalate the matter to external regulators as a violation of risk management standards',
        ],
        correctAnswer: 2,
        explanation: 'While risk acceptance is a valid response, the auditor should evaluate whether the level of accepted risk is consistent with the organization\'s risk appetite as established by the board. If the accepted risk exceeds risk appetite, the CAE should discuss with senior management and, if unresolved, communicate to the board. Blanket acceptance without scrutiny, direct auditor intervention in controls, or external escalation without internal resolution are not appropriate first responses.',
        difficulty: 'Hard',
    },
    // Risk Q6 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'The COSO framework identifies five components of internal control. Which component focuses on identifying, capturing, and exchanging information needed to conduct, manage, and control operations?',
        options: [
            'Control environment, which establishes the organization\'s ethical standards and governance structure',
            'Risk assessment, which identifies and analyzes risks that may prevent achievement of objectives',
            'Information and communication, which ensures relevant data flows to support internal control',
            'Monitoring activities, which evaluates whether internal control components are present and functioning',
        ],
        correctAnswer: 2,
        explanation: 'The Information and Communication component of COSO involves identifying, capturing, and exchanging information in a form and timeframe that enables people to carry out their responsibilities. It includes both internal and external communication. Control environment sets the foundation, risk assessment evaluates threats, and monitoring assesses ongoing effectiveness.',
        difficulty: 'Medium',
    },
    // Risk Q7 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'Risk tolerance is best described as:',
        options: [
            'The broad amount and type of risk the organization is willing to accept to achieve its strategy',
            'The acceptable level of variation in performance relative to the achievement of specific objectives',
            'The maximum total loss the organization can absorb before declaring financial insolvency',
            'The process of identifying and cataloging all potential risks across the entire organization',
        ],
        correctAnswer: 1,
        explanation: 'Risk tolerance refers to the acceptable variation in performance around specific objectives. It is more specific than risk appetite (which is the broad, organization-wide willingness to accept risk). Risk tolerance translates risk appetite into measurable limits at the operational level. Risk capacity is the maximum risk an organization can bear, and risk identification is a separate process.',
        difficulty: 'Easy',
    },
    // Risk Q8 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'A manufacturing company purchases insurance to cover potential losses from natural disasters. This risk response strategy is known as:',
        options: [
            'Risk avoidance, where the organization eliminates the activity giving rise to the risk entirely',
            'Risk reduction, where the organization implements controls to lower the likelihood of the event',
            'Risk sharing or transfer, where the organization shifts the financial impact to a third party',
            'Risk acceptance, where the organization takes no action and absorbs any losses that may arise',
        ],
        correctAnswer: 2,
        explanation: 'Purchasing insurance is a risk sharing (or transfer) strategy because the organization shifts the financial impact of a loss to the insurance company. Risk avoidance would mean ceasing the activity, risk reduction would involve controls to lower likelihood or impact, and risk acceptance would mean absorbing losses without any mitigation. Insurance does not prevent the event but transfers its financial consequences.',
        difficulty: 'Medium',
    },
    // Risk Q9 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'An internal auditor is evaluating an organization\'s entity-level controls. Which of the following would be considered an entity-level control rather than a process-level control?',
        options: [
            'A three-way match between purchase orders, receiving documents, and invoices in accounts payable',
            'Management\'s process for reviewing and approving the quarterly financial close and reporting cycle',
            'An input validation check that prevents alphabetic characters from being entered in numeric fields',
            'A supervisor\'s daily review and approval of individual journal entries posted by accounting clerks',
        ],
        correctAnswer: 1,
        explanation: 'Entity-level controls operate across the entire organization and affect multiple processes. Management\'s review of the quarterly financial close is an entity-level control that addresses risks across the financial reporting process. Three-way matching, input validation, and journal entry approval are process-level controls that operate within specific transaction cycles. Entity-level controls include those related to the control environment, risk assessment, monitoring, and organization-wide policies.',
        difficulty: 'Hard',
    },
    // Risk Q10 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'An example of a corrective control is:',
        options: [
            'A password policy requiring complex passwords and regular changes across all system accounts',
            'A backup and recovery procedure that restores data after a system failure or incident occurs',
            'An authorization matrix requiring manager approval before purchase orders can be submitted',
            'An automated input validation edit check that rejects transactions with incomplete data fields',
        ],
        correctAnswer: 1,
        explanation: 'A backup and recovery procedure is a corrective control because it restores data and operations after an incident has occurred. Password policies and authorization matrices are preventive controls (they prevent unauthorized access and unapproved purchases). Input validation edits are also preventive controls that stop errors before processing. Corrective controls address issues after they happen.',
        difficulty: 'Easy',
    },
    // Risk Q11 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'An organization uses Key Risk Indicators (KRIs) as part of its risk management process. The primary purpose of KRIs is to:',
        options: [
            'Provide early warning signals that risk exposure may be increasing beyond acceptable thresholds',
            'Replace the need for periodic internal audit engagements over the organization\'s risk framework',
            'Guarantee that no risk event will materialize as long as all indicators remain within defined limits',
            'Serve as the sole basis for the external auditor\'s opinion on the effectiveness of internal controls',
        ],
        correctAnswer: 0,
        explanation: 'Key Risk Indicators are metrics that provide early warning signals when risk exposure is approaching or exceeding acceptable levels. They enable proactive risk management by alerting management to emerging threats. KRIs do not replace internal audit, cannot guarantee prevention of risk events, and are not the basis for external audit opinions. They are a monitoring tool that supports the overall risk management framework.',
        difficulty: 'Medium',
    },
    // Risk Q12 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'A compensating control is best described as:',
        options: [
            'The primary control designed to address a specific risk in the most direct and efficient manner',
            'An alternative control implemented when the primary control is not feasible or cost-effective',
            'A control that automatically corrects errors without requiring any human review or intervention',
            'A control that only operates during the annual financial statement close and reporting period',
        ],
        correctAnswer: 1,
        explanation: 'A compensating control is an alternative control that mitigates risk when the ideal or primary control is not feasible, practical, or cost-effective. For example, if segregation of duties is impossible due to staffing constraints, a compensating control such as enhanced supervisory review may be implemented. It is not the primary control, not necessarily automated, and not limited to specific time periods.',
        difficulty: 'Medium',
    },
    // Risk Q13 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'An organization implements a new ERP system. From a risk and control perspective, the greatest concern during the implementation phase is:',
        options: [
            'The ERP vendor\'s stock price may decline if the implementation project does not meet its timeline',
            'Inadequate data migration, access controls, and change management may introduce significant risks',
            'The new system will automatically eliminate all pre-existing control weaknesses without configuration',
            'Internal audit should delay all technology-related engagements until the system has been live for years',
        ],
        correctAnswer: 1,
        explanation: 'ERP implementations involve major risks including data migration errors (incomplete or inaccurate conversion), access control gaps (improperly configured user permissions), and change management failures (inadequate training, resistance). These risks can undermine data integrity and operational continuity. A new system does not automatically fix pre-existing issues — it must be properly configured. Internal audit should be involved during implementation, not after.',
        difficulty: 'Hard',
    },
    // Risk Q14 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'The monitoring component of the COSO framework includes:',
        options: [
            'Ongoing evaluations and separate evaluations to assess whether internal controls are functioning',
            'The initial design and implementation of control activities at the transaction processing level',
            'Setting the organization\'s ethical values and commitment to competency for all employees',
            'Identifying external events that could affect the organization\'s ability to achieve its objectives',
        ],
        correctAnswer: 0,
        explanation: 'The monitoring component includes ongoing evaluations (built into routine operations) and separate evaluations (periodic assessments) that determine whether internal control components are present and functioning. Designing controls is part of control activities, setting ethical values is control environment, and identifying external events is part of risk assessment.',
        difficulty: 'Easy',
    },
    // Risk Q15 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'An internal auditor is testing the operating effectiveness of a manual control. Which testing approach provides the most reliable evidence?',
        options: [
            'Inquiry of the control owner asking whether the control is performed consistently and on schedule',
            'Observation of the control being performed combined with inspection of supporting documentation',
            'Review of the written policy document describing how the control is supposed to be performed',
            'Reliance on management\'s self-assessment report stating that all controls are operating effectively',
        ],
        correctAnswer: 1,
        explanation: 'Observation combined with inspection of documentation provides the most reliable evidence of operating effectiveness for manual controls. Inquiry alone is the weakest form of evidence. Policy review confirms control design but not operation. Management self-assessments are useful but less reliable than independent testing. Combining observation with document inspection corroborates that the control is actually being performed.',
        difficulty: 'Medium',
    },
    // Risk Q16 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'An organization faces a new regulatory requirement that significantly changes its compliance obligations. The risk management function should:',
        options: [
            'Wait for the regulation to be enforced before assessing its impact on the organization\'s processes',
            'Assess the impact of the new regulation, update the risk register, and recommend appropriate controls',
            'Delegate full responsibility for compliance to the legal department without further risk assessment',
            'Remove the related risk from the risk register since regulatory compliance is not a risk category',
        ],
        correctAnswer: 1,
        explanation: 'The risk management function should proactively assess the impact of new regulations, update the risk register to reflect changed compliance risks, and recommend controls to address the new requirements. Waiting for enforcement, delegating without assessment, or ignoring regulatory risk all leave the organization exposed to potential noncompliance penalties and operational disruption.',
        difficulty: 'Medium',
    },
    // Risk Q17 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'An internal auditor identifies that a key automated control in the revenue cycle has been operating with an incorrect configuration since a recent system update. The most significant implication is that:',
        options: [
            'Only transactions processed after the auditor discovered the error need to be reviewed and corrected',
            'All transactions processed since the system update may have been affected and require review',
            'The error has no significance because automated controls are inherently more reliable than manual ones',
            'The external auditor is solely responsible for identifying and remediating system configuration errors',
        ],
        correctAnswer: 1,
        explanation: 'When an automated control is misconfigured, all transactions processed since the misconfiguration occurred may be affected. Unlike manual controls where individual performance may vary, automated controls apply the same logic consistently — so an error affects every transaction. All transactions since the system update need review. Automated controls are not inherently free of error, and the external auditor does not bear sole responsibility for remediation.',
        difficulty: 'Hard',
    },
    // Risk Q18 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'Access controls over information systems are primarily classified as:',
        options: [
            'Detective controls that identify unauthorized access after it has already occurred in the system',
            'Corrective controls that restore data integrity after a security breach has been confirmed',
            'Preventive controls that restrict unauthorized users from accessing systems and sensitive data',
            'Directive controls that communicate management expectations about acceptable system usage',
        ],
        correctAnswer: 2,
        explanation: 'Access controls (passwords, biometrics, role-based permissions, multi-factor authentication) are primarily preventive because they stop unauthorized users from gaining access before any damage occurs. While access logs can serve a detective function, the controls themselves are designed to prevent unauthorized entry. Corrective controls fix issues after the fact, and directive controls provide guidance.',
        difficulty: 'Easy',
    },
    // Risk Q19 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'A risk heat map is a tool used in risk management to:',
        options: [
            'Calculate the precise financial impact of every identified risk with mathematical certainty',
            'Visually display risks based on their likelihood and impact to prioritize management attention',
            'Eliminate low-probability risks from the risk register permanently without any further assessment',
            'Assign individual accountability for each risk to specific internal audit team members only',
        ],
        correctAnswer: 1,
        explanation: 'A risk heat map visually displays risks on a matrix of likelihood and impact, allowing management to quickly identify and prioritize high-risk areas requiring attention. It does not calculate precise financial impacts, eliminate risks from consideration, or assign accountability to internal auditors. Risk ownership belongs to management, and the heat map is a prioritization and communication tool.',
        difficulty: 'Medium',
    },
    // Risk Q20 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Risk Management and Control',
        stem: 'An organization has implemented strong controls at the process level but has a weak control environment. An internal auditor should conclude that:',
        options: [
            'The strong process-level controls fully compensate for the weak control environment component',
            'The organization\'s overall internal control system is likely ineffective despite strong process controls',
            'Process-level controls and the control environment are independent and do not affect each other',
            'The control environment weakness should be ignored if no process-level exceptions are identified',
        ],
        correctAnswer: 1,
        explanation: 'The COSO framework identifies the control environment as the foundation for all other components. A weak control environment (poor tone at the top, lack of integrity, inadequate governance) undermines the effectiveness of process-level controls because management may override them or employees may not take them seriously. The overall system is likely ineffective because the foundation is compromised, regardless of process-level control strength.',
        difficulty: 'Hard',
    },

    // ===== Domain E: Fraud Risks (15%) — 15 NEW questions =====

    // Fraud Q1 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'Corruption, as a category of occupational fraud, includes all of the following EXCEPT:',
        options: [
            'Skimming cash receipts before they are recorded in the organization\'s accounting books',
            'Accepting bribes from vendors in exchange for favorable contract terms and award decisions',
            'Engaging in kickback schemes where employees receive payments from suppliers for their business',
            'Exploiting conflicts of interest where employees have undisclosed financial stakes in transactions',
        ],
        correctAnswer: 0,
        explanation: 'Skimming is a form of asset misappropriation, not corruption. The three main categories of occupational fraud per the ACFE are corruption (bribery, kickbacks, conflicts of interest, economic extortion), asset misappropriation (theft of cash or assets including skimming), and financial statement fraud. Bribery, kickbacks, and conflicts of interest are all subcategories of corruption.',
        difficulty: 'Easy',
    },
    // Fraud Q2 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'A purchasing manager consistently awards contracts to a vendor owned by a hidden business partner. This scenario is an example of:',
        options: [
            'Financial statement fraud involving deliberate manipulation of revenue recognition policies',
            'A conflict-of-interest scheme where the employee has an undisclosed relationship with the vendor',
            'An inventory theft scheme where physical assets are stolen from the organization\'s warehouse',
            'A payroll fraud scheme involving fictitious employees added to the organization\'s payroll system',
        ],
        correctAnswer: 1,
        explanation: 'This is a conflict-of-interest scheme, a subcategory of corruption. The purchasing manager has an undisclosed financial interest in the vendor and is using their position to direct business to that entity. It is not financial statement fraud (no manipulation of financial reporting), inventory theft (no physical assets stolen), or payroll fraud (no fictitious employees). Conflict of interest is one of the most common corruption schemes.',
        difficulty: 'Medium',
    },
    // Fraud Q3 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'According to fraud risk assessment principles, which of the following is an example of "opportunity" in the Fraud Triangle?',
        options: [
            'An employee facing significant personal debt and financial pressure from outstanding obligations',
            'An employee believing that taking small amounts of cash from the register is not really stealing',
            'Weak internal controls that allow an employee to process and approve their own expense reports',
            'An employee feeling underpaid and undervalued relative to their perceived contributions and effort',
        ],
        correctAnswer: 2,
        explanation: 'Opportunity refers to the conditions that allow fraud to occur, typically weak controls. An employee who can process and approve their own expense reports has opportunity due to lack of segregation of duties. Personal debt and feeling underpaid represent pressure/incentive. Believing that taking cash is acceptable represents rationalization. These are the other two elements of the Fraud Triangle.',
        difficulty: 'Easy',
    },
    // Fraud Q4 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'An organization\'s fraud risk assessment should be performed:',
        options: [
            'Only once during the organization\'s initial startup phase and never revised after that point',
            'Periodically, and updated when significant changes in the organization or environment occur',
            'Exclusively by external forensic accountants who are hired specifically for the fraud assessment',
            'Only after a fraud has been detected to determine how the existing controls failed to prevent it',
        ],
        correctAnswer: 1,
        explanation: 'Fraud risk assessments should be performed periodically and updated as the organization or its environment changes. New products, markets, technologies, or personnel changes can alter the fraud risk landscape. The assessment should be proactive, not reactive. It can be performed by internal resources (management, internal audit) and does not require external forensic accountants, though they may contribute.',
        difficulty: 'Medium',
    },
    // Fraud Q5 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'An internal auditor uses Benford\'s Law analysis on a population of vendor invoices. This analytical technique is most useful for:',
        options: [
            'Verifying the mathematical accuracy of each individual invoice total against supporting documents',
            'Identifying potentially fabricated or manipulated data by detecting deviations from expected digit patterns',
            'Confirming that all vendors in the master file are legitimate and currently active business entities',
            'Calculating the total dollar amount of fraud losses that the organization has already experienced',
        ],
        correctAnswer: 1,
        explanation: 'Benford\'s Law describes the expected frequency distribution of leading digits in naturally occurring datasets. Deviations from this pattern may indicate fabricated or manipulated data — such as fictitious invoices, duplicate payments, or amounts set just below approval thresholds. It does not verify individual invoice accuracy, confirm vendor legitimacy, or calculate fraud losses. It is a screening tool that identifies anomalies for further investigation.',
        difficulty: 'Hard',
    },
    // Fraud Q6 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'Which of the following is the most effective organizational anti-fraud control?',
        options: [
            'Relying solely on external auditors to detect all fraud during the annual statutory audit engagement',
            'A comprehensive anti-fraud program that includes prevention, detection, and response mechanisms',
            'Conducting a single background check on employees at the time of hiring with no subsequent review',
            'Eliminating the internal audit function to reduce costs and relying on management self-reporting',
        ],
        correctAnswer: 1,
        explanation: 'An effective anti-fraud program integrates prevention (strong controls, ethical culture, fraud awareness training), detection (monitoring, analytics, whistleblower mechanisms), and response (investigation protocols, disciplinary procedures). External auditors alone cannot detect all fraud, one-time background checks are insufficient, and eliminating internal audit removes a critical line of defense.',
        difficulty: 'Medium',
    },
    // Fraud Q7 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'A fictitious vendor scheme is a type of fraud where an employee:',
        options: [
            'Creates a fake vendor in the system and submits invoices for payment to themselves or accomplices',
            'Steals physical inventory from the warehouse and sells it through legitimate retail distribution',
            'Manipulates the organization\'s financial statements to inflate reported earnings to shareholders',
            'Accepts bribes from real vendors in exchange for awarding them contracts at inflated market prices',
        ],
        correctAnswer: 0,
        explanation: 'In a fictitious vendor scheme, an employee creates a fake vendor in the accounts payable system, submits fraudulent invoices, and diverts payments to themselves or an accomplice. It is a form of billing scheme under asset misappropriation. Inventory theft, financial statement manipulation, and bribery are different fraud categories with different characteristics.',
        difficulty: 'Easy',
    },
    // Fraud Q8 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'Data analytics can enhance fraud detection by enabling auditors to:',
        options: [
            'Eliminate the need for any professional judgment or skepticism during the analysis of transactions',
            'Analyze entire transaction populations to identify patterns, anomalies, and outliers for investigation',
            'Guarantee the detection of every fraudulent transaction regardless of the scheme\'s sophistication',
            'Replace all other internal controls since data analytics provides complete real-time fraud prevention',
        ],
        correctAnswer: 1,
        explanation: 'Data analytics allows auditors to analyze entire populations (not just samples) to identify unusual patterns, anomalies, duplicate transactions, and statistical outliers that may indicate fraud. However, it does not eliminate the need for professional judgment, cannot guarantee detection of all fraud (especially collusion or override), and does not replace other internal controls. Analytics is a powerful tool within a broader fraud detection program.',
        difficulty: 'Medium',
    },
    // Fraud Q9 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'The Diamond Model of fraud adds a fourth element to the Fraud Triangle. That fourth element is:',
        options: [
            'Capability — the personal traits and abilities that enable the individual to commit the fraud',
            'Detection — the organization\'s ability to identify fraudulent activities after they have occurred',
            'Regulation — the external laws and enforcement mechanisms that deter fraudulent behavior',
            'Insurance — the availability of coverage that transfers fraud losses to an external insurer',
        ],
        correctAnswer: 0,
        explanation: 'The Fraud Diamond (Wolfe and Hermanson, 2004) adds "Capability" to the three elements of the Fraud Triangle (Opportunity, Pressure, Rationalization). Capability refers to the personal traits and technical ability needed to commit and conceal fraud — such as position, intelligence, ego, coercion skills, and tolerance for stress. Detection, regulation, and insurance are external factors, not elements of the fraud model.',
        difficulty: 'Hard',
    },
    // Fraud Q10 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'Financial statement fraud typically differs from asset misappropriation in that financial statement fraud:',
        options: [
            'Is always committed by lower-level employees rather than by senior management or executives',
            'Involves deliberate misrepresentation of financial information, usually by senior management',
            'Has a lower median loss per occurrence compared to schemes involving theft of physical assets',
            'Is easily detected through routine control activities without the need for audit procedures',
        ],
        correctAnswer: 1,
        explanation: 'Financial statement fraud involves intentional misrepresentation of financial results, typically perpetrated by senior management (who have the authority and access to manipulate records). It generally has a much higher median loss than asset misappropriation, though it occurs less frequently. It is often the hardest type of fraud to detect because management can override controls. Asset misappropriation is more common but typically involves smaller amounts.',
        difficulty: 'Medium',
    },
    // Fraud Q11 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'Fraud awareness training for employees is an important anti-fraud control because it:',
        options: [
            'Teaches employees how to commit fraud more effectively so they understand the risk involved',
            'Helps employees recognize fraud indicators and understand their responsibility to report suspicions',
            'Guarantees that no employee will ever engage in fraudulent activity after completing the training',
            'Transfers the organization\'s fraud detection responsibility entirely to its general employee population',
        ],
        correctAnswer: 1,
        explanation: 'Fraud awareness training helps employees recognize red flags, understand the types of fraud that occur, and know their responsibility and channels for reporting suspicious activity. According to the ACFE, tips are the most common fraud detection method. Training does not teach fraud techniques, guarantee prevention, or transfer detection responsibility from management and audit to employees.',
        difficulty: 'Easy',
    },
    // Fraud Q12 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'An internal auditor discovers that the payroll department has been processing payments for employees who left the organization months ago. This finding most likely indicates:',
        options: [
            'A timing difference in the accounting records that will self-correct at the next period-end close',
            'A ghost employee scheme where terminated employees\' records are kept active for unauthorized payments',
            'A legitimate severance arrangement approved by the board for all departing employees going forward',
            'An immaterial administrative error that does not require any further investigation or corrective action',
        ],
        correctAnswer: 1,
        explanation: 'Payments to former employees whose records remain active in the payroll system is a classic indicator of a ghost employee scheme — a form of payroll fraud under asset misappropriation. Someone with access to the payroll system may be keeping terminated employees on the payroll and diverting their payments. This requires investigation, not dismissal as a timing difference or immaterial error.',
        difficulty: 'Medium',
    },
    // Fraud Q13 — Hard
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'When assessing the risk of management override of controls, the internal auditor should recognize that:',
        options: [
            'Management override is impossible in organizations with well-designed automated control systems',
            'Only external auditors have the authority and capability to assess management override risk factors',
            'Management override risk exists in all organizations because those with authority can circumvent controls',
            'Management override is only a concern in organizations that have previously experienced fraud events',
        ],
        correctAnswer: 2,
        explanation: 'Management override is an inherent risk in all organizations because individuals with sufficient authority can circumvent controls regardless of how well they are designed. Automated controls can be configured, disabled, or bypassed by those with administrative access. Both internal and external auditors should assess this risk. It is not limited to organizations with fraud history — it is a universal governance risk.',
        difficulty: 'Hard',
    },
    // Fraud Q14 — Easy
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'According to ACFE research, the most common method by which occupational fraud is initially detected is through:',
        options: [
            'Tips and reports from employees, customers, vendors, or other stakeholders who notice suspicious activity',
            'Routine external audits conducted by the organization\'s independent public accounting firm each year',
            'Accidental discovery by management during unrelated business activities or process review efforts',
            'Mandatory regulatory examinations performed by government oversight agencies on a scheduled basis',
        ],
        correctAnswer: 0,
        explanation: 'According to the ACFE\'s Report to the Nations, tips are consistently the most common method of initial fraud detection, accounting for approximately 43% of cases. This underscores the importance of whistleblower hotlines and reporting mechanisms. External audits, accidental discovery, and regulatory examinations each detect a smaller proportion of fraud cases.',
        difficulty: 'Easy',
    },
    // Fraud Q15 — Medium
    {
        examId: CIA_PART1_ID,
        type: 'mcq',
        domain: 'Fraud Risks',
        stem: 'An organization implements mandatory vacation policies for employees in sensitive financial positions. This policy is designed to:',
        options: [
            'Increase employee satisfaction and retention rates as part of the human resources benefits program',
            'Create an opportunity for other employees to perform the absent person\'s duties, potentially uncovering fraud',
            'Reduce the organization\'s total salary expense by encouraging employees to use unpaid leave balances',
            'Comply with labor regulations that require minimum vacation days for all full-time employees',
        ],
        correctAnswer: 1,
        explanation: 'Mandatory vacation is a fraud detection control. When employees in sensitive positions are required to take time off, someone else must perform their duties, which can reveal irregularities that the absent employee may have been concealing — such as fictitious vendors, lapping schemes, or unauthorized transactions. While it also benefits employee well-being, its primary purpose as a control is fraud detection.',
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
    console.log(`Added ${shuffled.length} NEW CIA Part 1 questions (no deletions)`);
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
