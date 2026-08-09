/**
 * Fetch every registered exam source once and report what actually happened.
 *
 * This exists because "the watcher is fixed" is a claim, not a fact, until
 * something has watched. The previous implementation ran weekly for months
 * while one of its two sources had never once been fetched successfully — and
 * nothing distinguished that from "nothing changed". Proving each URL resolves
 * is the difference between a monitor and a decoration.
 *
 * READ-ONLY BY DEFAULT: it fetches every source and prints the result without
 * touching Firestore. With --apply it runs the real check, which writes content
 * signatures (establishing the baseline future runs compare against) and emails
 * if anything looks changed or unreachable.
 *
 *   node scripts/check-exam-sources.js           # fetch + report, no writes
 *   node scripts/check-exam-sources.js --apply   # real run: baselines + alert
 *
 * Run from functions/. Requires `npm run build`.
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const axios = require("axios");

const APPLY = process.argv.includes("--apply");

const BROWSER_UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: "exam-coach-ai-platform",
});
const db = admin.firestore();

(async () => {
    const snap = await db.collection("exam_update_sources").get();
    const active = snap.docs.filter((d) => d.data().disabled !== true);
    console.log(
        `\n${active.length} active source(s)` +
            (snap.size - active.length ? `, ${snap.size - active.length} disabled (skipped)` : "") +
            "\n",
    );

    if (APPLY) {
        // Delegate to the real implementation so this proves the deployed code
        // path, not a reimplementation of it that could pass while that fails.
        const { performExamUpdateCheck } = require(path.join(__dirname, "..", "lib", "examWatch.js"));
        console.log("Running the real performExamUpdateCheck (writes baselines, may email)...\n");
        const outcomes = await performExamUpdateCheck();
        for (const o of outcomes) {
            const mark = o.status === "ok" || o.status === "reviewed_ok" ? "OK  " : o.changed ? "CHG " : "FAIL";
            console.log(`  ${mark} ${(o.examName || o.name).padEnd(24)} ${o.status}`);
        }
        const bad = outcomes.filter((o) => o.status === "unreachable" || o.status === "never_fetched");
        console.log(`\n${outcomes.length} checked, ${bad.length} unreachable.`);
        process.exit(bad.length ? 1 : 0);
    }

    let ok = 0;
    const failures = [];
    for (const d of active) {
        const s = d.data();
        let line;
        try {
            const res = await axios.get(s.url, {
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
            const kb = Math.round(Buffer.from(res.data).length / 1024);
            if (res.status === 200) {
                ok++;
                line = `  OK   ${String(s.examName || "").padEnd(22)} ${String(res.status)}  ${String(kb).padStart(5)} KB  ${s.name}`;
            } else {
                failures.push({ name: s.name, url: s.url, why: `HTTP ${res.status}` });
                line = `  FAIL ${String(s.examName || "").padEnd(22)} ${res.status}          ${s.name}`;
            }
        } catch (e) {
            failures.push({ name: s.name, url: s.url, why: e.message });
            line = `  FAIL ${String(s.examName || "").padEnd(22)} ERR         ${s.name}  (${e.message})`;
        }
        console.log(line);
    }

    console.log(`\n${ok}/${active.length} fetched successfully.`);
    if (failures.length) {
        console.log(`\n${failures.length} source(s) the watcher cannot see:`);
        failures.forEach((f) => console.log(`  - ${f.name}\n      ${f.url}\n      ${f.why}`));
        console.log(
            `\nA source that cannot be fetched is not being monitored. Fix the URL\n` +
                `(or confirm the body blocks automated access) before relying on this.`,
        );
    }
    console.log(`\nNo writes were made. Use --apply to establish signature baselines.`);
    process.exit(failures.length ? 1 : 0);
})().catch((e) => {
    console.error("FAILED:", e.message);
    process.exit(1);
});
