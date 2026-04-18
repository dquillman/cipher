import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type UsageEventType = 'session' | 'coreAction' | 'completion' | 'trap_drill_started' | 'trap_drill_completed';

export const UsageEventService = {
  emit: (userId: string, eventType: UsageEventType, examId?: string, meta?: Record<string, unknown>) => {
    // Fire-and-forget — no await, no retry
    addDoc(collection(db, 'usage_events'), {
      userId,
      eventType,
      ...(examId && { examId }),
      ...(meta && { meta }),
      timestamp: serverTimestamp(),
    }).catch(() => {}); // Fail silently
  },
};
