
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
    const storedDemoUser = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (storedDemoUser) {
        try {
            const demoUser = JSON.parse(storedDemoUser);
            setUser(demoUser);
            setLoading(false);
            return;
        } catch (e) {
            console.error("Failed to parse demo user from localStorage", e);
            localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        }
    }


    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Do not handle auth changes if a demo user is already set
        if (localStorage.getItem(DEMO_USER_STORAGE_KEY)) {
            setLoading(false);
            return;
        }
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
             const basicUser: AppUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName!,
                role: 'patient', 
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
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    setUser(null); // Optimistically clear user
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
    setAuthUser,
    signUp: (email, password) =>
      createUserWithEmailAndPassword(auth, email, password),
    signIn: (email, password) =>
      signInWithEmailAndPassword(auth, email, password),
    signOut: signOut,
    updateProfile: (user: FirebaseUser, profile: { displayName?: string, photoURL?: string}) => updateProfile(user, profile),
  };
}
