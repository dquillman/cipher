# CipherExam

AI-powered certification exam prep platform. Multi-cert SaaS with original AI-generated questions, Bloom's-Taxonomy-classified content, and metacognitive coaching that explains *why* an answer is correct and *how to think* about similar questions.

**Live (staging):** https://www.cipherexam.com

---

## Certifications covered

PMP · Security+ · CSM · SHRM-CP · ITIL 4 · Network+ · A+ Core 2 · Six Sigma GB · PgMP · CIA Part 1
*Coming soon:* CISSP · AWS SAA

All questions are **original**, AI-generated against publicly published exam objectives. No content is scraped from copyrighted exams or prep books.

---

## What makes it different

- **Bloom's Taxonomy classification.** Every question is audited and classified by cognitive level (remember / understand / apply / analyze / evaluate / create) so practice sets build the right kind of thinking, not just recall.
- **Metacognitive explanations.** Each answer includes both the reasoning *and* a strategy for approaching that question type — teaching test-taking, not just facts.
- **Scenario-aware.** A separate classification pipeline handles scenario-based questions (which dominate exams like PMP).
- **Continuous question-bank auditing.** Internal pipelines audit, classify, and validate the entire question library; CSV exports feed quality review.

---

## Stack

- **Frontend** — React 18, TypeScript, Vite, Tailwind, React Router v7, Playwright E2E tests
- **Backend** — Firebase Cloud Functions (Node.js)
- **Database** — Firestore with iterated production security rules
- **AI layer** — Multi-model integration with rate-limit handling and model-selection logic
- **Infra** — Firebase Hosting + Cloud Functions, GitHub Actions CI, staged deployments

## Repository layout

```
web/                  React + TS + Vite frontend (Playwright tested)
functions/            Firebase Cloud Functions: AI generation, classification, audits
marketing-dashboard/  Separate marketing / admin dashboard app
onboarding-assets/    User onboarding flows and assets
docs/                 Architecture and operational documentation
scripts/              Deployment and maintenance utilities
firestore.rules       Production Firestore security rules
firestore.indexes.json
```

## Notable infrastructure

- **Versioned content migrations** (`deploy-ec113-rewrites.js`, `validate-ec113.js`) — schema and content changes ship with audit + validation steps
- **Production repair tooling** (`repair-smart-quiz-runs.js`, `fix_exam.cjs`) — operational maturity for live customer data
- **Staged deployment scripts** (`deploy-structural-w2.js`, `deploy-structural-final.js`)
- **Hardened admin security** — see `ADMIN_SECURITY_DEPLOYMENT.md`

---

## Running locally

```bash
# Install
npm install
cd web && npm install
cd ../functions && npm install

# Dev (web only)
npm run dev

# Build everything
npm run build
```

## Status

Active. Currently on v1.17 with an external tester program. Product roadmap and strategy in `MULTI-EXAM-PLAYBOOK.md` and `MARKETING-PLAN.md`.
