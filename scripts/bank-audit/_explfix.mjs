import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const PMP = '6kECziMtR1BS3MpABLW5';
const APPLY = process.argv.includes('--apply');

/**
 * Drop only the sentences that cite an option letter; keep everything else.
 *
 * Split only where a terminator is FOLLOWED by a capital or an opening bracket.
 * Splitting on every '.' tore the earned-value questions apart: "SPI = 0.84
 * (behind schedule)" became a sentence beginning "84".
 */
function strip(text) {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z(])/);
  const kept = sentences.filter(s => !/\bOption\s+[A-F]\b/.test(s));
  return kept.join(' ').replace(/\s+/g, ' ').trim();
}

const qs = await db.collection('questions').where('examId','==',PMP).get();
const backup = [], plan = [], tooShort = [];
for (const d of qs.docs) {
  const q = d.data();
  if (q.status === 'quarantined') continue;
  const e = String(q.explanation || '');
  if (!/\bOption\s+[A-F]\b/.test(e)) continue;
  backup.push({ id: d.id, explanation: e });
  const cleaned = strip(e);
  if (cleaned.length < 80) { tooShort.push({ id: d.id, cleaned, full: e }); continue; }
  plan.push({ id: d.id, to: cleaned.length, cleaned });
}
fs.writeFileSync('_pmp-explanations-backup.json', JSON.stringify(backup, null, 2));
console.log('backed up:', backup.length);
console.log('would rewrite:', plan.length, ' left alone:', tooShort.length);
const lens = plan.map(p => p.to).sort((a,b)=>a-b);
console.log('kept-length median:', lens[Math.floor(lens.length/2)], 'min:', lens[0]);
console.log('surviving letter refs:', plan.filter(p => /\bOption\s+[A-F]\b/.test(p.cleaned)).length);
console.log('starts with a bare number (split damage):', plan.filter(p => /^\d/.test(p.cleaned)).length);
console.log('\n--- shortest kept ---\n' + plan.find(p => p.to === lens[0]).cleaned);
const ev = plan.find(p => /CV = EV|SPI|CPI/.test(p.cleaned));
if (ev) console.log('\n--- an earned-value one ---\n' + ev.cleaned);
if (tooShort.length) console.log('\n--- left alone ---\n' + tooShort[0].full.replace(/\s+/g,' ').slice(0,200));

if (APPLY) {
  let n = 0;
  for (let i = 0; i < plan.length; i += 400) {
    const batch = db.batch();
    for (const p of plan.slice(i, i + 400)) { batch.update(db.collection('questions').doc(p.id), { explanation: p.cleaned }); n++; }
    await batch.commit();
  }
  console.log('\nAPPLIED to', n, 'documents.');
}
process.exit(0);
