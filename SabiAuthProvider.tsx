'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';

// Define the User Plan types
type Plan = 'WAKA' | 'GBEDU' | 'KPATAKPATA';

interface SabiUser extends User {
  role?: Plan;
}

interface AuthContextType {
  user: SabiUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SabiAuthProvider = ({ children, firebaseConfig }: { children: React.ReactNode, firebaseConfig: any }) => {
  const [user, setUser] = useState<SabiUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase Client
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);

  useEffect(() => {
     const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      // Ensure we are in the browser before touching document
    if (typeof window !== 'undefined') {
      if (u) {
        document.cookie = `__session=${u.uid}; path=/; max-age=604800; SameSite=Lax;`;
      } else {
        document.cookie = `__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    }
  });   
    return () => unsubscribe();
  }, [auth]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within SabiAuthProvider');
  return context;
};