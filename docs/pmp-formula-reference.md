# PMP Formula Reference

Source of truth for every numeric PMP question in Cipher — hand-authored seeds,
AI-generated items, and tutor explanations alike.

The machine-readable copy lives in
[`functions/src/pmpFormulas.ts`](../functions/src/pmpFormulas.ts) and is injected
into the system prompt of both PMP generation paths in `functions/src/index.ts`
(`generateQuestions`, and the PMP branch of the bulk exam generator). **If you
change a formula here, change it there too.**

## Auditing the existing bank

The prompt injection only governs questions generated from now on. To check
what is already in Firestore, `functions/scripts/audit_pmp_math.js` recomputes
every numeric question it can parse and reports where the keyed answer
disagrees:

```bash
node scripts/audit_pmp_math.js
```

It buckets results as PASS / FAIL (keyed answer wrong) / NO-MATCH (computed
value absent from the options) / REVIEW (numeric but not auto-parseable) /
SKIPPED (conceptual). It deliberately punts to REVIEW rather than guessing when
a stem carries extra terms it cannot attribute — a false FAIL is worse than an
abstention, because it trains you to ignore the report.

After changing any checker, run the self-test. It audits a fixture of
deliberately-broken questions and asserts each one is caught:

```bash
node scripts/audit_pmp_math.js --self-test
```

## Earned Value Management

| Metric | Formula | Reading |
| --- | --- | --- |
| PV | planned % complete × BAC | Budgeted cost of work scheduled |
| EV | actual % complete × BAC | Budgeted cost of work performed |
| AC | given | Actual cost incurred |
| CV | EV − AC | Positive = under budget |
| SV | EV − PV | Positive = ahead of schedule |
| CPI | EV / AC | >1 = cost efficient |
| SPI | EV / PV | >1 = schedule efficient |
| % complete | EV / BAC | |
| ETC | EAC − AC | Cost of remaining work |
| VAC | BAC − EAC | Positive = expect to finish under budget |
| TCPI (to BAC) | (BAC − EV) / (BAC − AC) | Efficiency needed to hit the budget |
| TCPI (to EAC) | (BAC − EV) / (EAC − AC) | Efficiency needed to hit the forecast |

### EAC — four variants

The stem's wording picks the variant. This is the single most common source of
wrong PMP numeric answers.

| Formula | Use when |
| --- | --- |
| `EAC = BAC / CPI` | Current cost variance is expected to continue (the default) |
| `EAC = AC + (BAC − EV)` | Remaining work proceeds at the budgeted rate; original estimate was flawed |
| `EAC = AC + [(BAC − EV) / (CPI × SPI)]` | Both cost and schedule performance affect remaining work |
| `EAC = AC + ETC` | A bottom-up re-estimate of remaining work was performed |

## Financial metrics

- **ROI** = (net benefit / cost) × 100
- **ROE** = net income / shareholder equity
- **NPV** = Σ [cash flow*t* / (1 + r)^*t*] − initial investment — highest NPV wins
- **IRR** = the discount rate at which NPV = 0 — higher is better
- **Payback period** = initial investment / annual net cash inflow — shorter is better
- **BCR** = PV of benefits / PV of costs — greater than 1 is favorable

## Estimation

- **Triangular (simple)** = (O + M + P) / 3
- **Beta / PERT** = (O + 4M + P) / 6
- **Activity standard deviation** = (P − O) / 6
- **Activity variance** = [(P − O) / 6]²
- **Sigma ranges**: 1σ 68.27% · 2σ 95.45% · 3σ 99.73% · 6σ 99.99966%

## Schedule / float

- **Total float** = LS − ES = LF − EF
- **Free float** = ES(successor) − EF(activity)
- **Critical path** = longest path through the network; total float typically 0

## Communication channels

- **Total channels** = n(n − 1) / 2, where n = number of stakeholders
- **Channels added** going from n to m people = m(m−1)/2 − n(n−1)/2

A stem asking for *additional* channels after new members join is a deliberate
trap — the total formula alone gives the wrong answer.

## Procurement (FPIF)

- **PTA** = ((ceiling price − target price) / buyer share ratio) + target cost
- **Final price** = target cost + target fee, adjusted by the share ratio applied
  to the cost under/overrun, capped at the ceiling price

## Risk

- **EMV** = probability × impact (sum across branches in a decision tree)
- **Contingency reserve** = Σ EMV of identified "known-unknown" risks — *inside*
  the cost baseline, PM-controlled
- **Management reserve** = for unknown-unknowns, typically 5–10% of total cost —
  *outside* the cost baseline, requires sponsor/management approval
- **RPN** = severity × occurrence × detection
- **Standard deviation** = √variance

## Provenance

Derived from a circulated "ALL PMP FORMULAS" cheat-sheet graphic
(template22.com), corrected on 2026-08-01. That image contained substantial
errors — if it or a copy resurfaces, do not import from it directly:

- `CV = EV = AC` and `CPI = EV = AC` — should be `EV − AC` and `EV / AC`
- SPI and TCPI were missing entirely; CPI's row was mislabeled "remaining schedule efficiency"
- `EAC = BAC − CPI` / `EAC = BAC + CPI` — should be `BAC / CPI`
- Communication channels as `n(n−1) − 2` and `n(n−1) = 2` — should be `n(n−1) / 2`
- The channel formula was mislabeled "Float" and duplicated across two sections
- `Triangular Estimate (O + M + P) + 3 = 3` — should be `(O + M + P) / 3`
- `PERT (O + 4M + P) + 6` — should be `/ 6`
- `SD − (P − C) − 6` — should be `(P − O) / 6`
- `PTE = (Ceiling − Target Price` — truncated; see the full PTA formula above
- "Free Float = schedule flexibility" is a definition, not a formula
