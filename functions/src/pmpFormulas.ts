/**
 * Canonical PMP formula reference.
 *
 * Injected into the system prompt of every PMP question-generation call so the
 * model computes from a verified source instead of its own recall. Numeric PMP
 * items are the easiest to get subtly wrong (EAC variant selection and the
 * communication-channels trap are the usual culprits) and the hardest for a
 * reviewer to spot, since a wrong answer still looks plausible.
 *
 * Human-readable version, including the common traps this guards against,
 * lives in docs/pmp-formula-reference.md. Keep the two in sync.
 */
export const PMP_FORMULA_REFERENCE = `
AUTHORITATIVE PMP FORMULAS — compute every numeric answer from these exactly.
Never rely on recall for a formula listed here.

Earned Value Management:
- PV = planned % complete x BAC
- EV = actual % complete x BAC
- CV = EV - AC          (positive = under budget)
- SV = EV - PV          (positive = ahead of schedule)
- CPI = EV / AC         (>1 = cost efficient)
- SPI = EV / PV         (>1 = schedule efficient)
- % complete = EV / BAC
- EAC has FOUR variants; the stem's wording selects which one applies:
  * EAC = BAC / CPI                        -> current cost variance will continue (default)
  * EAC = AC + (BAC - EV)                  -> remaining work at budgeted rate; original estimate flawed
  * EAC = AC + [(BAC - EV) / (CPI x SPI)]  -> both cost and schedule affect remaining work
  * EAC = AC + ETC                         -> bottom-up re-estimate of remaining work
- ETC = EAC - AC
- VAC = BAC - EAC       (positive = expect to finish under budget)
- TCPI = (BAC - EV) / (BAC - AC) to hit BAC; (BAC - EV) / (EAC - AC) to hit EAC

Financial metrics:
- ROI = (net benefit / cost) x 100
- ROE = net income / shareholder equity
- NPV = SUM[cash flow_t / (1 + r)^t] - initial investment; highest NPV wins
- IRR = discount rate where NPV = 0; higher is better
- Payback period = initial investment / annual net cash inflow; shorter is better
- BCR = PV of benefits / PV of costs; >1 is favorable

Estimation:
- Triangular (simple average) = (O + M + P) / 3
- Beta / PERT = (O + 4M + P) / 6
- Activity standard deviation = (P - O) / 6
- Activity variance = [(P - O) / 6]^2
- Sigma ranges: 1 sigma 68.27%, 2 sigma 95.45%, 3 sigma 99.73%, 6 sigma 99.99966%

Schedule / float:
- Total float = LS - ES = LF - EF
- Free float = ES(successor) - EF(activity)
- Critical path = longest path through the network; total float typically 0

Communication channels:
- Total channels = n(n - 1) / 2, where n = number of stakeholders
- Channels ADDED going from n to m people = m(m-1)/2 - n(n-1)/2
- Read the stem carefully: "how many ADDITIONAL channels" is NOT the total.

Procurement (FPIF):
- PTA = ((ceiling price - target price) / buyer share ratio) + target cost
- Final price = target cost + target fee, adjusted by the share ratio applied to
  the cost under/overrun, capped at the ceiling price

Risk:
- EMV = probability x impact (sum across branches for a decision tree)
- Contingency reserve = sum of EMVs of identified "known-unknown" risks;
  INSIDE the cost baseline, PM-controlled
- Management reserve = for unknown-unknowns, typically 5-10% of total cost;
  OUTSIDE the cost baseline, requires sponsor/management approval
- RPN = severity x occurrence x detection
- Standard deviation = sqrt(variance)

Rules for numeric questions:
1. Show the arithmetic in the explanation, substituting the stem's actual numbers.
2. Verify the stated correct option equals your computed result before returning.
3. Distractors must be the results of plausible MISTAKES (wrong EAC variant,
   inverted ratio, forgetting to divide by 2, using total instead of added
   channels) — never arbitrary numbers.
4. If a formula you need is not listed above, prefer a non-numeric question over
   guessing at the formula.
`.trim();
