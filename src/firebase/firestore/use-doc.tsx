
'use client';

import { useEffect, useState, useMemo } from 'react';
import { onSnapshot, type DocumentReference } from 'firebase/firestore';

export function useDoc<T>(ref: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refKey = ref ? ref.path : 'null';

  useEffect(() => {
    if (!ref) {
        setData(null);
        setLoading(false);
        return;
    }
    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error('Error fetching document:', err);
      },
    );

    return () => unsubscribe();
  }, [refKey]); // Re-run effect when the document path changes

  return { data, loading, error };
}
