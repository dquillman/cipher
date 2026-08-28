# Question bank audit — the real finding is the generator, not the questions

Supersedes the "9 bad questions" framing in
`security-plus-bank-audit-2026-08-28.md`. That count was produced by grepping
for the word "project". It was the wrong test.

## The correct test

Does the question contain **any information-security vocabulary at all** —
encryption, firewall, malware, SIEM, credentials, patching, logs, endpoints,
protocols, and ~50 other terms — anywhere in its stem or its options?

Applied to the 105-question CompTIA Security+ (SY0-701) bank:

| | Count | Share |
|---|---|---|
| Contains infosec vocabulary | 59 | 56% |
| **Contains none** | **46** | **44%** |

## It tracks a single field: `source`

| `source` | Questions | Off-topic | Rate |
|---|---|---|---|
| **`AI-AutoLeveler`** | **83** | **38** | **46%** |
| `AI-OpenAI-GPT4o-DALL-E` | 17 | 3 | 18% |
| `seed-matching-v1` | 5 | 0* | 0% |

\* flagged 5/5 by the regex, but that is a false positive — matching questions
keep their content in `matchPairs`, which the stem scan does not see. The
crypto matching question tested by hand was one of the best items in the bank.

Compare the CPP bank in the same database — 207 questions, sources
`authored-2026-08-bank-topup` (100) and `authored-2026-08-eco-refresh` (14):
**96% on-topic**, and the handful the regex flagged ("New hire reporting must
be submitted to the state within how many days", "Under the Common Law Test…",
"Direct deposit via ACH requires…") are all genuine CPP content — real
false positives.

So the authored banks are fine. `AI-AutoLeveler` is the defect.

## Two distinct failure modes, both from AI-AutoLeveler

**1. It read "Security" as physical/corporate security.** Concentrated in the
Security Operations domain, which in SY0-701 is monitoring, alerting,
vulnerability management, incident response, EDR, IAM and automation:

- "A security manager is tasked with revising the **emergency evacuation
  plan**. What should be their primary focus?"
- "During a routine security check, a **guard discovers an open door** leading
  to a restricted area."
- "During a security operation at a major corporate event, a **sudden protest
  begins outside the venue**."
- "…evaluating the effectiveness of existing **surveillance systems**…"

**2. It wrote project-management questions with a security noun attached.**
Concentrated in Security Program Management and Oversight — 16 of that domain's
21 questions:

- "A **project manager** is tasked with conducting security audits on various vendors."
- "In a mid-project review, a security breach is reported. What should the **project manager** do first?"
- "During a critical phase of **project execution**, the project manager realizes there are multiple conflicting security policies."

## Off-topic AI-AutoLeveler questions by domain

| Domain | Off-topic | Domain total |
|---|---|---|
| Security Program Management and Oversight | 16 | 21 |
| Security Operations | 11 | 29 |
| Threats, Vulnerabilities, and Mitigations | 6 | 23 |
| General Security Concepts | 3 | 13 |
| Security Architecture | 2 | 19 |

## Why this matters more than the count

The Exam Lens explains whatever it is handed. On `IHMSzuLvBnKZGguPRo1H` — a
pure schedule-risk question — it produced a "SECURITY TRIAD LENS" reading tying
the answer to the Integrity principle. Fluent, confident, wrong. A candidate
cannot tell the difference between that and a real explanation, which is
exactly the trust the product is selling.

## Recommendation

Rewriting nine questions by hand was the plan before this. It would fix 24% of
the off-topic items in one bank and leave the cause running.

1. **Find every bank AI-AutoLeveler touched.** Only Security+ and CPP were in
   the client cache, so the blast radius across A+, Network+, PMP, CIA, SHRM,
   ITIL, PgMP, CSM and Six Sigma is unmeasured. This is a single Firestore
   aggregation on `source`.
2. **Quarantine, don't delete.** A `status: 'quarantined'` field plus one
   `where` clause in the Quiz query stops them being served today, reversibly,
   without waiting on rewrites.
3. **Then regenerate**, using the CPP `authored-2026-08-bank-topup` prompt as
   the model — that pipeline produced a 96%-on-topic bank against the same
   infrastructure.

Step 2 is the one that stops the bleeding, and it is a few lines of code plus a
field update. Steps 1 and 3 are the real work.

No Firestore writes have been made.
