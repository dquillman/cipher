/**
 * READ ONLY. Counts every question by exam and by `source`, and flags items
 * that contain none of their exam's domain vocabulary.
 *
 * Run:  node audit-sources.mjs
 * Out:  console table + bank-audit-report.json
 */
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'node:fs';
import { EXAM_VOCAB } from './vocab.mjs';

if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const snap = await db.collection('questions').get();
console.log(`Read ${snap.size} question documents.\n`);

const byExam = new Map();

for (const doc of snap.docs) {
    const q = doc.data();
    const examId = q.examId ?? '(no examId)';
    if (!byExam.has(examId)) {
        byExam.set(examId, { examId, total: 0, bySource: {}, offTopic: [], hasVocab: false });
    }
    const bucket = byExam.get(examId);
    bucket.total++;

    const source = q.source ?? '(none)';
    bucket.bySource[source] = bucket.bySource[source] ?? { total: 0, offTopic: 0 };
    bucket.bySource[source].total++;

    const vocabEntry = EXAM_VOCAB[examId];
    if (!vocabEntry) continue;
    bucket.hasVocab = true;
    bucket.name = vocabEntry[0];

    // Matching and PBQ items keep their content outside stem/options, so a
    // stem scan cannot judge them. Skip rather than report a false positive.
    if (q.type === 'matching' || q.type === 'pbq') continue;

    const haystack = [q.stem ?? '', ...(q.options ?? [])].join(' ');
    if (!vocabEntry[1].test(haystack)) {
        bucket.bySource[source].offTopic++;
        bucket.offTopic.push({ id: doc.id, source, domain: q.domain ?? '', stem: (q.stem ?? '').slice(0, 140) });
    }
}

const report = [...byExam.values()].sort((a, b) => b.total - a.total);

for (const b of report) {
    const label = b.name ? `${b.name}  [${b.examId}]` : `[${b.examId}]  (no vocabulary configured — counts only)`;
    console.log(`\n=== ${label}`);
    console.log(`    ${b.total} questions`);
    for (const [src, s] of Object.entries(b.bySource).sort((x, y) => y[1].total - x[1].total)) {
        const pct = b.hasVocab ? `  ${String(Math.round((100 * s.offTopic) / s.total)).padStart(3)}% off-topic (${s.offTopic})` : '';
        console.log(`      ${String(s.total).padStart(4)}  ${src.padEnd(34)}${pct}`);
    }
    if (b.hasVocab) {
        console.log(`    -> ${b.offTopic.length} of ${b.total} contain no domain vocabulary (${Math.round((100 * b.offTopic.length) / b.total)}%)`);
    }
}

writeFileSync('bank-audit-report.json', JSON.stringify(report, null, 2));
console.log('\nWrote bank-audit-report.json');
console.log('Add exam ids to EXAM_VOCAB in vocab.mjs to score the banks listed as "counts only".');
