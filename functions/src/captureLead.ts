import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { enforceRateLimit } from './rateLimit';

const db = admin.firestore();

/**
 * Lead-magnet email capture.
 *
 * Called from the marketing LPs when a visitor submits the lead-magnet form.
 * Writes to Firestore `leadCaptures` and returns a download URL.
 *
 * A cluster can have MORE THAN ONE magnet. Callers may pass an explicit
 * `magnet` id; when they don't, the cluster's default magnet is served, which
 * keeps every existing LP working unchanged.
 *
 * The welcome sequence is sent by `sendLeadMagnetWelcome` (leadMagnetWelcome.ts),
 * which triggers on `leadCaptures/{captureId}` create. Note the doc key is
 * `email__cluster`, NOT `email__magnet` — a person who downloads two PMP
 * magnets is one lead with one cluster interest, and gets one welcome sequence.
 * Second and later downloads still return the file inline; they just don't
 * re-trigger email. That's deliberate: re-triggering would burn the list.
 */

type Cluster = 'pmp' | 'security-plus' | 'shrm-cp';

interface Magnet {
    cluster: Cluster;
    path: string;
    /** False until the PDF is deployed to web/public/lead-magnets/. */
    ready: boolean;
}

// Every magnet, keyed by id. Add a row here when a new PDF ships — and only
// set `ready: true` once the file is actually deployed, or we hand back a 404.
const MAGNETS: Record<string, Magnet> = {
    'pmp-exam-lens-cheat-sheet': {
        cluster: 'pmp',
        path: '/lead-magnets/pmp-exam-lens-cheat-sheet.pdf',
        ready: true,
    },
    'security-plus-pbq-walkthroughs': {
        cluster: 'security-plus',
        path: '/lead-magnets/security-plus-pbq-walkthroughs.pdf',
        ready: true,
    },
    'shrm-cp-competency-map': {
        cluster: 'shrm-cp',
        path: '/lead-magnets/shrm-cp-competency-map.pdf',
        ready: true,
    },
};

// What a caller gets when it sends only `cluster` (every LP today).
const DEFAULT_MAGNET_BY_CLUSTER: Record<Cluster, string> = {
    'pmp': 'pmp-exam-lens-cheat-sheet',
    'security-plus': 'security-plus-pbq-walkthroughs',
    'shrm-cp': 'shrm-cp-competency-map',
};

const VALID_CLUSTERS: readonly Cluster[] = ['pmp', 'security-plus', 'shrm-cp'];

function isValidEmail(s: unknown): s is string {
    if (typeof s !== 'string') return false;
    // Permissive — actually-bad emails will bounce on welcome-email send, not at form
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 320;
}

function isValidCluster(s: unknown): s is Cluster {
    return typeof s === 'string' && (VALID_CLUSTERS as readonly string[]).includes(s);
}

function resolveMagnetId(cluster: Cluster, requested: unknown): string {
    if (typeof requested === 'string' && MAGNETS[requested]?.cluster === cluster) {
        return requested;
    }
    // Unknown or mismatched magnet id falls back to the cluster default rather
    // than erroring — a stale LP should still deliver something useful.
    return DEFAULT_MAGNET_BY_CLUSTER[cluster];
}

interface CaptureLeadInput {
    email?: unknown;
    cluster?: unknown;
    magnet?: unknown;
    utm?: unknown;
    referrer?: unknown;
}

export const captureLead = functions.https.onCall(async (data: CaptureLeadInput, context) => {
    // Publicly callable — cap per-IP so a script can't spam leadCaptures writes.
    await enforceRateLimit('captureLead', context, 15);

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

    const magnetId = resolveMagnetId(cluster, data.magnet);
    const magnet = MAGNETS[magnetId];

    const normalizedEmail = email.trim().toLowerCase();
    const captureId = `${normalizedEmail}__${cluster}`;
    const captureRef = db.collection('leadCaptures').doc(captureId);

    // Upsert: same email + cluster combination updates the prior record but
    // never duplicates. The same prospect getting the PDF twice is logged once
    // with the most recent UTMs — firstCapturedAt is preserved from the
    // original capture.
    await db.runTransaction(async (tx) => {
        const existing = await tx.get(captureRef);
        tx.set(captureRef, {
            email: normalizedEmail,
            cluster,
            utm,
            referrer,
            // Most recent magnet requested, plus the full set this lead has
            // pulled from the cluster. The welcome sequence reads `cluster`;
            // `magnets` is for attribution — which magnet actually converts.
            magnet: magnetId,
            magnets: admin.firestore.FieldValue.arrayUnion(magnetId),
            ...(existing.exists ? {} : { firstCapturedAt: admin.firestore.FieldValue.serverTimestamp() }),
            lastCapturedAt: admin.firestore.FieldValue.serverTimestamp(),
            // Aggregated info for later drip-email targeting
            uid: context.auth?.uid ?? null,
            ip: context.rawRequest?.ip ?? null,
            userAgent: context.rawRequest?.headers?.['user-agent'] ?? null,
        }, { merge: true });
    });

    // Lead is captured above regardless. Only return a download link when the
    // magnet's PDF is actually deployed — otherwise the link would 404.
    if (!magnet.ready) {
        return { ok: true, downloadUrl: null, pending: true, magnet: magnetId };
    }

    const downloadUrl = `https://cipherexam.com${magnet.path}`;

    return { ok: true, downloadUrl, pending: false, magnet: magnetId };
});
