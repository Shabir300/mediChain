
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  onSnapshot,
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

  const queryKey = q ? q.toString() : 'null';

  useEffect(() => {
    if (!q) {
        setData([]);
        setLoading(false);
        return;
    }
    setLoading(true);

    const unsubscribe = onSnapshot(
      q,
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
  }, [queryKey]); // Re-run effect when the query string representation changes

  return { data, loading, error };
}
