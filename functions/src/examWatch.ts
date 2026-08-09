/**
 * Exam-outline change detection.
 *
 * WHY THIS EXISTS IN THIS SHAPE — read before simplifying it.
 *
 * PMI replaced the PMP Examination Content Outline effective 9 July 2026.
 * CipherExam served a bank built to the retired outline as its DEFAULT for four
 * weeks. The previous version of this checker was running the whole time. It
 * detected the change on 2 August and wrote `status: 'changed'` to a Firestore
 * document that nothing reads. Nobody found out until a manual audit on 7 August.
 *
 * Three defects caused that, and all three are addressed here:
 *
 *   1. DETECTION THAT GOES NOWHERE. A status field is not an alert. Every
 *      transition into `changed`, and every source that cannot be fetched at all,
 *      now emails a human. If the alert cannot be delivered the run FAILS loudly
 *      rather than silently succeeding — a silent watcher is worse than none,
 *      because it manufactures false confidence.
 *   2. A USER-AGENT THE SOURCE BLOCKS. The old checker sent a Googlebot UA.
 *      pmi.org answers that with 403, so the source that ANNOUNCES outline
 *      changes had `lastChangeDetectedAt: never` since the day it was added — it
 *      had never once succeeded, and nothing treated "never succeeded" as
 *      different from "no change". A normal desktop UA fetches it fine.
 *   3. SIGNATURES THAT DON'T TRACK CONTENT. It preferred ETag/Last-Modified,
 *      which CDNs rotate without the document changing (false positives, which
 *      train you to ignore the alert) and omit entirely on some hosts. And it
 *      hashed `JSON.stringify(response.data)`, which is meaningless for a PDF.
 *      We now hash normalised bytes/text and keep an excerpt so an alert can say
 *      what moved instead of just that something did.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as crypto from "crypto";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** pmi.org and several certifying bodies 403 anything that looks like a crawler. */
const BROWSER_UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function resolveKey(): string | null {
    return (
        process.env.RESEND_API_KEY ||
        (functions.config().resend && functions.config().resend.key) ||
        null
    );
}

function fromAddress(): string {
    return process.env.RESEND_FROM || "CipherExam Watch <dave@cipherexam.com>";
}

function alertRecipient(): string {
    return process.env.EXAM_WATCH_ALERT_TO || "dquillman2112@gmail.com";
}

export type SourceStatus = "ok" | "changed" | "unreachable" | "never_fetched" | "reviewed_ok";

export interface CheckOutcome {
    id: string;
    name: string;
    url: string;
    examId?: string;
    examName?: string;
    status: SourceStatus;
    previousStatus?: string;
    httpStatus?: number;
    error?: string;
    /** Only set when we have a previous signature AND the new one differs. */
    changed: boolean;
    /** True when this source has never once been fetched successfully. */
    neverSucceeded: boolean;
    bytes?: number;
    previousBytes?: number;
}

/**
 * Collapses a document to something that only changes when the CONTENT changes.
 * HTML gets scripts/styles/tags/whitespace stripped so a rotating CSRF token or
 * a build hash in a bundle filename doesn't read as an outline revision.
 * Binary (PDF) is hashed as-is.
 */
function normalise(body: Buffer, contentType: string): { hash: string; excerpt: string; bytes: number } {
    const isBinary = /pdf|octet-stream|zip/i.test(contentType);
    if (isBinary) {
        return {
            hash: crypto.createHash("sha256").update(body).digest("hex"),
            excerpt: `(binary ${contentType}, ${body.length} bytes)`,
            bytes: body.length,
        };
    }
    const text = body
        .toString("utf8")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    return {
        hash: crypto.createHash("sha256").update(text).digest("hex"),
        excerpt: text.slice(0, 1200),
        bytes: text.length,
    };
}

/**
 * Has this source ever been fetched successfully?
 *
 * `lastSuccessAt` is written by this module and did not exist in the previous
 * implementation, so a source carried over from it has a signature but no
 * success timestamp. Treating that as "never fetched" would fire a false
 * watcher-blind alert on the first run after deploy — and a monitor that cries
 * wolf on day one is a monitor people mute. A stored signature is proof of a
 * past successful fetch, so accept it as one.
 */
function hasEverSucceeded(s: admin.firestore.DocumentData): boolean {
    return !!s.lastSuccessAt || !!s.lastKnownSignature;
}

