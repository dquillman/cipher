# Security+ (SY0-701) question bank audit — 2026-08-28

Bank: `examId = 79cuGMNydTwDMhyiDjry`, 105 questions read from the client's
Firestore cache. Nothing was modified — this is a report only.

## Headline

The bank is not contaminated with mis-tagged PMP questions, which is what the
mobile audit first assumed. It is worse in a subtler way: a large slice of it
was **authored in project-management voice**, and a smaller slice tests no
security content at all.

| Slice | Count | Share |
|---|---|---|
| Total questions | 105 | — |
| Stems using PM framing (project manager / project team / kickoff / sprint …) | 41 | 39% |
| Stems mentioning "project" at all | 51 | 49% |
| **No security content whatsoever** | **9** | **8.6%** |

## The 9 that do not belong in a Security+ bank

These contain no security term of any kind — they are generic project-risk
questions. A Security+ candidate hitting one of these has been sold the wrong
product for that question.

| Doc ID | Tagged domain | Stem |
|---|---|---|
| `0zTpNVV9SDE3Y4FjW7Dw` | Threats, Vulnerabilities, and Mitigations | While analyzing a new project's scope, you discover that the team lacks experience with a critical technology. What should be your first step? |
| `23Qe3XDm2bbD8TUIihB2` | General Security Concepts | During a project audit, it was found that the team frequently shares sensitive files using unencrypted email. What should the project manager implement as a solution? |
| `ABzFKCjMI4eqn43qNknf` | Threats, Vulnerabilities, and Mitigations | While evaluating project risks, a team member suggests that existing software may not support future scaling needs. What is the best action to mitigate this risk? |
| `IHMSzuLvBnKZGguPRo1H` | Threats, Vulnerabilities, and Mitigations | During a project kickoff meeting, the project manager identifies a potential risk due to outdated software tools. What is the best initial response? |
| `SGuZ0JuddtSTxcRzzWpz` | Threats, Vulnerabilities, and Mitigations | While conducting a risk assessment for a healthcare project, it is discovered that a third-party vendor has repeatedly failed to meet quality standards. What is the best response? |
| `bLztyEYWIEChzm1FrcgX` | Threats, Vulnerabilities, and Mitigations | A project's progress is hindered by repeated delays caused by a supplier's failure to deliver materials on time. What mitigation strategy should the project manager employ? |
| `fchzbO5dIpcS1M019Q5b` | Threats, Vulnerabilities, and Mitigations | While reviewing project performance, you realize that dependency on a single vendor poses a significant risk. What should your response be? |
| `lJxly94DUWBAjTnS8AzX` | General Security Concepts | A stakeholder requests access to sensitive project information without any specific justification… |
| `ygEH3ST71DDESm09Ecay` | Threats, Vulnerabilities, and Mitigations | In a cloud migration project, a risk is identified where sensitive data could be exposed during the transfer. What is the most effective mitigation strategy? |

Note `23Qe3XDm2bbD8TUIihB2` and `ygEH3ST71DDESm09Ecay` are salvageable — they
have a real security answer underneath and only need the PM framing stripped.
The other seven are generic risk-management items with no security content to
recover.

## Domain concentration

Seven of the nine sit in **Threats, Vulnerabilities, and Mitigations** — 30% of
that domain's 23 questions. A learner who drills their weakest domain and lands
there gets the worst of it, which is exactly the path Smart Practice sends them
down.

PM-framed stems by domain:

| Domain | PM-framed | Total |
|---|---|---|
| Security Program Management and Oversight | 20 | 21 |
| Threats, Vulnerabilities, and Mitigations | 12 | 23 |
| General Security Concepts | 9 | 13 |
| Security Operations | 0 | 29 |
| Security Architecture | 0 | 19 |

"Security Program Management and Oversight" being 20/21 PM-framed is arguably
fine — governance genuinely is management work. **Security Operations and
Security Architecture are clean**, 0 out of 48 between them. So the problem is
concentrated, not systemic, and the two operational domains show what the
authoring voice should sound like.

## What this does to the Exam Lens

The Exam Lens explains whatever it is given. On `IHMSzuLvBnKZGguPRo1H` it
produced a "SECURITY TRIAD LENS" reading of a pure schedule-risk question and
tied the answer to the Integrity principle. That is confident, fluent, and
wrong — worse for trust than a plainly bad question, because it looks authored.

## Suggested order

1. Delete or re-author the seven unsalvageable items; strip PM framing from the
   two that have a real security answer.
2. Re-voice the 32 remaining PM-framed stems in Threats/General Concepts to
   analyst voice. Security Operations and Security Architecture are the model.
3. Check the other CompTIA banks (A+ 220-1202, Network+ N10-009) for the same
   authoring pattern — this looks like a generation-prompt artifact, not a
   tagging accident, so it will have affected whatever was generated alongside.

No writes were made to Firestore.
