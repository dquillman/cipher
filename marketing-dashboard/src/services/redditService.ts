import { collection, doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase.ts';
import type { RedditCommunity, RedditActivity } from '../types/reddit.ts';

const COMMUNITIES_COL = 'marketing_reddit_communities';
const ACTIVITY_COL = 'marketing_reddit_activity';

// Communities
export async function addCommunity(community: Omit<RedditCommunity, 'id'>): Promise<void> {
  const ref = doc(collection(db, COMMUNITIES_COL));
  await setDoc(ref, { ...community, id: ref.id });
}

export async function updateCommunity(id: string, data: Partial<RedditCommunity>): Promise<void> {
  await updateDoc(doc(db, COMMUNITIES_COL, id), data);
}

export async function deleteCommunity(id: string): Promise<void> {
  await deleteDoc(doc(db, COMMUNITIES_COL, id));
}

// Activity log
export async function addActivity(activity: Omit<RedditActivity, 'id'>): Promise<void> {
  const ref = doc(collection(db, ACTIVITY_COL));
  await setDoc(ref, { ...activity, id: ref.id });
}

export async function deleteActivity(id: string): Promise<void> {
  await deleteDoc(doc(db, ACTIVITY_COL, id));
}

// Quick "I Commented" — increment counters and log activity in one go
export async function quickComment(communityId: string, subredditName: string, dateStr: string): Promise<void> {
  await updateDoc(doc(db, COMMUNITIES_COL, communityId), {
    commentsMade: increment(1),
    karma: increment(1),
  });
  const ref = doc(collection(db, ACTIVITY_COL));
  await setDoc(ref, {
    id: ref.id,
    subredditId: communityId,
    date: dateStr,
    type: 'comment',
    description: `Commented in ${subredditName}`,
  });
}
