# ExamCoach Customer Acquisition Plan

**Created:** 2026-03-16
**Status:** Pre-launch
**Goal:** First 1,000 activated users
**Milestones:** 100 users (validate product + messaging) → 1,000 users (scalable acquisition working)

---

## Guiding Principle

> Do not optimize for traffic. Optimize for activated trials.

An **activated user** = signup + choose exam + answer 10 questions.
Traffic without activation is meaningless. Launch narrow, measure everything, then widen.

---

## Phase 1 — Measurement Foundation (Days 1-2)

No ad spend until this is done.

### 1.1 Define the Primary Conversion

| Event | Definition | Where tracked |
|---|---|---|
| `signup_complete` | User finishes free-trial registration | GA4 + all ad platforms |
| `activated_user` | Signup + selects exam + answers 10 questions | GA4 (internal KPI) |

Ad campaigns optimize toward `signup_complete`. Internal success is measured by `activated_user`.

### 1.2 Full-Funnel Event Tracking (GA4)

| Event | Trigger |
|---|---|
| `landing_page_view` | User lands on marketing page |
| `pricing_view` | User views pricing section/page |
| `cta_click` | User clicks "Start Free Trial" |
| `trial_start` | User begins signup flow |
| `signup_complete` | User finishes signup (PRIMARY CONVERSION) |
| `exam_selected` | User picks an exam |
| `activated_user` | User answers 10 questions |
| `explanation_viewed` | User reads an AI explanation |

The `explanation_viewed` event is critical. If users answer questions but skip explanations, the problem is onboarding — not marketing. The AI explanation is the product's core differentiator; track whether people actually experience it.

### 1.3 Ad Platform Plumbing

Install before any spend:

- **Google Ads** — Import `signup_complete` from GA4 as a conversion action
- **Meta** — Pixel + Conversions API (server-side). Meta needs ~50 conversion events per ad set to exit learning phase
- **LinkedIn** — Insight Tag with conversion tracking enabled

---

## Phase 2 — Authority Assets (Days 1-3)

Exam prep buyers are skeptical professionals. Before any traffic arrives, build three credibility assets.

### 2.1 Founder Story Page

A page on the site that explains:
- Why ExamCoach exists
- Why certification exams test reasoning, not memorization
- Why memorization-based prep fails

This builds trust that a brand page alone cannot.

### 2.2 Core Article

**Title:** "Why Certification Exam Questions Are So Confusing"

Sections:
- Memorization vs. reasoning
- How exams test judgment
- Examples from PMP questions
- CTA: Start Free Trial

This becomes the anchor for SEO, social posts, and ad landing pages.

### 2.3 Product Demo Video

- Length: 2-3 minutes
- Show: question → user answer → AI explanation → analytics
- Embed on homepage

---

## Phase 3 — First 100 Users Manually (Days 2-10)

Before paid ads scale, get the first users through free channels. These users provide feedback, testimonials, and product validation.

**Target:** 100 activated users | **Quality gate:** activation rate > 30% (if 100 sign up but < 30 activate, stop marketing and fix onboarding)

**Track by exam:**

| Exam | Target |
|---|---|
| PMP | 60 |
| CISSP | 20 |
| AWS | 10 |
| Other | 10 |

Exam audiences behave differently. Tracking separately reveals where real demand is strongest before you spend ad dollars.

### 3.1 Reddit Communities

Post in: r/pmp, r/projectmanagement, r/cissp, r/itcareerquestions

**Important:** Reddit is allergic to product launches. Do NOT lead with a pitch.

- Post 3-4 value-only posts first (insights about exam reasoning, study tips)
- Mention the tool only in comments or when asked
- Use a personal tone: "I've been studying PMP and noticed..." not "I built a tool"
- Once you have credibility in the community, share the tool naturally

**Expected users:** 20-40

### 3.2 LinkedIn Groups

Post in groups such as:
- Project Management Professional (PMP) Guidance
- Project Management Excellence
- PMI communities
- PMO communities
- Agile groups

Message angle: "Looking for feedback from people preparing for certification exams. ExamCoach teaches the reasoning behind questions instead of just giving answers. Free access while testing."

**Expected users:** 30-40

### 3.3 LinkedIn Warm Outreach

Search LinkedIn for: PMP candidate, studying for PMP, project manager studying.

**Rules to avoid getting flagged:**
- Only message people you've already engaged with (commented on their posts, connected naturally)
- No more than 10-15 messages per day
- Personalize every message — reference something specific from their profile
- If response rate drops below 10%, stop and adjust the message

