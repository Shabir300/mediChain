
'use client';

import { useEffect, useState, useRef } from 'react';
import { onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore';

export function useDoc<T>(ref: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refRef = useRef(ref);

  useEffect(() => {
    if (!refRef.current) {
        setLoading(false);
        return;
    }

    const unsubscribe = onSnapshot(
      refRef.current,
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
  }, []);

  return { data, loading, error };
}
