"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
// 1. ADD THESE FIRESTORE IMPORTS
import { getFirestore, doc, getDoc } from "firebase/firestore";

type Plan = "WAKA" | "GBEDU" | "KPATAKPATA";

interface SabiUser extends User {
  role?: Plan;
  aiCredits?: number;
}

interface AuthContextType {
  user: SabiUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SabiAuthProvider = ({
  children,
  firebaseConfig,
}: {
  children: React.ReactNode;
  firebaseConfig: any;
}) => {
  const [user, setUser] = useState<SabiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  const db = getFirestore(app); // Initialize Firestore

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      // 1. Only process if 'u' is actually present or explicitly null
      if (u === undefined) return;

      console.log("🔐 SabiAuth: State changed, UID:", u?.uid);

      if (u) {
        // Set Cookie
        document.cookie = `__session=${u.uid}; path=/; max-age=604800; SameSite=Lax;`;

        // Fetch Firestore Role
        const userDoc = await getDoc(doc(db, "users", u.uid));
        const userData = userDoc.data();

        setUser({
          ...u,
          role: userData?.role || "WAKA",
          aiCredits: userData?.aiCredits || 0,
        } as SabiUser);
      } else {
        setUser(null);
        document.cookie = `__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  // <AI-LOCK-START>
  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      // THE FIX: Use Popup again, but wrap it in a small timeout
      // This ensures any "active file chooser" is fully cleared by the browser first
      setTimeout(async () => {
        await signInWithPopup(auth, provider);
      }, 100);
    } catch (error) {
      console.error("SabiAuth Login Error:", error);
    }
  };
  // <AI-LOCK-END>

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within SabiAuthProvider");
  return context;
};
