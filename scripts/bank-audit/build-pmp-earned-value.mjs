/**
 * Authors the PMP (July 2026 ECO) earned-value / quantitative set and writes
 * seed/pmp-earned-value.json. Content lives here rather than in raw JSON so the
 * reasoning stays readable and reviewable in a diff.
 *
 *   node build-pmp-earned-value.mjs
 *
 * WHY type 'emv' AND NOT 'pbq'
 * ----------------------------
 * 'emv' is a real member of the QuestionType union in web/src/config/exams.ts
 * and it is fully drivable from a seed document:
 *   - utils/scoring.ts gradesBySingleIndex() lists 'emv', so Quiz.tsx renders it
 *     down the single-select MCQ path and grades `selectedOption === correctAnswer`,
 *   - components/quiz/ExplanationPanel.tsx renders <EmvCalculation> on top of the
 *     normal explanation when `question.type === 'emv' && question.scenarios`,
 *   - Quiz.tsx's First-Exposure Guarantee treats any non-'mcq' type as a subtype
 *     and forces one into a session the candidate has never seen.
 * So every item here is type 'emv'. No fallback to 'mcq' was needed.
 *
 * WHAT THE SECOND DRAFT CHANGED (and why)
 * ---------------------------------------
 * The first draft was an arithmetic drill wearing a scenario. Four defects, in
 * descending order of how much they mattered:
 *
 * 1. THE VARIANT LEAK. Across all eight EAC items, the presence of planned value
 *    in the stem predicted the keyed EAC variant with 8/8 accuracy: PV present
 *    meant CPI x SPI, PV absent meant something else. The headline skill of the
 *    set — reading the narrative to choose the assumption — was answerable
 *    without reading a narrative sentence. Fixed two ways, and the fix is
 *    enforced rather than asserted: `eacFamily` below declares, per item, which
 *    figures the stem hands over and which variant is keyed, and
 *    load-pmp-earned-value.mjs cross-tabulates them and fails the build if the
 *    presence or absence of ANY single figure identifies ANY variant exactly.
 *    It also checks the declaration is honest, by requiring each named figure's
 *    label to appear in the stem and each unnamed one to be absent from it.
 *    Concretely: #5 (typical) and #6 (atypical) now supply PV as a decoy with a
 *    cause that rules out schedule-driven cost, #7 (CPI x SPI) withholds both EV
 *    and PV and makes the candidate recover EV from CPI x AC, and #12 (typical)
 *    carries a withdrawn bottom-up re-estimate so a bottom-up figure no longer
 *    means a bottom-up answer.
 *
 * 2. DATA THAT WAS ONLY EVER THE ANSWER'S INPUTS. 17 of 20 items supplied
 *    exactly what the key needed and nothing else, so choosing which numbers not
 *    to use — a large share of the real exam's difficulty — was not being
 *    tested. Every item now carries at least one figure the key does not use:
 *    a raised purchase order that is a commitment and not a cost (#1), an
 *    accepted-then-rejected deliverable still sitting in earned value (#2),
 *    contingency balances (#3, #4, #11, #13, #14), planned value where nothing
 *    is being accelerated (#5, #6, #8, #10, #11, #12), management reserve (#7),
 *    a withdrawn re-estimate (#12), a licence common to both branches (#18) and
 *    a risk that closed last week but is still in the register (#19).
 *
 * 3. BARE-FIGURE OPTIONS. Seven items offered four dollar amounts and nothing
 *    else, which is a numeric answer sheet rather than a decision. Every keyed
 *    option now carries the interpretation or the next action, and every
 *    distractor names the specific mistake that produces it.
 *
 * 4. Q14 HAD NO RIGHT ANSWER. Its key read "TCPI is 0.82, below the 0.75
 *    achieved so far", which is false — 0.82 is above 0.75, so the re-baselined
 *    target still requires a ~9% improvement. Both numbers were individually
 *    correct and both were confirmed by mathChecks; the false part was the
 *    comparative word binding them, which value-to-text-to-question chaining
 *    cannot see. The loader now parses comparative words (above/below/higher
 *    than/lower than/exceeds/...) sitting between two checked values and asserts
 *    the stated inequality against the computed one.
 *
 * Also: #15 was cut. It duplicated an existing bank item ("A project has a
 * To-Complete Performance Index (TCPI) of 1.25 based on the BAC. The project is
 * 40% complete. What does this TCPI value indicate...") down to the structure —
 * same metric, same given-TCPI framing, same ask, two constants moved — and its
 * 0.88-at-45% opening collided with a second existing item. It is replaced by a
 * schedule-index item on terminal SPI drift, which nothing in the bank covers.
 * All 20 stems were re-checked against the 22 EV-flavoured stems in
 * functions/scripts/backup-2026-pmp-migration-*.json.
 *
 * DOMAIN TAGS
 * -----------
 * Every item is Process. The risk items (#17-#20) were previously tagged
 * "Business Environment · Task 5 — Plan and manage risk"; that provenance could
 * not be produced. The repo cites the July 2026 ECO only at domain level
 * (web/src/utils/domainCitations.ts carries the three domain weightings and
 * nothing below them), there is no ECO document anywhere in the tree, and the
 * bank's own 196 existing items classify EMV and contingency-reserve questions
 * as Process. The task NUMBERS have been dropped from every `ecoTask` string in
 * this set for the same reason — they asserted a mapping no file here can
 * support. The loader now rejects "Task <n>" in an ecoTask so they cannot come
 * back without a source.
 *
 * WHY ONLY #17 CARRIES `scenarios`
 * --------------------------------
 * EmvCalculation.tsx prints one `p x impact` line per scenario and closes with
 * "<label> has the highest expected monetary value". That sentence is true and
 * useful only for a flat pick-one-branch comparison of OPPORTUNITIES whose key
 * is the max-EMV branch. #17 is that. It is deliberately not attached to:
 *   #18 — a decision tree (base cost + a risk-weighted add-on per path). The
 *         component's flat p x impact row cannot express `base + p x impact`.
 *   #19 — contingency sizing, where the answer is the SUM of the EMVs. The panel
 *         would close by naming the largest single risk, which is the exact
 *         reasoning one of its distractors punishes.
 *   #20 — threats. The stem asks which structure has the LOWEST expected cost of
 *         risk; the panel has no sign-aware wording and would close in green
 *         with "...has the highest expected monetary value" one item after #17
 *         used "highest" to mean the biggest win. Dropping the panel was chosen
 *         over teaching the component a second vocabulary, because the panel is
 *         shared by every exam and this set does not get to change it.
 *
 * DIFFICULTY
 * ----------
 * Labels follow one rule, applied by counting the decisions an item forces:
 * (a) rejecting supplied figures the key does not use, (b) choosing a formula
 * variant from the narrative, (c) chaining one result into another, (d) turning
 * the number into a judgement or a governance action. Two of those is 'medium',
 * three or four is 'hard'. Nothing here is 'easy': the first draft's two easy
 * items were below the exam floor (one needed two subtractions and a sign
 * convention) and were rebuilt rather than relabelled, so this set has no
 * entry-level tier and does not pretend to. That matches the other authored
 * seeds in this directory, none of which carry an 'easy' item either.
 *
 * SOURCES
 * -------
 * Formulas: docs/pmp-formula-reference.md and functions/src/pmpFormulas.ts (the
 * two are kept in sync; the cheat-sheet graphic they were corrected against is
 * listed there as untrustworthy). Domains and weightings: PMI, "Project
 * Management Professional (PMP) Examination Content Outline — July 2026"
 * (People 33% / Process 41% / Business Environment 26%), as cited in
 * web/src/utils/domainCitations.ts.
 *
 * These questions are NOT reviewed by a certified subject matter expert.
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const EXAM_ID = '6kECziMtR1BS3MpABLW5';
const SOURCE = 'authored-2026-08-pmp-earned-value';

const D = {
    process: 'Process',
    people: 'People',
    business: 'Business Environment',
};

const q = (o) => ({
    examId: EXAM_ID, source: SOURCE, type: 'emv',
    difficulty: 'medium', bloomLevel: 'Apply', domain: D.process, ...o,
});

// ─────────────────────────────────────────────────────────────────────────────
// The questions.
//
// Answer keys are hand-placed, not shuffled: several explanations lean on the
// exact wording of a distractor, and a shuffle step that renumbers keys is one
// more thing that can silently go wrong. The validator asserts the keys are
// spread across all four positions instead (5/5/5/5 here), and separately that
// the key is not reliably the wordiest option.
// ─────────────────────────────────────────────────────────────────────────────

const questions = [

    // ─────────── Reading the three base measures (2) ───────────

    /* 1 */ q({
        difficulty: 'medium', bloomLevel: 'Apply',
        ecoTask: 'Process · Evaluate project status',
        stem: 'A hybrid programme runs its infrastructure workstream predictively, with a budget at completion of $800,000 over twelve months. At the end of month six the baseline schedule shows 50% of that work should be finished. The customer has demonstrated and formally accepted deliverables representing 40% of the scope. The ledger shows $360,000 of costs incurred against the workstream, a separate purchase order for $95,000 has been raised for equipment that has not yet shipped and against which nothing is payable, and $60,000 of contingency reserve is unspent. Which set of values belongs in the month-six status report?',
        options: [
            'PV $400,000; EV $320,000; AC $360,000',
            'PV $320,000; EV $400,000; AC $360,000',
            'PV $400,000; EV $360,000; AC $360,000',
            'PV $400,000; EV $320,000; AC $455,000',
        ],
        correctAnswer: 0,
        explanation: 'Each of the three values comes from a different source, and the whole discipline depends on not mixing them up. Planned value is what the baseline said would be complete by now: PV = 50% x $800,000 = $400,000. Earned value is the budgeted cost of the work actually accepted, so it applies the ACTUAL percentage to the SAME budget: EV = 40% x $800,000 = $320,000. Actual cost is what has been incurred for work performed: AC = $360,000. The purchase order is a commitment and not a cost — no goods have arrived and nothing is payable — and the contingency balance is money set aside rather than money spent, so neither belongs in any of the three. The option reporting PV $320,000 and EV $400,000 swaps the planned and actual percentages, which is the commonest slip when both figures sit in the same paragraph. The option showing EV $360,000 takes earned value from the ledger instead of from accepted scope; that collapses cost and progress into a single number, forces the cost variance to zero every period, and is why a project can look perfectly controlled right up to the week the money runs out. The option showing AC $455,000 folds the purchase order into actual cost, reporting money that has not been spent and overstating the position by the full value of the order.',
    }),

    /* 2 */ q({
        difficulty: 'hard', bloomLevel: 'Analyze',
        ecoTask: 'Process · Evaluate project status',
        stem: 'A month-end report for a $1,200,000 predictive build shows planned value of $500,000, earned value of $450,000 and actual cost of $520,000. Reviewing it before it goes to the sponsor, the project manager finds that a deliverable budgeted at $60,000 was booked as complete on a developer\'s sign-off and then formally rejected at the acceptance review three days later, and that the rejection has not been reflected in the report. The $30,000 of invoices raised for that deliverable have been paid. The build holds $75,000 of contingency reserve. What are the corrected variances?',
        options: [
            'CV is -$70,000 and SV is -$50,000 — the figures as reported, since the rejection is a subsequent event',
            'CV is -$130,000 and SV is -$110,000 — the rejected deliverable leaves earned value, while the money spent on it stays in actual cost',
            'CV is -$100,000 and SV is -$110,000 — the rejected deliverable leaves earned value and its invoices leave actual cost',
            'CV is -$130,000 and SV is -$50,000 — the correction applies to the cost variance, which is where the rejected spend sits',
        ],
        correctAnswer: 1,
        explanation: 'Earned value is the budgeted cost of work that has actually been delivered, and a deliverable that failed its acceptance review has not been delivered — so the $60,000 comes out: corrected EV = $450,000 - $60,000 = $390,000, which is 32.5% of the budget. Actual cost does not move, because the $30,000 was genuinely spent and no accounting entry un-spends it; keeping the two measures independent is the entire reason earned value management works. Planned value does not move either, since the baseline is unaffected by what the team did or failed to do. So CV = EV - AC = $390,000 - $520,000 = -$130,000 and SV = EV - PV = $390,000 - $500,000 = -$110,000. The contingency balance is none of the three: it is money held against risk, not money planned, earned or spent. Reporting the uncorrected -$70,000 and -$50,000 passes work the customer has rejected off as value delivered, and that correction only gets more expensive the longer it waits. Removing the invoices from actual cost as well produces a cost variance of -$100,000; it feels even-handed and it is wrong, because it hides real money the project consumed. Correcting only the cost variance and leaving the schedule variance at -$50,000 puts two different earned values in one report, which no reviewer can reconcile.',
    }),

    // ─────────── Variances and indices (2) ───────────

    /* 3 */ q({
        difficulty: 'medium', bloomLevel: 'Analyze',
        ecoTask: 'Process · Analyze schedule variation',
        stem: 'Halfway through a data-centre migration the steering committee chair interrupts the status walkthrough with a direct question: "How far behind are we?" The migration carries a budget at completion of $2,000,000 and holds $180,000 of contingency reserve. The current report shows earned value of $600,000, planned value of $750,000 and actual cost of $640,000, and the integrated schedule has not been re-run since the last baseline. What is the most accurate response?',
        options: [
            'SPI is 1.25, calculated as planned value divided by earned value, so the project is running ahead of plan and the committee can be told that no schedule intervention is needed this period',
            'SV is -$150,000 and SPI is 0.80; the team has earned 80% of the value it was scheduled to earn, and converting that into a number of days needs the schedule model, not the variance',
            'SV is -$40,000 and SPI is 0.94, a slip of under ten percent that sits inside normal reporting tolerance, so the migration stays reported as on track this period',
            'SV is -$150,000 and SPI is 0.80, so the project is running at 80% of planned pace and will finish about 25% later than the baseline date unless the pace improves',
        ],
        correctAnswer: 1,
        explanation: 'SV = EV - PV = $600,000 - $750,000 = -$150,000, and SPI = EV / PV = $600,000 / $750,000 = 0.80. The trap is the chair\'s word "far": schedule variance is denominated in currency, not in days, because it is the difference between two budgeted amounts of work. Saying "we are $150,000 behind schedule" is correct and sounds wrong to every executive who hears it, which is why the honest answer pairs the index with a pointer to the schedule model — only the network and the critical path turn a shortfall in earned work into a forecast date, and the stem says that model has not been re-run. Neither the budget at completion nor the contingency balance is an input to either figure. The option forecasting a finish 25% late divides by SPI, which feels like a legitimate conversion and is not: the remaining work is not necessarily on the critical path, and the index drifts back towards parity as any project completes, however late it finishes. The option giving SPI 1.25 has inverted the ratio to PV / EV, which turns every late project into an early one. The option reporting SV -$40,000 with SPI 0.94 has used actual cost in both places, computing EV - AC and EV / AC, so it is reporting cost performance under a schedule label.',
    }),

    /* 4 */ q({
        difficulty: 'medium', bloomLevel: 'Analyze',
        ecoTask: 'Process · Evaluate project status',
        stem: 'At a stage gate on a $1,800,000 product build, the steering committee asks the project manager what the performance indices say and where corrective action should be aimed. The reporting pack gives earned value of $440,000, actual cost of $400,000 and planned value of $550,000, and notes that $30,000 of the $120,000 contingency reserve has been drawn. What should the project manager conclude?',
        options: [
            'CPI is 0.91 and SPI is 1.25, so cost efficiency is the problem and spending controls should be tightened across the remaining work before any schedule intervention is considered by the committee',
            'CPI is 1.10 and SPI is 0.80, and because the favourable cost variance offsets the unfavourable schedule variance the build is on balance healthy and needs no corrective action this period',
            'CPI is 0.80 and SPI is 1.10, so the build is over budget but ahead of schedule, and the committee should aim its corrective action at procurement and cost control',
            'CPI is 1.10 and SPI is 0.80: the work performed costs less than budgeted but less of it has been done than planned, so the corrective action belongs in the schedule, not in cost control',
        ],
        correctAnswer: 3,
        explanation: 'Both indices divide earned value by something: CPI = EV / AC = $440,000 / $400,000 = 1.10, and SPI = EV / PV = $440,000 / $550,000 = 0.80. Above parity is favourable, so this build is buying its work cheaply and simply is not buying enough of it. That combination almost always means throughput rather than price — too few people, a blocked dependency, or work sitting part-finished — and it is the classic signature of an under-resourced team, where a low burn rate and a low delivery rate are two views of the same shortage. Neither the budget at completion nor the contingency drawn enters either index; they are in the pack because a real reporting pack contains them. The option swapping the results to CPI 0.80 and SPI 1.10 uses the wrong denominator in each ratio, dividing by planned value for cost and by actual cost for schedule; it is the hardest distractor to spot, because both numbers on the page are right and only their labels have been exchanged. The option giving CPI 0.91 and SPI 1.25 has inverted both ratios to AC / EV and PV / EV, which reverses the diagnosis entirely and would send the committee after costs that are already performing. The offsetting option is the seductive one: a favourable cost index and an unfavourable schedule index do not cancel, because they measure different things, and money saved does not deliver a late scope on time.',
    }),

    // ─────────── EAC — the four assumptions (5) ───────────

    /* 5 */ q({
        difficulty: 'hard', bloomLevel: 'Analyze',
        ecoTask: 'Process · Plan and manage budget',
        stem: 'A construction project has a budget at completion of $4,000,000. At the reporting date, earned value is $1,600,000, planned value is $1,700,000 and actual cost is $2,000,000. Root-cause analysis traces the entire overrun to a negotiated labour rate increase that applies to every remaining hour on the job. The modest schedule slip is confined to a landscaping package carrying six weeks of float, and no overtime or acceleration is planned anywhere on the site. The sponsor asks for the forecast final cost. What should the project manager report?',
        options: [
            '$5,000,000: each dollar is buying 80 cents of work and the new rate applies to every remaining hour, so the whole scope reprices at that efficiency',
            '$4,400,000: the overspend to date is sunk and the work that remains should be priced at the baseline rate the original estimate assumed',
            '$5,187,500: both the cost and the schedule index belong in the forecast, because a rate rise on every remaining hour will drag the finish date with it too',
            '$4,000,000: the budget at completion stands until a change request revises it, so the forecast the sponsor is given should not move ahead of that approval',
        ],
        correctAnswer: 0,
        explanation: 'The wording, not the numbers, selects the formula. A labour rate increase applying to every remaining hour is the definition of a variance that will continue at the current rate, which is the assumption behind EAC = BAC / CPI. CPI = EV / AC = $1,600,000 / $2,000,000 = 0.80, so EAC = $4,000,000 / 0.80 = $5,000,000. Read the result as a sanity check: every dollar buys 80 cents of work, so a $4,000,000 scope costs $5,000,000 to buy. Planned value is on the page and is not an input here. It gives SPI = 0.94, but the stem says the slip sits on a package with float and that nothing is being accelerated, so schedule performance is not driving the cost of the remaining work; carrying the CPI x SPI variant anyway gives $5,187,500 and inflates the ask by nearly two hundred thousand dollars. The $4,400,000 option applies EAC = AC + (BAC - EV), the variant reserved for an overrun whose cause is closed; here the cause is explicitly ongoing, so it prices the remaining 60% of the work at rates that no longer exist. It is the commonest error on this topic because that formula reads like "money spent plus work left". The $4,000,000 option reports the budget as the forecast, ignoring a cost inefficiency that has already been measured — and only the forecast tells the sponsor how large the change request is going to be.',
    }),

    /* 6 */ q({
        difficulty: 'hard', bloomLevel: 'Analyze',
        ecoTask: 'Process · Plan and manage budget',
        stem: 'A single shipment on an equipment upgrade was held at customs and incurred a one-time $70,000 penalty. The route has since been changed and the procurement lead confirms the remaining work will proceed at the originally budgeted rates. The upgrade has a budget at completion of $600,000; earned value stands at $240,000, planned value at $250,000 and actual cost at $310,000, and the fortnight the shipment lost has been absorbed inside the schedule\'s float without any acceleration. What estimate at completion should the project manager report?',
        options: [
            '$775,000 — dividing the budget by the cost performance index projects the efficiency achieved so far across everything that is still to be done',
            '$360,000 — that is what the work still to be done is worth, and it is the figure the sponsor needs before releasing further funding',
            '$670,000 — the penalty is spent and its cause is closed, so it stays in the forecast while the remaining $360,000 of work is priced at baseline',
            '$794,375 — the forecast should carry both indices, since the delay the held shipment caused will have to be recovered somewhere in the schedule',
        ],
        correctAnswer: 2,
        explanation: 'The stem states the condition for the atypical-variance forecast: the cause of the overrun is closed and the remaining work will run at budget. That is EAC = AC + (BAC - EV) = $310,000 + ($600,000 - $240,000) = $310,000 + $360,000 = $670,000. In plain terms, the $70,000 already lost is sunk and stays in the forecast, while the $360,000 of work still to do is priced at the baseline. Planned value is supplied and is a distractor: SPI = 0.96, the lost fortnight sat inside float, and nothing is being accelerated, so there is no mechanism by which schedule performance drives the cost of what remains — applying the CPI x SPI variant regardless gives $794,375. The $775,000 option applies the default EAC = BAC / CPI, with CPI = $240,000 / $310,000 = 0.77. It is what a candidate reaches for on recognising "earned value question" faster than they read the scenario, and it projects a customs penalty that cannot recur across every remaining dollar, tying up reserve that other projects need. The $360,000 option is the estimate to complete rather than the estimate at completion — it answers what the remaining work is worth and forgets the $310,000 already spent. Confusing the two is the most frequent slip in this family, and it always understates.',
    }),

    /* 7 */ q({
        difficulty: 'hard', bloomLevel: 'Analyze',
        ecoTask: 'Process · Plan and manage budget',
        stem: 'A regulator has fixed the go-live date for a compliance platform and the sponsor has ruled it immovable. The platform carries a budget at completion of $1,000,000 and actual cost to date of $500,000. This month\'s report gives a cost performance index of 0.80 and a schedule performance index of 0.80, and the delivery manager has already authorised a second shift and weekend working for the remainder of the build in order to hold the date. Management reserve stands at $75,000. What should the project manager forecast, and what does that forecast commit them to?',
        options: [
            '$1,250,000, because dividing the budget by the cost performance index forecasts everything that remains at the cost efficiency the team has demonstrated so far',
            '$1,437,500, because the schedule shortfall is being bought back with premium hours — and a forecast $437,500 above budget goes to change control, not into a footnote',
            '$1,100,000, because the money already overspent is sunk and the work that remains was estimated at rates the team can still deliver against',
            '$1,562,500, because dividing the budget by both indices captures the compounding effect of running late and over cost at the same time',
        ],
        correctAnswer: 1,
        explanation: 'Neither earned value nor planned value is handed over, so both have to be recovered before any variant can be applied: EV = CPI x AC = 0.80 x $500,000 = $400,000, which is 40% of the budget, and PV = EV / SPI = $400,000 / 0.80 = $500,000. Cost is running at 0.80 and schedule at 0.80, and the immovable date means the schedule shortfall will be bought back with premium-rate hours. That is the condition for EAC = AC + [(BAC - EV) / (CPI x SPI)] = $500,000 + [$600,000 / 0.64] = $500,000 + $937,500 = $1,437,500. The second half of the answer is what a project manager is actually paid for: VAC = BAC - EAC = -$437,500, which makes this a change request rather than a status note, and the management reserve neither covers it nor is the project manager\'s to draw on. The $1,250,000 option is EAC = BAC / CPI, the default variant and the quicker sum; it is wrong here for one specific reason, that it prices the rest of the work at the efficiency observed so far while the stem says the team is about to work differently and more expensively in order to protect the date. The $1,100,000 option is AC + (BAC - EV), which assumes the remaining work runs at the budgeted rate — the opposite of a project going onto overtime. The $1,562,500 option is BAC / (CPI x SPI): it never adds actual cost back and applies the schedule penalty to work that is already finished and paid for, double-counting the problem.',
    }),

    /* 8 */ q({
        difficulty: 'hard', bloomLevel: 'Evaluate',
        ecoTask: 'Process · Plan and manage budget',
        stem: 'A technical review of a systems integration concludes that the original estimate for the remaining integration work assumed an architecture the team abandoned two months ago, and is no longer a usable basis for any forecast. The team completes a bottom-up re-estimate of the remaining work at $1,900,000. The integration carries a budget at completion of $2,400,000, with earned value of $900,000, planned value of $1,000,000 and actual cost of $1,150,000. What estimate at completion should the project manager present to the change control board?',
        options: [
            '$3,066,667 — dividing the budget by the cost performance index gives an independent check that corroborates the re-estimate to within $17,000',
            '$2,650,000 — the money spent so far plus the value of the work not yet earned, priced at the baseline rate',
            '$1,900,000 — the re-estimate is the figure the board needs, because it is the only number produced after the architecture changed',
            '$3,050,000 — the re-estimate is the only surviving basis, and a $650,000 gap to the approved budget makes this a change request',
        ],
        correctAnswer: 3,
        explanation: 'When the original estimate is declared unusable, every formula that derives the remaining cost from the budget at completion is derived from a number the team has just disowned. The only defensible forecast is EAC = AC + bottom-up ETC = $1,150,000 + $1,900,000 = $3,050,000, and VAC = BAC - EAC = -$650,000, which is what obliges the project manager to take it to the board rather than footnote it. The $3,066,667 option is EAC = BAC / CPI, with CPI = $900,000 / $1,150,000 = 0.78. It lands within $17,000 of the right answer, and that closeness is exactly what makes it dangerous: it looks like independent corroboration when it is really the same discredited budget wearing an index, and its agreement here is a coincidence of the arithmetic rather than evidence. The $2,650,000 option is AC + (BAC - EV), which prices the remaining work at the baseline rate the technical review has just invalidated. The $1,900,000 option reports the bottom-up estimate to complete on its own and omits the money already spent; a forecast smaller than what a project has already committed should fail a moment of sanity checking before it reaches a board. Planned value is in the stem because a status pack contains it, and it is an input to none of the four figures.',
    }),

    /* 9 */ q({
        difficulty: 'hard', bloomLevel: 'Evaluate',
        ecoTask: 'Process · Plan and manage budget',
        stem: 'The finance business partner wants a defensible estimate at completion before the quarterly forecast review. The cost performance index sits at 0.92 and the schedule performance index at 0.98. Root-cause analysis attributes the whole cost variance to rework on a subsystem that has since been completed, tested and formally accepted by the customer, and the scope that remains is routine repetition of work the team has already delivered twice. An independent estimate commissioned last week confirmed the baseline figures for that remaining scope. Which forecasting approach should the project manager use, and why?',
        options: [
            'EAC = AC + a fresh bottom-up estimate to complete, because a forecast is only credible once the remaining work has been re-estimated from the ground up',
            'EAC = BAC / CPI, because the cost performance index is the most reliable single predictor of final cost and removes subjective judgement from the forecast',
            'EAC = AC + [(BAC - EV) / (CPI x SPI)], because the schedule is also running behind and cost and schedule pressure compound on the work that remains',
            'EAC = AC + (BAC - EV), because the cause of the variance is closed out and the remaining work is expected to be performed at the budgeted rate',
        ],
        correctAnswer: 3,
        explanation: 'This item carries no arithmetic on purpose: choosing the assumption is the skill, and the four variants give materially different answers from identical inputs. Two facts settle it. The variance has a closed cause — the subsystem is accepted, so the rework cannot recur — and the estimates for the remaining scope have just been independently validated. Both point at EAC = AC + (BAC - EV): keep the money already spent, price what is left at baseline. Applying BAC / CPI is the default and therefore the answer most candidates give when the clock is short, but it projects a finished problem, a cost index of 0.92, across the rest of the project and overstates the forecast, which has a real cost when reserve is allocated on the strength of it. The CPI x SPI variant is genuinely available here — a schedule index of 0.98 is on the page — and it is still wrong, because that variant belongs where schedule pressure is actively driving cost through overtime, crashing or expediting, and the stem describes none of that; a schedule index two percent off plan is not evidence of it. The bottom-up option is not wrong as a practice, but it is the response to an estimate that has been discredited, and here an independent estimate has just confirmed the opposite. Re-estimating anyway spends days of the team\'s time reproducing a number that has already been validated.',
    }),

    // ─────────── ETC / VAC (3) ───────────

    /* 10 */ q({
        difficulty: 'hard', bloomLevel: 'Apply',
        ecoTask: 'Process · Plan and manage budget',
        stem: 'The finance business partner on a warehouse automation project asks a single question at the funding checkpoint: how much more money will this need from today? The project carries a budget at completion of $900,000, with earned value of $360,000, planned value of $400,000 and actual cost of $420,000. Performance analysis concludes that the cost variances seen so far are typical of how this team and this scope will continue to behave, and the modest schedule slip is confined to a training workstream that carries float and will not be accelerated. What should the project manager report?',
        options: [
            '$1,050,000 — the full forecast cost of the project, which is the number a funding review needs in order to reserve against it for the rest of the year',
            '$540,000 — the budgeted cost of the work not yet earned, which is what the remaining scope was estimated to cost',
            '$630,000 — the forecast total less what has already been spent, which is the money the project must actually ask for from today',
            '$480,000 — the amount still unspent against the approved budget, which is what the finance system will show as available',
        ],
        correctAnswer: 2,
        explanation: 'The question asks for the estimate to complete, and ETC = EAC - AC, so the EAC assumption has to be settled first. "Variances are typical" is the trigger for EAC = BAC / CPI. CPI = EV / AC = $360,000 / $420,000 = 0.86 to two places, or exactly six sevenths, so EAC = $900,000 x 7 / 6 = $1,050,000 and ETC = $1,050,000 - $420,000 = $630,000. Planned value is supplied and is not used: the slip sits on a workstream with float that nobody is accelerating, so schedule performance is not driving the cost of the remaining work and the CPI x SPI variant has no basis. The $540,000 option is BAC - EV, which is the correct estimate-to-complete formula for a different assumption — that the rest of the work will run at the budgeted rate. Right shape, wrong premise, and it understates the ask by ninety thousand dollars: enough for a funding request to be approved and then run out. The $480,000 option is BAC - AC, the money left in the budget. That is a genuinely useful number and it is not an estimate to complete; mistaking what is left in the envelope for what the work will cost is how projects reach 90% of the budget with 60% of the scope. The $1,050,000 option is the estimate at completion itself, which answers a different question — the total cost including the money already spent — and asking for it would request that money twice.',
    }),

    /* 11 */ q({
        difficulty: 'hard', bloomLevel: 'Evaluate',
        ecoTask: 'Process · Plan and manage budget',
        stem: 'A business unit controller reads the ledger for a plant upgrade and tells the project manager: "You have $480,000 left in the budget, so you are fine." The upgrade has a budget at completion of $1,500,000, earned value of $900,000, planned value of $960,000 and actual cost of $1,020,000, and $45,000 of contingency reserve is uncommitted. The cost variances are expected to continue, and the small schedule slip sits on a path with float that the team is not planning to accelerate. How should the project manager respond?',
        options: [
            'Agree in part: $480,000 of budget remains against an estimate to complete of $600,000, leaving a shortfall that can be absorbed from contingency without escalating',
            'Agree: unspent budget is by definition the estimate to complete, so $480,000 is the right figure to carry into the forecast and no funding conversation is needed',
            'Disagree: the estimate to complete is $1,700,000, so the upgrade needs that much additional funding and the sponsor should be asked for it before more work is authorised',
            'Disagree: the estimate to complete is $680,000 against $480,000 of unspent budget, so report a variance at completion of -$200,000 and take a funding or scope decision to change control',
        ],
        correctAnswer: 3,
        explanation: 'The controller has quoted BAC - AC = $1,500,000 - $1,020,000 = $480,000, which is money left in the envelope and says nothing about what the remaining work costs. With variances expected to continue, CPI = EV / AC = $900,000 / $1,020,000 = 0.88, so EAC = BAC / CPI = $1,700,000, ETC = EAC - AC = $1,700,000 - $1,020,000 = $680,000, and VAC = BAC - EAC = -$200,000. The upgrade is two hundred thousand dollars short, and the ledger cannot show that, because the ledger knows about money and not about scope delivered. Reporting it as a variance at completion routes it to change control, which is where a funding or scope decision belongs. Planned value is on the page and stays there: the slip has float and nothing is being accelerated, so there is no schedule-driven cost effect to model. The option quoting $600,000 uses ETC = BAC - EV — right formula, wrong assumption — and understates the gap; the contingency balance would not close even that smaller figure, and contingency is sized against specific identified risks rather than against a forecast overrun in general. The option agreeing with the controller mistakes unspent budget for a forecast, which is the error the whole question exists to expose. The option demanding $1,700,000 reports the estimate at completion as though it were the estimate to complete, double-counting the money already spent and turning a manageable conversation into one that will not survive first contact with a sponsor.',
    }),

    /* 12 */ q({
        difficulty: 'hard', bloomLevel: 'Analyze',
        ecoTask: 'Process · Plan and manage budget',
        stem: 'The portfolio office has asked every project manager to submit a variance at completion ahead of the quarterly funding review. A regulatory reporting build carries a budget at completion of $750,000, earned value of $300,000, planned value of $330,000 and actual cost of $375,000, and its cost variances are expected to continue at the present rate. A draft bottom-up re-estimate putting the remaining work at $400,000 was circulated last month, but the technical lead has withdrawn it pending a design decision that has not been taken. The schedule slip is confined to a documentation workstream off the critical path that will not be accelerated. What figure should be submitted, and what does it mean?',
        options: [
            '-$187,500 — a forecast overrun that has to be reported now, while a scope or funding decision is still possible',
            '+$187,500 — a forecast saving of the same size, since variance at completion is the forecast total less the approved budget',
            '-$75,000 — the variance the build has actually incurred to date, which is the only overrun anyone can evidence',
            '-$25,000 — the shortfall once the remaining work is taken at the bottom-up re-estimate rather than at baseline',
        ],
        correctAnswer: 0,
        explanation: 'VAC = BAC - EAC, so the forecast comes first. Variances continuing is the trigger for EAC = BAC / CPI, with CPI = EV / AC = $300,000 / $375,000 = 0.80, giving EAC = $750,000 / 0.80 = $937,500 and VAC = $750,000 - $937,500 = -$187,500. Negative is unfavourable: the build is forecast to finish that much beyond its budget, and the portfolio office needs the number now, while scope and funding are still adjustable. Two figures in the stem exist to be rejected. The bottom-up re-estimate has been formally withdrawn, so it is a basis for nothing; using it anyway gives EAC = $375,000 + $400,000 = $775,000 and a variance at completion of -$25,000, which understates the exposure by $162,500 on the strength of a number its own author has retracted. Planned value is also supplied and also unused, because the documentation slip has float and is not being accelerated. The positive $187,500 option computes EAC - BAC and inverts the meaning, reporting an overrun as a saving — the kind of error a portfolio office propagates into a funding decision before anyone re-checks it. The -$75,000 option is the cost variance, EV - AC: the cost variance is what has happened to date and the variance at completion is what is forecast to happen by the end, and quoting the smaller of the two understates the problem by $112,500.',
    }),

    // ─────────── TCPI (2) ───────────

    /* 13 */ q({
        difficulty: 'medium', bloomLevel: 'Apply',
        ecoTask: 'Process · Plan and manage budget',
        stem: 'The sponsor of a rail signalling upgrade has stated plainly that no further funding will be released and the work must complete within the original budget. The upgrade carries a budget at completion of $5,000,000, with earned value of $2,000,000, planned value of $2,200,000 and actual cost of $2,500,000; $250,000 of contingency reserve remains, and the sponsor has ruled it out of scope for this conversation. What cost efficiency must the remaining work achieve, and how should that be put to the sponsor?',
        options: [
            'A to-complete performance index of 1.20 — every remaining dollar must buy $1.20 of work, against the $0.80 it is buying today',
            'A to-complete performance index of 0.80, the cost efficiency the team has demonstrated, which is therefore the rate the remaining work should be planned around',
            'A to-complete performance index of 0.83, which is below one and so tells the sponsor the work still to come is easier than what has been done',
            'A to-complete performance index of 1.00, since the remaining work only has to be delivered at the rate the baseline budgeted for it',
        ],
        correctAnswer: 0,
        explanation: 'The target is the original budget, so this is TCPI to BAC = (BAC - EV) / (BAC - AC) = ($5,000,000 - $2,000,000) / ($5,000,000 - $2,500,000) = $3,000,000 / $2,500,000 = 1.20. Read the two halves separately and the formula stops needing to be memorised: the numerator is the work still to be delivered, valued at baseline, and the denominator is the money still available to deliver it. Needing three million dollars of work out of two and a half million dollars of cash means every remaining dollar has to buy $1.20 of work. The characterisation matters as much as the number: CPI = EV / AC = $2,000,000 / $2,500,000 = 0.80, so a required 1.20 is above the 0.80 achieved so far, a fifty percent improvement that almost never materialises without a change of scope or approach — and saying so is the whole value of doing the calculation. The 0.80 option quotes the cost performance index as though it were the requirement, which inverts the message entirely. The 0.83 option inverts the ratio to (BAC - AC) / (BAC - EV) and lands beneath parity, implying the target is easier than business as usual. The 1.00 option assumes the remaining work merely has to run at the budgeted rate, quietly ignoring the half million dollars already overspent — that money is gone, and the work that is left has to make it up. Planned value and the contingency balance are inputs to none of this.',
    }),

    /* 14 */ q({
        difficulty: 'hard', bloomLevel: 'Analyze',
        ecoTask: 'Process · Plan and manage budget',
        stem: 'Following a re-baselining review, the sponsor of a laboratory fit-out has approved a revised estimate at completion of $3,800,000 as the new management target. The original budget at completion was $3,000,000. At the review date earned value stood at $1,200,000, planned value at $1,300,000 and actual cost at $1,600,000, and $210,000 of contingency reserve was left uncommitted. What efficiency must the remaining work achieve against the approved target, and what does the result tell the project manager?',
        options: [
            'TCPI is 0.82, above the 0.75 achieved so far, so the approved target still asks for a modest improvement on demonstrated cost efficiency rather than a relaxation of it',
            'TCPI is 1.29, so the team must improve substantially on the cost efficiency it has achieved so far, and the sponsor should be warned before the revised figure is committed to',
            'TCPI is 0.75, unchanged from the current cost performance index, so the approved target simply formalises current performance and needs no change in how the work is run',
            'TCPI is 1.22, so the approved target is already out of reach and a further re-baselining should be requested before the team commits to the revised figure',
        ],
        correctAnswer: 0,
        explanation: 'Once an estimate at completion has been formally approved it becomes the target, so the denominator changes: TCPI to EAC = (BAC - EV) / (EAC - AC) = ($3,000,000 - $1,200,000) / ($3,800,000 - $1,600,000) = $1,800,000 / $2,200,000 = 0.82. Current CPI = EV / AC = $1,200,000 / $1,600,000 = 0.75. The comparison is the answer, and the direction of it is the whole item: 0.82 is above the 0.75 the team has demonstrated, so the re-baselined target still requires roughly a nine percent improvement in cost efficiency. That is a real ask rather than a licence to slow down, though a far smaller one than the original budget demanded, which is what re-baselining is for. It is worth checking the target against the CPI-based forecast too: BAC / CPI = $3,000,000 / 0.75 = $4,000,000, so the approved figure sits two hundred thousand dollars tighter than a straight-line projection. The 1.29 option is TCPI to BAC, ($3,000,000 - $1,200,000) / ($3,000,000 - $1,600,000), which is the answer a candidate gives when they apply the formula they memorised rather than the target the stem names; it is also the number that justified the re-baselining in the first place. The 0.75 option repeats the cost performance index, mistaking past performance for a forward requirement, and 0.82 and 0.75 are not one number. The 1.22 option inverts the ratio to $2,200,000 / $1,800,000, and its recommendation compounds the error by sending the project manager back for a second re-baselining the arithmetic does not support. Planned value and the contingency balance are supplied and are inputs to none of it.',
    }),

    // ─────────── Reading the indices honestly (2) ───────────

    /* 15 */ q({
        difficulty: 'hard', bloomLevel: 'Evaluate',
        ecoTask: 'Process · Analyze schedule variation',
        stem: 'A twelve-month predictive rollout is in its final month. The schedule performance index has climbed from 0.78 in month seven to 0.97 now, and the earned value report shows 92% of the budgeted work complete. The integrated master schedule still forecasts handover six weeks after the baseline date, and both remaining activities sit on the critical path. A steering committee member points at the improving index and asks whether the project has recovered. What should the project manager say?',
        options: [
            'Yes — at 0.97 the remaining variance is inside three percent of plan, which is normal reporting tolerance, so the baseline handover date can still be committed to',
            'No — a schedule performance index always converges on parity as a project completes, whatever the finish date, so the improvement is arithmetic; the critical path says six weeks late',
            'No — an index of 0.97 still indicates a shortfall, so the rollout is about three percent late, roughly eleven days against a twelve-month baseline, and that is the figure the committee should be given',
            'Yes on cost grounds — the improving index shows the corrective actions worked, so the six-week forecast predates the recovery and should be re-examined',
        ],
        correctAnswer: 1,
        explanation: 'The schedule performance index is EV / PV, and both converge on the budget at completion as the last work packages are earned, so the index is dragged towards parity on every project that finishes, however late it finishes. At 92% complete an index of 0.97 carries almost no information about the finish date, and the movement from 0.78 to 0.97 is what the arithmetic does rather than what the team did. The credible read is the schedule model: two activities left, both on the critical path, six weeks of forecast slip. That is what the committee should be told, and telling them in the final month is the last chance anyone has to act on it. Reading 0.97 as three percent of plan and stopping there commits the project to a date the network does not support. Converting the index into a duration — three percent of twelve months, so about eleven days — is the same error wearing arithmetic: the index is a ratio of budgeted cost of work, not of time, and a project can hold an index near parity while a single critical-path activity runs months late. Treating the improvement as evidence that corrective action worked inverts cause and effect, because nothing changed except how much of the budget had been earned; re-examining a schedule forecast on that basis replaces a network model with a statistical artefact.',
    }),

    /* 16 */ q({
        difficulty: 'medium', bloomLevel: 'Analyze',
        ecoTask: 'Process · Evaluate project status',
        stem: 'An executive dashboard auto-populates a "percent complete" tile for a $1,600,000 product programme straight from the finance feed, and it currently reads 35%. The underlying period figures are earned value of $480,000, actual cost of $560,000 and planned value of $640,000. The project manager is asked to confirm the tile before the portfolio review. What should the project manager say?',
        options: [
            'Confirm 35%, because recorded spend is the most objective measure of progress available and the finance feed is the system of record for the portfolio review and reconciles to the ledger',
            'Correct it to 40%, because that is the percentage the baseline schedule says should be complete by now, and the baseline is the agreed measure of plan',
            'Correct it to 30%: percent complete is earned value divided by budget at completion, and the tile is showing actual cost divided by budget at completion, which is budget consumed rather than work delivered',
            'Correct it to 75%, because that is the proportion of the scheduled work the team has actually completed and so the truest reading of progress to date',
        ],
        correctAnswer: 2,
        explanation: 'Percent complete = EV / BAC = $480,000 / $1,600,000 = 30%. The dashboard is computing AC / BAC = $560,000 / $1,600,000 = 35%, which measures how much of the budget has been consumed and would read 100% the moment the money ran out, whatever had been built. That is not a rounding difference, it is a different quantity, and the gap between the two is the cost overrun in another form: 35% of the budget has bought 30% of the work. The 40% option is PV / BAC = $640,000 / $1,600,000, the planned percent complete — what the baseline says should be finished, which is the schedule\'s claim and not a measurement of anything the team has done. Reporting it makes every project look exactly on plan until the day it visibly is not. The 75% option is EV / PV = 0.75, the schedule performance index; it is a ratio of work delivered to work scheduled, not a share of total scope, and quoting it would tell the portfolio review the programme is three-quarters finished when barely a third of the scope exists. Confirming the tile is the worst of the four, because it makes a defective dashboard the official record and every decision downstream of it inherits the error.',
    }),

    // ─────────── Expected monetary value (4) ───────────

    /* 17 */ q({
        difficulty: 'medium', bloomLevel: 'Evaluate',
        ecoTask: 'Process · Assess and manage risks',
        stem: 'Four opportunities in the risk register compete for a single funding slot in this quarter\'s response plan, and only one can be taken. Consolidating two vendor tools has a 30% chance of saving $500,000. Automating the regression suite has an 80% chance of saving $150,000. Renegotiating the hosting contract has a 55% chance of saving $320,000. Retiring a legacy reporting service has a 45% chance of saving $340,000. Which should the project manager recommend on expected monetary value?',
        options: [
            'Consolidate two vendor tools',
            'Retire a legacy reporting service',
            'Renegotiate the hosting contract',
            'Automate the regression suite',
        ],
        correctAnswer: 2,
        correctLabel: 'Renegotiate the hosting contract',
        scenarios: [
            { label: 'Consolidate two vendor tools', probability: 0.30, impact: 500000 },
            { label: 'Automate the regression suite', probability: 0.80, impact: 150000 },
            { label: 'Renegotiate the hosting contract', probability: 0.55, impact: 320000 },
            { label: 'Retire a legacy reporting service', probability: 0.45, impact: 340000 },
        ],
        explanation: 'EMV = probability x impact, applied to each branch and then compared. Consolidating the vendor tools gives 0.30 x $500,000 = $150,000. Automating the regression suite gives 0.80 x $150,000 = $120,000. Renegotiating hosting gives 0.55 x $320,000 = $176,000. Retiring the legacy reporting service gives 0.45 x $340,000 = $153,000. Hosting wins, and it wins while being neither the most likely of the four nor the largest prize on the page — which is exactly what the technique is for, since it prices magnitude and likelihood in the same unit so the two can be traded against each other instead of argued about. Automating the regression suite is the answer most people reach for under time pressure, because a four-in-five chance feels like the safe recommendation and it is the first number the eye lands on; ranking by probability alone ignores a payoff a third of the size. Consolidating the vendor tools carries the biggest headline saving and the worst odds, and it finishes third. Retiring the reporting service is the genuine near-miss, and the gap between it and hosting is $23,000 — small enough that one transposed digit changes the recommendation, which is why this arithmetic is written down rather than done in the head. One caveat belongs in the recommendation itself: expected monetary value is an average over many repetitions, so on a single one-shot decision the chosen branch pays nothing in nearly half of all outcomes, and if the project cannot absorb that, risk appetite may legitimately override the arithmetic.',
    }),

    /* 18 */ q({
        difficulty: 'hard', bloomLevel: 'Analyze',
        ecoTask: 'Process · Assess and manage risks',
        stem: 'A make-or-buy decision is being analysed with a decision tree. Building the component in-house costs $500,000, with a 30% probability that a known integration defect recurs and adds $600,000 of rework. Buying it from a vendor costs $620,000 fixed, with a 15% probability of a $300,000 late-integration penalty. A $40,000 test-harness licence is needed either way. Both paths deliver the same scope. What should the project manager recommend?',
        options: [
            'Build in-house, because its $500,000 base cost is $120,000 lower than the vendor price and the integration defect is a known issue the team has learned to contain',
            'Buy from the vendor, because its 15% risk probability is half that of the build option and transferring the exposure to a supplier is the stronger risk response',
            'Build in-house, at an expected cost of $680,000 against $920,000 to buy once the vendor penalty is counted in full, which makes building the clearly cheaper path',
            'Buy from the vendor, at an expected cost of $665,000 against $680,000 to build — a $15,000 gap that sits inside the estimating error, so present the ranges rather than a decisive result',
        ],
        correctAnswer: 3,
        explanation: 'Each path is a base cost plus a probability-weighted add-on. Build = $500,000 + (0.30 x $600,000) = $500,000 + $180,000 = $680,000. Buy = $620,000 + (0.15 x $300,000) = $620,000 + $45,000 = $665,000. The test-harness licence is common to both paths, so it shifts each total by the same amount and cannot change the ranking; adding it to one side only is the fastest way to reverse the answer. Buying is cheaper in expectation, and saying so honestly means saying how thin the margin is: a $15,000 gap on a two-thirds-of-a-million-dollar decision sits well inside the precision of the estimates feeding it, so in practice the tie-breaker will be something the tree does not price, such as who holds the capability afterwards. Comparing the $500,000 and $620,000 base costs is the fastest wrong answer available and the one a candidate reaches for when time is short; it ignores the whole purpose of the analysis, which is that the cheaper sticker carries four times the risk exposure. Comparing the bare probabilities is the same error on the other axis: 30% against 15% looks like a factor of two, while the exposures are $180,000 against $45,000, a factor of four, because the impact sizes differ as well. The $920,000 figure adds the vendor penalty at full value instead of weighting it, budgeting for an outcome that is 85% likely never to happen and making the correct choice look like the expensive one.',
    }),

    /* 19 */ q({
        difficulty: 'hard', bloomLevel: 'Analyze',
        ecoTask: 'Process · Assess and manage risks',
        stem: 'A quantitative risk analysis on a plant relocation produces four open costed threats: a permit delay at 40% probability and $250,000 impact; a key supplier failure at 15% and $600,000; an adverse currency movement at 60% and $75,000; and scope-clarification rework at 25% and $180,000. A fifth entry, a data-migration failure assessed at 35% and $400,000, was closed last week when the migration completed successfully, and it remains in the register marked closed. The sponsor asks how much contingency should be added and how it will be controlled. What should the project manager propose?',
        options: [
            '$1,105,000 of contingency, so the relocation stays funded even in the worst case where all four open risks occur at their full assessed impact',
            '$420,000 of contingency, which keeps the data-migration risk funded until its register entry is formally removed at the next review',
            '$280,000 of contingency reserve, held inside the cost baseline and controlled by the project manager, with management reserve for unknown-unknowns set separately by the sponsor',
            '$280,000 held as management reserve outside the cost baseline, so the project manager can draw on it as risks materialise without a separate approval each time',
        ],
        correctAnswer: 2,
        explanation: 'Contingency for identified risks is the sum of the expected monetary values of the risks that are still open: 0.40 x $250,000 = $100,000, plus 0.15 x $600,000 = $90,000, plus 0.60 x $75,000 = $45,000, plus 0.25 x $180,000 = $45,000, giving $280,000. The closed data-migration entry is the figure to reject: its risk has been resolved as a non-event, so its expected value is now zero however the register still labels it, and carrying it adds 0.35 x $400,000 = $140,000 of reserve against something that can no longer happen, taking the ask to $420,000. The second half of the answer matters as much as the arithmetic. Contingency reserve covers known-unknowns, sits inside the cost baseline, and is the project manager\'s to authorise against the risks it was sized for; management reserve covers unknown-unknowns, sits outside the cost baseline, and needs sponsor or management approval to release. The $1,105,000 option adds the four raw impacts and funds a worst case in which every risk fires at once — it is the intuitive answer, it is what a nervous sponsor often asks for, and it ties up $825,000 of organisational capital against an outcome whose joint probability is beneath one percent. The management-reserve option gets the number right and both governance points wrong: it puts a known-unknown allocation in the wrong pot and inverts who controls it, and that second half is the more damaging, because it removes the sponsor\'s oversight of unknown-unknowns entirely.',
    }),

    /* 20 */ q({
        difficulty: 'hard', bloomLevel: 'Evaluate',
        ecoTask: 'Process · Assess and manage risks',
        stem: 'A project manager is choosing between four contract structures for the same statement of work. Each carries a single quantified downside: time-and-materials with a not-to-exceed cap, a 50% probability of a $300,000 overrun charge; firm fixed price with a change-order clause, a 25% probability of $520,000 of change-order exposure; cost-plus-incentive-fee, a 70% probability of a $180,000 shared-overrun charge; and cost-plus-award-fee, a 40% probability of a $270,000 award-adjustment charge. Which structure carries the lowest expected cost of risk?',
        options: [
            'Time-and-materials with a not-to-exceed cap, at an expected cost of risk of $150,000, because the cap is the only one of the four that puts a hard ceiling on the buyer\'s exposure',
            'Cost-plus-award-fee, at an expected cost of risk of $108,000 — the lowest of the four, though it holds neither the least likely downside nor the smallest one',
            'Cost-plus-incentive-fee, because its $180,000 exposure is the smallest single downside of the four and the incentive fee shares any overrun with the supplier',
            'Firm fixed price with a change-order clause, because its 25% probability is the lowest on the page and a firm price transfers the exposure to the supplier',
        ],
        correctAnswer: 1,
        explanation: 'Expected cost of risk is probability x impact, computed for each structure and then compared: time-and-materials 0.50 x $300,000 = $150,000; firm fixed price 0.25 x $520,000 = $130,000; cost-plus-incentive-fee 0.70 x $180,000 = $126,000; cost-plus-award-fee 0.40 x $270,000 = $108,000. The award-fee structure is cheapest in expectation, and it wins while holding neither the lowest probability nor the smallest impact — which is the whole lesson, because those are precisely the two heuristics a candidate reaches for when the clock is short. Ranking by impact size picks the incentive-fee structure, whose downside is the smallest on the page and whose seven-in-ten probability makes it the third most expensive of the four. Ranking by probability picks the firm fixed price, whose one-in-four odds are the longest and whose exposure is the largest, leaving it $22,000 adrift of the award-fee structure. Time-and-materials reads as the protected option because a not-to-exceed cap sounds like a ceiling, and at even odds on a $300,000 charge it is the most expensive of the four in expectation. One convention is worth stating: these impacts are written as costs, so the cheapest structure is the smallest number. Where threats are carried alongside opportunities in one register they are entered as negative values instead, and the same decision then becomes the least negative expected value — identical arithmetic, only the sign convention moves.',
    }),
];

