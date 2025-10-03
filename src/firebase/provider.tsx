
'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  Context,
} from 'react';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import {
  FirebaseApp,
  initializeApp,
  getApps,
  getApp,
} from 'firebase/app';
import { firebaseConfig } from './config';
import { useFirebaseAuth } from './auth/use-firebase-auth';

// Define the shape of the context value
interface FirebaseContextValue {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Create the context with an undefined initial value
const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined,
);

// Define the props for the provider component
interface FirebaseProviderProps {
  children: ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const app = useMemo(() => {
    const apps = getApps();
    if (apps.length === 0) {
      return initializeApp(firebaseConfig);
    } else {
      return getApp();
    }
  }, []);

  const auth = useMemo(() => getAuth(app), [app]);
  const firestore = useMemo(() => getFirestore(app), [app]);

  const contextValue = useMemo(
    () => ({
      app,
      auth,
      firestore,
    }),
    [app, auth, firestore],
  );

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
}

// Custom hook to use the Firebase context
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

// Custom hook to get the Firebase App instance
export function useFirebaseApp() {
  return useFirebase().app;
}

// Custom hook to get the Firestore instance
export function useFirestore() {
  return useFirebase().firestore;
}

// Custom hook to get the Auth instance
export function useAuth() {
  return useFirebaseAuth();
}
