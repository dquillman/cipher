import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import type { BudgetEntry } from '../types/budget.ts';

const COL = 'marketing_budget';

export async function saveBudgetEntry(entry: Omit<BudgetEntry, 'id'>): Promise<void> {
  const id = entry.date;
  await setDoc(doc(db, COL, id), { ...entry, id });
}

export async function deleteBudgetEntry(date: string): Promise<void> {
  await deleteDoc(doc(db, COL, date));
}
