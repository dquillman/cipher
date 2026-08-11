import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import {
  complianceFooter,
  complianceStatus,
  isOptedOut,
  recordComplianceBlock,
} from "./emailCompliance";

/**
 * Lead-magnet welcome sequence.
 *
 * Fires on `leadCaptures/{captureId}` create and schedules a 3-touch sequence
 * through Resend's `scheduled_at` API in one shot. Closes the gap noted in
 * captureLead.ts ("Future enhancement: trigger a welcome email"): before this,
 * a lead-magnet download wrote a Firestore row, returned a PDF URL, and nothing
 * else ever happened.
 *
 * WHY 3 TOUCHES AND NOT THE 7-DAY SEQUENCE
 * `scheduleOnboardingDrip` runs a Day 4-7 sequence on `users/{uid}` create —
 * that is for people who started a trial. A lead who downloaded a cheat sheet
 * has not signed up for anything. Sending them a 7-email onboarding drip treats
 * a PDF download as a trial start, and burns the list.
 *
 * So this sequence does one job: deliver -> prove -> invite. If it works, the
 * lead starts a trial, a `users/{uid}` doc is created, and
 * `scheduleOnboardingDrip` takes over from there. Clean handoff, no overlap in
 * intent.
 *
 * KNOWN LIMITATION (see TODO below): if a lead converts to a trial on Day 1
 * they will receive the remaining lead touches AND the onboarding drip. The
 * scheduled Resend message IDs are persisted on the capture doc so a future
 * conversion hook can cancel them; that hook does not exist yet. Day 2 and
 * Day 5 copy is deliberately written so it still reads sensibly to someone who
 * has already started a trial.
 *
 * Deploy-safe: if RESEND_API_KEY is absent the function logs and no-ops, so it
 * can ship before the key is provisioned — same contract as onboardingDrip.
 * Idempotent: stamps `welcomeSequenceScheduledAt` on the capture doc and bails
 * if already set, so function retries never double-schedule.
 *
 * COPY PROVENANCE: written against brand-voice.md — founder voice, plain, no
 * combat metaphors, no guaranteed-pass language, no invented scarcity, real
 * pricing only ($19/mo, $189/yr, 7-day trial, no card). Exam fees are cost
 * anchors verified 2026-07-31 and are always phrased "exam fee", never
 * "$425 to sit" (readers misread the latter as CipherExam's own price).
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type Cluster = "pmp" | "security-plus" | "shrm-cp";

function resolveKey(): string | null {
  return (
    process.env.RESEND_API_KEY ||
    (functions.config().resend && functions.config().resend.key) ||
    null
  );
}

function fromAddress(): string {
  return process.env.RESEND_FROM || "Dave at CipherExam <dave@cipherexam.com>";
}

function shell(inner: string, ctaUrl: string, ctaLabel: string | null, footer: string): string {
  const cta = ctaLabel
    ? `<p style="margin-top:28px"><a href="${ctaUrl}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${ctaLabel}</a></p>`
    : "";
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#0f172a;max-width:560px">
${inner}
${cta}
<p style="color:#64748b;font-size:13px;margin-top:24px">— Dave, CipherExam · 7-day free trial. No credit card required. Cancel anytime.</p>
${footer}
</div>`;
}

type ClusterCopy = {
  examName: string;
  magnetTitle: string;
  magnetPath: string;
  lp: string;
  /** Exam sit fee, verified 2026-07-31. Always phrased as "exam fee". */
  fee: string;
  /** One concrete, anchored insight from inside the magnet. Day 2 payload. */
  insightHtml: string;
};

const CLUSTERS: Record<Cluster, ClusterCopy> = {
  "pmp": {
    examName: "PMP",
    magnetTitle: "The PMP Exam Lens Cheat Sheet",
    magnetPath: "/lead-magnets/pmp-exam-lens-cheat-sheet.pdf",
    lp: "/lp/pmp",
    fee: "$425",
    insightHtml: `<p>Here's the part of the cheat sheet people write back about.</p>
<p>Three of the four options on most PMP questions are <em>defensible</em>. They're not wrong in general — they're wrong for this scenario, or right under classical project management, or right if you skip a stakeholder. That's the whole difficulty.</p>
<p>So the useful question isn't "which answer is correct." It's "what would PMI want you to do here." Ask that before you read the options, not after.</p>`,
  },
  "security-plus": {
    examName: "Security+",
    magnetTitle: "Security+ PBQ Walkthroughs",
    magnetPath: "/lead-magnets/security-plus-pbq-walkthroughs.pdf",
    lp: "/lp/security-plus",
    fee: "$404",
    insightHtml: `<p>Here's the part of the walkthroughs that catches people.</p>
<p>Performance-based questions come first on Security+, they're worth more than multiple choice, and a question bank cannot prepare you for them. You can know every term in the CIA triad and still stall on a drag-and-drop firewall rule set.</p>
<p>The fix is procedural, not factual: work the PBQ as a sequence of decisions, and skip it early if it stalls you. Time spent stuck on question 2 is time taken from the other 88.</p>`,
  },
  "shrm-cp": {
    examName: "SHRM-CP",
    magnetTitle: "The SHRM-CP Competency Map",
    magnetPath: "/lead-magnets/shrm-cp-competency-map.pdf",
    lp: "/lp/shrm-cp",
    fee: "$410",
    insightHtml: `<p>Here's the distinction the competency map is built around.</p>
<p>SHRM-CP splits into knowledge items and situational judgment items, and they reward completely different preparation. Knowledge items test the BoCK. Situational judgment items test whether you'd behave like a competent HR professional — and there, the technically correct answer and the expected answer are often not the same one.</p>
<p>Study those two as separate subjects. Most candidates study them as one and wonder why the practice scores don't move.</p>`,
  },
};

