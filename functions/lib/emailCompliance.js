"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complianceFooter = exports.recordOptOut = exports.isOptedOut = exports.recordComplianceBlock = exports.complianceStatus = exports.unsubscribeUrl = exports.unsubscribeToken = exports.normalizeEmail = void 0;
const admin = require("firebase-admin");
const crypto = require("crypto");
/**
 * CAN-SPAM compliance for commercial email.
 *
 * The US CAN-SPAM Act requires every commercial message to carry a working
 * opt-out mechanism and a valid physical postal address, and to honour an
 * opt-out within 10 business days. `examCountdown.ts` already checked
 * `emailOptOut` on the user doc, but the two senders that would actually mail a
 * cold lead — `sendLeadMagnetWelcome` and `scheduleOnboardingDrip` — had no
 * suppression check, no unsubscribe link, and no postal address.
 *
 * That is not a lint-level problem. A lead-magnet post drives strangers into
 * `leadCaptures`, and each capture scheduled three emails to someone who had no
 * way to stop them.
 *
 * FAILS CLOSED. If the postal address or the signing secret is missing, the
 * senders do not "send anyway without a footer" — they refuse and record why.
 * A missing footer is a legal exposure; a missed send is an inconvenience.
 *
 * Required environment (functions/.env):
 *   CIPHER_POSTAL_ADDRESS   e.g. "Code Q LLC, 123 Example St, Bend, OR 97701"
 *   EMAIL_OPTOUT_SECRET     any long random string; signs unsubscribe tokens
 */
/** Leads live in `leadCaptures` and have no user doc, so suppression needs its
 *  own collection keyed by the address itself. */
const OPTOUT_COLLECTION = "emailOptOuts";
function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}
exports.normalizeEmail = normalizeEmail;
function postalAddress() {
    const value = (process.env.CIPHER_POSTAL_ADDRESS || "").trim();
    return value.length > 0 ? value : null;
}
function optOutSecret() {
    const value = (process.env.EMAIL_OPTOUT_SECRET || "").trim();
    // A short secret is a forgeable secret; an attacker who can mint tokens can
    // unsubscribe anyone. Treat a stub value as missing rather than as configured.
    return value.length >= 16 ? value : null;
}
function unsubscribeToken(email) {
    const secret = optOutSecret();
    if (!secret)
        return null;
    return crypto.createHmac("sha256", secret).update(normalizeEmail(email)).digest("hex").slice(0, 32);
}
exports.unsubscribeToken = unsubscribeToken;
function unsubscribeUrl(email) {
    const token = unsubscribeToken(email);
    if (!token)
        return null;
    const address = encodeURIComponent(normalizeEmail(email));
    return `https://cipherexam.com/api/unsubscribe?e=${address}&t=${token}`;
}
exports.unsubscribeUrl = unsubscribeUrl;
/**
 * Whether a compliant commercial email can be sent at all.
 * Returns the specific missing pieces so the log says what to fix.
 */
function complianceStatus() {
    const missing = [];
    if (!postalAddress())
        missing.push("CIPHER_POSTAL_ADDRESS");
    if (!optOutSecret())
        missing.push("EMAIL_OPTOUT_SECRET (min 16 chars)");
    return { ok: missing.length === 0, missing };
}
exports.complianceStatus = complianceStatus;
/** Records the block on systemHealth/email so it surfaces the same way a
 *  missing Resend key does, rather than dying in a log nobody reads. */
async function recordComplianceBlock(source, missing) {
    console.error(`[compliance] ${source} BLOCKED — no email sent. Missing: ${missing.join(", ")}. ` +
        "CAN-SPAM requires a working opt-out and a physical postal address in every " +
        "commercial message. Set these in functions/.env and redeploy.");
    await admin
        .firestore()
        .doc("systemHealth/email")
        .set({
        ok: false,
        reason: `CAN-SPAM compliance not configured: ${missing.join(", ")}`,
        lastFailureAt: admin.firestore.FieldValue.serverTimestamp(),
        lastFailureSource: source,
    }, { merge: true })
        .catch(() => undefined);
}
exports.recordComplianceBlock = recordComplianceBlock;
/** True when this address has opted out and must not be mailed. */
async function isOptedOut(email) {
    var _a;
    const normalized = normalizeEmail(email);
    if (!normalized)
        return true; // no address is not a mailable address
    try {
        const snap = await admin.firestore().collection(OPTOUT_COLLECTION).doc(normalized).get();
        return snap.exists && ((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.optedOut) === true;
    }
    catch (err) {
        // Fail CLOSED. If the suppression list cannot be read we do not know whether
        // this person opted out, and mailing someone who did is the violation.
        console.error(`[compliance] opt-out lookup failed for ${normalized} — suppressing send: ${String(err)}`);
        return true;
    }
}
exports.isOptedOut = isOptedOut;
async function recordOptOut(email, source) {
    const normalized = normalizeEmail(email);
    if (!normalized)
        return;
    await admin
        .firestore()
        .collection(OPTOUT_COLLECTION)
        .doc(normalized)
        .set({
        email: normalized,
        optedOut: true,
        optedOutAt: admin.firestore.FieldValue.serverTimestamp(),
        source,
    }, { merge: true });
}
exports.recordOptOut = recordOptOut;
/**
 * The footer every commercial message must carry.
 * Returns null when compliance is unconfigured — callers must treat that as
 * "do not send", never as "send without a footer".
 */
function complianceFooter(email) {
    const address = postalAddress();
    const url = unsubscribeUrl(email);
    if (!address || !url)
        return null;
    return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 14px">
<p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0">
You are receiving this because you downloaded a free resource from CipherExam.<br>
<a href="${url}" style="color:#64748b">Unsubscribe</a> — one click, no login. Stops future emails within a few days.<br>
${escapeHtml(address)}
</p>`;
}
exports.complianceFooter = complianceFooter;
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
//# sourceMappingURL=emailCompliance.js.map