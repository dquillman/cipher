/**
 * Deploy Structural Wave 2
 *
 * 1. Inserts 5 new structural questions into Firestore
 * 2. Soft-retires 5 replaced template questions (active: false, examId nulled)
 * 3. Prints deployment summary
 *
 * Usage:
 *   node deploy-structural-w2.js            # dry run (default)
 *   node deploy-structural-w2.js --live     # live deploy
 */

const admin = require("firebase-admin");
if (admin.apps.length === 0) admin.initializeApp({ projectId: "exam-coach-ai-platform" });
const db = admin.firestore();

const DRY_RUN = !process.argv.includes("--live");
const EXAM_ID = "7qmPagj9A6RpkC0CwGkY";
const CONTENT_VERSION = "1.17.0-STRUCTURAL-W2";
const COLLECTION = "questions";

// ── IDs to soft-retire ──────────────────────────────────────────────
const RETIRE_IDS = [
  "iPDfTuvzkALzAF6IcSkg",
  "CoIJHJ4Xkpt37QjZ7wzC",
  "IBajrhrby9BSp5BDjdqT",
  "xPrU4Gux6WxtKgjFIlKh",
  "mXs1mTtViak56ibYFC4Q",
];

// ── New structural questions ────────────────────────────────────────
const NEW_QUESTIONS = [
  {
    stem: "A pharmaceutical company needs to contract a vendor to build a custom laboratory information management system (LIMS). The scope for core modules \u2014 sample tracking, chain-of-custody logging, and regulatory reporting \u2014 is well-defined, with detailed requirements approved by the quality assurance team. However, the integration layer is highly uncertain: the vendor must reverse-engineer interfaces for 12 proprietary laboratory instruments, each with undocumented protocols. Past projects involving similar instrument integrations have experienced 30\u201360% scope variation. The procurement team has shortlisted three contract structures and asked the PM for a recommendation.\n\nThe CFO wants cost certainty. The vendor\u2019s proposal notes that an FFP bid for the full project would include a 35% risk premium to cover integration unknowns.\n\nWhich contract structure should the PM recommend?",
    options: [
      "Award a firm fixed-price (FFP) contract for the entire project, since the CFO\u2019s priority is cost certainty and FFP ensures the total price will not exceed the agreed amount regardless of integration complexity.",
      "Structure a hybrid contract \u2014 FFP for the well-defined core modules and cost-plus-incentive-fee (CPIF) for the integration layer \u2014 so that risk allocation matches scope certainty in each project area.",
      "Use a time-and-materials (T&M) contract for the full engagement to maintain maximum flexibility as the integration requirements emerge through discovery.",
      "Award an FFP contract with the vendor\u2019s 35% risk premium accepted, and establish a separate management reserve on the buyer\u2019s side to cover any additional integration overruns.",
    ],
    correctAnswer: 1,
    difficulty: "Hard",
    domain: "Process",
    explanation: "Correct Answer: B. Structure a hybrid contract \u2014 FFP for the well-defined core modules and CPIF for the integration layer \u2014 so that risk allocation matches scope certainty in each project area.\n\nWhy This Is Correct:\nPMI\u2019s procurement management guidance emphasizes that contract type selection should align risk allocation with the degree of scope definition (PMBOK Guide, Section 12). The core modules have detailed, approved requirements \u2014 ideal for FFP, where the buyer gains cost certainty and the vendor assumes delivery risk on well-understood work. The integration layer involves reverse-engineering 12 proprietary instrument interfaces with 30\u201360% historical scope variation \u2014 a scenario where FFP forces the vendor to embed a 35% risk premium, meaning the buyer pays for uncertainty that may not fully materialize. A CPIF structure for this portion shares the risk appropriately: the buyer absorbs some cost variability, but the incentive fee motivates the vendor to control costs efficiently. This hybrid approach applies the right contract mechanism to each component\u2019s risk profile, which is the core PMI principle for procurement decisions.\n\nWhy the Other Options Are Incorrect:\n\nA. Award FFP for the entire project \u2014 FFP transfers all cost risk to the vendor, which is appropriate for well-defined scope but counterproductive for uncertain work. The vendor has already signaled the consequence: a 35% risk premium baked into the fixed price. The buyer pays for worst-case uncertainty upfront with no mechanism to recover the premium if integration proves simpler than expected. FFP for highly uncertain scope also incentivizes the vendor to limit effort once the fixed budget is consumed, potentially compromising integration quality.\n\nC. Use T&M for the full engagement \u2014 T&M provides maximum flexibility but transfers all cost risk to the buyer, including for the core modules where scope is well-defined and cost certainty is achievable through FFP. Under T&M, the vendor earns revenue by consuming hours, not by completing deliverables \u2014 there is no contractual incentive for efficient delivery. Using T&M for well-defined work sacrifices cost control unnecessarily and contradicts the CFO\u2019s stated priority.\n\nD. Award FFP with the risk premium plus a management reserve \u2014 This approach layers cost buffers on both sides of the contract. The vendor\u2019s 35% premium covers their risk; the buyer\u2019s management reserve covers additional overruns beyond that. The buyer is paying for uncertainty twice \u2014 once in the vendor\u2019s inflated price and once in their own reserve \u2014 with no shared incentive to control costs. CPIF achieves the same risk coverage more efficiently by sharing cost outcomes and motivating both parties toward efficiency.",
  },
  {
    stem: "An enterprise data center migration is 60% complete. The latest earned value data shows CPI at 0.88 and SPI at 0.94, with a BAC of $2,000,000. Over the past four reporting periods, the CPI has declined steadily from 0.96 to 0.88, while the SPI has remained stable between 0.93 and 0.95. The cost overruns are distributed across multiple workstreams rather than isolated to a single event. The schedule delays are adding overhead costs \u2014 extended facility leases, prolonged vendor support contracts, and additional project management hours \u2014 that compound the cost variance.\n\nThe project sponsor, concerned about the downward cost trend, asks the PM to present the most realistic estimate at completion (EAC) at the next steering committee meeting. The finance team has already calculated EAC = BAC / CPI and is prepared to present that figure.\n\nWhich EAC approach should the PM recommend as the most realistic forecast?",
    options: [
      "Use EAC = BAC / CPI, since the cumulative cost performance index reflects the established spending pattern and is the standard EVM forecast for sustained variances.",
      "Use EAC = AC + (BAC \u2212 EV), since the cost overruns may stabilize in the remaining phases and the remaining work can reasonably be completed at the originally budgeted rate.",
      "Use EAC = AC + [(BAC \u2212 EV) / (CPI \u00d7 SPI)], since the schedule delays are generating additional costs and both trends must be factored into the forecast for remaining work.",
      "Discard the formula-based EAC and commission a bottom-up re-estimate of all remaining work packages, since the declining CPI indicates the original budget assumptions are fundamentally flawed.",
    ],
    correctAnswer: 2,
    difficulty: "Hard",
    domain: "Process",
    explanation: "Correct Answer: C. Use EAC = AC + [(BAC \u2212 EV) / (CPI \u00d7 SPI)], since the schedule delays are generating additional costs and both trends must be factored into the forecast for remaining work.\n\nWhy This Is Correct:\nThe scenario explicitly states that schedule delays are driving additional costs \u2014 extended facility leases, prolonged vendor support, and extra project management hours. This means the SPI is not just a schedule indicator; it is actively compounding the cost variance. When schedule underperformance generates cost impacts, PMI guidance recommends using the EAC formula that incorporates both CPI and SPI: EAC = AC + [(BAC \u2212 EV) / (CPI \u00d7 SPI)]. This produces a higher, more conservative forecast than BAC / CPI alone because it accounts for the cost of time \u2014 every week the project runs behind schedule, overhead costs accumulate on top of the direct cost overruns. With a CPI declining over four periods and a stable-but-below-1.0 SPI whose effects are compounding costs, this formula captures the full picture the sponsor is asking for.\n\nWhy the Other Options Are Incorrect:\n\nA. Use EAC = BAC / CPI \u2014 This formula accounts for the cost trend but treats schedule performance as irrelevant to cost outcomes. In this scenario, that assumption is explicitly contradicted: the schedule delays are generating measurable cost impacts through extended leases and vendor contracts. BAC / CPI will understate the true EAC because it ignores the cost of the time overrun. The finance team\u2019s calculation is a reasonable starting point but not the most realistic forecast given the stated relationship between schedule delays and cost growth.\n\nB. Use EAC = AC + (BAC \u2212 EV) \u2014 This formula assumes remaining work will be completed at the originally budgeted rate, which is only appropriate when current variances are atypical \u2014 caused by a one-time event that will not recur. The scenario describes the opposite: CPI has declined steadily over four periods across multiple workstreams. This is a sustained, worsening trend, not a one-time anomaly. Assuming budgeted rates for remaining work would produce an optimistic forecast inconsistent with the established performance data.\n\nD. Commission a bottom-up re-estimate \u2014 A bottom-up re-estimate is appropriate when the original estimates are fundamentally flawed or when the remaining scope has changed so significantly that historical performance data is no longer predictive. Neither condition is described here. The CPI decline is a performance issue distributed across workstreams, not evidence that the original budget was wrong. A re-estimate is expensive, time-consuming, and unnecessary when the EVM data provides a reliable statistical basis for forecasting.",
  },
  {
    stem: "A federal agency\u2019s ERP implementation has reached its Phase 3 gate review. The project charter requires all phase-gate deliverables to be formally accepted by the designated authority before the steering committee can authorize funding for the next phase. Eleven of twelve required deliverables have been accepted. The twelfth \u2014 the security architecture review, owned by the agency\u2019s CISO office \u2014 is incomplete. The security team needs three additional weeks to finalize their assessment of the new system\u2019s access controls and data encryption architecture.\n\nThe steering committee chair is pressing for immediate approval because the implementation vendor\u2019s lead architect is available for only the next six weeks. A three-week gate delay would leave only three weeks of architect availability for Phase 4 \u2014 insufficient for the critical database migration work. The agency\u2019s internal audit division has informed the PM that any phase-gate approval granted without all twelve deliverables formally accepted will be flagged as a governance non-compliance finding in the next audit cycle.\n\nHow should the PM advise the steering committee?",
    options: [
      "Recommend full phase-gate approval with a documented exception for the security review, noting the business risk of losing the vendor architect and committing to complete the security assessment within the first two weeks of Phase 4.",
      "Recommend that the steering committee delay the phase-gate approval by three weeks until the security architecture review is complete, accepting the risk that the vendor architect may no longer be available for Phase 4.",
      "Recommend conditional approval that authorizes Phase 4 planning and preparation activities to begin immediately but withholds execution funding until the security review is formally accepted, preserving both compliance standing and forward momentum.",
      "Recommend that the PM negotiate with the vendor to extend the lead architect\u2019s availability window, resolving both the governance and resource constraints without requiring an exception to the phase-gate process.",
    ],
    correctAnswer: 2,
    difficulty: "Hard",
    domain: "Process",
    explanation: "Correct Answer: C. Recommend conditional approval that authorizes Phase 4 planning and preparation activities to begin immediately but withholds execution funding until the security review is formally accepted, preserving both compliance standing and forward momentum.\n\nWhy This Is Correct:\nThe PM faces two competing constraints: a governance framework that requires all deliverables to be accepted before phase authorization, and a resource availability window that penalizes delay. Conditional approval resolves both without compromising either. By authorizing planning activities (vendor onboarding, detailed design, migration planning) the PM preserves forward momentum and keeps the vendor architect engaged in preparatory work. By withholding execution funding until the security review is complete, the PM maintains the integrity of the phase-gate process and avoids the audit finding. This approach respects the governance framework\u2019s intent \u2014 ensuring security risks are assessed before execution proceeds \u2014 while pragmatically managing the business constraint. Under PMI principles, governance mechanisms exist to manage risk, not to create rigid barriers; conditional approval applies the mechanism proportionally.\n\nWhy the Other Options Are Incorrect:\n\nA. Recommend full approval with a documented exception \u2014 A documented exception acknowledges the governance violation but does not prevent the audit finding. The internal audit team has explicitly stated that approval without all twelve deliverables will be flagged. Proceeding with a known compliance gap \u2014 regardless of documentation \u2014 exposes the agency to audit risk and sets a precedent that phase-gate requirements are negotiable under schedule pressure. The business justification does not override the governance framework; it requires a solution that works within it.\n\nB. Recommend a three-week delay \u2014 Strict adherence to the gate process protects compliance but ignores the business consequence. Three weeks of delay reduces the vendor architect\u2019s Phase 4 availability from six weeks to three \u2014 potentially insufficient for the database migration. This option treats the governance requirement as absolute without exploring alternatives that could satisfy both constraints. PMI emphasizes that governance should enable decision-making, not prevent pragmatic problem-solving.\n\nD. Recommend negotiating to extend the vendor architect\u2019s availability \u2014 This option assumes the vendor will accommodate the request, which is outside the PM\u2019s control. The architect\u2019s availability constraint may reflect other client commitments that the vendor cannot adjust. Building the governance recommendation around an unconfirmed vendor concession introduces dependency risk. Even if negotiation succeeds, it does not address the underlying gate question \u2014 the steering committee still needs a decision framework for the incomplete deliverable.",
  },
  {
    stem: "A telecommunications company is using a hybrid approach to deploy a new billing platform. The software development team delivers increments in two-week sprints, while the infrastructure and regulatory workstreams follow a predictive timeline with contractually locked milestones tied to the regulator\u2019s compliance review schedule. Sprint 8 ends on Friday. The next predictive milestone \u2014 \"Billing Engine Functional Complete\" \u2014 is locked for the following Monday\u2019s governance review.\n\nThe sprint team has completed 8 of 10 planned user stories, but the two incomplete stories include the payment reconciliation module, which is one of four capabilities the milestone review will evaluate. The milestone report template requires a binary \"complete/incomplete\" status for each capability \u2014 there is no mechanism for partial credit. The program sponsor has told the PM that reporting the milestone as incomplete could trigger a regulator inquiry and delay the compliance certification timeline by up to six weeks.\n\nHow should the PM handle the governance report?",
    options: [
      "Report the milestone as \"complete\" since 80% of sprint scope was delivered and the remaining stories will be finished in the next sprint, avoiding the regulatory delay the sponsor is concerned about.",
      "Report the milestone as \"incomplete\" and supplement the governance report with the sprint team\u2019s velocity data and a delivery forecast showing the payment reconciliation module will be completed within one additional sprint, giving the sponsor factual data to manage the regulator conversation.",
      "Request that the milestone review be postponed by one sprint cycle to give the development team time to finish all planned stories before the governance checkpoint.",
      "Remove the two incomplete stories from the current sprint\u2019s committed scope and reclassify them as Sprint 9 scope, so the milestone report reflects only the work that was completed.",
    ],
    correctAnswer: 1,
    difficulty: "Medium",
    domain: "Process",
    explanation: "Correct Answer: B. Report the milestone as \"incomplete\" and supplement the governance report with the sprint team\u2019s velocity data and a delivery forecast showing the payment reconciliation module will be completed within one additional sprint, giving the sponsor factual data to manage the regulator conversation.\n\nWhy This Is Correct:\nPMI\u2019s foundational principle on reporting is transparency \u2014 project status must accurately reflect reality regardless of stakeholder pressure (PMBOK Guide, Section 10; PMI Code of Ethics). The payment reconciliation module is not complete, and the milestone template requires binary status. Reporting \"complete\" when the capability has not been delivered is a misrepresentation that could surface during the regulator\u2019s own review, creating a far worse outcome than an honest \"incomplete\" status. By supplementing the governance report with velocity data and a concrete delivery forecast, the PM provides the sponsor with credible evidence to present to the regulator: the capability is on a known trajectory with a specific completion date. This preserves the PM\u2019s integrity, respects the governance framework, and gives the sponsor actionable information rather than a false status.\n\nWhy the Other Options Are Incorrect:\n\nA. Report the milestone as \"complete\" \u2014 This misrepresents the project\u2019s actual status. The payment reconciliation module is one of four capabilities being evaluated, and it is not finished. If the regulator later discovers the capability was incomplete at the time of the milestone report, the credibility damage is far greater than an upfront \"incomplete\" finding. PMI\u2019s Code of Ethics requires honest and transparent reporting \u2014 the sponsor\u2019s concern about regulatory delay does not override this obligation.\n\nC. Postpone the milestone review by one sprint \u2014 The milestone date is contractually locked to the regulator\u2019s compliance review schedule. Requesting a postponement may not be within the PM\u2019s authority, and even if granted, it disrupts the regulatory timeline that downstream activities depend on. This option treats the governance checkpoint as movable when the scenario explicitly states it is locked.\n\nD. Remove incomplete stories and reclassify \u2014 Retroactively changing the sprint\u2019s committed scope to make the numbers match is a form of scope manipulation. It does not change the fact that the payment reconciliation module is incomplete \u2014 it only changes the documentation to obscure that fact. If the governance review evaluates the billing engine\u2019s four capabilities against the original plan, the missing module will still be evident regardless of how sprint scope was reclassified.",
  },
  {
    stem: "A SaaS company is six months into a twelve-month product development project to build an AI-powered customer support chatbot. The project was funded based on a business case projecting $1.2M in annual support cost savings through ticket deflection, with benefits realization expected to begin at launch. During a stakeholder review, the VP of Sales requests adding a lead-qualification feature to the chatbot, arguing it would generate an estimated $800K in new annual revenue \u2014 a benefit not included in the original business case.\n\nThe product owner estimates the feature would add eight weeks to the timeline and $180K in development cost. The original strategic objective \u2014 support cost reduction \u2014 remains on track, but adding the feature would push the launch past the fiscal year boundary, delaying the start of the projected $1.2M in savings by one full quarter. The VP argues the combined value justifies the delay; the CFO notes that the delayed savings will impact this year\u2019s operating budget.\n\nHow should the PM evaluate this request?",
    options: [
      "Accept the feature request because the combined annual value ($1.2M + $800K) far exceeds the incremental cost ($180K), making it a clear positive-ROI decision that the PM can approve.",
      "Evaluate the feature against the project\u2019s approved benefits realization plan and present the full trade-off \u2014 including delayed savings, incremental cost, fiscal-year budget impact, and new revenue potential \u2014 to the project sponsor for a strategic decision.",
      "Reject the feature request because it falls outside the project\u2019s approved scope and strategic objective, and recommend the VP of Sales submit it as a separate project proposal through the portfolio intake process.",
      "Add the feature to the product backlog for a post-launch release so that the original timeline and benefits realization schedule are preserved while the new revenue capability is still captured for a future iteration.",
    ],
    correctAnswer: 1,
    difficulty: "Medium",
    domain: "Business Environment",
    explanation: "Correct Answer: B. Evaluate the feature against the project\u2019s approved benefits realization plan and present the full trade-off \u2014 including delayed savings, incremental cost, fiscal-year budget impact, and new revenue potential \u2014 to the project sponsor for a strategic decision.\n\nWhy This Is Correct:\nThe request creates a genuine strategic trade-off: $800K in new revenue potential versus a one-quarter delay in realizing $1.2M in projected savings, with a $180K cost increase and a fiscal-year budget impact. This is not a decision the PM should make unilaterally \u2014 it involves strategic priorities, budget-cycle implications, and benefits realization timing that affect the organization beyond the project. Under PMI\u2019s benefits management framework (PMBOK Guide, Section 1; Benefits Realization Management), scope changes that affect the approved benefits realization plan must be evaluated against the original business case and escalated to the appropriate decision authority. The PM\u2019s role is to analyze the full trade-off \u2014 not just the surface-level ROI \u2014 and present it to the sponsor with enough information to make an informed strategic choice. This includes the fiscal-year impact the CFO raised, which a simple ROI calculation would miss.\n\nWhy the Other Options Are Incorrect:\n\nA. Accept the request based on combined ROI \u2014 The simple arithmetic ($2M combined value vs. $180K cost) obscures the real trade-off. The $1.2M in savings is delayed by a quarter, creating a $300K impact on this fiscal year\u2019s operating budget. The $800K revenue estimate is unvalidated and not in the approved business case. Accepting a scope change that alters the benefits realization timeline based on a back-of-envelope ROI calculation \u2014 without sponsor approval \u2014 exceeds the PM\u2019s decision authority and bypasses the governance process for business case modifications.\n\nC. Reject the request and redirect to portfolio intake \u2014 While scope discipline is important, a rigid rejection ignores the possibility that the organization\u2019s strategic priorities may have evolved since the project was approved. The lead-qualification feature may represent genuine strategic value that the sponsor would want to capture. PMI emphasizes that project managers should facilitate informed decision-making, not act as gatekeepers who block potentially valuable changes without analysis.\n\nD. Add the feature to the backlog for post-launch \u2014 This appears to be a compromise but actually defers the strategic question rather than answering it. If the feature has genuine revenue value, delaying it to a future release reduces the benefit window. If it does not align with the project\u2019s strategic objectives, putting it on the backlog creates scope creep expectations. The fundamental question \u2014 does this feature belong in this project\u2019s value proposition \u2014 remains unanswered.",
  },
];

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log("Project:", admin.app().options.projectId);
  console.log("Mode:", DRY_RUN ? "DRY RUN (no writes)" : "LIVE DEPLOY");
  console.log("Content version:", CONTENT_VERSION);
  console.log("");

  // 1. Verify all retire targets exist
  console.log("── Verifying retire targets ──");
  const retireSnaps = [];
  for (const id of RETIRE_IDS) {
    const snap = await db.collection(COLLECTION).doc(id).get();
    if (!snap.exists) {
      console.error("  MISSING: " + id);
      console.error("ABORTING: Cannot retire a document that does not exist.");
      process.exit(1);
    }
    retireSnaps.push({ id, data: snap.data() });
    console.log("  Found: " + id + " (" + (snap.data().stem || "").substring(0, 60) + "...)");
  }

  // 2. Preview / Deploy
  if (DRY_RUN) {
    console.log("\n── DRY RUN Preview ──");
    console.log("\nWould INSERT " + NEW_QUESTIONS.length + " new questions:");
    NEW_QUESTIONS.forEach(function (q, i) {
      console.log("  " + (i + 1) + ". [" + q.domain + "/" + q.difficulty + "] " + q.stem.substring(0, 80) + "...");
    });
    console.log("\nWould RETIRE " + RETIRE_IDS.length + " questions:");
    RETIRE_IDS.forEach(function (id) {
      console.log("  " + id);
    });
    console.log("\nDry run complete. Run with --live to deploy.");
    return;
  }

  // 3. Insert new questions
  console.log("\n── Inserting new questions ──");
  const batch1 = db.batch();
  const newIds = [];

  for (const q of NEW_QUESTIONS) {
    const docRef = db.collection(COLLECTION).doc(); // auto-ID
    newIds.push(docRef.id);
    batch1.set(docRef, {
      stem: q.stem,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      domain: q.domain,
      explanation: q.explanation,
      examId: EXAM_ID,
      active: true,
      contentVersion: CONTENT_VERSION,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("  Staged: " + docRef.id + " [" + q.domain + "/" + q.difficulty + "]");
  }

  await batch1.commit();
  console.log("  Committed " + NEW_QUESTIONS.length + " new questions.");

  // 4. Soft-retire old questions
  console.log("\n── Soft-retiring replaced questions ──");
  const batch2 = db.batch();

  for (const id of RETIRE_IDS) {
    const docRef = db.collection(COLLECTION).doc(id);
    batch2.update(docRef, {
      active: false,
      retiredVersion: "1.17.0",
      examId: "retired-" + EXAM_ID,
    });
    console.log("  Retiring: " + id);
  }

  await batch2.commit();
  console.log("  Committed " + RETIRE_IDS.length + " retirements.");

  // 5. Count active questions
  const allSnap = await db.collection(COLLECTION).where("examId", "==", EXAM_ID).get();
  const totalActive = allSnap.size;

  // 6. Summary
  console.log("\n══════════════════════════════════════");
  console.log("  STRUCTURAL WAVE 2 DEPLOY SUMMARY");
  console.log("══════════════════════════════════════");
  console.log("  Inserted:       " + NEW_QUESTIONS.length);
  console.log("  Retired:        " + RETIRE_IDS.length);
  console.log("  Net change:     " + (NEW_QUESTIONS.length - RETIRE_IDS.length >= 0 ? "+" : "") + (NEW_QUESTIONS.length - RETIRE_IDS.length));
  console.log("  Total active:   " + totalActive + " (examId=" + EXAM_ID + ")");
  console.log("  Content ver:    " + CONTENT_VERSION);
  console.log("══════════════════════════════════════");
  console.log("\nNew question IDs:");
  newIds.forEach(function (id) { console.log("  " + id); });
}

main()
  .then(function () { process.exit(0); })
  .catch(function (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  });