// ─────────────────────────────────────────────────────────────────────────────
// Machine-checkable arithmetic.
//
// These live OUTSIDE the question documents on purpose — the loader writes only
// `questions[i]`, so nothing here reaches Firestore. Every numeric key in the
// set is recomputed by the loader from the named formula and its inputs, and the
// loader then requires the formatted result to appear verbatim in the text it is
// supposed to appear in. That chains value -> text -> question, so a transposed
// digit in an option cannot pass, and a formula named here that does not match
// the one the explanation walks through is caught on the next run.
//
// `where` is 'option' (the keyed option) or 'explanation' (an intermediate step
// that must be shown in the worked calculation, but is not the final answer).
//
// Chaining is necessary and it is not sufficient. It confirms each number in
// isolation; it cannot see a false claim ABOUT two individually-correct numbers,
// which is how the first draft shipped a Q14 whose key read "0.82, below the
// 0.75 achieved so far" with both figures verified. The loader's comparative
// check closes that, and it needs these entries to know which strings in a
// sentence are values worth binding a comparison to.
// ─────────────────────────────────────────────────────────────────────────────

const mathChecks = [
    { q: 1, formula: 'pv', inputs: { plannedPct: 0.50, BAC: 800000 }, expect: 400000, fmt: 'money', text: 'PV $400,000' },
    { q: 1, formula: 'ev', inputs: { actualPct: 0.40, BAC: 800000 }, expect: 320000, fmt: 'money', text: 'EV $320,000' },

    { q: 2, formula: 'ev', inputs: { actualPct: 0.325, BAC: 1200000 }, expect: 390000, fmt: 'money', text: '$390,000', where: 'explanation' },
    { q: 2, formula: 'cv', inputs: { EV: 390000, AC: 520000 }, expect: -130000, fmt: 'money', text: 'CV is -$130,000' },
    { q: 2, formula: 'sv', inputs: { EV: 390000, PV: 500000 }, expect: -110000, fmt: 'money', text: 'SV is -$110,000' },

    { q: 3, formula: 'sv', inputs: { EV: 600000, PV: 750000 }, expect: -150000, fmt: 'money', text: 'SV is -$150,000' },
    { q: 3, formula: 'spi', inputs: { EV: 600000, PV: 750000 }, expect: 0.80, fmt: 'ratio', text: 'SPI is 0.80' },

    { q: 4, formula: 'cpi', inputs: { EV: 440000, AC: 400000 }, expect: 1.10, fmt: 'ratio', text: 'CPI is 1.10' },
    { q: 4, formula: 'spi', inputs: { EV: 440000, PV: 550000 }, expect: 0.80, fmt: 'ratio', text: 'SPI is 0.80' },

    { q: 5, formula: 'eac_typical', inputs: { BAC: 4000000, EV: 1600000, AC: 2000000 }, expect: 5000000, fmt: 'money', text: '$5,000,000' },
    { q: 5, formula: 'cpi', inputs: { EV: 1600000, AC: 2000000 }, expect: 0.80, fmt: 'ratio', text: '0.80', where: 'explanation' },
    { q: 5, formula: 'spi', inputs: { EV: 1600000, PV: 1700000 }, expect: 0.9411764705882353, fmt: 'ratio', text: 'SPI = 0.94', where: 'explanation' },
    { q: 5, formula: 'eac_both', inputs: { BAC: 4000000, EV: 1600000, AC: 2000000, PV: 1700000 }, expect: 5187500, fmt: 'money', text: '$5,187,500', where: 'explanation' },

    { q: 6, formula: 'eac_atypical', inputs: { BAC: 600000, EV: 240000, AC: 310000 }, expect: 670000, fmt: 'money', text: '$670,000' },
    { q: 6, formula: 'etc_budgeted', inputs: { BAC: 600000, EV: 240000 }, expect: 360000, fmt: 'money', text: '$360,000' },
    { q: 6, formula: 'spi', inputs: { EV: 240000, PV: 250000 }, expect: 0.96, fmt: 'ratio', text: 'SPI = 0.96', where: 'explanation' },
    { q: 6, formula: 'cpi', inputs: { EV: 240000, AC: 310000 }, expect: 0.7741935483870968, fmt: 'ratio', text: '0.77', where: 'explanation' },
    { q: 6, formula: 'eac_typical', inputs: { BAC: 600000, EV: 240000, AC: 310000 }, expect: 775000, fmt: 'money', text: '$775,000', where: 'explanation' },
    { q: 6, formula: 'eac_both', inputs: { BAC: 600000, EV: 240000, AC: 310000, PV: 250000 }, expect: 794375, fmt: 'money', text: '$794,375', where: 'explanation' },

    { q: 7, formula: 'ev', inputs: { actualPct: 0.40, BAC: 1000000 }, expect: 400000, fmt: 'money', text: '$400,000', where: 'explanation' },
    { q: 7, formula: 'cpi', inputs: { EV: 400000, AC: 500000 }, expect: 0.80, fmt: 'ratio', text: '0.80', where: 'explanation' },
    { q: 7, formula: 'eac_both', inputs: { BAC: 1000000, EV: 400000, AC: 500000, PV: 500000 }, expect: 1437500, fmt: 'money', text: '$1,437,500' },
    { q: 7, formula: 'vac', inputs: { BAC: 1000000, EAC: 1437500 }, expect: -437500, fmt: 'money', text: '$437,500 above budget' },

    { q: 8, formula: 'eac_bottomup', inputs: { AC: 1150000, ETC: 1900000 }, expect: 3050000, fmt: 'money', text: '$3,050,000' },
    { q: 8, formula: 'vac', inputs: { BAC: 2400000, EAC: 3050000 }, expect: -650000, fmt: 'money', text: '$650,000 gap' },
    { q: 8, formula: 'cpi', inputs: { EV: 900000, AC: 1150000 }, expect: 0.782608695652174, fmt: 'ratio', text: '0.78', where: 'explanation' },

    // #9 tests variant selection and carries no arithmetic by design. The two
    // indices it states are still bound to the explanation so the reasoning
    // cannot drift from the stem.
    { q: 9, formula: 'given', inputs: { value: 0.92 }, expect: 0.92, fmt: 'ratio', text: 'cost index of 0.92', where: 'explanation' },
    { q: 9, formula: 'given', inputs: { value: 0.98 }, expect: 0.98, fmt: 'ratio', text: 'schedule index of 0.98', where: 'explanation' },

    { q: 10, formula: 'cpi', inputs: { EV: 360000, AC: 420000 }, expect: 0.8571428571428571, fmt: 'ratio', text: '0.86', where: 'explanation' },
    { q: 10, formula: 'eac_typical', inputs: { BAC: 900000, EV: 360000, AC: 420000 }, expect: 1050000, fmt: 'money', text: '$1,050,000', where: 'explanation' },
    { q: 10, formula: 'etc_from_eac', inputs: { EAC: 1050000, AC: 420000 }, expect: 630000, fmt: 'money', text: '$630,000' },
    { q: 10, formula: 'etc_budgeted', inputs: { BAC: 900000, EV: 360000 }, expect: 540000, fmt: 'money', text: '$540,000', where: 'explanation' },

    { q: 11, formula: 'cpi', inputs: { EV: 900000, AC: 1020000 }, expect: 0.8823529411764706, fmt: 'ratio', text: '0.88', where: 'explanation' },
    { q: 11, formula: 'eac_typical', inputs: { BAC: 1500000, EV: 900000, AC: 1020000 }, expect: 1700000, fmt: 'money', text: '$1,700,000', where: 'explanation' },
    { q: 11, formula: 'etc_from_eac', inputs: { EAC: 1700000, AC: 1020000 }, expect: 680000, fmt: 'money', text: '$680,000' },
    { q: 11, formula: 'vac', inputs: { BAC: 1500000, EAC: 1700000 }, expect: -200000, fmt: 'money', text: '-$200,000' },
    { q: 11, formula: 'etc_budgeted', inputs: { BAC: 1500000, EV: 900000 }, expect: 600000, fmt: 'money', text: '$600,000', where: 'explanation' },

    { q: 12, formula: 'cpi', inputs: { EV: 300000, AC: 375000 }, expect: 0.80, fmt: 'ratio', text: '0.80', where: 'explanation' },
    { q: 12, formula: 'eac_typical', inputs: { BAC: 750000, EV: 300000, AC: 375000 }, expect: 937500, fmt: 'money', text: '$937,500', where: 'explanation' },
    { q: 12, formula: 'vac', inputs: { BAC: 750000, EAC: 937500 }, expect: -187500, fmt: 'money', text: '-$187,500' },
    { q: 12, formula: 'cv', inputs: { EV: 300000, AC: 375000 }, expect: -75000, fmt: 'money', text: '-$75,000', where: 'explanation' },
    { q: 12, formula: 'eac_bottomup', inputs: { AC: 375000, ETC: 400000 }, expect: 775000, fmt: 'money', text: '$775,000', where: 'explanation' },
    { q: 12, formula: 'vac', inputs: { BAC: 750000, EAC: 775000 }, expect: -25000, fmt: 'money', text: '-$25,000', where: 'explanation' },
    { q: 12, formula: 'difference', inputs: { a: 187500, b: 25000 }, expect: 162500, fmt: 'money', text: '$162,500', where: 'explanation' },
    { q: 12, formula: 'difference', inputs: { a: 187500, b: 75000 }, expect: 112500, fmt: 'money', text: '$112,500', where: 'explanation' },

    { q: 13, formula: 'tcpi_bac', inputs: { BAC: 5000000, EV: 2000000, AC: 2500000 }, expect: 1.20, fmt: 'ratio', text: 'index of 1.20' },
    { q: 13, formula: 'cpi', inputs: { EV: 2000000, AC: 2500000 }, expect: 0.80, fmt: 'ratio', text: '$0.80' },

    { q: 14, formula: 'tcpi_eac', inputs: { BAC: 3000000, EV: 1200000, AC: 1600000, EAC: 3800000 }, expect: 0.8181818181818182, fmt: 'ratio', text: 'TCPI is 0.82' },
    { q: 14, formula: 'cpi', inputs: { EV: 1200000, AC: 1600000 }, expect: 0.75, fmt: 'ratio', text: 'above the 0.75' },
    { q: 14, formula: 'tcpi_bac', inputs: { BAC: 3000000, EV: 1200000, AC: 1600000 }, expect: 1.2857142857142858, fmt: 'ratio', text: 'The 1.29 option', where: 'explanation' },
    { q: 14, formula: 'eac_typical', inputs: { BAC: 3000000, EV: 1200000, AC: 1600000 }, expect: 4000000, fmt: 'money', text: '$4,000,000', where: 'explanation' },

    // #15 tests interpretation of an index, not arithmetic. Both figures are
    // stated in the stem and the checks confirm the explanation quotes them
    // unchanged.
    { q: 15, formula: 'given', inputs: { value: 0.97 }, expect: 0.97, fmt: 'ratio', text: 'index of 0.97', where: 'explanation' },
    { q: 15, formula: 'given', inputs: { value: 0.78 }, expect: 0.78, fmt: 'ratio', text: 'from 0.78', where: 'explanation' },

    { q: 16, formula: 'pct_complete', inputs: { EV: 480000, BAC: 1600000 }, expect: 0.30, fmt: 'pct', text: 'Correct it to 30%' },
    { q: 16, formula: 'spi', inputs: { EV: 480000, PV: 640000 }, expect: 0.75, fmt: 'ratio', text: 'EV / PV = 0.75', where: 'explanation' },

    { q: 17, formula: 'emv', inputs: { probability: 0.30, impact: 500000 }, expect: 150000, fmt: 'money', text: '0.30 x $500,000 = $150,000', where: 'explanation' },
    { q: 17, formula: 'emv', inputs: { probability: 0.80, impact: 150000 }, expect: 120000, fmt: 'money', text: '0.80 x $150,000 = $120,000', where: 'explanation' },
    { q: 17, formula: 'emv', inputs: { probability: 0.55, impact: 320000 }, expect: 176000, fmt: 'money', text: '0.55 x $320,000 = $176,000', where: 'explanation' },
    { q: 17, formula: 'emv', inputs: { probability: 0.45, impact: 340000 }, expect: 153000, fmt: 'money', text: '0.45 x $340,000 = $153,000', where: 'explanation' },
    { q: 17, formula: 'difference', inputs: { a: 176000, b: 153000 }, expect: 23000, fmt: 'money', text: '$23,000', where: 'explanation' },

    { q: 18, formula: 'base_plus_emv', inputs: { base: 500000, probability: 0.30, impact: 600000 }, expect: 680000, fmt: 'money', text: '$680,000' },
    { q: 18, formula: 'base_plus_emv', inputs: { base: 620000, probability: 0.15, impact: 300000 }, expect: 665000, fmt: 'money', text: '$665,000' },
    { q: 18, formula: 'difference', inputs: { a: 680000, b: 665000 }, expect: 15000, fmt: 'money', text: '$15,000 gap' },

    { q: 19, formula: 'emv_sum', inputs: { branches: [{ p: 0.40, impact: 250000 }, { p: 0.15, impact: 600000 }, { p: 0.60, impact: 75000 }, { p: 0.25, impact: 180000 }] }, expect: 280000, fmt: 'money', text: '$280,000' },
    { q: 19, formula: 'emv', inputs: { probability: 0.35, impact: 400000 }, expect: 140000, fmt: 'money', text: '0.35 x $400,000 = $140,000', where: 'explanation' },
    { q: 19, formula: 'difference', inputs: { a: 1105000, b: 280000 }, expect: 825000, fmt: 'money', text: '$825,000', where: 'explanation' },

    { q: 20, formula: 'emv', inputs: { probability: 0.40, impact: 270000 }, expect: 108000, fmt: 'money', text: '$108,000' },
    { q: 20, formula: 'emv', inputs: { probability: 0.50, impact: 300000 }, expect: 150000, fmt: 'money', text: '0.50 x $300,000 = $150,000', where: 'explanation' },
    { q: 20, formula: 'emv', inputs: { probability: 0.25, impact: 520000 }, expect: 130000, fmt: 'money', text: '0.25 x $520,000 = $130,000', where: 'explanation' },
    { q: 20, formula: 'emv', inputs: { probability: 0.70, impact: 180000 }, expect: 126000, fmt: 'money', text: '0.70 x $180,000 = $126,000', where: 'explanation' },
    { q: 20, formula: 'difference', inputs: { a: 130000, b: 108000 }, expect: 22000, fmt: 'money', text: '$22,000', where: 'explanation' },
];