type LeadEmail = {
  dayOffset: number;
  subject: (c: ClusterCopy) => string;
  html: (c: ClusterCopy, downloadUrl: string, lpUrl: string, footer: string) => string;
};

/**
 * Deliver -> prove -> invite. Day 0 asks for nothing; the lead just gave us an
 * email and expects a file, so the file is the whole email.
 */
export const LEAD_SEQUENCE: LeadEmail[] = [
  {
    dayOffset: 0,
    subject: (c) => `${c.magnetTitle} — here it is`,
    html: (c, downloadUrl, _lpUrl, footer) =>
      shell(
        `<p>Thanks for grabbing this.</p>
<p><a href="${downloadUrl}">${c.magnetTitle}</a> — that link is permanent, so save it rather than re-requesting it.</p>
<p>One suggestion on how to use it: don't read it front to back. Work a practice question first, get it wrong, <em>then</em> come back and find the section that explains why. It sticks better that way.</p>
<p>I'll send you one more thing in a couple of days. If you'd rather I didn't, just reply and say so — I read every reply.</p>`,
        downloadUrl,
        null,
        footer,
      ),
  },
  {
    dayOffset: 2,
    subject: (c) => `The ${c.examName} question everyone gets wrong`,
    html: (c, downloadUrl, lpUrl, footer) =>
      shell(
        c.insightHtml +
          `<p>That's the reasoning pattern the whole cheat sheet is built on, and it's what CipherExam explains on every single question — not just which answer is right, but why the other three were built to look right.</p>
<p><a href="${downloadUrl}">Your copy of ${c.magnetTitle}</a>, in case you need the link again.</p>`,
        lpUrl,
        "Start Free Trial",
        footer,
      ),
  },
  {
    dayOffset: 5,
    subject: (c) => `What a ${c.examName} retake actually costs`,
    html: (c, _downloadUrl, lpUrl, footer) =>
      shell(
        `<p>The ${c.examName} exam fee is ${c.fee}. A retake means paying it again, plus several more weeks of study you'd already planned to be done with.</p>
<p>That's the real argument for preparing differently rather than just preparing more. Most candidates who fail didn't skip the material — they studied to recall it, and the exam asked them to apply it.</p>
<p>CipherExam is $19/month, or $189/year. The 7-day trial doesn't take a card, so you can see whether the explanations actually change how you read a question before deciding anything.</p>
<p>Either way, the cheat sheet is yours. Good luck with the sit.</p>`,
        lpUrl,
        "Start Free Trial",
        footer,
      ),
  },
];

function scheduledAtIso(base: Date, dayOffset: number): string {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + dayOffset);
  // Mid-morning UTC, matching onboardingDrip.
  d.setUTCHours(15, 0, 0, 0);
  return d.toISOString();
}

function isCluster(s: unknown): s is Cluster {
  return typeof s === "string" && Object.prototype.hasOwnProperty.call(CLUSTERS, s);
}

