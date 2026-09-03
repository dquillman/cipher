import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const APPLY = process.argv.includes('--apply');

const BAD = [
  ['DHYEO5Bi2mYKeFmK7qnO', 'key says Day 25; 10+15+8 = Day 33. Explanation contains the author scratch-work "Wait - re-reading" and concludes Day 33, i.e. option B. Stem also claims foundation and rough-in run in parallel, which its own dependency chain forbids.'],
  ['GFUcgh2ukrCkq0JzMmKg', 'the PMBOK EAC for both trends continuing is 330000 + 200000/(0.909*0.95) = $561,579, which is not among the options. Key $578,947 is BAC/(CPI*SPI), not a PMBOK formula, and the explanation mislabels 0.864 as CPI.'],
  ['IWdVsn2uiClUGfkX4AzS', 'key A says do not change the cost baseline; PMBOK 6th 7.3.3.1 requires an approved change adding the management reserve draw to the baseline, which is option C. The item explanation itself says the baseline may be updated through a change request.'],
  ['FhKpmDgVOAlrS4ccibNL', 'two defensible answers with no tiebreaker in the stem: crash at a certain $25,000 vs fast-track at EMV $12,000. The explanation concedes fast-tracking has the lower expected cost, then keys crash on a risk tolerance the stem never states.'],
  ['H9hYk13EtAgmHmFZ0KQh', 'keyed Segregation of Duties for architectural tier segregation. SoD is a process control over people; the explanation gives that definition and so disproves the key. Defense in depth is offered and is the defensible answer.'],
  ['7ncl0U3b2lwy3HnORakH', 'keys "remove redundant security layers", which teaches the opposite of defense in depth and contradicts two other active items in the same bank and domain that key layering and integration.'],
  ['INFAEjaIWyZcJG50OzJs', 'the explanation argues approval must follow testing, while the scored order places change-advisory-board approval before testing. Following the explanation is marked wrong.'],
  ['NJttvsHX2ZKtpIasG4vU', 'forced binary with two defensible answers: the row keys Integrity for password storage while the explanation defends it on confidentiality grounds, and the same table uses Confidentiality for protecting stored data.'],
  ['SqZmn5ZEfYQHVB0IKFQX', 'non-unique pairing: security awareness training and daily log review are both people-executed, so Administrative and Operational can be legitimately swapped. Also uses the SY0-601 term Administrative where SY0-701 uses Managerial.'],
  ['BfVp6Wa3JCPlMt5ZwJdv', 'keys a security guard Preventive and bollards Deterrent, the reverse of the common teaching, so a consistently-reasoning candidate gets exactly one row wrong.'],
  ['u3XSKs1D9NCQh3S1C0Hf', 'stem says a vulnerability is detected; key isolates the host and the explanation presumes exploitation the stem never states. The same bank keys assess-first on equivalent items.'],
];

const rows = [];
for (const [id, reason] of BAD) {
  const ref = db.collection('questions').doc(id);
  const d = await ref.get();
  if (!d.exists) { console.log(id, 'MISSING - skipped'); continue; }
  const q = d.data();
  rows.push({ id, examId: q.examId, alreadyQuarantined: q.status === 'quarantined', reason });
  if (APPLY && q.status !== 'quarantined') {
    await ref.update({ status: 'quarantined', quarantineReason: reason, quarantinedAt: new Date().toISOString() });
  }
}
fs.writeFileSync('_round7-quarantine.json', JSON.stringify(rows, null, 2));
console.log((APPLY ? 'QUARANTINED' : 'would quarantine') + ':', rows.filter(r => !r.alreadyQuarantined).length, 'of', rows.length);
process.exit(0);