async function checkOne(
    doc: admin.firestore.QueryDocumentSnapshot,
): Promise<CheckOutcome> {
    const s = doc.data();
    const base = {
        id: doc.id,
        name: s.name || s.examName || doc.id,
        url: s.url as string,
        examId: s.examId,
        examName: s.examName,
        previousStatus: s.status,
    };

    let res;
    try {
        res = await axios.get(s.url, {
            headers: {
                "User-Agent": BROWSER_UA,
                Accept: "text/html,application/xhtml+xml,application/pdf,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
            responseType: "arraybuffer",
            validateStatus: () => true,
            timeout: 20000,
            maxRedirects: 5,
        });
    } catch (err: any) {
        const neverSucceeded = !hasEverSucceeded(s);
        await doc.ref.update({
            lastCheckedAt: admin.firestore.Timestamp.now(),
            status: neverSucceeded ? "never_fetched" : "unreachable",
            lastErrorCode: null,
            lastErrorMessage: err.message,
            consecutiveFailures: (s.consecutiveFailures || 0) + 1,
        });
        return { ...base, status: neverSucceeded ? "never_fetched" : "unreachable", error: err.message, changed: false, neverSucceeded };
    }

    if (res.status !== 200) {
        // A source that has NEVER been fetched is a broken watcher, not a quiet
        // "needs manual review". That distinction is the whole bug: the PMI
        // updates page sat at 403 indefinitely and read as uneventful.
        const neverSucceeded = !hasEverSucceeded(s);
        await doc.ref.update({
            lastCheckedAt: admin.firestore.Timestamp.now(),
            status: neverSucceeded ? "never_fetched" : "unreachable",
            lastErrorCode: res.status,
            lastErrorMessage: `HTTP ${res.status}`,
            consecutiveFailures: (s.consecutiveFailures || 0) + 1,
        });
        return { ...base, status: neverSucceeded ? "never_fetched" : "unreachable", httpStatus: res.status, changed: false, neverSucceeded };
    }

    const body = Buffer.from(res.data);
    const { hash, excerpt, bytes } = normalise(body, String(res.headers["content-type"] || ""));
    const signature = `sha256:${hash}`;
    const first = !s.lastKnownSignature;
    const changed = !first && signature !== s.lastKnownSignature;

    // `reviewed_ok` survives an unchanged check — a human cleared it and nothing
    // has moved since, so don't downgrade their sign-off to a bare `ok`.
    const status: SourceStatus = changed
        ? "changed"
        : s.status === "reviewed_ok"
          ? "reviewed_ok"
          : "ok";

    await doc.ref.update({
        lastCheckedAt: admin.firestore.Timestamp.now(),
        lastSuccessAt: admin.firestore.Timestamp.now(),
        status,
        lastKnownSignature: signature,
        lastKnownExcerpt: excerpt,
        lastKnownBytes: bytes,
        ...(changed
            ? {
                  lastChangeDetectedAt: admin.firestore.Timestamp.now(),
                  previousExcerpt: s.lastKnownExcerpt || null,
                  previousBytes: s.lastKnownBytes ?? null,
              }
            : {}),
        lastErrorCode: null,
        lastErrorMessage: null,
        consecutiveFailures: 0,
    });

    return { ...base, status, changed, neverSucceeded: false, bytes, previousBytes: s.lastKnownBytes };
}

export function buildAlert(changed: CheckOutcome[], broken: CheckOutcome[]): { subject: string; html: string } {
    const parts: string[] = [];

    if (changed.length) {
        parts.push(
            `<h2 style="margin:0 0 8px;font-size:18px">Outline changed — ${changed.length} source${changed.length > 1 ? "s" : ""}</h2>`,
            `<p style="margin:0 0 16px;color:#334155">A certifying body has published a change. Until someone confirms what moved, assume the matching question bank is stale.</p>`,
            "<ul style='padding-left:18px;color:#0f172a'>",
            ...changed.map(
                (c) =>
                    `<li style="margin-bottom:10px"><strong>${c.examName || c.name}</strong><br>` +
                    `<a href="${c.url}" style="color:#4f46e5">${c.url}</a><br>` +
                    `<span style="color:#64748b;font-size:13px">content size ${c.previousBytes ?? "?"} → ${c.bytes ?? "?"}${c.examId ? ` · bank <code>${c.examId}</code>` : ""}</span></li>`,
            ),
            "</ul>",
        );
    }

    if (broken.length) {
        parts.push(
            `<h2 style="margin:20px 0 8px;font-size:18px">Watcher blind — ${broken.length} source${broken.length > 1 ? "s" : ""}</h2>`,
            `<p style="margin:0 0 16px;color:#334155">These cannot be fetched, so they are <em>not</em> being monitored. A source that has never succeeded has been silently blind since it was added.</p>`,
            "<ul style='padding-left:18px;color:#0f172a'>",
            ...broken.map(
                (b) =>
                    `<li style="margin-bottom:10px"><strong>${b.examName || b.name}</strong>` +
                    `${b.neverSucceeded ? ' <span style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:3px;font-size:12px">NEVER FETCHED</span>' : ""}<br>` +
                    `<a href="${b.url}" style="color:#4f46e5">${b.url}</a><br>` +
                    `<span style="color:#64748b;font-size:13px">${b.httpStatus ? `HTTP ${b.httpStatus}` : b.error || "unreachable"}</span></li>`,
            ),
            "</ul>",
        );
    }

    const subject = changed.length
        ? `[CipherExam] Exam outline changed — ${changed.map((c) => c.examName || c.name).join(", ")}`
        : `[CipherExam] Exam watcher blind on ${broken.length} source${broken.length > 1 ? "s" : ""}`;

    return {
        subject,
        html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;max-width:640px">${parts.join(
            "\n",
        )}<p style="margin-top:24px;color:#64748b;font-size:13px">Weekly check. Sources live in the <code>exam_update_sources</code> collection.</p></div>`,
    };
}

/**
 * Runs every source, then alerts on anything that changed or that we cannot see.
 * Throws if there is something to report and the alert could not be sent — a
 * watcher that fails to notify must not report success.
 */
export const performExamUpdateCheck = async (): Promise<CheckOutcome[]> => {
    const all = await db().collection("exam_update_sources").get();
    // A superseded source is disabled rather than deleted: keeping the document
    // preserves its history, and deleting monitoring is never the safe default.
    const snap = { docs: all.docs.filter((d) => d.data().disabled !== true), empty: false } as { docs: admin.firestore.QueryDocumentSnapshot[]; empty: boolean };
    snap.empty = snap.docs.length === 0;
    if (snap.empty) {
        console.warn("[examWatch] no sources registered — nothing is being monitored");
        return [];
    }

    const outcomes = await Promise.all(snap.docs.map((d) => checkOne(d)));

    const changed = outcomes.filter((o) => o.changed);
    const broken = outcomes.filter((o) => o.status === "unreachable" || o.status === "never_fetched");

    console.log(
        `[examWatch] ${outcomes.length} checked · ${changed.length} changed · ${broken.length} unreachable ` +
            `(${broken.filter((b) => b.neverSucceeded).length} never fetched)`,
    );

    if (!changed.length && !broken.length) return outcomes;

    const apiKey = resolveKey();
    if (!apiKey) {
        // Deliberately loud. The failure this whole module exists to prevent is a
        // detection that nobody sees, and an unsent alert is exactly that.
        const msg =
            `[examWatch] ${changed.length} change(s) and ${broken.length} unreachable source(s) detected ` +
            `but RESEND_API_KEY is not set, so NO ALERT WAS SENT.`;
        console.error(msg);
        throw new Error(msg);
    }

    const { subject, html } = buildAlert(changed, broken);
    await sendAlert(subject, html, apiKey);
    console.log(`[examWatch] alert sent to ${alertRecipient()}: ${subject}`);
    return outcomes;
};

/** The single Resend call. Exported so it can be exercised without waiting for
 *  a real outline change — an alert path that has never sent is not a verified
 *  alert path, and that is the precise failure this module exists to prevent. */
export async function sendAlert(subject: string, html: string, apiKey: string): Promise<void> {
    await axios.post(
        RESEND_ENDPOINT,
        {
            from: fromAddress(),
            to: [alertRecipient()],
            subject,
            html,
            tags: [{ name: "campaign", value: "exam-watch" }],
        },
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, timeout: 15000 },
    );
}


/** A monitored blueprint URL, one per certification we sell. */
export interface ExamSourceSeed {
    name: string;
    url: string;
    type: string;
    examId: string;
    examName: string;
    notes: string;
}

// One source per certification we sell. Previously only PMP was watched —
// the other nine banks had no monitoring at all, so an outline change in any
// of them was undetectable by construction.
//
// `examId` links a source to the bank it threatens, so an alert can name the
// content that just went stale instead of only naming a URL.
export const EXAM_SOURCES: ExamSourceSeed[] = [
    {
        name: "PMI PMP Examination Content Outline",
        // The 2026 outline lives at a DIFFERENT path than the 2021 one. The old
        // entry watched .../pmp-examination-content-outline.pdf, which is the
        // superseded document — it would have kept reporting "no change" on a
        // file PMI had stopped updating.
        url: "https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/new-pmp-examination-content-outline-2026.pdf",
        type: "pdf",
        examId: "6kECziMtR1BS3MpABLW5",
        examName: "PMP",
        notes: "Authoritative blueprint. PMI builds the exam from the ECO, not the PMBOK Guide.",
    },
    // NOTE: PMI's HTML exam-updates page (/certifications/project-management-pmp/new-exam)
    // is deliberately NOT registered. It returns 403 to any server-side fetch
    // regardless of user-agent, so it could only ever sit in a permanent
    // "watcher blind" state — a standing false alarm is how an alert stream
    // becomes something people mute. The ECO PDF above IS the blueprint PMI
    // builds the exam from, and it fetches cleanly, so it is the real signal.
    {
        name: "PMI PgMP Examination Content Outline",
        url: "https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/program-management-professional-examination-content-outline.pdf",
        type: "pdf",
        examId: "bF7IQUrKjbP2KLwiSNqt",
        examName: "PgMP",
        notes: "The PgMP ECO itself. Verified 1.3 MB PDF; pmi.org HTML pages 403 server-side fetches, PDFs do not.",
    },
    {
        name: "CompTIA Security+ Exam Objectives",
        url: "https://www.comptia.org/certifications/security",
        type: "web",
        examId: "79cuGMNydTwDMhyiDjry",
        examName: "Security+",
        notes: "CompTIA refreshes roughly every three years and publishes retirement dates.",
    },
    {
        name: "CompTIA Network+ Exam Objectives",
        url: "https://www.comptia.org/certifications/network",
        type: "web",
        examId: "gp6QwBz0FXFIntLSQSYr",
        examName: "Network+",
        notes: "Config claims N10-008; the marketing ticker claims N10-009. Under audit.",
    },
    {
        name: "CompTIA A+ Exam Objectives",
        url: "https://www.comptia.org/certifications/a",
        type: "web",
        examId: "cxBsVz8AVaocdEYbgSMA",
        examName: "A+ Core 2",
        notes: "Core 1/Core 2 series roll together; a series bump retires both halves.",
    },
    {
        name: "Scrum Guide",
        url: "https://scrumguides.org/scrum-guide.html",
        type: "web",
        examId: "IpECw0XAtBkgD1HyvYas",
        examName: "CSM",
        notes: "The 2020 revision is the current one; the guide is the CSM's source of truth.",
    },
    {
        name: "SHRM Body of Applied Skills and Knowledge (BASK)",
        url: "https://www.shrm.org/credentials/certification/exam-preparation/bask",
        type: "web",
        examId: "bpfawZDj3qalhoU4mdd3",
        examName: "SHRM-CP",
        notes: "BASK is revised periodically and drives the exam blueprint.",
    },
    {
        name: "ASQ Six Sigma Green Belt Body of Knowledge",
        url: "https://www.asq.org/cert/resource/pdf/certification/2022-SSGB-BoK.pdf",
        type: "pdf",
        examId: "XGfL6RE2ls7cokP2tqMa",
        examName: "Six Sigma Green Belt",
        notes: "The 2022 CSSGB Body of Knowledge PDF. asq.org 403s HTML but serves this.",
    },
    {
        name: "IIA CIA Exam Syllabus",
        url: "https://www.theiia.org/en/certifications/cia/",
        type: "web",
        examId: "dtgTymjijqUr4NEIHbE1",
        examName: "CIA Part 1",
        notes: "Global Internal Audit Standards took effect January 2025; syllabus follows.",
    },
    {
        name: "PayrollOrg CPP Content Outline",
        url: "https://info.payroll.org/pdfs/certification/CPP-KSA-Outline-09-28-2019.pdf",
        type: "pdf",
        examId: "Vs3aNmifAJc9bYRFCxXc",
        examName: "CPP",
        notes: "The CPP KSA content outline PDF. Currently the 2019 edition; a new outline takes effect 5 Sep 2026, so expect this to change.",
    },
    {
        name: "PeopleCert ITIL 4 Foundation",
        url: "https://www.peoplecert.org/ways-to-get-certified/itil-4-foundation",
        type: "web",
        examId: "6FKeXlV2dzv4I03tewcU",
        examName: "ITIL 4 Foundation",
        notes: "Administered by PeopleCert; Axelos attribution may be outdated.",
    },
];

/** Lazy so importing this module never races admin.initializeApp(). */
function db(): admin.firestore.Firestore {
    return admin.firestore();
}
