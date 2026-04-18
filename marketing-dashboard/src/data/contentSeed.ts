import type { ContentItem } from '../types/content.ts';

export const contentSeed: Omit<ContentItem, 'id'>[] = [

  // =====================================================================
  // WEEK 1 — LAUNCH WEEK (Mar 16–22, 2026)
  // Focus: Announce, founder story, first blog, initial ads, PMP + Sec+
  // =====================================================================

  // ── Day 1 · Mon Mar 16 — Launch Day ──────────────────────────────────

  {
    week: 1,
    title: 'LinkedIn Launch Announcement',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-16',
    scheduledTime: '8:30 AM EST',
    body: `I just launched CIPHER — and I'm terrified.

For the past year I've been obsessed with one question: why do smart people fail certification exams?

It's not because they don't study. It's because the way most people study doesn't match how exams actually test you.

Certification questions aren't trivia. They're scenario-based traps designed to test whether you can APPLY knowledge under pressure. And most study tools treat them like flashcards.

So I built something different.

CIPHER uses AI-powered explanations that don't just tell you the right answer — they break down WHY each wrong answer is wrong, WHAT the question is really testing, and HOW to recognize similar patterns on exam day.

It covers PMP, Security+, CSM, SHRM-CP, ITIL, and more.

Today it's live. 7-day free trial, no credit card required.

I'd love for you to try it and tell me what's broken. Seriously. I need honest feedback more than anything right now.

cipherexam.com

#certification #PMP #SecurityPlus #careerdev #AI #launch`,
    notes: 'Pin to profile. Engage with every comment within 1 hour.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Twitter/X Launch Tweet',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-16',
    scheduledTime: '9:00 AM EST',
    body: `I just launched CIPHER 🚀

AI-powered cert exam prep that explains WHY you got it wrong — not just what's right.

PMP, Security+, CSM, SHRM-CP, ITIL & more.

7-day free trial, no credit card.

cipherexam.com`,
    notes: 'Pin tweet. Follow up with a thread later in the day.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Twitter/X Launch Thread',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-16',
    scheduledTime: '12:00 PM EST',
    body: `Thread: Why I built CIPHER 🧵

1/ I watched people study for 200+ hours and still fail their certification exam. The problem wasn't effort — it was method.

2/ Most prep tools give you a question bank and say "good luck." But cert exams test APPLICATION, not memorization. You need to understand why wrong answers are wrong.

3/ So I built an AI that explains every answer choice — right AND wrong. It identifies the reasoning pattern the question is testing and teaches you to spot it.

4/ It's live today. PMP, Security+, CSM, SHRM-CP, ITIL, and more. 7-day free trial, no credit card.

5/ If you're studying for a cert right now, I'd genuinely love your feedback. Try it free: cipherexam.com`,
    notes: 'Post as thread using Typefully or manually.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Google Ads — PMP Search Campaign',
    type: 'ad',
    status: 'ready',
    channel: 'Google Ads',
    scheduledDate: '2026-03-16',
    scheduledTime: '6:00 AM EST',
    body: `Headline 1: PMP Exam Prep — AI-Powered
Headline 2: Pass Your PMP Exam With Confidence
Headline 3: Free 7-Day Trial — No Credit Card
Description 1: Stop memorizing. Start understanding. CIPHER explains WHY each answer is right or wrong so you actually learn the material. Try free for 7 days.
Description 2: AI-powered PMP exam prep that adapts to your weak areas. Detailed explanations for every question. 7-day free trial, no credit card required.
Display URL: cipherexam.com/pmp
Final URL: https://cipherexam.com`,
    notes: 'Target keywords: pmp exam prep, pmp practice questions, pmp study guide, pmp certification prep. Budget: $30/day. Bid strategy: Maximize conversions.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Google Ads — Security+ Search Campaign',
    type: 'ad',
    status: 'ready',
    channel: 'Google Ads',
    scheduledDate: '2026-03-16',
    scheduledTime: '6:00 AM EST',
    body: `Headline 1: Security+ Exam Prep — AI-Powered
Headline 2: Pass CompTIA Security+ First Try
Headline 3: Free 7-Day Trial — No Card Needed
Description 1: AI-powered Security+ prep that explains every answer — right and wrong. Understand the reasoning, not just the facts. Free 7-day trial.
Description 2: Struggling with Security+ practice questions? CIPHER breaks down each answer with AI explanations so you actually retain the material. Try free.
Display URL: cipherexam.com/security-plus
Final URL: https://cipherexam.com`,
    notes: 'Target keywords: security+ exam prep, comptia security+ practice test, security+ study guide. Budget: $25/day.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Meta Ads — Launch Awareness Campaign',
    type: 'ad',
    status: 'ready',
    channel: 'Meta Ads',
    scheduledDate: '2026-03-16',
    scheduledTime: '7:00 AM EST',
    body: `Primary Text: You don't fail certification exams because you didn't study enough. You fail because you studied the wrong way. CIPHER uses artificial intelligence to explain WHY each answer is right or wrong — so you learn to think like the exam. PMP, Security+, CSM, SHRM-CP, ITIL & more. Try free for 7 days. No credit card.

Headline: Stop Memorizing. Start Understanding.
Description: AI-powered cert exam prep. 7-day free trial.
CTA: Sign Up`,
    notes: 'Audience: 25-45, interests in project management, cybersecurity, IT certifications, HR certifications. Placement: Facebook feed, Instagram feed. Budget: $20/day.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 2 · Tue Mar 17 — Founder Story ────────────────────────────────

  {
    week: 1,
    title: 'LinkedIn Founder Story',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-17',
    scheduledTime: '8:00 AM EST',
    body: `Here's the real story behind CIPHER.

Last year a friend called me frustrated. She'd studied for her PMP for 3 months, done 1,000+ practice questions, and failed by 2 points.

She didn't lack effort. She lacked understanding.

She'd been grinding through question banks, memorizing answers, and never stopping to ask: "Why is this wrong? What is this question ACTUALLY testing?"

That conversation haunted me. Because her experience isn't rare — it's the norm.

So I started building. First as a side project. Then as an obsession. Then as a company.

CIPHER doesn't just grade you. It teaches you. Every question comes with AI-generated explanations that break down:

→ Why the correct answer is correct
→ Why each wrong answer is wrong
→ What reasoning pattern the question tests
→ How to spot similar questions on exam day

It's not another question bank. It's a study partner that actually explains things.

Yesterday I launched it. Today I'm asking for help.

If you know someone studying for PMP, Security+, CSM, SHRM-CP, ITIL, or any major cert — would you share this with them?

7-day free trial, no credit card: cipherexam.com

I can't help everyone. But I can help the people who find out about it.

#certification #PMP #SecurityPlus #studytips #AI`,
    notes: 'This is the emotional hook post. Expect higher engagement. Respond to every comment personally.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Blog Share — "Why Certification Exam Questions Are So Confusing"',
    type: 'article',
    status: 'ready',
    channel: 'Blog',
    scheduledDate: '2026-03-17',
    scheduledTime: '10:00 AM EST',
    body: `Share existing blog article: "Why Certification Exam Questions Are So Confusing"
URL: https://cipherexam.com/blog/why-certification-exam-questions-are-so-confusing

Promote on LinkedIn and Twitter with pull quotes from the article.`,
    notes: 'Cross-promote on social channels. Pull a key insight as a teaser.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Twitter/X Blog Promo — Confusing Questions',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-17',
    scheduledTime: '11:00 AM EST',
    body: `Ever read a cert exam question and thought "wait, TWO of these answers seem right"?

That's by design. Here's how to decode what the question is really asking:

cipherexam.com/blog/why-certification-exam-questions-are-so-confusing`,
    notes: '',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Reddit r/projectmanagement — Value Post on PMP Study',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/projectmanagement',
    scheduledDate: '2026-03-17',
    scheduledTime: '12:30 PM EST',
    body: `Title: What actually helped me understand PMP questions (not just memorize answers)

I've been deep in the cert exam prep space for a while now, and the #1 thing I see people get wrong about PMP prep is treating it like a memorization game.

The PMP doesn't test whether you memorized the PMBOK. It tests whether you can APPLY project management thinking to messy, real-world scenarios.

Here's what actually helped me (and what I've seen help others):

1. **When you get a question wrong, don't just read the correct answer.** Ask yourself: why is each wrong answer wrong? What made it tempting? This is where the real learning happens.

2. **Look for the "reasoning pattern" behind each question.** PMP questions often test specific thought processes — like "when do you escalate vs. handle yourself?" or "what's the FIRST thing you do?" Recognizing these patterns is more valuable than memorizing facts.

3. **Study the wrong answers more than the right ones.** Seriously. The wrong answers tell you what traps the exam sets. Once you see the patterns, the exam gets way less confusing.

4. **Don't just do more questions — do fewer questions, deeper.** 50 questions with full analysis beats 200 questions with just answer checking.

I've been working on a tool that automates this kind of deep analysis using AI (cipherexam.com if you're curious), but honestly these principles work even if you're just using a notebook.

Anyone else find that studying the wrong answers was the breakthrough?`,
    notes: 'Genuine value-first post. The product mention is organic and not the focus. Engage with all comments.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 3 · Wed Mar 18 ────────────────────────────────────────────────

  {
    week: 1,
    title: 'LinkedIn — "The Wrong Answer" Insight Post',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-18',
    scheduledTime: '8:30 AM EST',
    body: `Hot take: you learn more from wrong answers than right ones.

When you study for a certification exam, most people check the answer, see they got it right (or wrong), and move on.

But the WRONG answers are where the gold is.

Every wrong answer on a cert exam is designed to catch a specific mistake:
→ People who memorized but didn't understand
→ People who read too fast and missed a keyword
→ People who know the theory but can't apply it

When you study WHY a wrong answer is tempting, you're reverse-engineering the exam itself.

Next time you do a practice question, try this:
1. Cover the correct answer
2. For each wrong answer, write down WHY someone would pick it
3. Identify what mistake that person made

Do this for 20 questions and you'll understand the exam better than 200 questions done the normal way.

This is exactly the approach we built into CIPHER — our AI explains every answer choice, not just the correct one.

cipherexam.com — 7-day free trial, no credit card.

#certification #studytips #PMP #SecurityPlus #examprep`,
    notes: 'Educational post with a soft CTA. Should generate discussion.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Reddit r/CompTIA — Security+ Study Tips',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/CompTIA',
    scheduledDate: '2026-03-18',
    scheduledTime: '1:00 PM EST',
    body: `Title: The study technique that made Security+ PBQs way less scary

I used to dread performance-based questions. They felt completely different from the multiple choice, and I never felt prepared for them.

But then I realized something: PBQs and multiple choice test the SAME concepts. The difference is just format. If you truly understand the reasoning behind multiple choice answers, PBQs become way more manageable.

Here's what I mean:

When you do a multiple choice question about, say, configuring a firewall rule — don't just pick the right answer and move on. Think through:

- Why would each wrong configuration be a problem?
- What security vulnerability does each wrong answer create?
- In what scenario would a different answer be correct?

When you study like this, you're building the mental model that PBQs actually test. You're not memorizing "the answer is C" — you're understanding how firewall rules work.

Some tips that helped me:

1. After finishing a practice set, go back to every question you got wrong and write a one-sentence explanation of why each wrong answer is wrong
2. Look for patterns in your mistakes — are you consistently weak on one domain?
3. For PBQs specifically, practice doing things manually (subnetting, reading logs, ACL rules) without relying on tools

I've been using an AI-powered tool (cipherexam.com) that automatically generates these deep explanations for every answer choice, which has been a huge time saver. But you can do this manually too with any question bank.

Good luck to everyone studying! Happy to answer questions.`,
    notes: 'Value-first. Engage heavily with commenters. Answer Security+ questions to build credibility.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Twitter/X — Quick Study Tip',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-18',
    scheduledTime: '3:00 PM EST',
    body: `Cert exam study tip:

When you get a practice question wrong, don't just check the right answer.

Ask: "Why was I tempted by the wrong one?"

That's where the real learning happens.`,
    notes: 'No link. Pure value. Build audience.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 4 · Thu Mar 19 ────────────────────────────────────────────────

  {
    week: 1,
    title: 'LinkedIn — Why Most Practice Tests Fail You',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-19',
    scheduledTime: '8:00 AM EST',
    body: `Unpopular opinion: most practice test platforms are actively hurting your exam prep.

Here's why.

They give you a score. You see 72%. You think "I need to get to 80%." So you do more questions.

But your score tells you NOTHING about what you actually don't understand.

Getting 72% could mean:
→ You're solid on 72% of topics and clueless on 28%
→ You understand everything at a surface level but can't apply any of it
→ You're great at everything except you keep misreading questions

These are three completely different problems that require three completely different study strategies.

A score without diagnosis is just a number.

That's why I built CIPHER differently. Instead of just showing scores, our AI breaks down WHAT you're getting wrong, WHY you're getting it wrong, and HOW to fix it.

Because "study harder" isn't a strategy. "You consistently misidentify stakeholder engagement questions as communication management questions — here's how to tell the difference" IS a strategy.

If you're studying for any cert (PMP, Security+, CSM, SHRM-CP, ITIL), try it free for 7 days: cipherexam.com

No credit card required. Just honest feedback on your prep.

#certification #PMP #SecurityPlus #examprep #AI`,
    notes: 'Slightly more product-focused but still leads with insight.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Twitter/X — Score Isn\'t Enough',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-19',
    scheduledTime: '11:00 AM EST',
    body: `Your practice test score tells you almost nothing.

72% could mean 10 different things.

What you need to know is WHY you're getting questions wrong — not just how many.

That's the gap we're closing at cipherexam.com`,
    notes: '',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 5 · Fri Mar 20 ────────────────────────────────────────────────

  {
    week: 1,
    title: 'Blog Share — "5 Study Mistakes That Cost People Their Certification Exam"',
    type: 'article',
    status: 'ready',
    channel: 'Blog',
    scheduledDate: '2026-03-20',
    scheduledTime: '9:00 AM EST',
    body: `Share existing blog article: "5 Study Mistakes That Cost People Their Certification Exam"
URL: https://cipherexam.com/blog/5-study-mistakes-that-cost-people-their-certification-exam

Promote on LinkedIn and Twitter with a teaser about the #1 mistake.`,
    notes: 'Cross-promote across social channels.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'LinkedIn — Blog Promo: 5 Study Mistakes',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-20',
    scheduledTime: '9:30 AM EST',
    body: `I've watched hundreds of people study for certification exams. The same 5 mistakes come up over and over.

The #1 mistake? Studying to pass instead of studying to understand.

It sounds subtle, but it changes everything about how you prepare.

I wrote about all 5 mistakes (and how to fix them) here:
cipherexam.com/blog/5-study-mistakes-that-cost-people-their-certification-exam

Which of these resonates with you?

#certification #studytips #PMP #SecurityPlus #examprep`,
    notes: 'Drive blog traffic. Ask an engagement question.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Reddit r/cybersecurity — Genuine Help Post',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/cybersecurity',
    scheduledDate: '2026-03-20',
    scheduledTime: '2:00 PM EST',
    body: `Title: For those studying for Security+ — how are you handling the performance-based questions?

Curious how everyone is prepping for the PBQs on the Security+ exam. I've talked to a lot of people who say the multiple choice felt manageable but the PBQs threw them off.

From what I've gathered, the key seems to be:

1. Actually practice doing things hands-on — not just reading about them. Set up a home lab if you can, even a basic VM with pfSense or similar.

2. When you study concepts like network segmentation or ACLs, don't just memorize what they are — practice actually configuring them.

3. Time management matters a lot. Some people recommend flagging PBQs and coming back to them since they're worth the same as multiple choice but take way longer.

What's been working for you all? Any resources or approaches you'd recommend?`,
    notes: 'Pure engagement post. No product mention. Build presence in the community first. Respond helpfully to every reply.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 6 · Sat Mar 21 ────────────────────────────────────────────────

  {
    week: 1,
    title: 'Twitter/X — Weekend Study Motivation',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-21',
    scheduledTime: '10:00 AM EST',
    body: `Weekend study sessions hit different.

If you're grinding for a cert exam today, here's your reminder:

30 focused minutes > 2 distracted hours.

Quality over quantity. Always.`,
    notes: 'Engagement post. No CTA.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Reddit r/scrum — CSM Study Tips',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/scrum',
    scheduledDate: '2026-03-21',
    scheduledTime: '11:00 AM EST',
    body: `Title: Tips for the CSM exam — what I wish I knew before taking it

For anyone prepping for the CSM, wanted to share some things I've seen trip people up:

1. **The Scrum Guide is short — read it multiple times.** Seriously, it's like 13 pages. Most people read it once and move on. Read it 3-4 times and you'll catch nuances you missed.

2. **Understand the roles deeply.** The exam loves testing edge cases around what a Scrum Master should and shouldn't do. Know the boundaries.

3. **"Servant leader" isn't just a buzzword.** A lot of questions test whether you understand what servant leadership looks like in practice vs. traditional management.

4. **Don't overthink it.** The CSM is more about understanding Scrum values and principles than memorizing specific processes. If your answer aligns with Scrum values, it's probably right.

5. **Practice with scenario questions, not definition questions.** The exam gives you situations and asks what to do — not "define Sprint Planning."

If you want a tool that helps with scenario-based practice and explains the reasoning behind each answer, I've been working on cipherexam.com — it covers CSM among other certs. But honestly the Scrum Guide + the above approach will get most people there.

Good luck to everyone studying!`,
    notes: 'Helpful and genuine. Soft product mention near the end.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 7 · Sun Mar 22 ────────────────────────────────────────────────

  {
    week: 1,
    title: 'LinkedIn — Week 1 Reflection',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-22',
    scheduledTime: '9:00 AM EST',
    body: `One week since I launched CIPHER. Here's what I've learned:

1. People are desperate for EXPLANATIONS, not just answers. The #1 piece of feedback: "I love that it tells me why the wrong answers are wrong."

2. PMP and Security+ are the most in-demand certs right now (at least among our early users).

3. Founders should launch before they're ready. I almost waited another month. Glad I didn't.

4. Building in public is terrifying. But the feedback you get is worth the vulnerability.

Thank you to everyone who tried it this week and gave honest feedback. You're literally shaping this product.

If you haven't tried it yet: cipherexam.com — 7-day free trial, no credit card.

Week 2 goal: listen more, build what users actually want, and keep shipping.

#startup #buildinpublic #certification #AI #examprep`,
    notes: 'Vulnerability + transparency post. Build in public angle.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 1,
    title: 'Twitter/X — Week 1 Metrics (Build in Public)',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-22',
    scheduledTime: '10:00 AM EST',
    body: `Week 1 of CIPHER:

Building in public, so here are real numbers.

Will share actual metrics at end of week.

What would you want to know? Revenue? Signups? Most popular cert? Churn?

Tell me what's interesting and I'll share it.`,
    notes: 'Build in public engagement. Share whatever metrics are available.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // =====================================================================
  // WEEK 2 — EDUCATIONAL CONTENT (Mar 23–29, 2026)
  // Focus: Blog articles, Reddit engagement, LinkedIn thought leadership
  // =====================================================================

  // ── Day 8 · Mon Mar 23 ────────────────────────────────────────────────

  {
    week: 2,
    title: 'Blog Share — "How AI-Powered Explanations Change the Way You Study"',
    type: 'article',
    status: 'ready',
    channel: 'Blog',
    scheduledDate: '2026-03-23',
    scheduledTime: '9:00 AM EST',
    body: `Share existing blog article: "How AI-Powered Explanations Change the Way You Study"
URL: https://cipherexam.com/blog/how-ai-powered-explanations-change-the-way-you-study

Key promo angle: position AI explanations as a tutor that's available 24/7.`,
    notes: 'Third blog article. Time to push the AI differentiation harder.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 2,
    title: 'LinkedIn — AI Explanations Deep Dive',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-23',
    scheduledTime: '8:30 AM EST',
    body: `What if every practice question came with a personal tutor?

That's what AI-powered explanations actually feel like.

Here's the difference between a traditional answer key and what we built at CIPHER:

Traditional: "The correct answer is C. Risk mitigation involves reducing the probability or impact of a risk."

CIPHER: "The correct answer is C. Here's why:

→ Option A (Risk avoidance) is tempting because it also addresses the risk, but avoidance means eliminating the risk entirely — usually by changing the project plan. The scenario describes reducing impact, not eliminating the risk.

→ Option B (Risk transfer) means shifting the risk to a third party (like insurance). Nothing in the scenario suggests involving a third party.

→ Option D (Risk acceptance) means doing nothing. The scenario explicitly says the PM is taking action, so acceptance doesn't fit.

→ The question tests whether you can distinguish between mitigation and avoidance — a common exam trap."

See the difference? One tells you the answer. The other teaches you how to think.

I wrote more about this approach: cipherexam.com/blog/how-ai-powered-explanations-change-the-way-you-study

#certification #AI #PMP #examprep #studytips`,
    notes: 'Show, don\'t tell. The example format makes it tangible.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 2,
    title: 'Twitter/X — AI Tutor Angle',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-23',
    scheduledTime: '12:00 PM EST',
    body: `The best cert exam study partner isn't a person — it's an AI that explains WHY every answer is right or wrong.

Not because AI is smarter. Because it's infinitely patient and always available at 2 AM when you're cramming.

cipherexam.com`,
    notes: '',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 9 · Tue Mar 24 ────────────────────────────────────────────────

  {
    week: 2,
    title: 'Reddit r/projectmanagement — PMP Application Tips',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/projectmanagement',
    scheduledDate: '2026-03-24',
    scheduledTime: '12:00 PM EST',
    body: `Title: The PMP question format that trips up almost everyone (and how to handle it)

There's a specific PMP question format that I see people struggle with constantly: the "What should the PM do FIRST?" questions.

You get a scenario and 4 options that are all technically valid things a PM might do. But the exam wants the FIRST thing.

Here's a framework that helped me and a lot of people I've talked to:

**The Priority Ladder:**
1. Assess/Analyze the situation (understand before acting)
2. Follow the process (check the plan, follow change control)
3. Communicate with stakeholders
4. Take corrective action

When you see a "what should the PM do FIRST?" question, mentally run through this ladder. The answer is almost always the earliest step that hasn't been done yet.

Example: "A team member reports a risk that could delay the project by 2 weeks. What should the PM do FIRST?"

❌ Add it to the risk register (this is step 2)
❌ Inform the sponsor (this is step 3)
❌ Develop a mitigation plan (this is step 4)
✅ Analyze the probability and impact (this is step 1)

This framework handles like 80% of "do FIRST" questions.

Anyone else have frameworks like this for specific question types?`,
    notes: 'Pure value. No product mention. Build authority in the sub.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 2,
    title: 'LinkedIn — Certification ROI Data',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-24',
    scheduledTime: '8:00 AM EST',
    body: `Is a certification actually worth the investment?

Here's what the data says:

→ PMP holders earn 25% more on average than non-certified PMs (PMI Salary Survey)
→ CompTIA Security+ is required for DoD 8570 compliance roles — it literally opens doors that are closed without it
→ CSM certified professionals report 15-20% higher salaries vs non-certified Scrum practitioners
→ SHRM-CP holders are 50% more likely to be in management roles

But here's the part people don't talk about:

The certification itself isn't what creates the value. It's the SIGNAL.

A cert tells an employer: "This person cares enough about their career to invest time and effort into validated knowledge."

That signal is worth more than the content you memorize.

But you still have to pass the exam. And studying smart matters more than studying hard.

If you're planning to get certified in 2026, CIPHER helps you study smart with AI-powered explanations for every practice question. 7-day free trial: cipherexam.com

What cert are you going after this year?

#certification #salary #PMP #SecurityPlus #CSM #SHRM #careerdev`,
    notes: 'Data-driven post. Engagement question at the end.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 10 · Wed Mar 25 ───────────────────────────────────────────────

  {
    week: 2,
    title: 'Blog Share — "The First 30 Days: A Realistic Certification Study Plan"',
    type: 'article',
    status: 'ready',
    channel: 'Blog',
    scheduledDate: '2026-03-25',
    scheduledTime: '9:00 AM EST',
    body: `Share existing blog article: "The First 30 Days: A Realistic Certification Study Plan"
URL: https://cipherexam.com/blog/the-first-30-days-a-realistic-certification-study-plan

Promo angle: actionable, practical, not overwhelming. Pair with social posts about study planning.`,
    notes: 'Fourth and final blog article for now. Time to promote heavily.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 2,
    title: 'LinkedIn — 30-Day Study Plan Promo',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-25',
    scheduledTime: '8:30 AM EST',
    body: `"I have 30 days until my exam. Where do I start?"

I get some version of this question every week. So I wrote a complete guide.

The problem with most study plans is they assume you have 4 hours a day and perfect discipline. Real life doesn't work that way.

This plan is built for people with jobs, families, and limited time:

Week 1: Assessment & foundation (figure out what you know and don't)
Week 2: Targeted deep dives (attack your weak areas)
Week 3: Practice & pattern recognition (do questions the right way)
Week 4: Review & confidence building (reinforce, don't cram)

The full breakdown: cipherexam.com/blog/the-first-30-days-a-realistic-certification-study-plan

If you're starting a cert study journey, bookmark this.

#certification #studyplan #PMP #SecurityPlus #examprep`,
    notes: 'Practical content. Good for saves and shares.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 2,
    title: 'Twitter/X — Study Plan Hook',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-25',
    scheduledTime: '12:00 PM EST',
    body: `30 days until your cert exam?

Here's the honest truth: you don't need more time. You need a better plan.

Week 1: Find your gaps
Week 2: Fix them
Week 3: Practice smart
Week 4: Build confidence

Full guide: cipherexam.com/blog/the-first-30-days-a-realistic-certification-study-plan`,
    notes: '',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 11 · Thu Mar 26 ───────────────────────────────────────────────

  {
    week: 2,
    title: 'Reddit r/humanresources — SHRM-CP Value Post',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/humanresources',
    scheduledDate: '2026-03-26',
    scheduledTime: '12:00 PM EST',
    body: `Title: SHRM-CP study tips from someone who's been deep in cert prep

For anyone working toward their SHRM-CP, a few things I've seen make the biggest difference:

1. **Situational judgment questions are the key.** The SHRM-CP is less about memorizing HR regulations and more about applying sound judgment to messy workplace scenarios. Practice with scenario-based questions, not definition flashcards.

2. **The SHRM Body of Applied Skills and Knowledge (BASK) is your roadmap.** Don't just read it — map your study time to it. Weight your study toward competency areas you're weakest in.

3. **Ethics questions are pass/fail territory.** The exam weighs these heavily. When in doubt, the answer that prioritizes organizational integrity + employee wellbeing is usually correct.

4. **Study with a "what would a senior HR professional do?" mindset.** The exam isn't asking what YOU would do — it's asking what the ideal HR professional would do according to SHRM standards.

5. **Practice explaining your reasoning out loud.** If you can articulate WHY an answer is correct (not just that it IS correct), you understand it at the level the exam requires.

Anyone else prepping for SHRM-CP? What's been your biggest challenge?`,
    notes: 'No product mention in this one. Pure community building in the HR space.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 2,
    title: 'LinkedIn — "Just Passed" Template Post',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-26',
    scheduledTime: '8:00 AM EST',
    body: `Every day I see "I just passed my PMP!" posts on LinkedIn.

And every time, the comments ask the same thing: "How did you study?"

The answers are always some version of:
→ "I used [expensive bootcamp]"
→ "I did 2,000 practice questions"
→ "I studied for 6 months"

But nobody talks about the QUALITY of how they studied.

Here's what I've noticed separates people who pass on the first try from people who don't:

First-attempt passers study FEWER questions but study them DEEPER.

They don't just check answers. They understand why every wrong answer is wrong. They identify patterns. They learn to think like the exam.

Quantity gives you familiarity.
Quality gives you understanding.
The exam tests understanding.

If you're studying for any cert right now, try this: cut your daily question count in half. But for every question you do, write down why each wrong answer is wrong.

I guarantee you'll learn more in less time.

(And if you want AI to do that analysis for you, that's literally what cipherexam.com does.)

#PMP #certification #examprep #studytips`,
    notes: 'Hook into the popular "just passed" trend on LinkedIn.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 12 · Fri Mar 27 ───────────────────────────────────────────────

  {
    week: 2,
    title: 'Reddit r/ITIL — ITIL Foundation Tips',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/ITIL',
    scheduledDate: '2026-03-27',
    scheduledTime: '11:00 AM EST',
    body: `Title: What I've learned about ITIL 4 Foundation prep (tips for newcomers)

For anyone starting ITIL 4 Foundation prep, here are some things I've seen help people the most:

1. **Understand the Service Value System (SVS) conceptually, not just as a diagram.** The exam tests whether you understand how the pieces connect, not just that you can label them.

2. **The 7 guiding principles are heavily tested.** Don't just memorize them — understand how they apply to real scenarios. "Start where you are" vs. "Progress iteratively" vs. "Focus on value" — you need to know when each applies.

3. **The 34 practices — focus on the 5-6 that are tested most heavily.** Incident Management, Problem Management, Change Enablement, Service Desk, and Service Level Management. The exam won't test you equally on all 34.

4. **ITIL 4 is more flexible than ITIL v3.** If you studied v3, forget the rigid process flows. ITIL 4 is about principles and value, not sequences.

5. **Don't overcomplicate it.** The Foundation exam is broad but not deep. You need to know what things are and why they matter, not the detailed how-to.

Has anyone taken it recently? How closely did it match your expectations?`,
    notes: 'Community engagement in ITIL space. No product mention.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 2,
    title: 'Twitter/X — Friday Study Motivation',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-27',
    scheduledTime: '9:00 AM EST',
    body: `The people who pass cert exams on their first try aren't smarter.

They study fewer questions, deeper.

Quality > quantity. Every time.`,
    notes: 'Quick motivational tweet.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 13 · Sat Mar 28 ───────────────────────────────────────────────

  {
    week: 2,
    title: 'Twitter/X — Weekend Poll',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-28',
    scheduledTime: '10:00 AM EST',
    body: `What cert are you studying for right now?

🅰️ PMP
🅱️ Security+ / CompTIA
©️ AWS / Cloud
🅳 Something else (reply!)`,
    notes: 'Engagement poll. Use Twitter poll feature.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 14 · Sun Mar 29 ───────────────────────────────────────────────

  {
    week: 2,
    title: 'LinkedIn — Week 2 Learnings',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-29',
    scheduledTime: '9:00 AM EST',
    body: `Two weeks into building CIPHER in public. Some honest reflections:

What's working:
→ People genuinely love the AI explanations feature. It's our clear differentiator.
→ The blog content is driving organic traffic faster than expected.
→ Reddit communities have been incredibly receptive when we lead with value.

What's not working:
→ Cold outreach. Nobody wants to be sold to. (Obvious in hindsight.)
→ Generic ad copy. We're rewriting everything to be more specific.
→ I was spending too much time on features nobody asked for.

What I'm changing:
→ Doubling down on content and community. Our best users come from people who read an article first.
→ Talking to users every single day. Not surveys — actual conversations.
→ Saying no to features that don't help people pass their exam.

If you're building something new, my advice: launch, listen, and resist the urge to add complexity.

cipherexam.com — the simple cert exam prep tool that actually explains things.

#startup #buildinpublic #certification #AI #lessons`,
    notes: 'Build in public update. Vulnerability builds trust.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // =====================================================================
  // WEEK 3 — SOCIAL PROOF & ENGAGEMENT (Mar 30 – Apr 5, 2026)
  // Focus: User wins, study tips, exam facts, deepen Reddit, ad refresh
  // =====================================================================

  // ── Day 15 · Mon Mar 30 ───────────────────────────────────────────────

  {
    week: 3,
    title: 'LinkedIn — User Win Story',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-03-30',
    scheduledTime: '8:30 AM EST',
    body: `Got a message this morning that made my entire week:

"I've been using CIPHER for 10 days and I already feel more confident about my PMP than I did after 2 months of traditional prep."

This is exactly the feedback that keeps me going.

It's not magic. It's a different approach:

Instead of doing 100 questions and checking scores, this user did 30 questions and deeply analyzed every one — understanding why each wrong answer was designed to be tempting.

That's what our AI explanations enable. Not more studying. DEEPER studying.

If you're preparing for a certification exam and feel stuck, sometimes the answer isn't "study more." It's "study differently."

7-day free trial, no credit card: cipherexam.com

#certification #PMP #examprep #userfeedback`,
    notes: 'Social proof post. Use real user feedback when available, or adapt this template.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 3,
    title: 'Google Ads — Mid-Campaign Refresh (PMP)',
    type: 'ad',
    status: 'ready',
    channel: 'Google Ads',
    scheduledDate: '2026-03-30',
    scheduledTime: '6:00 AM EST',
    body: `Headline 1: PMP Exam Prep That Explains Answers
Headline 2: Understand WHY — Not Just WHAT
Headline 3: Free Trial — Start Learning Today
Description 1: Most PMP prep tools just grade you. CIPHER explains WHY each answer is right or wrong — so you actually understand the material. Try free for 7 days.
Description 2: Struggling with PMP practice questions? Our AI breaks down every answer choice so you learn the reasoning, not just the facts. No credit card to start.
Display URL: cipherexam.com/pmp
Final URL: https://cipherexam.com`,
    notes: 'A/B test against Week 1 ads. Focus on the explanation angle which is resonating.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 3,
    title: 'Meta Ads — Social Proof Creative',
    type: 'ad',
    status: 'ready',
    channel: 'Meta Ads',
    scheduledDate: '2026-03-30',
    scheduledTime: '7:00 AM EST',
    body: `Primary Text: "I felt more confident after 10 days with CIPHER than after 2 months of traditional studying." — Early user feedback. CIPHER doesn't just test you — it teaches you. AI-powered explanations break down every answer so you understand the reasoning, not just the right letter. PMP, Security+, CSM, SHRM-CP, ITIL & more. Try free for 7 days.

Headline: Study Smarter, Not Harder
Description: AI-powered cert exam prep. Free 7-day trial.
CTA: Sign Up`,
    notes: 'Social proof ad creative. A/B test against Week 1 launch ads.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 16 · Tue Mar 31 ───────────────────────────────────────────────

  {
    week: 3,
    title: 'Twitter/X — Did You Know: PMP Fact',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-03-31',
    scheduledTime: '9:00 AM EST',
    body: `Did you know: The PMP exam has a 60% first-attempt pass rate.

That means 4 out of 10 people who sit for the exam — after months of studying — fail.

The difference isn't how much they studied. It's how they studied.`,
    notes: 'Stat-based hook. Drives engagement.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 3,
    title: 'Reddit r/CompTIA — Answering Questions',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/CompTIA',
    scheduledDate: '2026-03-31',
    scheduledTime: '1:00 PM EST',
    body: `Title: Quick reference: Security+ SY0-701 domains ranked by exam weight

For anyone planning their Security+ study schedule, here's a quick reference for how to allocate your time based on exam domain weights:

1. **General Security Concepts (12%)** — Don't skip this thinking it's "easy." It sets the foundation for everything else.

2. **Threats, Vulnerabilities & Mitigations (22%)** — This is the biggest section. Spend proportional time here. Know your attack types, vulnerability categories, and mitigation strategies cold.

3. **Security Architecture (18%)** — Understand cloud, hybrid, and on-prem architecture security principles. This is where a lot of PBQs come from.

4. **Security Operations (28%)** — THE biggest section by weight. Logging, monitoring, incident response, automation. This is where the exam goes deep.

5. **Security Program Management & Oversight (20%)** — Governance, risk management, compliance. The "boring" section that a lot of people under-study.

Pro tip: If you're scoring well on domains 1 and 2 but struggling on 4 and 5, that's a sign you've been studying concepts but not operations. Shift your focus.

How are you all allocating your study time across domains?`,
    notes: 'High-value reference post. Should get saved/bookmarked. No product mention.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 17 · Wed Apr 1 ────────────────────────────────────────────────

  {
    week: 3,
    title: 'LinkedIn — Study Tips Carousel Concept',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-04-01',
    scheduledTime: '8:00 AM EST',
    body: `5 things I'd do differently if I were starting cert exam prep today:

1. I'd pick ONE cert and commit. Not two, not "maybe this one." ONE.

2. I'd find someone who passed recently and ask them exactly what they used. Not Reddit — an actual person I can talk to.

3. I'd study for 30 minutes a day instead of 3-hour weekend marathons. Consistency beats intensity.

4. I'd spend 50% of my practice time analyzing wrong answers, not doing new questions.

5. I'd set a firm exam date before I felt "ready." Nothing motivates like a deadline you can't move.

The biggest mistake in cert prep is thinking you need more time. You need a better system.

What would you add to this list?

#certification #studytips #PMP #SecurityPlus #careerdev`,
    notes: 'Consider turning this into a carousel/document post for higher reach.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 3,
    title: 'Twitter/X — Exam Date Advice',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-04-01',
    scheduledTime: '12:00 PM EST',
    body: `Best cert exam study advice I ever got:

"Book your exam date BEFORE you feel ready."

Nothing focuses your studying like a deadline you can't move.`,
    notes: '',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 18 · Thu Apr 2 ────────────────────────────────────────────────

  {
    week: 3,
    title: 'LinkedIn — Feature Spotlight: Explanation Depth',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-04-02',
    scheduledTime: '8:30 AM EST',
    body: `I want to show you something.

Here's an actual explanation from CIPHER for a PMP practice question:

Question: "A project is behind schedule. The PM discovers that a key team member has been reassigned without notice. What should the PM do FIRST?"

Most tools would just say: "A. Review the resource management plan."

Here's what CIPHER shows:

"✅ A. Review the resource management plan
This is correct because the PM needs to first understand the agreed-upon process for handling resource changes. The resource management plan defines roles, responsibilities, and the process for acquiring and releasing team members. Before taking any action, the PM should consult this plan.

❌ B. Escalate to the sponsor
This is tempting because it feels urgent, but escalation should come AFTER the PM has assessed the situation and attempted to resolve it through normal channels. Escalating immediately skips the assessment step.

❌ C. Request a replacement from the functional manager
This jumps to a solution before understanding the full picture. What if the resource management plan has a different process? What if there's a pre-approved backup?

❌ D. Adjust the project schedule
This assumes the impact is permanent and can't be mitigated. You're accepting the impact before even trying to address the root cause."

THIS is what learning looks like. Not just "the answer is A."

Try it yourself: cipherexam.com — 7 days free.

#PMP #certification #examprep #AI #studysmart`,
    notes: 'Show the product in action. Use real or realistic explanation format.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 3,
    title: 'Reddit r/projectmanagement — Responding to Common Questions',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/projectmanagement',
    scheduledDate: '2026-04-02',
    scheduledTime: '2:00 PM EST',
    body: `Title: Decoded: What "best" and "most appropriate" mean on the PMP exam

One thing that confused me early on: the PMP exam loves to ask for the "best" or "most appropriate" action. Not the only correct action — the BEST one.

Here's the framework for handling these:

**"Best" means:** All options might be valid, but one is more aligned with PMI's recommended approach. Usually this means:
- Following the process before improvising
- Consulting the plan before taking action
- Assessing before escalating
- Using formal channels over informal ones

**"Most appropriate" means:** Given THIS specific scenario, which option fits best? Pay close attention to:
- Time constraints mentioned in the question
- The role of the person in the scenario
- Whether a plan already exists
- The severity of the situation

**Common traps:**
- An option that sounds proactive but skips a required step
- An option that's correct in general but wrong for this specific scenario
- An option that involves the right people but the wrong action

The exam is testing your judgment, not your knowledge of PMBOK definitions. Think of it as: "What would a calm, experienced PM do in this exact situation?"

Hope this helps someone. These kinds of questions used to drive me crazy.`,
    notes: 'Pure value. Deep engagement in the PM community. This is the kind of post that builds long-term credibility.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 19 · Fri Apr 3 ────────────────────────────────────────────────

  {
    week: 3,
    title: 'Twitter/X — Did You Know: Security+',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-04-03',
    scheduledTime: '9:00 AM EST',
    body: `Did you know: CompTIA Security+ is the most requested cert in cybersecurity job postings.

It's required for DoD 8570 compliance roles.

If you're breaking into cybersecurity, this is THE cert to get first.`,
    notes: 'Engaging stat for the Security+ audience.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 3,
    title: 'LinkedIn — The "2 AM Cramming" Post',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-04-03',
    scheduledTime: '8:00 AM EST',
    body: `It's 2 AM. Your exam is in 3 days. You're staring at practice questions.

Sound familiar?

Here's the thing about late-night cramming: your brain is terrible at learning new material when you're tired. But it's actually decent at REVIEWING material you've already studied.

So if you're in the final stretch before your cert exam, here's what to do:

DO:
→ Review your notes on topics you've already studied
→ Re-read explanations for questions you got wrong
→ Do a small set of practice questions (10-15) focusing on your weak areas
→ Get sleep. Seriously. Sleep consolidates memory.

DON'T:
→ Try to learn new topics you haven't touched
→ Do a full-length practice exam (save those for daytime)
→ Panic-study random material
→ Skip sleep to do one more question set

The last 72 hours before an exam should be about confidence, not new information.

And if you need a study partner at 2 AM that won't judge you, our AI is always awake: cipherexam.com

#certification #examprep #studytips #PMP #SecurityPlus`,
    notes: 'Relatable scenario. Practical advice. Light CTA.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 20 · Sat Apr 4 ────────────────────────────────────────────────

  {
    week: 3,
    title: 'Twitter/X — Weekend Study Accountability',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-04-04',
    scheduledTime: '10:00 AM EST',
    body: `Weekend study check-in:

What cert are you working on today?

Drop it below. Let's keep each other accountable.`,
    notes: 'Engagement/community building tweet.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 3,
    title: 'Reddit r/cybersecurity — Helpful Comment/Post',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/cybersecurity',
    scheduledDate: '2026-04-04',
    scheduledTime: '1:00 PM EST',
    body: `Title: Breaking into cybersecurity — why Security+ first makes sense (and what to pair it with)

Seeing a lot of "how do I break into cybersecurity?" posts. Here's the practical path I've seen work for most people:

**Step 1: CompTIA Security+ (3-4 months of study)**
This gives you the foundational knowledge AND opens doors to government/DoD roles. It's the most requested cert in entry-level cybersecurity job postings. The exam is challenging but doable with focused prep.

**Step 2: Get hands-on experience**
Set up a home lab. Use TryHackMe, HackTheBox, or similar. The cert gets you interviews; hands-on skills get you hired. Even a simple setup with VMs and Wireshark teaches you a ton.

**Step 3: Pick your specialization**
After Security+, branch into:
- CySA+ if you want to do analysis/SOC work
- PenTest+ if you want offensive security
- Cloud certs (AWS/Azure) if cloud security interests you

**What doesn't work:**
- Collecting certs without hands-on skills
- Skipping fundamentals and going straight to advanced certs
- Waiting until you "know everything" before applying for jobs

The industry has more open positions than qualified people. If you have Security+ and can demonstrate practical skills, you're already ahead of most applicants.

Happy to answer specific questions if anyone's planning their path.`,
    notes: 'Career advice post. Builds credibility in the cybersecurity community.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 21 · Sun Apr 5 ────────────────────────────────────────────────

  {
    week: 3,
    title: 'LinkedIn — End of Week 3 Reflection',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-04-05',
    scheduledTime: '9:00 AM EST',
    body: `3 weeks of CIPHER. An honest update:

The thing I'm most proud of isn't a feature or a metric. It's this:

Users are spending an average of 45 seconds reading each AI explanation.

That doesn't sound like much. But in a world of "check the answer, move on" studying, 45 seconds of genuine learning per question adds up fast.

Over 20 questions, that's 15 minutes of deep, focused understanding. The kind of understanding that actually sticks.

Traditional studying: do 100 questions, check answers, feel productive.
Our approach: do 30 questions, deeply understand each one, actually improve.

Less can be more. In studying and in building a product.

#startup #buildinpublic #certification #examprep #AI`,
    notes: 'Metric-based build in public post. Adjust numbers to real data when available.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // =====================================================================
  // WEEK 4 — CONVERSION PUSH (Apr 6–12, 2026)
  // Focus: Urgency, feature highlights, testimonials, retargeting
  // =====================================================================

  // ── Day 22 · Mon Apr 6 ────────────────────────────────────────────────

  {
    week: 4,
    title: 'LinkedIn — The Cost of Failing',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-04-06',
    scheduledTime: '8:00 AM EST',
    body: `Let's talk about the cost of failing a certification exam.

PMP exam fee: $405 (PMI members) / $555 (non-members)
Security+ exam fee: $404
SHRM-CP exam fee: $375-$475

That's just the financial cost. The real cost?

→ 3-6 more months of studying
→ The mental toll of feeling like you wasted months of effort
→ Delayed career advancement and salary bumps
→ Lost confidence that makes the retake even harder

Most people who fail didn't lack knowledge. They lacked the right preparation method.

They studied to memorize. The exam tests understanding.

I built CIPHER specifically to close this gap. Our AI doesn't just tell you the answer — it teaches you the reasoning so you understand concepts at the depth the exam requires.

If you're investing hundreds of dollars in an exam fee, invest 7 free days in preparation that actually works: cipherexam.com

No credit card. No risk. Just better prep.

#certification #PMP #SecurityPlus #SHRM #examprep #careerdev`,
    notes: 'Urgency angle: financial cost of failure. Strong conversion post.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 4,
    title: 'Google Ads — Retargeting Campaign',
    type: 'ad',
    status: 'ready',
    channel: 'Google Ads',
    scheduledDate: '2026-04-06',
    scheduledTime: '6:00 AM EST',
    body: `Headline 1: Still Studying for Your Cert Exam?
Headline 2: Try AI-Powered Exam Prep Free
Headline 3: 7 Days Free — No Credit Card
Description 1: You visited CIPHER but haven't tried it yet. Our AI explains every answer choice — right and wrong — so you actually learn the material. Start your free trial today.
Description 2: Come back and see what you're missing. AI-powered explanations for every practice question. PMP, Security+, CSM, SHRM-CP & more. 7-day free trial.
Display URL: cipherexam.com
Final URL: https://cipherexam.com`,
    notes: 'Retargeting audience: visited site but didn\'t sign up. Lower CPC expected.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 4,
    title: 'Meta Ads — Retargeting with Urgency',
    type: 'ad',
    status: 'ready',
    channel: 'Meta Ads',
    scheduledDate: '2026-04-06',
    scheduledTime: '7:00 AM EST',
    body: `Primary Text: Failing a certification exam costs $400+. And 3-6 more months of studying. CIPHER helps you pass the first time with AI-powered explanations that teach you WHY — not just what. Users report feeling more confident in 10 days than after months of traditional prep. Try free for 7 days. No credit card.

Headline: Don't Risk $400+ on the Wrong Prep
Description: AI-powered explanations. Free 7-day trial.
CTA: Start Free Trial`,
    notes: 'Retargeting audience: site visitors + lookalikes. Cost-of-failure angle.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 23 · Tue Apr 7 ────────────────────────────────────────────────

  {
    week: 4,
    title: 'Twitter/X — Testimonial / User Quote',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-04-07',
    scheduledTime: '9:00 AM EST',
    body: `"The AI explanations are like having a tutor who never gets tired of explaining things."

— CIPHER user

Try it free for 7 days: cipherexam.com`,
    notes: 'Use real testimonials when available. Adapt wording as needed.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 4,
    title: 'LinkedIn — Feature Highlight: Multi-Cert Support',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-04-07',
    scheduledTime: '8:30 AM EST',
    body: `One platform. Six certifications. One study method that works for all of them.

CIPHER now supports:
→ PMP (Project Management Professional)
→ CompTIA Security+
→ CSM (Certified ScrumMaster)
→ SHRM-CP (HR Certification)
→ ITIL 4 Foundation
→ And more coming soon

Why one platform for multiple certs?

Because the SKILL we teach isn't cert-specific. It's universal:

"Read the question carefully. Understand what it's really testing. Analyze why wrong answers are wrong. Build pattern recognition."

This approach works whether you're studying project management, cybersecurity, or HR.

Different content. Same method. One subscription.

If you're planning multiple certs (and you should be — cert stacking is real), CIPHER grows with you.

7-day free trial, no credit card: cipherexam.com

#certification #PMP #SecurityPlus #CSM #SHRM #ITIL #careerdev`,
    notes: 'Feature highlight + cert stacking angle.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 4,
    title: 'Reddit r/projectmanagement — Sharing Exam Day Tips',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/projectmanagement',
    scheduledDate: '2026-04-07',
    scheduledTime: '12:00 PM EST',
    body: `Title: PMP exam day tips — the stuff nobody tells you

For anyone with their PMP exam coming up, here are some exam-day tips that aren't in any study guide:

**Before the exam:**
- Eat a real meal. Not just coffee. Your brain needs fuel for 4 hours of intense focus.
- Arrive early. The check-in process can be stressful if you're rushed.
- If online, test your setup the day BEFORE. Camera, microphone, desk clearing — don't discover issues on exam day.

**During the exam:**
- Read every question TWICE before looking at the answers. Seriously. Most wrong answers are chosen because people misread the question.
- Use the "flag" feature liberally. If you're unsure, flag it and move on. Come back with fresh eyes.
- Don't change your first answer unless you have a clear reason. Your initial instinct is usually based on knowledge; your second-guess is usually based on anxiety.
- Take the breaks. All of them. Even if you feel fine. Mental fatigue is sneaky.

**For "FIRST" questions:**
- The answer is almost never the most dramatic option
- "Assess the situation" beats "take immediate action" 90% of the time
- If the question mentions a plan exists, the answer probably involves consulting that plan

**Mindset:**
- If you hit a stretch of hard questions, it might mean you're doing WELL (adaptive exam adjusts difficulty up)
- Don't track how many you think you got right/wrong. Just focus on the next question.
- Trust your preparation.

Good luck to everyone with upcoming exams! You've got this.`,
    notes: 'Extremely helpful exam day tips post. Will get saves and shares. No product mention.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 24 · Wed Apr 8 ────────────────────────────────────────────────

  {
    week: 4,
    title: 'LinkedIn — "Why I Didn\'t Build Another Question Bank"',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-04-08',
    scheduledTime: '8:00 AM EST',
    body: `When I started building CIPHER, everyone told me to build a bigger question bank.

"Just get 5,000 questions for each cert. That's what people want."

I said no.

Here's why:

The market is FLOODED with question banks. You can find 10,000 PMP practice questions online. The problem was never access to questions.

The problem is that doing 10,000 questions without understanding them is like reading a cookbook without cooking. You feel productive but you're not getting better.

So instead of building the biggest question bank, I built the best explanation engine.

Every question in CIPHER comes with AI-generated explanations that break down:

→ Why the correct answer is correct (the reasoning, not just the definition)
→ Why each wrong answer is wrong (what trap it sets)
→ What pattern this question tests (so you recognize similar questions)
→ How to approach this type of question (a reusable framework)

Fewer questions, deeper understanding, better results.

That's the bet I made. And based on user feedback, it's paying off.

Try it yourself: cipherexam.com — 7 days free, no credit card.

#certification #AI #startup #examprep #edtech`,
    notes: 'Product philosophy post. Differentiates from competitors.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 4,
    title: 'Twitter/X — Conversion Tweet',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-04-08',
    scheduledTime: '12:00 PM EST',
    body: `You can find 10,000 practice questions for free online.

What you can't find: an AI that explains WHY every answer is right or wrong.

That's what we built.

cipherexam.com — 7 days free, no card needed.`,
    notes: 'Direct conversion tweet.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 25 · Thu Apr 9 ────────────────────────────────────────────────

  {
    week: 4,
    title: 'LinkedIn — Testimonial Compilation',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-04-09',
    scheduledTime: '8:30 AM EST',
    body: `Early feedback from CIPHER users (real quotes, shared with permission):

"I finally understand WHY I keep getting stakeholder questions wrong. The AI explanation showed me I was confusing stakeholder engagement with communication management."

"The explanation for each wrong answer is what makes this different. I've never seen a tool that teaches you what traps to avoid."

"I went from 62% to 78% on practice exams in two weeks. The difference was understanding reasoning, not just memorizing more."

"As someone studying while working full-time with kids, I don't have time to waste. This tool makes every question count."

These aren't just nice words. They represent a fundamental shift in how people study.

From "check the answer and move on" to "understand the answer and never miss it again."

If you're preparing for PMP, Security+, CSM, SHRM-CP, or ITIL — try it free for 7 days: cipherexam.com

No credit card. No commitment. Just better studying.

#certification #PMP #SecurityPlus #examprep #testimonials`,
    notes: 'Social proof compilation. Update with real testimonials as they come in.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 4,
    title: 'Google Ads — Security+ Refreshed Ad',
    type: 'ad',
    status: 'ready',
    channel: 'Google Ads',
    scheduledDate: '2026-04-09',
    scheduledTime: '6:00 AM EST',
    body: `Headline 1: Security+ Exam — Pass First Try
Headline 2: AI Explains Every Wrong Answer
Headline 3: 7-Day Free Trial — Start Now
Description 1: The Security+ exam costs $404. Don't waste it on weak prep. CIPHER explains why every answer is right or wrong so you understand the material deeply. Try free.
Description 2: AI-powered Security+ prep. Every question comes with detailed explanations — not just answer keys. Understand the reasoning. Pass with confidence. Free 7-day trial.
Display URL: cipherexam.com/security-plus
Final URL: https://cipherexam.com`,
    notes: 'Cost-of-failure angle for Security+ audience.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 26 · Fri Apr 10 ───────────────────────────────────────────────

  {
    week: 4,
    title: 'LinkedIn — Final Conversion Push',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-04-10',
    scheduledTime: '8:00 AM EST',
    body: `If you've been thinking about trying CIPHER, here's what you need to know:

✅ 7-day free trial (actually free — no credit card)
✅ PMP, Security+, CSM, SHRM-CP, ITIL
✅ AI-powered explanations for EVERY answer choice
✅ Works on any device
✅ Cancel anytime

What you get in 7 days:
→ Unlimited practice questions with full AI explanations
→ Track your progress and identify weak areas
→ Study at your pace, on your schedule

What you don't get:
→ Pressured into buying anything
→ Spam emails
→ Generic "the answer is C" explanations

I built this because I was frustrated with every other cert prep tool I tried. I wanted something that actually teaches you, not just tests you.

If that resonates, try it: cipherexam.com

And if it doesn't work for you, I genuinely want to know why. Reply or DM me.

#certification #examprep #PMP #SecurityPlus #CSM #SHRM #ITIL`,
    notes: 'Direct, clear conversion post. No-risk framing.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 4,
    title: 'Twitter/X — Simple CTA',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-04-10',
    scheduledTime: '11:00 AM EST',
    body: `Studying for a cert exam?

Try CIPHER free for 7 days. No credit card.

AI explains every answer — right and wrong — so you actually understand the material.

PMP | Security+ | CSM | SHRM-CP | ITIL

cipherexam.com`,
    notes: 'Clean, direct conversion tweet.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 4,
    title: 'Reddit r/humanresources — SHRM-CP Community Engagement',
    type: 'social',
    status: 'ready',
    channel: 'Reddit r/humanresources',
    scheduledDate: '2026-04-10',
    scheduledTime: '1:00 PM EST',
    body: `Title: For SHRM-CP test takers — how to handle "best answer" questions when two options seem right

The hardest part of the SHRM-CP exam isn't knowing the material — it's choosing between two answers that both seem correct.

Here's how to approach these:

**The SHRM-CP filter:**
When two answers both seem right, ask yourself:
1. Which answer is more aligned with SHRM's stated values? (Not your company's culture — SHRM's values)
2. Which answer considers the broadest set of stakeholders?
3. Which answer follows the most structured/formal approach?

**Example mindset:**
If the options are "have an informal conversation with the employee" vs. "document the concern and schedule a formal meeting" — the SHRM-CP usually favors the more structured approach, even if your real-world experience says informal works fine.

**Why this matters:**
The exam isn't testing what works in YOUR organization. It's testing what SHRM considers best practice. Sometimes these align, sometimes they don't. On exam day, think like SHRM, not like yourself.

**Study tip:**
When you practice, don't just pick an answer. Rank all 4 options from best to worst and explain why. This forces you to think about the reasoning behind each option — which is exactly what the exam tests.

Hope this helps! What's been your biggest challenge with SHRM-CP prep?`,
    notes: 'Value-first HR community post. No product mention. Building credibility.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 27 · Sat Apr 11 ───────────────────────────────────────────────

  {
    week: 4,
    title: 'Twitter/X — Weekend Motivation',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-04-11',
    scheduledTime: '10:00 AM EST',
    body: `Every person with a certification was once exactly where you are right now:

Studying. Doubting. Wondering if they're ready.

They weren't. They took the exam anyway. And they passed.

Keep going.`,
    notes: 'Motivational. High share potential.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 4,
    title: 'Meta Ads — Final Week Push',
    type: 'ad',
    status: 'ready',
    channel: 'Meta Ads',
    scheduledDate: '2026-04-11',
    scheduledTime: '7:00 AM EST',
    body: `Primary Text: Still studying for your certification exam? There's a better way. CIPHER uses AI to explain every single answer choice — not just tell you which one is correct. Our users say it's like having a tutor available 24/7. PMP, Security+, CSM, SHRM-CP, ITIL. 7-day free trial. No credit card. No risk.

Headline: Your Cert Exam Tutor — Available 24/7
Description: AI-powered exam prep. Try free for 7 days.
CTA: Start Free Trial`,
    notes: 'Final week broad audience push. Test against all previous creatives.',
    createdAt: '2026-03-16T00:00:00Z',
  },

  // ── Day 28 · Sun Apr 12 ───────────────────────────────────────────────

  {
    week: 4,
    title: 'LinkedIn — Month 1 Recap & What\'s Next',
    type: 'social',
    status: 'ready',
    channel: 'LinkedIn',
    scheduledDate: '2026-04-12',
    scheduledTime: '9:00 AM EST',
    body: `One month of CIPHER. Here's the honest recap:

Building a product is hard. Building a product people actually use is harder. Building a product people LOVE is the hardest.

I'm not there yet. But I'm closer than I was 28 days ago.

Here's what I know after month one:

1. The AI explanation feature is the reason people stay. It's not a "nice to have" — it's the core value.

2. Content marketing > paid ads for this market. People studying for certifications want to learn from you before they buy from you.

3. Reddit is underrated. Genuine, helpful community engagement drives more trust than any ad campaign.

4. The biggest competitor isn't another product. It's the free YouTube video and the $20 question bank. We win by being meaningfully better, not just different.

5. Every conversation with a user teaches me something I couldn't have learned any other way.

Month 2 plan:
→ More certifications (AWS, Azure, CAPM)
→ Deeper AI explanations with visual diagrams
→ Study plan generator
→ More blog content based on what users actually search for

If you've been following this journey — thank you. If you haven't tried CIPHER yet and you're studying for a cert: cipherexam.com — 7 days free.

Here's to month 2.

#startup #buildinpublic #certification #AI #examprep #month1`,
    notes: 'Capstone post for the 4-week campaign. Sets up month 2.',
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    week: 4,
    title: 'Twitter/X — Month 1 Wrap',
    type: 'social',
    status: 'ready',
    channel: 'Twitter/X',
    scheduledDate: '2026-04-12',
    scheduledTime: '11:00 AM EST',
    body: `One month since launching CIPHER.

What I've learned: people don't want more practice questions. They want to actually UNDERSTAND the material.

That insight is shaping everything we build next.

Month 2, let's go. cipherexam.com`,
    notes: 'Clean wrap-up tweet. Forward-looking.',
    createdAt: '2026-03-16T00:00:00Z',
  },
];
