import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';

export async function requirePro(context: any) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const uid = context.auth.uid;

  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(uid).get();

  if (!userDoc.exists) {
    throw new HttpsError('permission-denied', 'User profile not found.');
  }

  const userData = userDoc.data();

  const isPro =
    userData?.isPro === true ||
    userData?.plan === 'pro' ||
    userData?.trialActive === true ||
    userData?.testerOverride === true ||
    userData?.billingStatus === 'comped';

  if (!isPro) {
    throw new HttpsError('permission-denied', 'Pro subscription required.');
  }

  return true;
}
