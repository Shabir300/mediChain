
'use client';

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc }from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth as useFirebaseAuth, useFirestore } from '../provider';
import type { Role } from '@/context/auth-context';

export interface User extends FirebaseUser {
    role?: Role;
    pharmacyName?: string;
}

export function useUser() {
  const { auth } = useFirebaseAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{role: Role, pharmacyName?: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({ ...firebaseUser, role: data.role, pharmacyName: data.pharmacyName });
            setUserData({ role: data.role, pharmacyName: data.pharmacyName });
        } else {
            setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  return {
    user,
    userData,
    loading,
    signUp: (email, password) =>
      createUserWithEmailAndPassword(auth, email, password),
    signIn: (email, password) =>
      signInWithEmailAndPassword(auth, email, password),
    signOut: () => signOut(auth),
  };
}
