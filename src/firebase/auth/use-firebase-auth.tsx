
'use client';

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc }from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirebase } from '../provider';
import type { User as AppUser } from '@/lib/types';


export function useFirebaseAuth() {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            const fullUser: AppUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName!,
                role: data.role,
                pharmacyName: data.pharmacyName,
            }
            setUser(fullUser);
        } else {
             const basicUser: AppUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName!,
                role: 'patient', // default role
            }
            setUser(basicUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  return {
    user,
    userData: user,
    loading,
    setAuthUser: setUser, // Manually set user for demo purposes
    signUp: (email, password) =>
      createUserWithEmailAndPassword(auth, email, password),
    signIn: (email, password) =>
      signInWithEmailAndPassword(auth, email, password),
    signOut: () => {
        setUser(null);
        return signOut(auth);
    },
    updateProfile: (user: FirebaseUser, profile: { displayName?: string, photoURL?: string}) => updateProfile(user, profile),
  };
}
