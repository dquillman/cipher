import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { auth } from '../firebase.ts';
import type { ContentItem } from '../types/content.ts';
import { contentSeed } from '../data/contentSeed.ts';

const COL = 'marketing_content';

async function waitForAuth(): Promise<void> {
  if (auth.currentUser) return;
  return new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) { unsub(); resolve(); }
    });
  });
}

export async function addContent(item: Omit<ContentItem, 'id'>): Promise<void> {
  const ref = doc(collection(db, COL));
  await setDoc(ref, { ...item, id: ref.id });
}

export async function updateContent(id: string, data: Partial<ContentItem>): Promise<void> {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteContent(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function seedContent(): Promise<void> {
  await waitForAuth();
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) {
    console.log(`[Content] Already has ${snap.size} items, skipping seed`);
    return;
  }
  console.log('[Content] Seeding content calendar...');
  let success = 0;
  for (const item of contentSeed) {
    try {
      const ref = doc(collection(db, COL));
      await setDoc(ref, { ...item, id: ref.id });
      success++;
    } catch (err) {
      console.error('[Content] Failed to write item:', item.title, err);
    }
  }
  console.log(`[Content] Seeded ${success}/${contentSeed.length} items`);
}

export async function reseedContent(): Promise<void> {
  await waitForAuth();
  const snap = await getDocs(collection(db, COL));
  for (const d of snap.docs) {
    await deleteDoc(doc(db, COL, d.id));
  }
  console.log('[Content] Cleared, reseeding...');
  let success = 0;
  for (const item of contentSeed) {
    try {
      const ref = doc(collection(db, COL));
      await setDoc(ref, { ...item, id: ref.id });
      success++;
    } catch (err) {
      console.error('[Content] Failed to write item:', item.title, err);
    }
  }
  console.log(`[Content] Reseeded ${success}/${contentSeed.length} items`);
}
