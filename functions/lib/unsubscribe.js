"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsubscribe = void 0;
const functions = require("firebase-functions");
const emailCompliance_1 = require("./emailCompliance");
/**
 * One-click unsubscribe.
 *
 * CAN-SPAM requires the opt-out to work without the recipient creating an
 * account, logging in, or explaining themselves, and to keep working for at
 * least 30 days after the message was sent. So this is a plain GET with no
 * auth: the link in the footer is the whole mechanism.
 *
 * The token is an HMAC of the address, which stops someone enumerating
 * addresses and unsubscribing other people — the link only works for the
 * address it was minted for.
 *
 * Deliberately idempotent and always-affirmative: unsubscribing twice, or
 * unsubscribing an address that was never on the list, both return "you're
 * unsubscribed". Telling a visitor "that address isn't in our system" would
 * turn this endpoint into a membership oracle.
 */
exports.unsubscribe = functions
    // Public by necessity, and declared in code so a redeploy cannot quietly
    // revoke it. New HTTP functions deploy PRIVATE by default — the first deploy
    // of this one returned 403, which would have meant every unsubscribe link in
    // every sent email was dead while the emails still went out. That is a worse
    // failure than not sending at all, because the recipient has already been
    // mailed and now cannot stop it.
    .runWith({ invoker: "public" })
    .https.onRequest(async (req, res) => {
    const email = (0, emailCompliance_1.normalizeEmail)(String(req.query.e || ""));
    const token = String(req.query.t || "");
    const page = (heading, body, status) => {
        res.status(status).set("Content-Type", "text/html; charset=utf-8").send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${heading} · CipherExam</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:48px 20px">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:32px">
<h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
<p style="line-height:1.6;color:#475569;margin:0">${body}</p>
<p style="margin-top:24px"><a href="https://cipherexam.com" style="color:#4f46e5">Back to CipherExam</a></p>
</div></body></html>`);
    };
    if (!email || !token) {
        page("Link incomplete", "That unsubscribe link is missing information. Reply to any of our emails and we will remove you by hand.", 400);
        return;
    }
    const expected = (0, emailCompliance_1.unsubscribeToken)(email);
    if (!expected) {
        // Compliance is unconfigured, so no valid token could ever have been minted.
        console.error("[unsubscribe] EMAIL_OPTOUT_SECRET not set — cannot verify opt-out links.");
        page("Something went wrong", "We could not process that just now. Reply to any of our emails and we will remove you by hand.", 500);
        return;
    }
    // Constant-time compare so the endpoint does not leak token bytes by timing.
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    const valid = a.length === b.length &&
        (await Promise.resolve().then(() => require("crypto"))).timingSafeEqual(a, b);
    if (!valid) {
        page("Link not recognised", "That unsubscribe link is not valid. Reply to any of our emails and we will remove you by hand.", 400);
        return;
    }
    try {
        await (0, emailCompliance_1.recordOptOut)(email, "one-click-unsubscribe");
    }
    catch (err) {
        console.error(`[unsubscribe] failed to record opt-out for ${email}: ${String(err)}`);
        page("Something went wrong", "We could not process that just now. Reply to any of our emails and we will remove you by hand.", 500);
        return;
    }
    console.log(`[unsubscribe] opted out ${email}`);
    page("You're unsubscribed", "You will not receive any more marketing email from CipherExam. If you have an account, this does not affect service messages about it.", 200);
});
//# sourceMappingURL=unsubscribe.js.map