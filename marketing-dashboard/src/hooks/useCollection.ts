import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy, type Query,
  type DocumentData, type QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase.ts';

export function useCollection<T extends { id: string }>(
  collectionName: string,
  ...constraints: QueryConstraint[]
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, collectionName);
    const q: Query<DocumentData> = constraints.length
      ? query(ref, ...constraints)
      : query(ref);

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
      setData(items);
      setLoading(false);
    });

    return unsub;
  }, [collectionName]);

  return { data, loading };
}

export function useOrderedCollection<T extends { id: string }>(
  collectionName: string,
  orderField: string,
  direction: 'asc' | 'desc' = 'asc',
) {
  return useCollection<T>(collectionName, orderBy(orderField, direction));
}