Short message template:
> Hi — I noticed you're preparing for [exam]. I built a tool that explains the reasoning behind certification exam questions. Looking for early testers who'd be willing to try it and give feedback. Interested?

**Expected users:** 10-20

### 3.4 Use These Users For

- [ ] Collect 5+ testimonials for landing page and ads
- [ ] Identify onboarding friction before paid traffic arrives
- [ ] Validate which exam messaging resonates strongest
- [ ] Get quotes for social proof ("I finally understand why PMP questions are worded that way")
- [ ] Personally talk to at least 10 early users (15-minute calls)

**Testimonial prompt** — trigger in-app after activation:

> "What surprised you most about ExamCoach?"

Short responses become powerful landing page quotes. Example:
- User says: *"This finally explains why PMP questions are worded like that."*
- Marketing version: *"ExamCoach finally explained why PMP questions are worded the way they are."*

**User interview questions** (for the 10 conversations):
- What confused you?
- What made you stay?
- What almost made you leave?

These answers often reshape messaging, onboarding, and marketing language more than any analytics dashboard.

**Planning note:** Treat the user projections above as directional estimates, not targets. Track actual vs. projected weekly and shift effort to whatever channel is actually producing.

---

## Phase 4 — Creative System (Days 4-6)

### 4.1 Video Ad Assets

| Format | Length | Purpose | Use |
|---|---|---|---|
| Explainer | 30s | Full value prop | Cold audiences, YouTube |
| Conversion | 15s | Direct CTA push | Retargeting, warm audiences |
| Hook | 6s | Pattern interrupt | Bumper ads, retargeting |

### 4.2 Static Image Ads

Pull 2-3 static images from the strongest video frames. These run on Meta, LinkedIn, and Google Display/Demand Gen.

### 4.3 Core Message (Consistent Everywhere)

All ads, landing pages, and emails repeat the same promise:

- **Learn how certification exams think**
- AI explanations for every question
- Free 7-day trial
- No credit card required

### 4.4 Segment by Exam, Not by Persona

Each exam gets its own ad group/campaign with exam-specific headlines, keywords, and landing page wording above the fold.

| Priority | Exam | Reason |
|---|---|---|
| 1 | PMP | Clearest message, largest addressable market |
| 2 | CISSP | High-value audience, strong search intent |
| 3 | AWS | Volume play, competitive market |
| 4 | Scrum/Agile | Adjacent to PMP audience |
| 5 | CompTIA/ITIL | Later expansion |

---

## Phase 5 — Google Search Ads (Days 6-30)

Search traffic has the highest purchase intent. This is your best first dollar.

**Budget:** $30-$50/day total. Allocate 70% to PMP, 30% to other exams.

### 5.1 Keyword Clusters

**Problem searches:**
```
why pmp questions are hard
why certification exams are confusing
```

**Study searches:**
```
how to pass pmp exam
pmp study strategy
cissp study plan
```

**Tool searches:**
```
pmp exam prep ai
pmp exam prep app
pmp practice questions explained
cissp exam prep app
cissp practice questions software
certification exam prep with explanations
pmp mindset questions
```

### 5.2 Ad Copy — Clear, Not Clever

```
Headline: Learn How Certification Exams Think
Description: AI explanations for every question. Start your free 7-day trial. No credit card required.
```

Match ad copy to landing page language exactly.

---

## Phase 6 — Retargeting (Days 7-30)

Warm traffic converts better than cold.

### 6.1 Google/YouTube Retargeting

**Audience:** Site visitors + video viewers only.

**Creative rotation:**
- 6s hook: *"Why do exam questions trick you?"*
- 15s conversion: *"ExamCoach teaches how the exam thinks"*

Do NOT blast the full 30s ad at retargeting audiences.

Use Demand Gen campaigns (covers YouTube, Discover, Gmail, Shorts, Display).

### 6.2 Meta Retargeting

**Retargeting only.** No cold traffic on Meta until the offer is proven.

**Budget:** $10-$20/day

**Creative:** 6s video, 15s video, 1 static image

Meta needs volume to learn. Start small, let it accumulate conversion data.

### 6.3 LinkedIn Ads (Week 4+)

**Only for these use cases:**
- PMP targeting: project managers, PMO roles, operations professionals
- Team/employer sales (later phase)

LinkedIn is expensive. Do not make it a first-spend channel.

**When to use:** After Google Search has proven which exam message converts best.

**Format:** Video ads (square format) or Lead Gen Forms for employer-led buyers.

---

## Phase 7 — Onsite Conversion Funnel

### 7.1 CTA Discipline

One CTA everywhere: **Start Free Trial**

