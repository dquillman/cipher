import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Lead-magnet email capture.
 *
 * Called from the marketing LPs when a visitor submits the lead-magnet form.
 * Writes to Firestore `leadCaptures` and returns a download URL.
 *
 * Cluster-to-PDF mapping is hard-coded for now (3 clusters). When more
 * clusters land, extend `PDF_PATHS`.
 *
 * Future enhancement: trigger a welcome email via Resend/SendGrid. For now
 * the client surfaces the download URL inline on success.
 */

type Cluster = 'pmp' | 'security-plus' | 'shrm-cp';

const PDF_PATHS: Record<Cluster, string> = {
    'pmp': '/lead-magnets/pmp-exam-lens-cheat-sheet.pdf',
    'security-plus': '/lead-magnets/security-plus-pbq-walkthroughs.pdf',
    'shrm-cp': '/lead-magnets/shrm-cp-competency-map.pdf',
};

const VALID_CLUSTERS: readonly Cluster[] = ['pmp', 'security-plus', 'shrm-cp'];

// Clusters whose lead-magnet PDF actually exists in web/public/lead-magnets/.
// Other valid clusters still capture the lead but return no download link, so we
// never hand back a URL that 404s. Add a cluster here once its PDF is published.
const READY_CLUSTERS: readonly Cluster[] = ['pmp'];

function isValidEmail(s: unknown): s is string {
    if (typeof s !== 'string') return false;
    // Permissive — actually-bad emails will bounce on welcome-email send, not at form
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 320;
}

function isValidCluster(s: unknown): s is Cluster {
    return typeof s === 'string' && (VALID_CLUSTERS as readonly string[]).includes(s);
}

interface CaptureLeadInput {
    email?: unknown;
    cluster?: unknown;
    utm?: unknown;
    referrer?: unknown;
}

export const captureLead = functions.https.onCall(async (data: CaptureLeadInput, context) => {
    const email = data.email;
    const cluster = data.cluster;
    const utm = (data.utm && typeof data.utm === 'object') ? data.utm : {};
    const referrer = typeof data.referrer === 'string' ? data.referrer.slice(0, 500) : null;

    if (!isValidEmail(email)) {
        throw new functions.https.HttpsError('invalid-argument', 'A valid email is required.');
    }
    if (!isValidCluster(cluster)) {
        throw new functions.https.HttpsError('invalid-argument', 'cluster must be pmp | security-plus | shrm-cp.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const captureId = `${normalizedEmail}__${cluster}`;
    const captureRef = db.collection('leadCaptures').doc(captureId);

    // Upsert: same email + cluster combination overwrites the prior record's
    // timestamps but never duplicates. This means the same prospect getting
    // the PDF twice is logged once with the most recent UTMs.
    await captureRef.set({
        email: normalizedEmail,
        cluster,
        utm,
        referrer,
        firstCapturedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastCapturedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Aggregated info for later drip-email targeting
        uid: context.auth?.uid ?? null,
        ip: context.rawRequest?.ip ?? null,
        userAgent: context.rawRequest?.headers?.['user-agent'] ?? null,
    }, { merge: true });

    // Bump the "lastCapturedAt" again on the merge (the first set covers initial create)
    await captureRef.update({
        lastCapturedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Lead is captured above regardless. Only return a download link when the
    // cluster's PDF is actually published — otherwise the link would 404.
    if (!READY_CLUSTERS.includes(cluster)) {
        return { ok: true, downloadUrl: null, pending: true };
    }

    const downloadUrl = `https://cipherexam.com${PDF_PATHS[cluster]}`;

    return { ok: true, downloadUrl, pending: false };
});
