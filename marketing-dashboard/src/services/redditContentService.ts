import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import type { RedditDraft } from '../types/redditContent.ts';

const DRAFTS_COL = 'marketing_reddit_drafts';

export async function addDraft(draft: Omit<RedditDraft, 'id'>): Promise<void> {
  const ref = doc(collection(db, DRAFTS_COL));
  await setDoc(ref, { ...draft, id: ref.id });
}

export async function updateDraft(id: string, data: Partial<RedditDraft>): Promise<void> {
  await updateDoc(doc(db, DRAFTS_COL, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteDraft(id: string): Promise<void> {
  await deleteDoc(doc(db, DRAFTS_COL, id));
}