Not "Learn More." Not "Explore." Not "Book Demo." This is self-serve SaaS.

### 7.2 Message Consistency (Ad to App)

Every touchpoint repeats the same four promises:

1. Learn how certification exams think
2. Free 7-day trial
3. No credit card required
4. Pick your exam and start now

If the ad says one thing and the signup screen says another, you lose users.

### 7.3 "Try a Question" Landing Page Teaser

Add an interactive element on the landing page — one real exam question with AI explanation, no signup required.

> Try a real exam question with explanation

If users experience the AI explanation before signing up, conversion rates increase significantly. This removes the biggest objection: "Is this actually different from other prep tools?"

### 7.4 Friction Removal

The path from ad click to first question should take under 60 seconds:

```
Ad click → Landing page → Start Free Trial → Pick exam → First question
```

Every extra screen between click and value is a leak.

### 7.5 The First Explanation Must Be Impressive

The first AI explanation a user sees is the make-or-break moment. If they immediately understand the format and feel the value, they stay. If they don't, conversion collapses.

Hand-curate or quality-check the first explanation shown during the diagnostic. Do not leave this to chance.

### 7.6 Fallback Lead Capture (Only If Signup Conversion Is Weak)

If direct trial signup underperforms, add a lead magnet:

- Free PMP reasoning mini-quiz (5 questions)
- "10 Questions That Reveal Your Exam Thinking Traps" PDF
- Free exam readiness snapshot

**Do not lead with email capture.** Trial is always better than a lead.

---

## Phase 8 — Founder Marketing (Week 1 Onward)

Dave becomes a distribution channel. Free, high-trust, and compounding.

### 8.1 Weekly LinkedIn Posts

Post at least once per week. Topics:

- Why PMP questions feel weird
- How certification exams test thinking, not knowledge
- Thinking traps in PMP questions
- What AI explanations reveal about exam design

Each post links to ExamCoach or the core article.

### 8.2 Short-Form Video (YouTube, LinkedIn, TikTok/Reels)

Repurpose ad hooks as organic clips:

- *"Why do exam questions keep tricking you?"*
- *"Memorizing answers is why you're stuck"*
- *"The reason PMP questions feel weird"*

One strong clip becomes ad creative, landing page proof, and email content.

---

## Phase 9 — Trial-to-User Conversion

### 9.1 First-Run Onboarding (Under 3 Minutes)

```
Choose exam → 5-question diagnostic → Show weak domains/thinking traps → Start personalized practice
```

This makes the product feel intelligent, not generic.

### 9.2 7-Day Email Sequence

| Day | Subject focus | CTA |
|---|---|---|
| 0 | Welcome — start with your exam | Pick your exam |
| 1 | Your weakest domain identified | Practice weak domain |
| 2 | How AI explanations improve scores | Try an explanation |
| 3 | Complete your diagnostic | Finish diagnostic |
| 5 | Your progress + social proof | Continue practicing |
| 6 | Trial ending tomorrow | Upgrade now |
| 7 | Final convert offer | Subscribe |

Every email pushes exactly one action. No fluff.

### 9.3 Retargeting by Funnel Stage

| Segment | Ad message |
|---|---|
| Visited, no trial | Value prop + social proof |
| Trial started, signup incomplete | Reminder + "no credit card" |
| Signed up, not activated | "Pick your exam and start" |
| Activated, not converted to paid | Progress reminder + upgrade offer |

Treating all traffic the same is lazy and expensive.

---

## Phase 10 — Free Diagnostic Tool (Week 3)

Add a free tool to the site: **Certification Readiness Score**

### How It Works

1. User answers 10 questions (no signup required)
2. Result: "You are 62% ready for PMP"
3. CTA: "Improve your weak areas with ExamCoach — Start Free Trial"

### Why This Matters

