const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

const PMP_ID = '7qmPagj9A6RpkC0CwGkY';

const questions = [
    // ===== Domain I: People (42%) — 31 questions =====
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'Two team members disagree on the technical approach for a critical deliverable. The project manager should first:',
        options: [
            'Facilitate a discussion to understand each perspective and find a collaborative solution',
            'Choose the approach recommended by the more senior team member based on their organizational tenure',
            'Escalate the issue to the project sponsor immediately so they can decide the technical direction',
            'Assign the work to a third team member to avoid the conflict and keep the project on schedule',
        ],
        correctAnswer: 0,
        explanation: 'PMI emphasizes collaborative conflict resolution. The PM should first facilitate open discussion to understand root causes and find common ground. Deferring to seniority ignores potentially better ideas. Premature escalation wastes sponsor time. Reassigning avoids the problem without resolution and may create resentment.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A servant leader on an agile project primarily focuses on:',
        options: [
            'Removing impediments and enabling the team to self-organize and deliver value',
            'Making all technical decisions for the team to maintain consistent quality standards',
            'Assigning tasks to each team member daily based on workload analysis and skills',
            'Reporting team velocity to stakeholders without providing additional context',
        ],
        correctAnswer: 0,
        explanation: 'Servant leadership — a core agile principle — means the leader serves the team by removing obstacles, providing resources, and creating an environment where the team can self-organize. Making decisions for the team or assigning tasks undermines autonomy. Reporting velocity without context does not serve the team or stakeholders.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A team member consistently delivers high-quality work ahead of schedule. According to PMI best practices, the project manager should:',
        options: [
            'Recognize the achievement and tailor rewards to what motivates that individual',
            'Publicly compare other team members unfavorably to this individual during meetings',
            'Assign extra work as a reward for early completion to maximize their contribution',
            'Ignore the performance to avoid showing favoritism and maintain equal treatment',
        ],
        correctAnswer: 0,
        explanation: 'PMI emphasizes recognizing and rewarding performance in ways meaningful to the individual. Tailored recognition reinforces positive behavior. Unfavorable comparisons damage team morale. Piling on work punishes high performers. Ignoring achievement signals that performance does not matter.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A project team is newly formed and members are polite but tentative. According to Tuckman\'s model, the team is in the:',
        options: [
            'Forming stage',
            'Storming stage',
            'Norming stage',
            'Performing stage',
        ],
        correctAnswer: 0,
        explanation: 'In Tuckman\'s model, Forming is characterized by politeness, uncertainty, and dependence on the leader. Team members are getting to know each other and the project. Storming involves conflict and power struggles. Norming sees trust and cohesion developing. Performing is when the team operates autonomously and effectively.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'The project manager notices that a key stakeholder has become disengaged from project reviews. The best action is to:',
        options: [
            'Meet with the stakeholder to understand their concerns and re-establish engagement',
            'Remove the stakeholder from the communication plan since their interest has declined',
            'Continue without them since the project is progressing well and their input is optional',
            'Ask another stakeholder to represent their interests without informing them directly',
        ],
        correctAnswer: 0,
        explanation: 'Stakeholder disengagement often signals unmet needs, changing priorities, or dissatisfaction. A direct conversation uncovers the root cause and enables re-engagement. Removing them or continuing without them risks missing critical input. Having someone represent them without consent is deceptive and may misrepresent their interests.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'In a hybrid project, the team is struggling with competing priorities between sprint work and predictive milestones. The PM should:',
        options: [
            'Collaborate with the team to create an integrated plan that balances iterative delivery with milestone commitments',
            'Abandon the agile components and revert to fully predictive planning to eliminate the methodology confusion',
            'Let the team choose which methodology to follow independently without any guidance from project leadership',
            'Escalate to the PMO and request the project be cancelled because the hybrid approach has proven unworkable',
        ],
        correctAnswer: 0,
        explanation: 'Hybrid projects require balancing agile iteration with predictive structure. The PM should collaborate with the team to integrate both approaches — mapping sprint outputs to milestones and adjusting cadence as needed. Abandoning agile eliminates its benefits. Leaving the team without guidance creates confusion. Cancellation is premature and disproportionate.',
        difficulty: 'Hard',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'An agile team member is hesitant to speak up during retrospectives. The Scrum Master should:',
        options: [
            'Create a safe environment using anonymous feedback techniques and actively invite participation',
            'Require the team member to present at the next retrospective so they become comfortable speaking up',
            'Discuss the issue publicly during the retrospective to address it transparently in front of the team',
            'Remove the team member from future retrospectives since their silence adds no value to the session',
        ],
        correctAnswer: 0,
        explanation: 'Psychological safety is essential for effective retrospectives. Anonymous techniques (sticky notes, online tools) and gentle invitation reduce pressure. Requiring presentation or public discussion increases anxiety. Removing a member excludes their perspective. The Scrum Master\'s role is to facilitate an environment where everyone feels safe to contribute.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A project requires specialized skills not available on the current team. The PM should first:',
        options: [
            'Assess the skill gap, identify training options, and explore resource acquisition alternatives',
            'Reduce the project scope to match existing team capabilities without exploring other solutions',
            'Proceed with the current team and hope they can figure it out through on-the-job learning',
            'Immediately hire a full-time contractor without evaluating other options or cost impacts',
        ],
        correctAnswer: 0,
        explanation: 'PMI advocates assessing competency gaps and evaluating options: training existing team members, acquiring new resources, or partnering with other teams. Reducing scope without exploring alternatives limits value delivery. Hoping is not a strategy. Hiring without evaluation may be costly or unnecessary if training or internal transfers can close the gap.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'During a negotiation with a vendor, the project manager discovers the vendor cannot meet the original timeline. The PM should:',
        options: [
            'Explore alternative solutions and negotiate a revised agreement that protects project objectives',
            'Terminate the contract immediately and start a new procurement process with another vendor',
            'Accept the delay without negotiation to preserve the vendor relationship and avoid friction',
            'Threaten the vendor with legal action to enforce the original timeline and contract terms',
        ],
        correctAnswer: 0,
        explanation: 'PMI emphasizes win-win negotiation and protecting project objectives. Exploring alternatives (phased delivery, additional resources, scope adjustment) finds solutions that work for both parties. Termination is costly and time-consuming. Accepting without negotiation sacrifices project interests. Threats damage the relationship and may not change the reality of the situation.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A globally distributed team is experiencing communication issues due to time zone differences. The PM should:',
        options: [
            'Establish overlapping core hours, use asynchronous communication tools, and rotate meeting times fairly',
            'Require all team members to work the same hours regardless of location to maximize overlap time',
            'Communicate only with the team members in the PM\'s time zone and rely on them to relay updates',
            'Cancel all meetings and rely exclusively on email to eliminate scheduling difficulties entirely',
        ],
        correctAnswer: 0,
        explanation: 'Virtual team management requires intentional practices. Overlapping core hours enable synchronous collaboration. Asynchronous tools (shared documents, recorded updates) bridge gaps. Rotating meeting times shares the burden fairly. Requiring identical hours is impractical and disrespectful. Ignoring some team members excludes their input. Email-only communication misses the richness of real-time discussion.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A team is using the Thomas-Kilmann Conflict Model. When the situation involves trivial issues and preserving the relationship is more important than winning, which approach is most appropriate?',
        options: [
            'Accommodating',
            'Competing',
            'Avoiding',
            'Collaborating',
        ],
        correctAnswer: 0,
        explanation: 'Accommodating means yielding to the other party\'s position. It is appropriate when the issue is unimportant to you but important to the other person, or when preserving the relationship is the priority. Competing means pursuing your interests at the other\'s expense. Avoiding withdraws from the conflict entirely. Collaborating seeks a win-win but requires more time and effort than trivial issues warrant.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'Emotional intelligence in project management is most important for:',
        options: [
            'Understanding team dynamics, managing relationships, and responding effectively to stakeholder emotions',
            'Calculating earned value metrics accurately using cost and schedule performance data from the PMIS',
            'Creating detailed Gantt charts with proper dependencies, milestones, and resource assignment linkages',
            'Writing comprehensive risk registers that document all identified threats and planned response strategies',
        ],
        correctAnswer: 0,
        explanation: 'Emotional intelligence (EQ) encompasses self-awareness, self-regulation, motivation, empathy, and social skills. In project management, EQ helps PMs read team dynamics, manage difficult conversations, build trust, and respond to stakeholder concerns. EV calculations, Gantt charts, and risk registers are technical skills that require IQ and process knowledge, not emotional intelligence.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A Scrum team\'s velocity has been declining over the past three sprints. The Scrum Master should:',
        options: [
            'Use the retrospective to explore root causes such as technical debt, team morale, or impediments',
            'Add more team members to increase velocity since additional resources will boost team throughput',
            'Extend the sprint duration to allow more time for work and ensure all items are completed',
            'Set mandatory overtime until velocity recovers to the level committed in the release plan',
        ],
        correctAnswer: 0,
        explanation: 'Declining velocity signals an underlying issue. The retrospective is the proper forum to investigate root causes — technical debt, burnout, unclear requirements, or impediments. Adding members introduces coordination overhead (Brooks\'s Law). Extending sprints masks the problem. Mandatory overtime leads to burnout and further decline. The Scrum Master should facilitate problem identification and team-driven solutions.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'The product owner and development team disagree on the priority of backlog items. The Scrum Master should:',
        options: [
            'Facilitate a discussion to align priorities based on business value and team capacity',
            'Override the product owner and let the team decide priorities based on technical complexity',
            'Side with the product owner since they own the backlog and their assessment takes precedence',
            'Pause the sprint until the disagreement is resolved by upper management and governance',
        ],
        correctAnswer: 0,
        explanation: 'The Scrum Master facilitates collaboration between the product owner and the team. While the PO owns prioritization, the team provides input on feasibility and capacity. Facilitating discussion ensures both perspectives are heard and priorities reflect business value balanced with technical reality. Overriding either party undermines their role. Pausing work is unnecessary.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A project team includes members from three different countries with varying cultural norms around hierarchy and communication. The PM should:',
        options: [
            'Invest time in understanding cultural differences and adapt communication and leadership styles accordingly',
            'Impose the PM\'s own cultural norms on the entire team to create consistency and eliminate confusion',
            'Ignore cultural differences and treat everyone identically regardless of their background or preferences',
            'Separate team members by culture to avoid misunderstandings and assign them to independent work streams',
        ],
        correctAnswer: 0,
        explanation: 'PMI values diversity and cultural awareness. Understanding different norms around hierarchy, direct vs. indirect communication, and decision-making helps the PM tailor their approach. Imposing one culture is disrespectful. Ignoring differences leads to misunderstandings. Separating by culture undermines team cohesion and collaboration.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A stakeholder requests a major scope change late in the project. The PM should:',
        options: [
            'Evaluate the impact on scope, schedule, cost, and quality, then present the analysis to the change control board',
            'Reject the change outright because the project is nearly complete and modifications would be too disruptive',
            'Implement the change immediately to keep the stakeholder happy and maintain a positive relationship',
            'Defer the decision to the next project phase without analysis since time remaining is insufficient',
        ],
        correctAnswer: 0,
        explanation: 'All change requests should follow the integrated change control process regardless of timing. The PM evaluates impact across all project dimensions and presents findings to the CCB for a decision. Outright rejection ignores potentially valuable changes. Implementing without analysis risks budget and schedule. Deferring without analysis leaves the stakeholder without a response.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'When mentoring a junior project manager, the most effective approach is to:',
        options: [
            'Share experiences, provide guidance on challenging situations, and encourage the mentee to develop their own judgment',
            'Make all decisions for the junior PM to prevent mistakes and ensure project outcomes meet quality standards',
            'Assign only simple tasks that require no growth so the junior PM builds confidence without risk of failure',
            'Provide a written manual and avoid direct interaction to encourage independent problem-solving skills',
        ],
        correctAnswer: 0,
        explanation: 'Effective mentoring develops capability through shared experience, guided reflection, and progressive autonomy. Making decisions for the mentee creates dependency. Simple tasks do not develop skills. A manual without interaction misses the personal, contextual nature of mentoring. The goal is to build independent judgment, not dependence.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A team member reports that their workload is unsustainable. The PM\'s best response is to:',
        options: [
            'Review the resource allocation, reprioritize tasks, and explore options like redistributing work or adjusting timelines',
            'Tell the team member to work harder because the deadline cannot change and all resources are already committed',
            'Ignore the complaint since all team members are equally busy and addressing one concern sets a precedent',
            'Replace the team member with someone more productive who can handle the workload demands effectively',
        ],
        correctAnswer: 0,
        explanation: 'Sustainable pace is a core agile principle. The PM should take the concern seriously, review resource loading, and find solutions — redistributing work, adjusting priorities, or negotiating timelines. Demanding harder work leads to burnout and quality issues. Ignoring complaints damages trust. Replacing team members is disruptive and does not address the root cause.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'The best way to build shared understanding among diverse stakeholders is to:',
        options: [
            'Use visual tools like models, prototypes, and shared artifacts to create a common reference point',
            'Send a detailed 100-page requirements document for review and expect thorough reading before meetings',
            'Assume all stakeholders interpret requirements the same way since the documentation uses clear language',
            'Limit communication to formal written memos only to create an auditable paper trail of all interactions',
        ],
        correctAnswer: 0,
        explanation: 'Visual tools (wireframes, prototypes, story maps) create tangible reference points that bridge different perspectives and reduce misinterpretation. Long documents are often unread. Assuming shared interpretation leads to costly rework. Formal-only communication misses the richness of collaborative, visual dialogue.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'During a project kickoff, the PM defines team ground rules. Which item is most important to include?',
        options: [
            'How decisions will be made and conflicts resolved',
            'The PM\'s preferred font for documents and formatting',
            'A detailed org chart of the parent company structure',
            'The history of the project management profession',
        ],
        correctAnswer: 0,
        explanation: 'Ground rules establish behavioral expectations that enable effective teamwork. Decision-making processes and conflict resolution methods are foundational — they prevent ambiguity when disagreements arise. Document formatting, org charts, and PM history are not ground rules that govern team behavior.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A project team operates in an environment that requires compliance with strict security protocols. A new team member questions why certain procedures seem unnecessary. The PM should:',
        options: [
            'Explain the rationale behind the procedures and their connection to compliance requirements',
            'Tell the team member to follow procedures without asking questions since protocols are mandatory',
            'Remove the procedures to keep the team member happy and streamline the workflow for efficiency',
            'Assign the team member to a different project where security protocols are less strict overall',
        ],
        correctAnswer: 0,
        explanation: 'Explaining the "why" behind procedures builds understanding and buy-in. Compliance requirements exist for good reasons — connecting them to organizational or regulatory needs helps new members understand their importance. Discouraging questions stifles learning. Removing necessary procedures creates risk. Reassignment wastes a development opportunity.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'An empowered agile team is one that:',
        options: [
            'Has the authority to make decisions about how work gets done within defined boundaries',
            'Operates without any organizational constraints or reporting requirements whatsoever',
            'Relies on management to approve every task before starting any work on deliverables',
            'Follows a strict command-and-control hierarchy where all decisions flow from leadership',
        ],
        correctAnswer: 0,
        explanation: 'Empowerment in agile means the team has autonomy to decide how to achieve objectives within defined boundaries (sprint goals, organizational policies, quality standards). It does not mean zero accountability or constraints. Management approval for every task is micromanagement. Command-and-control undermines self-organization.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A functional manager refuses to release a promised resource to the project. The PM should:',
        options: [
            'Escalate through the appropriate governance channels while documenting the impact on the project',
            'Assign unqualified team members to cover the gap without informing stakeholders about the risk',
            'Confront the functional manager aggressively in front of their team to pressure the release',
            'Reduce the project scope without CCB approval to accommodate fewer resources on the team',
        ],
        correctAnswer: 0,
        explanation: 'Resource conflicts in matrix organizations are common and should be escalated through governance channels. Documenting the impact on schedule, cost, and quality provides objective data for decision-makers. Assigning unqualified resources creates quality and risk issues. Aggressive confrontation damages relationships. Scope changes require CCB approval.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'The concept of "T-shaped" team members refers to:',
        options: [
            'Individuals with deep expertise in one area and broad knowledge across other disciplines',
            'Team members who work exclusively in one technical specialty and avoid other tasks',
            'Managers who delegate tasks but never contribute technically to project deliverables',
            'Contractors who work part-time on multiple projects and split their attention',
        ],
        correctAnswer: 0,
        explanation: 'T-shaped professionals have deep vertical expertise in one domain plus broad horizontal skills across adjacent areas. This enables collaboration, flexibility, and the ability to contribute beyond a single specialty. Pure specialists (I-shaped) create bottlenecks. The concept is valued in agile teams where cross-functional collaboration is essential.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A project stakeholder with high power and high interest should be managed using which engagement strategy?',
        options: [
            'Manage closely — actively engage with regular, detailed communication',
            'Keep informed — send periodic updates but limit their involvement',
            'Monitor — track their position but minimize direct communication',
            'Keep satisfied — address concerns only when they escalate issues',
        ],
        correctAnswer: 0,
        explanation: 'The power/interest grid suggests that high-power, high-interest stakeholders need close management with frequent, detailed engagement. They can significantly impact the project and are actively interested. "Keep informed" suits high-interest, low-power stakeholders. "Keep satisfied" suits high-power, low-interest. "Monitor" suits low-power, low-interest.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A PM discovers that a team member has been working excessive overtime without reporting it. The most appropriate response is to:',
        options: [
            'Discuss the situation privately to understand why and address any underlying workload or process issues',
            'Formally reprimand the team member for not following time-tracking procedures as required by policy',
            'Praise the team member for their dedication and encourage more overtime to demonstrate commitment',
            'Report the team member to HR for policy violation since unreported overtime creates organizational risk',
        ],
        correctAnswer: 0,
        explanation: 'Unreported overtime often signals systemic issues — unrealistic estimates, scope creep, or fear of appearing slow. A private conversation uncovers the root cause and demonstrates care for the person. Immediate reprimand or HR escalation may be premature and damages trust. Praising unreported overtime normalizes unsustainable practices and hides project problems.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'During sprint planning, the team estimates that they cannot complete all the stories the product owner wants in the sprint. The Scrum Master should:',
        options: [
            'Support the team\'s estimate and help the product owner reprioritize the sprint backlog',
            'Override the team\'s estimate and commit to all stories to satisfy the product owner\'s request',
            'Add team members from another project to increase capacity so all stories can be completed',
            'Extend the sprint by one week to fit all the work and meet the product owner\'s expectations',
        ],
        correctAnswer: 0,
        explanation: 'The team is best positioned to estimate their own capacity. The Scrum Master protects this autonomy and helps facilitate prioritization with the product owner. Overriding estimates undermines trust and leads to unsustainable commitments. Adding members mid-sprint introduces disruption. Extending sprint length should be a rare, deliberate team decision — not a reaction to overcommitment.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'A project manager who practices transparency would:',
        options: [
            'Share project status honestly — including problems and risks — with stakeholders',
            'Only share positive news to maintain stakeholder confidence and avoid creating alarm',
            'Restrict access to the project dashboard to the core team only to prevent confusion',
            'Defer all status reporting to the PMO to maintain objectivity and consistent messaging',
        ],
        correctAnswer: 0,
        explanation: 'Transparency means sharing accurate information — good and bad — so stakeholders can make informed decisions. Filtering only positive news is deceptive and erodes trust when problems eventually surface. Restricting dashboard access limits visibility. While the PMO may aggregate reporting, the PM owns transparent communication with their stakeholders.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'The PM learns that a critical team member plans to leave the organization in two weeks. The best immediate action is to:',
        options: [
            'Assess the impact, initiate knowledge transfer, and update the resource management plan',
            'Attempt to convince the team member to stay at any cost by offering incentives beyond policy',
            'Ignore the situation until the departure is official since acting prematurely causes disruption',
            'Remove the team member from all work immediately to force others to learn critical skills',
        ],
        correctAnswer: 0,
        explanation: 'Proactive risk management means addressing the impact immediately. Knowledge transfer ensures continuity. Updating the resource plan enables timely replacement or redistribution. Trying to retain the person may work but cannot be the only action. Ignoring it until they leave wastes preparation time. Removing them immediately wastes their remaining contributions.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'People',
        stem: 'In a predictive project, the RACI matrix is most useful for:',
        options: [
            'Clarifying roles and responsibilities for each deliverable or work package',
            'Tracking the project schedule and critical path to identify potential delays',
            'Calculating the project budget and cost baseline for each work package element',
            'Measuring team member utilization rates across multiple concurrent projects',
        ],
        correctAnswer: 0,
        explanation: 'A RACI matrix (Responsible, Accountable, Consulted, Informed) maps team members to deliverables or activities, clarifying who does the work, who owns the decision, who provides input, and who needs updates. It does not track schedules, calculate budgets, or measure utilization — those require separate tools like Gantt charts, cost baselines, and resource histograms.',
        difficulty: 'Easy',
    },

    // ===== Domain II: Process (50%) — 36 questions =====
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A project team is using an iterative approach and delivers a working increment every two weeks. The primary benefit of this approach is:',
        options: [
            'Early and frequent delivery of business value with opportunities for stakeholder feedback',
            'Eliminating the need for project planning entirely since iteration replaces formal planning',
            'Guaranteed on-time project completion because iterative delivery ensures all work is done',
            'Reduced need for stakeholder engagement since working increments speak for themselves',
        ],
        correctAnswer: 0,
        explanation: 'Iterative delivery provides value early and enables course correction through regular feedback. It does not eliminate planning (agile planning is continuous and adaptive). No methodology guarantees on-time delivery. Iterative approaches actually increase stakeholder engagement through frequent reviews and demonstrations.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'The project communication plan should include all of the following EXCEPT:',
        options: [
            'The personal social media accounts of team members',
            'Communication methods and channels for each stakeholder group',
            'Frequency and timing of communications such as status reports',
            'Stakeholder information needs and escalation procedures',
        ],
        correctAnswer: 0,
        explanation: 'A communication plan defines who needs what information, when, how, and through which channels. It includes methods, frequency, formats, and escalation paths. Personal social media accounts are private and irrelevant to project communications. All other options are standard elements of a communication management plan.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A risk has been identified with high probability and high impact. The team decides to change the project plan to eliminate the threat entirely. This risk response strategy is:',
        options: [
            'Avoid',
            'Mitigate',
            'Transfer',
            'Accept',
        ],
        correctAnswer: 0,
        explanation: 'Avoidance eliminates the threat by changing the project plan (e.g., removing the risky activity, changing approach). Mitigation reduces probability or impact but does not eliminate the risk. Transfer shifts the impact to a third party (insurance, contracts). Acceptance takes no proactive action and deals with the risk if it occurs.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'The project has a CPI of 0.85 and an SPI of 1.1. What does this indicate?',
        options: [
            'The project is over budget but ahead of schedule',
            'The project is under budget and ahead of schedule',
            'The project is over budget and behind schedule',
            'The project is under budget but behind schedule',
        ],
        correctAnswer: 0,
        explanation: 'CPI (Cost Performance Index) < 1.0 means spending more than planned (over budget). SPI (Schedule Performance Index) > 1.0 means more work completed than planned (ahead of schedule). CPI of 0.85 means for every dollar spent, only $0.85 of value is earned. SPI of 1.1 means 10% more work is done than scheduled.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'In agile, the Definition of Done (DoD) serves to:',
        options: [
            'Ensure all team members share a common understanding of what "complete" means for a product increment',
            'Replace the project charter as the primary authorizing document that formally starts the project',
            'Eliminate the need for testing since the DoD checklist ensures quality at every development step',
            'Define the project\'s total scope for all sprints by establishing the complete feature set for release',
        ],
        correctAnswer: 0,
        explanation: 'The Definition of Done creates a shared quality standard that every increment must meet before it is considered complete. It typically includes coding standards, testing, documentation, and review requirements. It does not replace the charter, eliminate testing (it usually mandates testing), or define total scope (that is the product backlog).',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A project manager discovers that actual costs exceed the planned budget at the 50% completion mark. After analyzing EVM data, the best next step is to:',
        options: [
            'Determine the root cause of the variance and present corrective options to the sponsor',
            'Request additional funding without investigating the cause since the budget was insufficient',
            'Reduce quality standards to cut costs and bring the project back within budget quickly',
            'Hide the variance in the next status report to avoid alarming stakeholders prematurely',
        ],
        correctAnswer: 0,
        explanation: 'PMI emphasizes root cause analysis before corrective action. Understanding why costs exceeded the plan enables targeted solutions. Requesting funds blindly does not fix the underlying issue. Reducing quality creates technical debt and stakeholder dissatisfaction. Hiding variances is unethical and delays necessary decisions.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'The Work Breakdown Structure (WBS) is primarily used to:',
        options: [
            'Decompose the total project scope into manageable, deliverable-oriented work packages',
            'Assign individual tasks to team members on a daily basis using resource availability data',
            'Track the critical path of the project schedule by analyzing dependent activity sequences',
            'Calculate the project\'s earned value metrics including CPI, SPI, and estimate at completion',
        ],
        correctAnswer: 0,
        explanation: 'The WBS is a hierarchical decomposition of project scope into deliverables and work packages. It defines what is in scope and organizes the work. Task assignment is done through the responsibility assignment matrix. Critical path is determined through schedule network analysis. EVM uses the WBS as a framework but requires additional cost and schedule data.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A fixed-price contract is most appropriate when:',
        options: [
            'The scope of work is well-defined and unlikely to change significantly',
            'Requirements are vague and expected to evolve throughout the project lifecycle',
            'The buyer wants maximum flexibility to add scope at no additional cost to budget',
            'The project involves cutting-edge research with unpredictable outcomes and risk',
        ],
        correctAnswer: 0,
        explanation: 'Fixed-price contracts work best when scope is clearly defined because the vendor prices based on known deliverables. Vague or evolving requirements suit cost-reimbursable or time-and-materials contracts. Fixed-price does not provide free scope additions — changes require contract modifications. Research projects with unpredictable outcomes are poorly suited to fixed-price arrangements.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'During the Validate Scope process, the primary activity is:',
        options: [
            'Obtaining formal acceptance of completed deliverables from the customer or sponsor',
            'Verifying that deliverables meet quality specifications through inspection and testing',
            'Creating the project scope statement that defines boundaries, deliverables, and constraints',
            'Decomposing work packages into activities required to produce each project deliverable',
        ],
        correctAnswer: 0,
        explanation: 'Validate Scope focuses on formal acceptance — the customer or sponsor confirms that deliverables meet their expectations. Control Quality (a separate process) verifies that deliverables meet specifications. Scope statement creation occurs during Plan Scope Management. Decomposition into activities occurs during Define Activities.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A project manager receives a change request that would significantly alter the project baseline. The correct first step is to:',
        options: [
            'Log the change request and perform an impact analysis before taking action',
            'Implement the change immediately if it comes from the sponsor since their authority overrides',
            'Reject the change because the baseline should not be modified once formally approved',
            'Approve the change and update all baselines simultaneously to maintain alignment',
        ],
        correctAnswer: 0,
        explanation: 'All changes — regardless of source — must follow the integrated change control process. The first step is logging the request and analyzing impacts on scope, schedule, cost, quality, and risk. Even sponsor requests need analysis before approval. Baselines can be modified through proper change control. Approving without analysis is reckless.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'In Kanban, Work-in-Progress (WIP) limits are used to:',
        options: [
            'Prevent bottlenecks by limiting the number of items in any workflow stage at one time',
            'Set the maximum number of team members on the project to keep coordination manageable',
            'Define the total number of user stories in the product backlog so scope remains fixed',
            'Restrict the project budget allocation per sprint to maintain financial discipline',
        ],
        correctAnswer: 0,
        explanation: 'WIP limits constrain how many items can be in a given workflow state simultaneously. This prevents overloading, exposes bottlenecks, improves flow, and reduces context-switching. They do not limit team size, backlog size, or budget. When a WIP limit is reached, the team must finish current work before pulling new items.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'The critical path in a project schedule represents:',
        options: [
            'The longest sequence of dependent activities that determines the minimum project duration',
            'The shortest path through the project network identifying minimum total effort required',
            'The activities with the highest cost representing the largest portion of the project budget',
            'The activities that can be delayed without affecting the project end date due to float',
        ],
        correctAnswer: 0,
        explanation: 'The critical path is the longest sequence of dependent activities — it determines the earliest possible project completion date. Any delay on the critical path delays the entire project. The shortest path has float. High-cost activities may or may not be on the critical path. Activities with float can be delayed without affecting the end date.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A project has completed and the PM is conducting lessons learned. This activity is most important because:',
        options: [
            'It captures knowledge that improves future project performance for the organization',
            'It assigns blame for project failures to specific team members for accountability purposes',
            'It is required to release project resources back to the functional organization formally',
            'It determines the final project budget by reconciling actual costs against the baseline',
        ],
        correctAnswer: 0,
        explanation: 'Lessons learned capture what went well and what could be improved, creating organizational knowledge that benefits future projects. They are not about blame — PMI emphasizes a blameless, learning-oriented approach. Resource release and final budget are part of project closure but are not the purpose of lessons learned.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A product backlog refinement session in Scrum is intended to:',
        options: [
            'Clarify, estimate, and prioritize upcoming backlog items so they are ready for sprint planning',
            'Replace the sprint review ceremony by incorporating stakeholder feedback directly into refinement',
            'Approve the final product for release by obtaining sign-off from the product owner and sponsors',
            'Assign specific tasks to individual team members so each person knows their responsibilities',
        ],
        correctAnswer: 0,
        explanation: 'Backlog refinement (grooming) ensures upcoming items are well-understood, properly sized, and prioritized before they enter sprint planning. It does not replace the sprint review (which demonstrates completed work to stakeholders). Product release approval is a separate decision. Task assignment happens during sprint planning, not refinement.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'The project charter formally authorizes the project and:',
        options: [
            'Gives the project manager the authority to apply organizational resources to project activities',
            'Contains the detailed project schedule with all dependencies, milestones, and resource assignments',
            'Replaces the project management plan as the primary document guiding execution and control',
            'Is created by the project manager without sponsor involvement based on technical requirements',
        ],
        correctAnswer: 0,
        explanation: 'The charter formally authorizes the project and empowers the PM to use organizational resources. It is a high-level document that does not contain detailed schedules (that is the project management plan). The charter and project plan serve different purposes. The charter is typically issued by the sponsor or initiator, not created by the PM alone.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A project is using a time-boxed approach with two-week iterations. At the end of an iteration, two user stories are incomplete. The PM should:',
        options: [
            'Move the incomplete stories back to the product backlog for reprioritization in the next iteration',
            'Extend the iteration until all stories are complete to ensure the team meets its original commitment',
            'Remove the incomplete stories from the project entirely since failure to complete indicates low value',
            'Mark the stories as complete and move on to maintain the appearance of consistent velocity metrics',
        ],
        correctAnswer: 0,
        explanation: 'In agile, time-boxes are fixed — iterations end on schedule regardless of completion status. Incomplete stories return to the backlog for the product owner to reprioritize. Extending the iteration violates the time-box principle. Removing stories eliminates potentially valuable work. Marking incomplete work as done compromises quality and transparency.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'Monte Carlo simulation in project management is used to:',
        options: [
            'Model the probability of different schedule or cost outcomes through random sampling of risk variables',
            'Assign tasks to team members randomly to ensure fair distribution of work across the project team',
            'Select vendors through a random lottery process to eliminate bias in the procurement selection',
            'Generate random test cases for quality assurance to validate software against unexpected inputs',
        ],
        correctAnswer: 0,
        explanation: 'Monte Carlo simulation uses random sampling to model uncertainty in project estimates. By running thousands of iterations with varying input assumptions, it produces a probability distribution of outcomes (e.g., "80% chance of finishing by date X"). It does not randomize task assignment, vendor selection, or testing.',
        difficulty: 'Hard',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A project team uses a burn-down chart to track progress. Midway through the sprint, the burn-down line is above the ideal line. This indicates:',
        options: [
            'The team is behind the planned pace and may not complete all sprint backlog items',
            'The team is ahead of schedule and will likely finish all committed work before the timebox ends',
            'The sprint has been cancelled by the product owner due to a significant change in priorities',
            'The project budget has been exceeded and the team must implement cost reduction measures now',
        ],
        correctAnswer: 0,
        explanation: 'A burn-down chart plots remaining work against time. The ideal line shows expected progress. When the actual line is above the ideal, more work remains than expected — the team is behind pace. Below the ideal line means ahead of schedule. Burn-down charts track work remaining, not budget. Sprint cancellation would stop the chart entirely.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'The purpose of a project governance structure is to:',
        options: [
            'Define decision-making authority, escalation paths, and oversight mechanisms for the project',
            'Eliminate the need for a project manager by distributing leadership responsibilities across the team',
            'Ensure all decisions are made by consensus among all stakeholders to guarantee equal input',
            'Replace the organization\'s existing management hierarchy with a project-specific authority model',
        ],
        correctAnswer: 0,
        explanation: 'Project governance defines who has authority to make decisions, how issues are escalated, and how oversight is provided. It complements — does not replace — organizational management. Not all decisions can or should be made by consensus; governance clarifies who decides what. The PM operates within the governance structure, not as a replacement for it.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'In a predictive project, the scope baseline consists of:',
        options: [
            'The project scope statement, WBS, and WBS dictionary',
            'Only the project charter which defines the complete scope',
            'The project schedule and budget cost baselines combined',
            'The risk register and stakeholder register documents',
        ],
        correctAnswer: 0,
        explanation: 'The scope baseline is the approved version of the scope statement (what is included/excluded), the WBS (hierarchical decomposition), and the WBS dictionary (detailed descriptions of each work package). The charter is a pre-planning document. Schedule and budget are separate baselines. Registers are project documents, not baselines.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A project risk has materialized and become an issue. The PM should:',
        options: [
            'Execute the planned risk response and track the issue to resolution',
            'Create a new risk register entry for the same event to document it properly',
            'Wait for the issue to resolve itself since most issues diminish over time',
            'Update the lessons learned but take no immediate action on the issue now',
        ],
        correctAnswer: 0,
        explanation: 'When a risk becomes an issue, the planned risk response (if one exists) should be executed immediately. The issue is tracked in the issue log until resolved. Creating a new risk entry duplicates information. Waiting allows the impact to worsen. Lessons learned are captured but are not a substitute for action.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'Three-point estimating uses optimistic, most likely, and pessimistic values to:',
        options: [
            'Calculate a weighted average that accounts for uncertainty in activity duration or cost estimates',
            'Determine the exact project completion date with certainty by eliminating all schedule variance',
            'Eliminate all estimation risk by producing a single definitive number that replaces contingency',
            'Assign a fixed budget with no contingency since the approach already accounts for all scenarios',
        ],
        correctAnswer: 0,
        explanation: 'Three-point estimating (using PERT or triangular distribution) produces a weighted average that acknowledges uncertainty. The PERT formula (O + 4M + P) / 6 gives more weight to the most likely estimate. It does not produce exact dates, eliminate risk, or remove the need for contingency. It provides a more realistic estimate than a single-point guess.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A sprint review in Scrum is primarily for:',
        options: [
            'Demonstrating completed work to stakeholders and gathering feedback to adapt the product backlog',
            'Evaluating individual team member performance to determine promotions and compensation adjustments',
            'Planning the next sprint in detail by selecting backlog items, defining tasks, and estimating effort',
            'Reviewing and updating the team\'s working agreements and process improvement action items',
        ],
        correctAnswer: 0,
        explanation: 'The sprint review is an inspect-and-adapt event where the team demonstrates the done increment to stakeholders and gathers feedback. This feedback informs backlog adjustments. It is not a performance review. Sprint planning (not review) details the next sprint. Working agreements are discussed in retrospectives, not reviews.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'Which of the following is an output of the Plan Risk Responses process?',
        options: [
            'Change requests resulting from planned risk responses that may modify the project management plan',
            'The initial risk register that documents all identified threats, opportunities, and impact assessments',
            'The project charter that formally authorizes the project and defines high-level scope and objectives',
            'The WBS dictionary that provides detailed descriptions of each work package and acceptance criteria',
        ],
        correctAnswer: 0,
        explanation: 'Plan Risk Responses produces risk response plans and often generates change requests — because implementing risk responses may require changes to scope, schedule, cost, or other baselines. The initial risk register is created during Identify Risks. The charter is created during Develop Project Charter. The WBS dictionary is an output of Create WBS.',
        difficulty: 'Hard',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A project manager is determining whether to use a predictive, agile, or hybrid approach. The most important factor in this decision is:',
        options: [
            'The degree of requirements clarity and the rate of expected change',
            'The PM\'s personal preference for a specific methodology based on their training',
            'Whether the organization has used Scrum before on similar-sized projects',
            'The project budget amount since larger budgets require predictive approaches',
        ],
        correctAnswer: 0,
        explanation: 'Methodology selection should be driven by project characteristics. Predictive approaches suit well-defined, stable requirements. Agile suits uncertain, evolving requirements with frequent change. Hybrid combines elements based on project needs. Personal preference, organizational history, or budget alone should not dictate the approach.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'Resource leveling may result in:',
        options: [
            'An extended project schedule to resolve resource over-allocation',
            'A shorter critical path that reduces the overall project duration',
            'Increased project scope as additional deliverables are added',
            'Reduced project quality standards due to resource constraints',
        ],
        correctAnswer: 0,
        explanation: 'Resource leveling adjusts the schedule to resolve resource conflicts or over-allocation, often by delaying activities until resources are available. This typically extends the project schedule. It does not shorten the critical path (it may lengthen it), change scope, or affect quality standards.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'During project closure, all of the following should occur EXCEPT:',
        options: [
            'Beginning new scope items that were not part of the original project or approved changes',
            'Obtaining formal acceptance of the final deliverable from the customer or project sponsor',
            'Releasing project resources back to their functional organizations and updating availability',
            'Archiving project documents and lessons learned in the organizational process asset library',
        ],
        correctAnswer: 0,
        explanation: 'Project closure involves formal acceptance, resource release, financial closure, lessons learned, and document archiving. Starting new scope items during closure is inappropriate — new work should be handled as a separate project or phase. Closure is about wrapping up, not expanding.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A quality audit is performed to:',
        options: [
            'Determine whether project activities comply with organizational and project policies and processes',
            'Test individual deliverables for defects by executing detailed test cases against requirements',
            'Assign quality ratings to team members based on the defect count in their work products',
            'Calculate the cost of quality for the project budget including prevention and failure costs',
        ],
        correctAnswer: 0,
        explanation: 'Quality audits evaluate whether project activities conform to organizational and project policies, processes, and procedures. They identify best practices and gaps in process compliance. Testing deliverables is quality control (inspection). Team ratings are performance management. Cost of quality is a planning tool, not an audit output.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'The Estimate at Completion (EAC) when current cost performance is expected to continue is calculated as:',
        options: [
            'BAC / CPI',
            'BAC × CPI',
            'BAC + ETC',
            'AC + BAC',
        ],
        correctAnswer: 0,
        explanation: 'When current cost performance (CPI) is expected to continue, EAC = BAC / CPI. This adjusts the original budget by the efficiency factor. For example, if BAC is $100,000 and CPI is 0.80, EAC = $125,000 — reflecting that every dollar buys only $0.80 of value. Other EAC formulas exist for different assumptions about future performance.',
        difficulty: 'Hard',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A project manager is using a responsibility assignment matrix (RAM). The "A" in RACI stands for:',
        options: [
            'Accountable — the person ultimately answerable for the correct completion of the work',
            'Authorized — the person who approved the project budget and has financial authority',
            'Available — the person who has time in their schedule and can be assigned to tasks',
            'Assigned — the person doing the day-to-day work on the deliverable as documented',
        ],
        correctAnswer: 0,
        explanation: '"A" stands for Accountable — the one person who is ultimately answerable for the deliverable or decision. There can be only one "A" per task. "R" (Responsible) is who does the work. "C" (Consulted) provides input. "I" (Informed) is kept updated. Accountable is not the same as Authorized, Available, or Assigned.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'In an agile project, the most appropriate way to handle emerging requirements is to:',
        options: [
            'Add them to the product backlog for prioritization by the product owner',
            'Reject all new requirements after the initial release plan is set for scope stability',
            'Create a separate change control board for each new requirement for governance',
            'Implement them immediately without any prioritization to show responsiveness',
        ],
        correctAnswer: 0,
        explanation: 'Agile embraces change. New requirements are added to the product backlog and the product owner prioritizes them against existing items based on business value. Rejecting change undermines agile principles. A formal CCB for each item adds unnecessary overhead in agile. Implementing without prioritization ignores the product owner\'s role and may deliver low-value work before high-value work.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A project team uses a RACI matrix and discovers that one activity has no "R" assigned. This means:',
        options: [
            'No one is responsible for performing the work — the gap must be addressed immediately',
            'The activity will be completed automatically by the system through configured workflows',
            'The accountable person will also perform the work since both roles belong to them',
            'The activity can be safely removed from scope because no one needs to perform it',
        ],
        correctAnswer: 0,
        explanation: 'A missing "R" means no one is assigned to do the work — a critical gap. The PM must assign responsibility before work begins. Activities do not complete themselves. While the "A" person is answerable, they may not perform the work. Missing responsibility does not mean the work is unnecessary — it means the assignment is incomplete.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'The primary difference between fast-tracking and crashing a schedule is:',
        options: [
            'Fast-tracking performs activities in parallel that were planned sequentially; crashing adds resources to reduce duration',
            'Fast-tracking adds resources to accelerate delivery; crashing removes dependencies to enable parallel execution',
            'Fast-tracking increases quality by enabling more thorough testing; crashing decreases quality by compressing reviews',
            'Fast-tracking is used only in agile methodologies; crashing is used only in predictive project approaches',
        ],
        correctAnswer: 0,
        explanation: 'Fast-tracking overlaps activities that were originally planned in sequence — this increases risk because dependencies may cause rework. Crashing adds resources (overtime, additional staff) to compress duration — this increases cost. Both are schedule compression techniques. Neither is exclusive to agile or predictive. Both may affect quality if not managed carefully.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Process',
        stem: 'A project team is conducting a make-or-buy analysis. The primary purpose is to:',
        options: [
            'Determine whether it is more cost-effective and strategic to produce a deliverable internally or procure it externally',
            'Decide which team members will be laid off as part of the restructuring that accompanies procurement decisions',
            'Calculate the project\'s net present value by comparing discounted cash flows of internal production versus procurement',
            'Develop the project communication plan by identifying stakeholders who need to know about procurement decisions',
        ],
        correctAnswer: 0,
        explanation: 'Make-or-buy analysis evaluates the costs, benefits, and risks of producing something in-house versus purchasing from an external source. Factors include cost, capacity, expertise, control, and strategic alignment. It is a procurement planning tool, not related to staffing decisions, NPV calculations, or communication planning.',
        difficulty: 'Medium',
    },

    // ===== Domain III: Business Environment (8%) — 6 questions =====
    {
        examId: PMP_ID, type: 'mcq', domain: 'Business Environment',
        stem: 'A project must comply with industry-specific regulations. The PM discovers a new regulation that affects the project scope. The best course of action is to:',
        options: [
            'Assess the impact on scope and schedule, then submit a change request through the change control process',
            'Ignore the regulation since it was not part of the original scope and would disrupt the approved baseline',
            'Shut down the project until the regulation is fully understood by the legal team and formally documented',
            'Delegate compliance entirely to the legal department without integrating it into the project plan',
        ],
        correctAnswer: 0,
        explanation: 'Regulatory changes are external environmental factors that affect project scope. The PM should assess the impact and process the change through proper channels. Ignoring regulations creates legal liability. Shutting down the project is disproportionate. While legal provides guidance, the PM must integrate compliance requirements into the project plan.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Business Environment',
        stem: 'Benefits realization in project management refers to:',
        options: [
            'Ensuring that the project\'s intended business outcomes are actually achieved after delivery',
            'Calculating the project\'s cost savings during execution by comparing actuals against the budget',
            'Distributing project team bonuses after completion based on individual performance metrics',
            'Measuring team member satisfaction at the end of the project through surveys and feedback',
        ],
        correctAnswer: 0,
        explanation: 'Benefits realization ensures that the strategic objectives driving the project are actually achieved — often extending beyond project closure. It involves identifying, planning, tracking, and sustaining business benefits. Cost savings during execution are operational efficiency, not benefits realization. Team bonuses and satisfaction are important but separate from business value delivery.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Business Environment',
        stem: 'An organization is implementing a new ERP system. Many employees resist the change. The PM should:',
        options: [
            'Develop a change management strategy that addresses resistance through communication, training, and stakeholder engagement',
            'Proceed with implementation and expect employees to adapt on their own since benefits will become evident over time',
            'Postpone the project indefinitely until all resistance disappears and every stakeholder fully supports the initiative',
            'Discipline employees who resist the change to send a clear message that non-compliance will not be tolerated',
        ],
        correctAnswer: 0,
        explanation: 'Organizational change management is a critical success factor for projects that affect how people work. A structured approach — communicating the vision, addressing concerns, providing training, and engaging champions — reduces resistance. Expecting adaptation without support leads to poor adoption. Indefinite postponement kills project value. Discipline creates hostility.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Business Environment',
        stem: 'The business case for a project should be reviewed:',
        options: [
            'Periodically throughout the project to ensure continued business justification',
            'Only at the start of the project during initiation when the investment decision is made',
            'Only at the end of the project during closing to verify the original justification',
            'Never — once approved, it should not be questioned or revisited by the team',
        ],
        correctAnswer: 0,
        explanation: 'Business conditions change over time. Periodic review of the business case (at phase gates, major milestones, or when significant changes occur) ensures the project still delivers sufficient value to justify continued investment. If the business case is no longer valid, the project may need to be redirected or terminated to avoid wasting resources.',
        difficulty: 'Easy',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Business Environment',
        stem: 'A project\'s external environment has changed significantly — a major competitor launched a similar product. The PM should:',
        options: [
            'Evaluate the impact on project scope and value, then work with stakeholders to determine if adjustments are needed',
            'Ignore the competitor since the project plan is already approved and external conditions are outside project control',
            'Cancel the project immediately since the competitor has first-mover advantage and continuing wastes resources',
            'Double the project budget to accelerate delivery without stakeholder approval to beat the competitor to market',
        ],
        correctAnswer: 0,
        explanation: 'External business changes directly affect project value and strategy. The PM should evaluate the impact and collaborate with stakeholders on potential responses — pivoting features, accelerating delivery, or adjusting scope. Ignoring changes risks delivering an obsolete product. Cancellation may be premature. Budget changes require governance approval.',
        difficulty: 'Medium',
    },
    {
        examId: PMP_ID, type: 'mcq', domain: 'Business Environment',
        stem: 'The organizational culture most conducive to successful project management is one that:',
        options: [
            'Values collaboration, supports reasonable risk-taking, and empowers project teams',
            'Strictly penalizes any project deviation from the original plan to ensure baseline discipline',
            'Discourages cross-functional communication to maintain departmental focus and boundaries',
            'Limits project manager authority to only administrative tasks such as scheduling meetings',
        ],
        correctAnswer: 0,
        explanation: 'Project success thrives in cultures that encourage collaboration across silos, support calculated risk-taking (innovation requires some tolerance for failure), and empower teams with appropriate authority. Punitive cultures discourage transparency. Discouraging communication creates silos. Limiting PM authority prevents effective project execution.',
        difficulty: 'Easy',
    },
];

function shuffleOptions(q) {
    const opts = [...q.options];
    const correctText = opts[q.correctAnswer];
    // Fisher-Yates shuffle
    for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return { ...q, options: opts, correctAnswer: opts.indexOf(correctText) };
}

async function deleteExisting() {
    const snap = await db.collection('questions').where('examId', '==', PMP_ID).get();
    if (snap.empty) { console.log('No existing PMP questions to delete.'); return; }
    const batchSize = 500;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = db.batch();
        docs.slice(i, i + batchSize).forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
    console.log(`Deleted ${docs.length} existing PMP questions.`);
}

(async () => {
    await deleteExisting();
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
    console.log(`Seeded ${shuffled.length} PMP questions (options shuffled)`);
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
