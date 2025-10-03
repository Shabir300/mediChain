
'use client';

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc }from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { useFirebase } from '../provider';
import type { User as AppUser } from '@/lib/types';


const DEMO_USER_STORAGE_KEY = 'curelink-demo-user';

export function useFirebaseAuth() {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setAuthUser = useCallback((userToSet: AppUser | null) => {
    if (userToSet) {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(userToSet));
    } else {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    }
    setUser(userToSet);
  }, []);

  useEffect(() => {
    // First, check for a persisted demo user
    const storedDemoUser = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (storedDemoUser) {
        try {
            const demoUser = JSON.parse(storedDemoUser);
            setUser(demoUser);
            setLoading(false);
            // If we have a demo user, we don't need to listen to Firebase auth changes
            return;
        } catch (e) {
            console.error("Failed to parse demo user from localStorage", e);
            localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        }
    }


    // If no demo user, proceed with Firebase auth state
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
                ...(data.role === 'pharmacy' && { pharmacyName: data.pharmacyName }),
            }
            setUser(fullUser);
        } else {
             // This case might happen during signup before the doc is created
             // Or if the user doc is somehow deleted.
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

  const signOut = useCallback(async () => {
    // Clear both demo user and Firebase user
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    setUser(null);
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out from Firebase:", error);
    }
  }, [auth]);


  return {
    user,
    userData: user,
    loading,
    setAuthUser, // For demo accounts
    signUp: (email, password) =>
      createUserWithEmailAndPassword(auth, email, password),
    signIn: (email, password) =>
      signInWithEmailAndPassword(auth, email, password),
    signOut: signOut,
    updateProfile: (user: FirebaseUser, profile: { displayName?: string, photoURL?: string}) => updateProfile(user, profile),
  };
}
