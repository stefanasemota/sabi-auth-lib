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
      console.log("🔐 SabiAuth: State changed, UID:", u?.uid);

      if (u) {
        // 2. SET COOKIE IMMEDIATELY
        if (typeof window !== "undefined") {
          document.cookie = `__session=${u.uid}; path=/; max-age=604800; SameSite=Lax;`;
          console.log("🍪 SabiAuth: Cookie __session set.");
        }

        // 3. FETCH ROLE FROM FIRESTORE
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("📊 SabiAuth: Firestore data found:", userData.role);

            // Merge Firebase Auth user with Firestore Role/Credits
            setUser({
              ...u,
              role: userData.role || "WAKA",
              aiCredits: userData.aiCredits || 0,
            } as SabiUser);
          } else {
            console.warn("⚠️ SabiAuth: No Firestore doc for user.");
            setUser(u as SabiUser);
          }
        } catch (err) {
          console.error("❌ SabiAuth: Firestore fetch failed:", err);
          setUser(u as SabiUser);
        }
      } else {
        // 4. CLEANUP ON LOGOUT
        setUser(null);
        if (typeof window !== "undefined") {
          document.cookie = `__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

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
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within SabiAuthProvider");
  return context;
};
