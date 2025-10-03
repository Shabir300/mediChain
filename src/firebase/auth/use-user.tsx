
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


export function useUser() {
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
            // This might happen briefly during signup, or if the user doc doesn't exist
            // We set a basic user object, but the role might be missing.
             const basicUser: AppUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName!,
                role: 'patient', // default role, redirection logic should be robust
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
    // Keep userData for compatibility in other parts of the app for now, but it's derived from user.
    userData: user, 
    loading,
    signUp: (email, password) =>
      createUserWithEmailAndPassword(auth, email, password),
    signIn: (email, password) =>
      signInWithEmailAndPassword(auth, email, password),
    signOut: () => signOut(auth),
    updateProfile: (user: FirebaseUser, profile: { displayName?: string, photoURL?: string}) => updateProfile(user, profile),
  };
}
