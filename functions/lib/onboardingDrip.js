"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleOnboardingDrip = exports.DRIP_SEQUENCE = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const emailCompliance_1 = require("./emailCompliance");
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
function resolveKey() {
    return (process.env.RESEND_API_KEY ||
        (functions.config().resend && functions.config().resend.key) ||
        null);
}
function fromAddress() {
    // Must be a Resend-verified sending domain. Override via env in prod.
    return process.env.RESEND_FROM || "Dave at CipherExam <dave@cipherexam.com>";
}
const CTA = "https://cipherexam.com/app";
function shell(inner, footer, cta = { href: CTA, label: "Open CipherExam" }) {
    return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#0f172a;max-width:560px">
${inner}
<p style="margin-top:28px"><a href="${cta.href}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${cta.label}</a></p>
<p style="color:#64748b;font-size:13px;margin-top:24px">— Dave, CipherExam</p>
${footer}
</div>`;
}
/**
 * The Day 4-7 sequence. Day 0/3/6 are deliberately omitted (manual founder
 * emails). Themes map to founder-email-replies.json keys.
 */
exports.DRIP_SEQUENCE = [
    {
        dayOffset: 4,
        theme: "loved-trap-framing",
        subject: "The wrong answers are the whole game",
        html: ({ firstName, footer }) => shell(`<p>Hi ${firstName},</p>
<p>Most prep tools tell you the right answer. The exam already gave you four plausible ones — your problem is the three that <em>look</em> right.</p>
<p>Every CipherExam explanation walks the traps: why each wrong option is tempting, and the frame the test-writer is actually grading. That's the part that makes the exam stop feeling like a trick.</p>`, footer),
    },
    {
        dayOffset: 5,
        theme: "skeptical-of-ai",
        subject: "Why our explanations aren't just ChatGPT",
        html: ({ firstName, footer }) => shell(`<p>Hi ${firstName},</p>
<p>Fair question we hear a lot: isn't this just an LLM wrapper?</p>
<p>No. Every question is Bloom's-classified and run through exam-specific trap detection, so the explanation targets the exact reasoning error the option was designed to catch — not a generic summary. It's the difference between "here's the answer" and "here's why you'd have missed it."</p>`, footer),
    },
    {
        dayOffset: 6,
        theme: "pricing-confusion",
        subject: "What a retake actually costs",
        html: ({ firstName, footer }) => shell(`<p>Hi ${firstName},</p>
<p>Pricing is simple: $19/month. The 14-day trial never charges a card.</p>
<p>Worth the comparison: a single exam retake usually runs several hundred dollars and weeks of re-study. CipherExam is built to get you through on the first sit by fixing the reasoning gaps, not just the knowledge gaps.</p>`, footer),
    },
    {
        dayOffset: 13,
        theme: "credibility",
        subject: "Your trial ends tomorrow",
        html: ({ firstName, footer }) => shell(`<p>Hi ${firstName},</p>
<p>Your free trial wraps tomorrow. If the adaptive routing has been sending you back to your weakest domain — that's the whole point; it's where the score actually moves.</p>
<p>After tomorrow you keep a daily quiz and everything you have already done. Pro is $19/month for unlimited practice, the full timed mocks and the domain breakdown.</p>`, footer, 
        // The generic "Start Free Trial" button was wrong on every drip email --
        // they all go to people whose trial is already running -- and worst here,
        // where the action being asked for is to subscribe.
        { href: "https://cipherexam.com/app/pricing", label: "See Pro pricing" }),
    },
];
function scheduledAtIso(base, dayOffset) {
    const d = new Date(base.getTime());
    d.setUTCDate(d.getUTCDate() + dayOffset);
    // Deliver mid-morning UTC rather than exactly at signup time.
    d.setUTCHours(15, 0, 0, 0);
    return d.toISOString();
}
exports.scheduleOnboardingDrip = functions.firestore
    .document("users/{uid}")
    .onCreate(async (snap, context) => {
    var _a, _b, _c;
    const uid = context.params.uid;
    const data = snap.data() || {};
    const email = data.email;
    const firstName = (typeof data.displayName === "string" && data.displayName.trim().split(" ")[0]) ||
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
        // console.ERROR, not warn. This was console.warn until 2026-08-06 and the
        // drip sent nothing for weeks with nobody noticing — a warning in Cloud
        // Logging is functionally invisible. Error level surfaces in Firebase
        // error reporting and can be alerted on.
        console.error(`[drip] RESEND_API_KEY not set — NO ONBOARDING EMAIL SENT for ${uid}. ` +
            "Every signup is silently receiving nothing. Set RESEND_API_KEY " +
            "(and RESEND_FROM) in functions/.env and redeploy.");
        // Queryable health state so a dashboard can surface this without anyone
        // reading logs. Never allowed to break the trigger.
        await admin
            .firestore()
            .doc("systemHealth/email")
            .set({
            ok: false,
            reason: "RESEND_API_KEY not set",
            lastFailureAt: admin.firestore.FieldValue.serverTimestamp(),
            lastFailureSource: "scheduleOnboardingDrip",
        }, { merge: true })
            .catch(() => undefined);
        // Stamp the user so backfillOnboardingDrip can find them once the key
        // is set — this trigger is onCreate and will never fire for them again.
        await snap.ref
            .set({ onboardingDripBlockedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
            .catch(() => undefined);
        return;
    }
    // CAN-SPAM gate — same contract as sendLeadMagnetWelcome. These are
    // commercial messages and need a working opt-out plus a postal address.
    // Fails closed: no footer means no send.
    const compliance = (0, emailCompliance_1.complianceStatus)();
    if (!compliance.ok) {
        await (0, emailCompliance_1.recordComplianceBlock)("scheduleOnboardingDrip", compliance.missing);
        await snap.ref
            .set({ onboardingDripBlockedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
            .catch(() => undefined);
        return;
    }
    // A signup can already be on the suppression list — someone who downloaded
    // a magnet, unsubscribed, then started a trial later. Honouring the opt-out
    // is the whole point of keeping it.
    if (await (0, emailCompliance_1.isOptedOut)(email)) {
        console.log(`[drip] ${uid} skipped — ${email} has opted out.`);
        await snap.ref
            .set({ onboardingDripSuppressedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
            .catch(() => undefined);
        return;
    }
    const footer = (0, emailCompliance_1.complianceFooter)(email, 'signup');
    if (!footer) {
        await (0, emailCompliance_1.recordComplianceBlock)("scheduleOnboardingDrip", ["footer could not be built"]);
        return;
    }
    const base = new Date(); // signup time
    const results = [];
    for (const mail of exports.DRIP_SEQUENCE) {
        try {
            const res = await axios_1.default.post(RESEND_ENDPOINT, {
                from: fromAddress(),
                to: [email],
                subject: mail.subject,
                html: mail.html({ firstName, footer }),
                scheduled_at: scheduledAtIso(base, mail.dayOffset),
                tags: [
                    { name: "campaign", value: "onboarding-drip" },
                    { name: "day", value: String(mail.dayOffset) },
                    { name: "theme", value: mail.theme },
                ],
            }, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                timeout: 15000,
            });
            results.push({ dayOffset: mail.dayOffset, ok: true, id: (_a = res.data) === null || _a === void 0 ? void 0 : _a.id });
        }
        catch (err) {
            const message = axios_1.default.isAxiosError(err)
                ? JSON.stringify((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : err.message)
                : String(err);
            console.error(`[drip] Day ${mail.dayOffset} schedule failed for ${uid}: ${message}`);
            results.push({ dayOffset: mail.dayOffset, ok: false, error: message });
        }
    }
    const scheduled = results.filter((r) => r.ok).length;
    await admin
        .firestore()
        .doc(`users/${uid}`)
        .set({
        onboardingDripScheduledAt: admin.firestore.FieldValue.serverTimestamp(),
        onboardingDripResult: { scheduled, total: exports.DRIP_SEQUENCE.length, results },
    }, { merge: true });
    // Clear the health flag once sends actually work.
    await admin
        .firestore()
        .doc("systemHealth/email")
        .set({
        ok: scheduled > 0,
        reason: scheduled > 0 ? null : "Resend accepted zero of the scheduled sends",
        lastSuccessAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSuccessSource: "scheduleOnboardingDrip",
    }, { merge: true })
        .catch(() => undefined);
    console.log(`[drip] scheduled ${scheduled}/${exports.DRIP_SEQUENCE.length} emails for ${uid}`);
});
//# sourceMappingURL=onboardingDrip.js.map