import { collection, doc, setDoc, updateDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { auth } from '../firebase.ts';

import { checklistSeed } from '../data/checklistSeed.ts';

const COL = 'marketing_checklist';
const PROGRESS_KEY = 'ec_checklist_progress';

/** Save completed task names to localStorage as backup */
function saveProgressLocally(completedTasks: string[]): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(completedTasks));
}

/** Get completed task names from localStorage backup */
function getLocalProgress(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
  } catch { return []; }
}

async function waitForAuth(): Promise<void> {
  if (auth.currentUser) return;
  return new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) { unsub(); resolve(); }
    });
  });
}

export async function seedChecklist(): Promise<void> {
  try {
    await waitForAuth();
    const snap = await getDocs(collection(db, COL));
    if (!snap.empty) {
      console.log(`[Checklist] Already has ${snap.size} items, skipping seed`);
      // Sync local backup of completed tasks
      const completed = snap.docs
        .filter(d => d.data().completed)
        .map(d => d.data().task as string);
      saveProgressLocally(completed);
      return;
    }
    console.log('[Checklist] Collection empty, seeding with preserved progress...');
    await writeAllItems();
  } catch (err) {
    console.error('[Checklist] seedChecklist failed:', err);
  }
}

export async function reseedChecklist(): Promise<void> {
  await waitForAuth();

  // Save current progress before deleting
  const snap = await getDocs(collection(db, COL));
  const completed = snap.docs
    .filter(d => d.data().completed)
    .map(d => d.data().task as string);
  saveProgressLocally(completed);
  console.log(`[Checklist] Saved ${completed.length} completed tasks to local backup`);

  // Delete existing docs
  for (const d of snap.docs) {
    await deleteDoc(doc(db, COL, d.id));
  }
  console.log('[Checklist] Deleted, writing new items with preserved progress...');
  await writeAllItems();
}

async function writeAllItems(): Promise<void> {
  const localProgress = getLocalProgress();
  console.log(`[Checklist] Restoring progress for ${localProgress.length} completed tasks`);

  let success = 0;
  for (let i = 0; i < checklistSeed.length; i++) {
    const item = checklistSeed[i];
    // Restore completion status from local backup
    const wasCompleted = localProgress.includes(item.task);
    try {
      const ref = doc(collection(db, COL));
      await setDoc(ref, {
        ...item,
        id: ref.id,
        completed: wasCompleted,
        completedAt: wasCompleted ? new Date().toISOString() : null,
      });
      success++;
    } catch (err) {
      console.error(`[Checklist] Failed to write item ${i}: "${item.task}"`, err);
    }
  }
  console.log(`[Checklist] Seeded ${success}/${checklistSeed.length} items (${localProgress.length} restored as completed)`);
}

export async function toggleChecklistItem(id: string, completed: boolean, taskName: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    completed,
    completedAt: completed ? new Date().toISOString() : null,
  });

  // Update local backup
  const progress = getLocalProgress();
  if (completed && !progress.includes(taskName)) {
    progress.push(taskName);
  } else if (!completed) {
    const idx = progress.indexOf(taskName);
    if (idx >= 0) progress.splice(idx, 1);
  }
  saveProgressLocally(progress);
}
