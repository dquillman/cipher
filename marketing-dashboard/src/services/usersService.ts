import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import type { First100User } from '../types/users.ts';

const COL = 'marketing_users_first100';

export async function addUser(user: Omit<First100User, 'id'>): Promise<void> {
  const ref = doc(collection(db, COL));
  await setDoc(ref, { ...user, id: ref.id });
}

export async function updateUser(id: string, data: Partial<First100User>): Promise<void> {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
