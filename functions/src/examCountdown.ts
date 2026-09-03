import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import { complianceFooter, isOptedOut } from "./emailCompliance";

/**
 * Exam Countdown sequence.
 *
 * Users set an exam date in the study planner (SetupPlanner → StudyPlanService).
 * That date lives on `study_plans/{planId}.examDate` (Firestore Timestamp),
 * alongside `userId`, `examId`, and `status: 'active'`.
 *
 * A daily scheduled job (14:00 UTC) finds active plans whose exam date is
 * exactly 14, 7, 3, or 1 day(s) away and sends the matching countdown email
 * through Resend.
 *
 * Deploy-safe: if RESEND_API_KEY is absent the function logs and no-ops
 * (same contract as onboardingDrip). Idempotent: each sent milestone is
 * stamped on the plan doc as `countdownEmailsSent: { d14: true, ... }` and a
 * stamped milestone is never resent — safe across retries and overlapping
 * runs on the same day.
 *
 * Opt-out: if the user doc carries `emailOptOut: true` the user is skipped.
 * (No opt-out field exists in the codebase today; this honors one the moment
 * it's introduced.)
 *
 * COPY: brand-voice.md compliant — calm, useful, no combat metaphors, no
 * pass promises. One CTA into the app. Signed "Dave at CipherExam".
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

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

function shell(inner: string, ctaLabel: string, footer = ""): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#0f172a;max-width:560px">
${inner}
<p style="margin-top:28px"><a href="${CTA}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${ctaLabel}</a></p>
<p style="color:#64748b;font-size:13px;margin-top:24px">— Dave at CipherExam</p>
${footer}
</div>`;
}

type CountdownEmail = {
  /** Days before the exam this email goes out. */
  daysOut: number;
  /** Idempotency key on the plan doc: countdownEmailsSent.<stampKey>. */
  stampKey: "d14" | "d7" | "d3" | "d1";
  subject: string;
  ctaLabel: string;
  html: (ctx: { firstName: string; footer: string }) => string;
};

export const COUNTDOWN_SEQUENCE: CountdownEmail[] = [
  {
    daysOut: 14,
    stampKey: "d14",
    subject: "Two weeks out — your final-review plan",
    ctaLabel: "Run a readiness check",
    html: ({ firstName, footer }) =>
      shell(
        `<p>Hi ${firstName},</p>
<p>Your exam is two weeks away. This is the point where a plan matters more than more hours.</p>
<p>Here's the shape of a solid final fortnight:</p>
<ul style="padding-left:20px;margin:12px 0">
<li><strong>This week:</strong> run a readiness check to see where you actually stand — your accuracy by domain, not your gut feeling.</li>
<li><strong>Then:</strong> drill your two weakest domains. That's where the score moves. Domains you're already strong in only need light touch-ups.</li>
<li><strong>Skip:</strong> re-reading material you already know. It feels productive; it isn't.</li>
</ul>
<p>Your dashboard already knows your weak domains. Start there.</p>`,
        "Run a readiness check",
        footer,
      ),
  },
  {
    daysOut: 7,
    stampKey: "d7",
    subject: "One week out — make this simulator week",
    ctaLabel: "Start a full-length mock",
    html: ({ firstName, footer }) =>
      shell(
        `<p>Hi ${firstName},</p>
<p>One week to go. This week is about exam conditions, not new material.</p>
<p>A cadence that works:</p>
<ul style="padding-left:20px;margin:12px 0">
<li><strong>Early in the week:</strong> one full-length mock, timed, no pauses. Sitting for the full duration is a skill of its own.</li>
<li><strong>The day after:</strong> review every miss slowly. The explanation matters more than the score — you're looking for the reasoning pattern behind each wrong turn, not just the right answer.</li>
<li><strong>Mid-week:</strong> short, focused sets in the domains the mock exposed.</li>
<li><strong>End of week:</strong> a second mock if your first score left room, or targeted review if it didn't.</li>
</ul>
<p>One honest mock plus a careful review is worth more than three rushed ones.</p>`,
        "Start a full-length mock",
        footer,
      ),
  },
  {
    daysOut: 3,
    stampKey: "d3",
    subject: "Three days out — time to taper",
    ctaLabel: "Do a light review set",
    html: ({ firstName, footer }) =>
      shell(
        `<p>Hi ${firstName},</p>
<p>Three days left. Counterintuitive advice: study less.</p>
<p>The work is mostly done. What matters now:</p>
<ul style="padding-left:20px;margin:12px 0">
<li><strong>Light review only.</strong> Short question sets in your weak domains — 20 to 30 minutes, not marathon sessions. You're keeping the patterns warm, not learning new ones.</li>
<li><strong>Sleep.</strong> Two consecutive nights of good sleep before exam day does more for your reasoning than any cram session.</li>
<li><strong>Logistics.</strong> Confirm your test center or online-proctor setup, your ID, and your arrival time today — not the night before. If it's online, do the system check now.</li>
</ul>
<p>Tired and over-prepared loses to rested and prepared. Taper.</p>`,
        "Do a light review set",
        footer,
      ),
  },
  {
    daysOut: 1,
    stampKey: "d1",
    subject: "Tomorrow's the day — you've done the work",
    ctaLabel: "Skim your exam-day checklist",
    html: ({ firstName, footer }) =>
      shell(
        `<p>Hi ${firstName},</p>
<p>Your exam is tomorrow. No new material today — nothing you learn in the next 24 hours will change the outcome, but showing up rested and calm will.</p>
<p>Tomorrow morning:</p>
<ul style="padding-left:20px;margin:12px 0">
<li>Eat something normal. Arrive (or log in) early enough that nothing is rushed.</li>
<li>ID and confirmation ready the night before.</li>
<li>During the exam: flag hard questions and move on. Your first pass builds momentum; the flagged ones look easier on the way back.</li>
<li>When a question feels like a trick, slow down and ask what the test-writer is actually grading. You've practiced exactly that.</li>
</ul>
<p>You've put in the reps. Trust the preparation — it's in there.</p>`,
        "Skim your exam-day checklist",
        footer,
      ),
  },
];

