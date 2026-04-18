import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { DEFAULT_CONFIG, type MarketingConfig } from '../types/config.ts';

const DOC_REF = doc(db, 'marketing_config', 'settings');

export async function getConfig(): Promise<MarketingConfig> {
  const snap = await getDoc(DOC_REF);
  if (snap.exists()) return snap.data() as MarketingConfig;
  await setDoc(DOC_REF, DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

export async function updateConfig(data: Partial<MarketingConfig>): Promise<void> {
  await setDoc(DOC_REF, data, { merge: true });
}
