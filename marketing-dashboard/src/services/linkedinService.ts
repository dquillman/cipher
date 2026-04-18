import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import type { LinkedInProspect } from '../types/linkedin.ts';

const COL = 'marketing_linkedin_outreach';

export async function addProspect(prospect: Omit<LinkedInProspect, 'id'>): Promise<void> {
  const ref = doc(collection(db, COL));
  await setDoc(ref, { ...prospect, id: ref.id });
}

export async function updateProspect(id: string, data: Partial<LinkedInProspect>): Promise<void> {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteProspect(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
