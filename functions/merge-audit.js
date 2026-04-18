/**
 * Merge audit results back into blooms-classified.csv.
 *
 * Reads blooms-reclassified.csv (output of audit-blooms.js).
 * For every row where changed=YES AND newLevel != ERROR, updates the matching
 * row in blooms-classified.csv with:
 *   - bloomLevel -> newLevel
 *   - confidence -> newConfidence
 *   - rationale  -> newRationale (prefixed with "[audit] ")
 *
 * Writes a backup of the original to blooms-classified.pre-audit.csv.
 *
 * Usage:
 *   node merge-audit.js                 # dry run
 *   node merge-audit.js --commit        # actually update the file
 *   node merge-audit.js --commit --accept-all    # accept every change regardless
 *   node merge-audit.js --commit --min-new-confidence 0.8   # only accept high-confidence audit reclassifications
 */

const fs = require("fs");
const path = require("path");

const CLASSIFIED = path.join(__dirname, "blooms-classified.csv");
const RECLASSIFIED = path.join(__dirname, "blooms-reclassified.csv");
const BACKUP = path.join(__dirname, "blooms-classified.pre-audit.csv");

const args = process.argv.slice(2);
const commit = args.includes("--commit");
const acceptAll = args.includes("--accept-all");
const getFlag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const minNewConfidence = parseFloat(getFlag("--min-new-confidence") || "0");

function parseCsv(raw) {
    let cur = "", inQ = false;
    const tokens = [[]];
    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        if (inQ) {
            if (ch === '"' && raw[i + 1] === '"') { cur += '"'; i++; }
            else if (ch === '"') inQ = false;
            else cur += ch;
        } else {
            if (ch === '"') inQ = true;
            else if (ch === ",") { tokens[tokens.length - 1].push(cur); cur = ""; }
            else if (ch === "\n") { tokens[tokens.length - 1].push(cur); cur = ""; tokens.push([]); }
            else if (ch === "\r") { /* skip */ }
            else cur += ch;
        }
    }
    if (cur.length || tokens[tokens.length - 1].length) tokens[tokens.length - 1].push(cur);
    return tokens.filter(r => r.length > 1 || (r.length === 1 && r[0].length));
}

function escapeCsv(v) {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r"))
        return '"' + s.replace(/"/g, '""') + '"';
    return s;
}

function toRows(grid) {
    const header = grid[0];
    const rows = grid.slice(1).map(r => {
        const o = {};
        header.forEach((h, i) => o[h] = r[i] || "");
        return o;
    });
    return { header, rows };
}

function main() {
    if (!fs.existsSync(CLASSIFIED) || !fs.existsSync(RECLASSIFIED)) {
        console.error(`Need both ${CLASSIFIED} and ${RECLASSIFIED}.`);
        process.exit(1);
    }

    const { header: classifiedHeader, rows: classifiedRows } = toRows(parseCsv(fs.readFileSync(CLASSIFIED, "utf-8")));
    const { rows: auditRows } = toRows(parseCsv(fs.readFileSync(RECLASSIFIED, "utf-8")));

    const byId = new Map(classifiedRows.map(r => [r.id, r]));
    const changesToApply = auditRows.filter(a => {
        if (a.changed !== "YES") return false;
        if (a.newLevel === "ERROR") return false;
        if (parseFloat(a.newConfidence || "0") < minNewConfidence) return false;
        return true;
    });

    const stats = {};
    changesToApply.forEach(a => {
        const key = `${a.oldLevel} -> ${a.newLevel}`;
        stats[key] = (stats[key] || 0) + 1;
    });

    console.log("=== MERGE PLAN ===");
    console.log(`Audit rows total:        ${auditRows.length}`);
    console.log(`Changed in audit:        ${auditRows.filter(a => a.changed === "YES").length}`);
    console.log(`Errored:                 ${auditRows.filter(a => a.newLevel === "ERROR").length}`);
    console.log(`Will apply:              ${changesToApply.length}`);
    console.log(`Min new-confidence:      ${minNewConfidence}`);
    console.log("\nTransitions:");
    Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k.padEnd(28)} ${v}`));

    if (!commit) {
        console.log("\nDRY RUN — nothing changed. Add --commit to write.");
        process.exit(0);
    }

    // Backup
    fs.copyFileSync(CLASSIFIED, BACKUP);
    console.log(`\nBackup: ${BACKUP}`);

    // Apply
    changesToApply.forEach(a => {
        const row = byId.get(a.id);
        if (!row) return;
        row.bloomLevel = a.newLevel;
        row.confidence = a.newConfidence;
        row.rationale = `[audit] ${a.newRationale}`;
    });

    // Rewrite
    const out = [classifiedHeader.join(",")];
    classifiedRows.forEach(r => {
        out.push(classifiedHeader.map(h => escapeCsv(r[h])).join(","));
    });
    fs.writeFileSync(CLASSIFIED, out.join("\n"), "utf-8");

    console.log(`\nApplied ${changesToApply.length} changes to ${CLASSIFIED}.`);
    console.log(`Next: node writeback-blooms.js          # dry-run`);
    console.log(`      node writeback-blooms.js --commit # actually write to Firestore`);
    process.exit(0);
}

main();
