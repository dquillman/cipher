import { collection, doc, setDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase.ts';
import type { ABTest } from '../types/abtest.ts';
import { abTestSeed } from '../data/abTestSeed.ts';

const COL = 'marketing_ab_tests';

export async function seedABTests(): Promise<void> {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) return;

  for (const test of abTestSeed) {
    const ref = doc(collection(db, COL));
    await setDoc(ref, { ...test, id: ref.id });
  }
}

export async function updateABTest(id: string, data: Partial<ABTest>): Promise<void> {
  await updateDoc(doc(db, COL, id), data);
}
