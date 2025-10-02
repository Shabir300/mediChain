"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type Role = 'patient' | 'doctor' | 'pharmacy';

export interface User {
  id: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => User | null;
  signup: (email: string, password: string, role: Role) => User | null;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database
const mockUsers: User[] = [
  { id: '1', email: 'patient@vitallink.com', role: 'patient' },
  { id: '2', email: 'doctor@vitallink.com', role: 'doctor' },
  { id: '3', email: 'pharmacy@vitallink.com', role: 'pharmacy' },
];
const mockPasswords: { [email: string]: string } = {
  'patient@vitallink.com': 'password',
  'doctor@vitallink.com': 'password',
  'pharmacy@vitallink.com': 'password',
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate checking for a logged-in user
    try {
      const storedUser = sessionStorage.getItem('curelink-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Could not parse user from session storage", error);
    }
    setLoading(false);
  }, []);

  const login = (email: string, password: string): User | null => {
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && mockPasswords[email] === password) {
      setUser(foundUser);
      sessionStorage.setItem('curelink-user', JSON.stringify(foundUser));
      return foundUser;
    }
    return null;
  };

  const signup = (email: string, password: string, role: Role): User | null => {
    if (mockUsers.find(u => u.email === email)) {
      return null; // User already exists
    }
    const newUser: User = { id: String(mockUsers.length + 1), email, role };
    mockUsers.push(newUser);
    mockPasswords[email] = password;
    return newUser;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('curelink-user');
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
