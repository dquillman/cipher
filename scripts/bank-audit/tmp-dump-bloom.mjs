// READ ONLY - no writes.
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'node:fs';

if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SEC = '79cuGMNydTwDMhyiDjry';
const NET = 'N5mrEby0gKLFs1y88DpM';
const OUT = 'C:/Users/daveq/AppData/Local/Temp/claude/G--Users-daveq-cipher-marketing/735a7e19-bb0c-4846-aec5-b522807d0874/scratchpad/';

for (const [name, examId] of [['sec', SEC], ['net', NET]]) {
  const snap = await db.collection('questions').where('examId', '==', examId).get();
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`${name}: ${rows.length} docs`);
  if (rows.length) console.log(`${name} keys:`, Object.keys(rows[0]).join(', '));
  const statuses = {};
  const types = {};
  for (const r of rows) { statuses[r.status ?? '(none)'] = (statuses[r.status ?? '(none)'] || 0) + 1; types[r.type ?? '(none)'] = (types[r.type ?? '(none)'] || 0) + 1; }
  console.log(`${name} status:`, JSON.stringify(statuses), 'types:', JSON.stringify(types));
  writeFileSync(OUT + name + '-raw.json', JSON.stringify(rows, null, 1));
}