// ─────────────────────────────────────────────────────────────────────────────
// The EAC family, declared so the variant leak cannot come back.
//
// `supplies` names the figures the STEM hands the candidate. The loader checks
// the declaration is honest (each named figure's label must appear in the stem,
// and each unnamed one must be absent from it), then cross-tabulates supplies
// against variants and fails if the presence or absence of any single figure
// identifies any variant exactly. That is the check the first draft failed 8/8
// on planned value.
//
// Also stays out of Firestore: the loader writes only questions[i].
// ─────────────────────────────────────────────────────────────────────────────

const eacFamily = [
    { q: 5, variant: 'typical', supplies: ['BAC', 'EV', 'AC', 'PV'] },
    { q: 6, variant: 'atypical', supplies: ['BAC', 'EV', 'AC', 'PV'] },
    { q: 7, variant: 'both', supplies: ['BAC', 'AC', 'CPI', 'SPI'] },
    { q: 8, variant: 'bottomup', supplies: ['BAC', 'EV', 'AC', 'PV', 'ETC'] },
    { q: 9, variant: 'atypical', supplies: ['CPI', 'SPI'] },
    { q: 10, variant: 'typical', supplies: ['BAC', 'EV', 'AC', 'PV'] },
    { q: 11, variant: 'typical', supplies: ['BAC', 'EV', 'AC', 'PV'] },
    { q: 12, variant: 'typical', supplies: ['BAC', 'EV', 'AC', 'PV', 'ETC'] },
];

