import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import type { FunnelEntry } from '../types/funnel.ts';

const COL = 'marketing_funnel';

export async function saveFunnelEntry(entry: Omit<FunnelEntry, 'id'>): Promise<void> {
  const id = entry.date;
  await setDoc(doc(db, COL, id), { ...entry, id });
}

export async function deleteFunnelEntry(date: string): Promise<void> {
  await deleteDoc(doc(db, COL, date));
}