/** UTC-midnight boundary `daysFromToday` days after today. */
function utcDayStart(daysFromToday: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d;
}

/**
 * Daily at 14:00 UTC: send the countdown email for every active study plan
 * whose examDate falls exactly 14 / 7 / 3 / 1 day(s) from today.
 */
export const sendExamCountdownEmails = functions.pubsub
  .schedule("every day 14:00")
  .timeZone("UTC")
  .onRun(async () => {
    const apiKey = resolveKey();
    if (!apiKey) {
      console.warn(
        "[countdown] RESEND_API_KEY not set — skipping send (deploy-safe no-op). " +
          "Set RESEND_API_KEY (and RESEND_FROM) to activate the countdown sequence.",
      );
      return null;
    }

    const db = admin.firestore();
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const mail of COUNTDOWN_SEQUENCE) {
      // examDate is stored as a Timestamp at (typically) UTC midnight of the
      // exam day; a [dayStart, nextDayStart) window matches any time-of-day.
      // Range-only query — no composite index needed; status filtered below.
      const windowStart = utcDayStart(mail.daysOut);
      const windowEnd = utcDayStart(mail.daysOut + 1);

      let plansSnap: FirebaseFirestore.QuerySnapshot;
      try {
        plansSnap = await db
          .collection("study_plans")
          .where("examDate", ">=", admin.firestore.Timestamp.fromDate(windowStart))
          .where("examDate", "<", admin.firestore.Timestamp.fromDate(windowEnd))
          .get();
      } catch (err) {
        console.error(`[countdown] D-${mail.daysOut} plan query failed: ${String(err)}`);
        failed++;
        continue;
      }

      for (const planDoc of plansSnap.docs) {
        const plan = planDoc.data();
        if (plan.status !== "active") {
          continue;
        }
        if (plan.countdownEmailsSent && plan.countdownEmailsSent[mail.stampKey]) {
          skipped++;
          continue;
        }
        const userId: string | undefined = plan.userId;
        if (!userId) {
          console.warn(`[countdown] study_plans/${planDoc.id} has no userId, skipping`);
          continue;
        }

        let email: string | undefined;
        let firstName = "there";
        try {
          const userSnap = await db.doc(`users/${userId}`).get();
          const user = userSnap.data() || {};
          if (user.emailOptOut === true) {
            console.log(`[countdown] users/${userId} opted out, skipping D-${mail.daysOut}`);
            continue;
          }
          email = user.email;
          firstName =
            (typeof user.displayName === "string" &&
              user.displayName.trim().split(" ")[0]) ||
            "there";
        } catch (err) {
          console.error(`[countdown] failed to read users/${userId}: ${String(err)}`);
          failed++;
          continue;
        }
        if (!email) {
          console.log(`[countdown] no email on users/${userId}, skipping`);
          continue;
        }

        // The check above reads users/{uid}.emailOptOut, which NOTHING in this
        // codebase ever writes -- the one-click unsubscribe records into the
        // `emailOptOuts` collection instead. So pressing Unsubscribe did not
        // stop these four emails. isOptedOut() reads the collection that the
        // unsubscribe endpoint actually writes.
        if (await isOptedOut(email)) {
          console.log(`[countdown] ${userId} has unsubscribed, skipping D-${mail.daysOut}`);
          continue;
        }

        // No unsubscribe link and no postal address went out on these at all.
        // complianceFooter returns null when either is unconfigured, and the
        // rule everywhere else in this codebase is "do not send", never "send
        // without a footer".
        const footer = complianceFooter(email, 'signup');
        if (!footer) {
          console.warn(`[countdown] compliance footer unavailable; not sending D-${mail.daysOut} to ${userId}.`);
          continue;
        }

        try {
          await axios.post(
            RESEND_ENDPOINT,
            {
              from: fromAddress(),
              to: [email],
              subject: mail.subject,
              html: mail.html({ firstName, footer }),
              tags: [
                { name: "campaign", value: "exam-countdown" },
                { name: "milestone", value: mail.stampKey },
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
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? JSON.stringify(err.response?.data ?? err.message)
            : String(err);
          console.error(
            `[countdown] D-${mail.daysOut} send failed for plan ${planDoc.id} (user ${userId}): ${message}`,
          );
          failed++;
          continue; // no stamp on failure — tomorrow's run won't match this window, but retries today can succeed
        }

        // Stamp the milestone so this email is never resent.
        try {
          await planDoc.ref.set(
            {
              countdownEmailsSent: {
                [mail.stampKey]: true,
              },
              [`countdownEmailsSentAt.${mail.stampKey}`]:
                admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        } catch (err) {
          console.error(
            `[countdown] sent D-${mail.daysOut} for plan ${planDoc.id} but failed to stamp: ${String(err)}`,
          );
        }
        sent++;
      }
    }

    console.log(`[countdown] run complete: sent=${sent} skipped=${skipped} failed=${failed}`);
    return null;
  });
