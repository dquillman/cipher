import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

/**
 * Ticket 1.2 — Resend onboarding drip.
 *
 * Fires on `users/{uid}` document create and schedules the Day 4/5/6/7
 * onboarding emails through Resend's `scheduled_at` API in one shot. Day 0 /
 * Day 3 / Day 6 stay MANUAL founder emails (sent by Dave) until activated
 * volume clears ~50/week — those are intentionally NOT sent here.
 *
 * Deploy-safe: if RESEND_API_KEY is absent the function logs and no-ops, so it
 * can ship before the key is provisioned. Idempotent: it stamps
 * `onboardingDripScheduledAt` on the user doc and bails if already set, so
 * function retries never double-schedule.
 *
 * COPY PROVENANCE: the email bodies below are grounded in the founder-email
 * theme taxonomy (cipher-marketing/site/data/founder-email-replies.json) and
 * brand-voice.md — trap framing, adaptive routing, real pricing, the
 * "Start Free Trial" CTA, no combat metaphors. Ticket 1.2 says copy should be
 * written from the Week-1 founder-email reply themes (Ticket 1.4), NOT invented
 * cold. Those replies do not exist yet, so this is the best-available draft
 * keyed to the anticipated themes; REFINE each email from the real top-3 themes
 * once ≥10 replies have been tagged.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type DripEmail = {
  /** Days after signup to deliver. */
  dayOffset: number;
  /** Founder-email theme this email is written against (see taxonomy). */
  theme: string;
  subject: string;
  html: (ctx: { firstName: string }) => string;
};

function resolveKey(): string | null {
  return (
    process.env.RESEND_API_KEY ||
    (functions.config().resend && functions.config().resend.key) ||
    null
  );
}

function fromAddress(): string {
  // Must be a Resend-verified sending domain. Override via env in prod.
  return process.env.RESEND_FROM || "Dave at CipherExam <dave@cipherexam.com>";
}

const CTA = "https://cipherexam.com/app";

function shell(inner: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#0f172a;max-width:560px">
${inner}
<p style="margin-top:28px"><a href="${CTA}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Start Free Trial</a></p>
<p style="color:#64748b;font-size:13px;margin-top:24px">— Dave, CipherExam · 7-day free trial. No credit card required. Cancel anytime.</p>
</div>`;
}

/**
 * The Day 4-7 sequence. Day 0/3/6 are deliberately omitted (manual founder
 * emails). Themes map to founder-email-replies.json keys.
 */
export const DRIP_SEQUENCE: DripEmail[] = [
  {
    dayOffset: 4,
    theme: "loved-trap-framing",
    subject: "The wrong answers are the whole game",
    html: ({ firstName }) =>
      shell(
        `<p>Hi ${firstName},</p>
<p>Most prep tools tell you the right answer. The exam already gave you four plausible ones — your problem is the three that <em>look</em> right.</p>
<p>Every CipherExam explanation walks the traps: why each wrong option is tempting, and the frame the test-writer is actually grading. That's the part that makes the exam stop feeling like a trick.</p>`,
      ),
  },
  {
    dayOffset: 5,
    theme: "skeptical-of-ai",
    subject: "Why our explanations aren't just ChatGPT",
    html: ({ firstName }) =>
      shell(
        `<p>Hi ${firstName},</p>
<p>Fair question we hear a lot: isn't this just an LLM wrapper?</p>
<p>No. Every question is Bloom's-classified and run through exam-specific trap detection, so the explanation targets the exact reasoning error the option was designed to catch — not a generic summary. It's the difference between "here's the answer" and "here's why you'd have missed it."</p>`,
      ),
  },
  {
    dayOffset: 6,
    theme: "pricing-confusion",
    subject: "What a retake actually costs",
    html: ({ firstName }) =>
      shell(
        `<p>Hi ${firstName},</p>
<p>Pricing is simple: $19/month, or $189/year (save 17%). The 7-day trial never charges a card.</p>
<p>Worth the comparison: a single exam retake usually runs several hundred dollars and weeks of re-study. CipherExam is built to get you through on the first sit by fixing the reasoning gaps, not just the knowledge gaps.</p>`,
      ),
  },
  {
    dayOffset: 7,
    theme: "credibility",
    subject: "Your trial ends tomorrow",
    html: ({ firstName }) =>
      shell(
        `<p>Hi ${firstName},</p>
<p>Your free trial wraps tomorrow. If the adaptive routing has been sending you back to your weakest domain — that's the whole point; it's where the score actually moves.</p>
<p>I read every reply to these emails personally. If anything's been confusing or missing, just hit reply and tell me.</p>`,
      ),
  },
];

function scheduledAtIso(base: Date, dayOffset: number): string {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + dayOffset);
  // Deliver mid-morning UTC rather than exactly at signup time.
  d.setUTCHours(15, 0, 0, 0);
  return d.toISOString();
}

export const scheduleOnboardingDrip = functions.firestore
  .document("users/{uid}")
  .onCreate(async (snap, context) => {
    const uid = context.params.uid as string;
    const data = snap.data() || {};
    const email: string | undefined = data.email;
    const firstName =
      (typeof data.displayName === "string" && data.displayName.trim().split(" ")[0]) ||
      "there";

    if (data.onboardingDripScheduledAt) {
      console.log(`[drip] already scheduled for ${uid}, skipping`);
      return;
    }
    if (!email) {
      console.log(`[drip] no email on users/${uid}, skipping`);
      return;
    }

    const apiKey = resolveKey();
    if (!apiKey) {
      console.warn(
        "[drip] RESEND_API_KEY not set — skipping send (deploy-safe no-op). " +
          "Set RESEND_API_KEY (and RESEND_FROM) to activate the drip.",
      );
      return;
    }

    const base = new Date(); // signup time
    const results: { dayOffset: number; ok: boolean; id?: string; error?: string }[] = [];

    for (const mail of DRIP_SEQUENCE) {
      try {
        const res = await axios.post(
          RESEND_ENDPOINT,
          {
            from: fromAddress(),
            to: [email],
            subject: mail.subject,
            html: mail.html({ firstName }),
            scheduled_at: scheduledAtIso(base, mail.dayOffset),
            tags: [
              { name: "campaign", value: "onboarding-drip" },
              { name: "day", value: String(mail.dayOffset) },
              { name: "theme", value: mail.theme },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          },
        );
        results.push({ dayOffset: mail.dayOffset, ok: true, id: res.data?.id });
      } catch (err) {
        const message =
          axios.isAxiosError(err)
            ? JSON.stringify(err.response?.data ?? err.message)
            : String(err);
        console.error(`[drip] Day ${mail.dayOffset} schedule failed for ${uid}: ${message}`);
        results.push({ dayOffset: mail.dayOffset, ok: false, error: message });
      }
    }

    const scheduled = results.filter((r) => r.ok).length;
    await admin
      .firestore()
      .doc(`users/${uid}`)
      .set(
        {
          onboardingDripScheduledAt: admin.firestore.FieldValue.serverTimestamp(),
          onboardingDripResult: { scheduled, total: DRIP_SEQUENCE.length, results },
        },
        { merge: true },
      );

    console.log(`[drip] scheduled ${scheduled}/${DRIP_SEQUENCE.length} emails for ${uid}`);
  });