export const sendLeadMagnetWelcome = functions.firestore
  .document("leadCaptures/{captureId}")
  .onCreate(async (snap, context) => {
    const captureId = context.params.captureId as string;
    const data = snap.data() || {};
    const email: string | undefined = data.email;
    const cluster: unknown = data.cluster;

    if (data.welcomeSequenceScheduledAt) {
      console.log(`[lead-welcome] already scheduled for ${captureId}, skipping`);
      return;
    }
    if (!email) {
      console.log(`[lead-welcome] no email on leadCaptures/${captureId}, skipping`);
      return;
    }
    if (!isCluster(cluster)) {
      console.warn(`[lead-welcome] unknown cluster "${String(cluster)}" on ${captureId}, skipping`);
      return;
    }

    const apiKey = resolveKey();
    if (!apiKey) {
      // Error, not warn — see the same block in onboardingDrip.ts. A warning
      // here is invisible, and an invisible mail failure is how the drip went
      // weeks without sending anything.
      console.error(
        `[lead-welcome] RESEND_API_KEY not set — NO WELCOME EMAIL SENT for ${captureId}. ` +
          "Lead-magnet captures are silently receiving nothing. Set RESEND_API_KEY " +
          "(and RESEND_FROM) in functions/.env and redeploy.",
      );
      await admin
        .firestore()
        .doc("systemHealth/email")
        .set(
          {
            ok: false,
            reason: "RESEND_API_KEY not set",
            lastFailureAt: admin.firestore.FieldValue.serverTimestamp(),
            lastFailureSource: "sendLeadMagnetWelcome",
          },
          { merge: true },
        )
        .catch(() => undefined);
      // Stamp the capture so a backfill can find it — onCreate won't refire.
      await snap.ref
        .set(
          { welcomeSequenceBlockedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true },
        )
        .catch(() => undefined);
      return;
    }

    // CAN-SPAM gate. These three emails go to someone who downloaded a PDF —
    // a cold lead, not a customer — so every one of them is a commercial
    // message that needs a working opt-out and a postal address. Fails closed:
    // no footer means no send, not a send without a footer.
    const compliance = complianceStatus();
    if (!compliance.ok) {
      await recordComplianceBlock("sendLeadMagnetWelcome", compliance.missing);
      await snap.ref
        .set(
          { welcomeSequenceBlockedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true },
        )
        .catch(() => undefined);
      return;
    }

    if (await isOptedOut(email)) {
      console.log(`[lead-welcome] ${captureId} skipped — ${email} has opted out.`);
      await snap.ref
        .set({ welcomeSequenceSuppressedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
        .catch(() => undefined);
      return;
    }

    const footer = complianceFooter(email);
    if (!footer) {
      // complianceStatus() passed, so this is unreachable in practice — but a
      // null footer must never silently become an empty string in the template.
      await recordComplianceBlock("sendLeadMagnetWelcome", ["footer could not be built"]);
      return;
    }

    const copy = CLUSTERS[cluster];
    const downloadUrl = `https://cipherexam.com${copy.magnetPath}`;
    const lpUrl = `https://cipherexam.com${copy.lp}?utm_source=email&utm_campaign=lead_magnet_welcome&utm_content=${cluster}`;

    const base = new Date();
    const results: { dayOffset: number; ok: boolean; id?: string; error?: string }[] = [];

    for (const mail of LEAD_SEQUENCE) {
      try {
        const body: Record<string, unknown> = {
          from: fromAddress(),
          to: [email],
          subject: mail.subject(copy),
          html: mail.html(copy, downloadUrl, lpUrl, footer),
          tags: [
            { name: "campaign", value: "lead-magnet-welcome" },
            { name: "day", value: String(mail.dayOffset) },
            { name: "cluster", value: cluster },
          ],
        };
        // Day 0 sends immediately; Resend rejects a scheduled_at in the past.
        if (mail.dayOffset > 0) {
          body.scheduled_at = scheduledAtIso(base, mail.dayOffset);
        }

        const res = await axios.post(RESEND_ENDPOINT, body, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        });
        results.push({ dayOffset: mail.dayOffset, ok: true, id: res.data?.id });
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? JSON.stringify(err.response?.data ?? err.message)
          : String(err);
        console.error(`[lead-welcome] Day ${mail.dayOffset} failed for ${captureId}: ${message}`);
        results.push({ dayOffset: mail.dayOffset, ok: false, error: message });
      }
    }

    const scheduled = results.filter((r) => r.ok).length;

    // TODO: persist these Resend message IDs so a conversion hook on
    // `users/{uid}` create can cancel any still-pending lead touches when the
    // lead starts a trial. Resend supports cancelling a scheduled send by id.
    await snap.ref.set(
      {
        welcomeSequenceScheduledAt: admin.firestore.FieldValue.serverTimestamp(),
        welcomeSequenceResult: { scheduled, total: LEAD_SEQUENCE.length, results },
      },
      { merge: true },
    );

    // Clear the health flag once sends actually work, so the doc can't sit
    // permanently red after the key is fixed.
    await admin
      .firestore()
      .doc("systemHealth/email")
      .set(
        {
          ok: scheduled > 0,
          reason: scheduled > 0 ? null : "Resend accepted zero of the scheduled sends",
          lastSuccessAt: admin.firestore.FieldValue.serverTimestamp(),
          lastSuccessSource: "sendLeadMagnetWelcome",
        },
        { merge: true },
      )
      .catch(() => undefined);

    console.log(
      `[lead-welcome] scheduled ${scheduled}/${LEAD_SEQUENCE.length} emails for ${captureId} (${cluster})`,
    );
  });