const out = {
    examId: EXAM_ID,
    examName: 'PMI Project Management Professional (PMP) — July 2026 Examination Content Outline',
    source: SOURCE,
    authoredAt: '2026-08-30',
    note: 'Earned-value and quantitative risk items, question type "emv" (single-select, graded by index; the one item carrying `scenarios` also renders the EMV calculation panel). Formulas taken from docs/pmp-formula-reference.md. NOT reviewed by a certified subject matter expert.',
    questions,
    mathChecks,
    eacFamily,
};

mkdirSync('./seed', { recursive: true });
writeFileSync('./seed/pmp-earned-value.json', JSON.stringify(out, null, 2), 'utf8');

const byDomain = {}, byDifficulty = {}, byBloom = {}, keyPos = [0, 0, 0, 0];
for (const x of questions) {
    byDomain[x.domain] = (byDomain[x.domain] || 0) + 1;
    byDifficulty[x.difficulty] = (byDifficulty[x.difficulty] || 0) + 1;
    byBloom[x.bloomLevel] = (byBloom[x.bloomLevel] || 0) + 1;
    keyPos[x.correctAnswer]++;
}
console.log(`wrote ${questions.length} 'emv' questions -> seed/pmp-earned-value.json`);
console.log('by domain:    ', byDomain);
console.log('by difficulty:', byDifficulty);
console.log('by bloom:     ', byBloom);
console.log('answer key at position A/B/C/D:', keyPos.join(' / '));
console.log(`with scenarios panel: ${questions.filter((x) => x.scenarios).length}`);
console.log(`math checks:  ${mathChecks.length}   EAC family: ${eacFamily.length}`);

// Option-length report. The loader fails the build if the key runs more than 30
// characters past the longest distractor, or if it is the wordiest option in
// more than half the prose items; printing it here means an authoring change
// shows its effect before the loader is run.
let prose = 0, longestKey = 0, worstMargin = -Infinity, worstAt = 0;
questions.forEach((x, i) => {
    const lens = x.options.map((o) => o.length);
    if (Math.max(...lens) < 60) return;
    prose++;
    const keyLen = lens[x.correctAnswer];
    const other = Math.max(...lens.filter((_, j) => j !== x.correctAnswer));
    if (keyLen > other) longestKey++;
    if (keyLen - other > worstMargin) { worstMargin = keyLen - other; worstAt = i + 1; }
});
console.log(`key is wordiest in ${longestKey} of ${prose} prose items (fails above ${Math.floor(prose / 2)}); worst margin ${worstMargin} chars at #${worstAt} (fails above 30)`);
