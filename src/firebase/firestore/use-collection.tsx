
'use client';

import { useEffect, useState, useRef } from 'react';
import {
  onSnapshot,
  query,
  collection,
  where,
  type DocumentData,
  type Query,
} from 'firebase/firestore';

interface UseCollectionOptions<T> {
  query?: [string, '==', any];
}

export function useCollection<T>(
  q: Query | null,
  options?: UseCollectionOptions<T>,
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const qRef = useRef(q);

  useEffect(() => {
    if (!qRef.current) {
        setLoading(false);
        return;
    }

    const unsubscribe = onSnapshot(
      qRef.current,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error('Error fetching collection:', err);
      },
    );

    return () => unsubscribe();
  }, []);

  return { data, loading, error };
}
