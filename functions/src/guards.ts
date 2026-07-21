import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { resolveProAccess } from './entitlement';

export async function requirePro(context: { auth?: { uid: string } | null }) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('permission-denied', 'User profile not found.');
  }

  const accessReason = resolveProAccess(userDoc.data());
  if (!accessReason) {
    throw new HttpsError('permission-denied', 'Pro subscription required.');
  }

  return accessReason;
}
