
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useToast } from '../hooks/use-toast';

export type Role = 'patient' | 'doctor' | 'pharmacy' | 'hospital';

export interface User {
  uid: string;
  email: string | null;
  role: Role;
  name?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (email: string, password: string, role: Role, name?: string, phone?: string) => Promise<User | null>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() } as User);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = { uid: userCredential.user.uid, email: userCredential.user.email, ...userDoc.data() } as User;
        setUser(userData);
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        return userData;
      }
      return null;
    } catch (error: any) {
      console.error("Error logging in:", error);
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please check your email and password.",
        variant: "destructive",
      });
      return null;
    }
  };

  const signup = async (email: string, password: string, role: Role, name?: string, phone?: string): Promise<User | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role,
        name,
        phone,
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        role,
        email,
        name: name || null,
        phone: phone || null,
      });
      setUser(newUser);
      toast({
        title: "Signup Successful",
        description: "Your account has been created.",
      });
      return newUser;
    } catch (error: any) {
      console.error("Error signing up:", error);
      const description = error.code === 'auth/email-already-in-use' 
        ? "This email is already in use." 
        : "An error occurred during signup.";
      toast({
        title: "Signup Failed",
        description,
        variant: "destructive",
      });
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout Failed",
        description: "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