- Works as a lead magnet without feeling like one
- Creates a strong SEO landing page
- Gives users a compelling reason to sign up (they've already seen their gap)
- Leverages existing diagnostic infrastructure in the product

---

## Phase 11 — Organic Content (Week 3+)

Paid gets you data fast. Organic compounds later.

### 11.1 Content Cadence

- **Month 1:** 1 article per week (realistic while launching ads, doing outreach, running a business)
- **Month 2:** 2 per week if you have a system working
- **Month 3:** 3 per week only if you have help or a content pipeline

Quality and consistency beat volume. One strong article per week outperforms three rushed ones.

### 11.2 Article Topics (Target Real Search Intent)

- "Why PMP questions are so confusing"
- "PMI mindset explained"
- "CISSP questions test judgment, not memorization"
- "How to study for certification exams more efficiently"
- "A thinking trap that fails PMP candidates"
- "How PMI expects you to think"

### 11.3 Competitor Comparison Page (Week 3-4)

Certification students frequently search for alternatives. Create one landing page:

**Title:** "ExamCoach vs Traditional PMP Question Banks"

Target keywords:
- `PrepCast alternative`
- `PocketPrep alternative`
- `best PMP study app`

Key message: Most tools teach answers. ExamCoach teaches reasoning.

Keep it factual. Focus on the reasoning-vs-memorization angle, not feature checklists. Build this only after the core funnel is working.

### 11.4 YouTube Exam Reasoning Channel (Month 3+)

Long-term organic play. Repurpose existing video assets into a dedicated channel:

- "Why PMP Questions Are So Confusing"
- "One Thinking Trap That Fails PMP Candidates"

Aligns perfectly with ExamCoach's value. Requires consistent publishing to gain traction — do not start until paid channels are stable.

---

## Phase 12 — Learn Fast: First 30 Days

### 12.1 Metrics That Matter

| Metric | Target (baseline) |
|---|---|
| Cost per trial start | Track from day 1 |
| Cost per signup complete | Track from day 1 |
| Cost per activated user | Track from day 1 |
| Trial-to-paid conversion rate | Track from week 2+ |

**Ignore:** CTR in isolation, impressions, video view counts. These can flatter garbage.

### 12.2 A/B Testing Calendar

Test ONE variable at a time:

| Week | Test |
|---|---|
| 1 | Hook A vs Hook B (video) |
| 2 | Subheadline: current vs "AI explanations for every exam question. Understand the reasoning — not just the answer." |
| 3 | "Start Free Trial" vs "Start Your 7-Day Free Trial" (CTA) |
| 4 | Explanation screenshot vs dashboard screenshot (static ad) |

Do not run 10 tests simultaneously and pretend you learned something.

### 12.3 Budget Concentration

Keep budgets concentrated on the winning channel until one lane clearly wins. Spreading thin starves every algorithm of the conversion data it needs to optimize.

---

## Phase 13 — Referral Loop (Month 2)

### 13.1 In-App Referral Prompt

After a user hits a meaningful milestone (e.g., completes 50 questions or finishes a domain assessment):

> "Share ExamCoach with a study buddy or coworker"

**V1: Keep it simple.** Just ask for the referral — no automated reward system. Exam prep spreads naturally through study partners and professional networks.

**V2 (only after organic referrals are happening):** Add an incentive like bonus trial days or unlocking a feature. Build the reward system only when you have evidence people will refer.

---

## Phase 14 — Partnerships & Affiliates (Month 2+)

### 14.1 Recruit Affiliates

Offer free access + commission or flat referral bonuses. Target:

- PMP coaches and instructors
- Agile trainers
- Cybersecurity educators
- Study newsletters
- Project management newsletters

This works especially well once onboarding is clean.

### 14.2 Team / Employer Sales

Once self-serve is working, create a second landing page for:

- Managers buying for teams
- Bootcamps and training providers
- PMOs and IT leaders

This is where LinkedIn ads get more interesting.

---

## Decision Rules

| If... | Then... |
|---|---|
| Google Search cost per signup > $50 after 100 clicks | Rewrite ad copy + check landing page match |
| Meta retargeting cost per signup > 2x Google | Pause Meta, reallocate to Google retargeting |
| LinkedIn cost per signup > 3x Google | Pause LinkedIn, revisit for employer sales only |
| Trial-to-activation rate < 20% | Fix onboarding before spending more on traffic |
| Activation-to-paid rate < 5% | Fix product value delivery, not marketing |
| One exam converts 2x better than others | Shift 80% of budget to that exam |
| Reddit/LinkedIn community yields < 25% of projected users after 7 days | Shift effort to the channel that's producing |
| Content takes > 4 hours per article in month 1 | Stay at 1x/week, do not force 2x |
| First 100 signups but activation rate < 30% | Stop all marketing spend, fix onboarding first |
| Users answer questions but < 50% view explanations | Onboarding problem — make explanation viewing more prominent |

---

## 30-Day Launch Checklist

### Week 1

| Day | Task | Done |
|---|---|---|
| 1 | Finalize GA4 event tracking (all 8 funnel events incl. `explanation_viewed`) | [ ] |
| 1 | Install Google Ads conversion import from GA4 | [ ] |
| 1 | Install Meta Pixel + Conversions API | [ ] |
| 1 | Install LinkedIn Insight Tag | [ ] |
| 1 | Publish founder story page | [ ] |
| 2 | Define `signup_complete` and `activated_user` events | [ ] |
| 2 | Verify all conversion tracking fires correctly | [ ] |
| 2 | Publish core article: "Why Certification Exam Questions Are So Confusing" | [ ] |
| 2 | Record and embed 2-3 min product demo video | [ ] |
| 2 | Begin Reddit value posts (no product links yet) | [ ] |
| 3 | Post in LinkedIn groups (feedback request) | [ ] |
| 3 | Begin LinkedIn warm outreach (10-15/day max) | [ ] |
| 3 | Start weekly LinkedIn founder posts | [ ] |
| 3 | Curate/quality-check first diagnostic explanation for each exam | [ ] |
| 4 | Organize video ads into 30s / 15s / 6s cuts | [ ] |
| 4 | Pull 2-3 static images from video frames | [ ] |
| 5 | Build "Try a Question" teaser on landing page (no signup required) | [ ] |
| 6 | Launch Google Search campaign — PMP only | [ ] |
| 6 | One landing page, one CTA, one conversion goal | [ ] |
| 7 | Launch Google/YouTube retargeting (6s + 15s ads) | [ ] |
| 7 | Launch Meta retargeting ($10-$20/day) | [ ] |
| 7 | Review first community outreach results | [ ] |

### Week 2

| Day | Task | Done |
|---|---|---|
| 8 | Review search term report, add negative keywords | [ ] |
| 8 | Collect first testimonials (trigger "What surprised you most?" prompt) | [ ] |
| 8 | Begin scheduling 10 user interview calls (15 min each) | [ ] |
| 9 | Improve landing page headline if CTR-to-signup is weak | [ ] |
| 10 | Reduce signup friction (audit every step) | [ ] |
| 11 | Launch email onboarding sequence (if not live) | [ ] |
| 12 | Run first A/B test (Hook A vs Hook B) | [ ] |
| 14 | Week 2 metrics review — cost per trial, cost per signup | [ ] |
| 14 | Review: do we have 100 manual users yet? If not, adjust outreach | [ ] |

### Week 3

| Day | Task | Done |
|---|---|---|
| 15 | Duplicate winning structure into CISSP or AWS | [ ] |
| 16 | Publish second organic content piece | [ ] |
| 17 | Set up retargeting segments by funnel stage | [ ] |
| 17 | Build and launch Certification Readiness Score tool | [ ] |
| 18 | Run second A/B test (subheadline A vs B) | [ ] |
| 19 | Build competitor comparison page (ExamCoach vs question banks) | [ ] |
| 21 | Week 3 metrics review | [ ] |

### Week 4

| Day | Task | Done |
|---|---|---|
| 22 | Test LinkedIn ads for PMP professionals (small budget) | [ ] |
| 23 | Review full-funnel conversion rates | [ ] |
| 24 | Cut underperforming keywords/ads | [ ] |
| 25 | Double budget on winning ad groups | [ ] |
| 28 | Full 30-day review: cost per activated trial by channel | [ ] |

---

## Expected Growth Path (Directional Estimates)

### First 100 Users (Days 2-14, manual channels)

| Source | Estimated Users |
|---|---|
| Reddit communities | 20-40 |
| LinkedIn groups | 30-40 |
| LinkedIn warm outreach | 10-20 |

### Next 900 Users (Weeks 3-8, paid + organic)

| Source | Estimated Users |
|---|---|
| Google Search | 350 |
| Retargeting (Google + Meta) | 150 |
| Organic content | 150 |
| Referrals | 150 |
| Communities (ongoing) | 100 |

**These are planning assumptions, not forecasts.** Track actual vs. projected weekly. Double down on what works, cut what doesn't.

---

## Budget Summary (Month 1)

| Channel | Daily | Monthly |
|---|---|---|
| Google Search | $30-$50 | $900-$1,500 |
| Google/YouTube Retargeting | $10-$20 | $300-$600 |
| Meta Retargeting | $10-$20 | $300-$600 |
| LinkedIn (week 4 only) | $20-$30 | $140-$210 |
| Manual outreach | $0 | $0 |
| **Total** | **$70-$120** | **$1,640-$2,910** |

Scale only what proves itself. Cut everything else.

**Month 2+ experimental budget:** Once total spend is high enough to be meaningful, reserve 10% for testing alternate headlines, new exam keywords, and YouTube discovery ads — without disrupting main campaigns. At $30-50/day total in month 1, a 10% carve-out is too small to learn from.

---

## Core Positioning

Every ad, post, and page reinforces:

> **ExamCoach teaches how certification exams think.**

That differentiates from question banks, practice quizzes, and video courses.
