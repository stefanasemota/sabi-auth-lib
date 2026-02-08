"use client";


import React, { createContext, useContext, useEffect, useState } from "react";
import { SabiUser, AuthContextType } from "./core/domain";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SabiAuthProvider = ({
  children,
  firebaseConfig,
  onLoginCallback,
}: {
  children: React.ReactNode;
  firebaseConfig: any;
  onLoginCallback?: (uid: string) => Promise<void>;
}) => {
  const [user, setUser] = useState<SabiUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase services
  const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      // Logic: Wait for explicit result from Firebase
      if (u === undefined) return;

      console.log("🔐 SabiAuth: Identity established:", u?.email);

      if (u) {
        // 1. SYNC COOKIE FOR SERVER COMPONENTS
        // This allows Next.js Middleware and Server Actions to see the UID
        document.cookie = `__session=${u.uid}; path=/; max-age=604800; SameSite=Lax;`;

        // 2. CHECK GLOBAL ADMIN STATUS
        // Every Sabi app uses 'roles_admin' for the owner/moderators
        try {
          const adminDoc = await getDoc(doc(db, "roles_admin", u.uid));

          setUser({
            ...u,
            isAdmin: adminDoc.exists(),
          } as SabiUser);

          // 3. TRIGGER SERVER-SIDE LOGIN LOGGING (if callback provided)
          if (onLoginCallback) {
            try {
              await onLoginCallback(u.uid);
            } catch (error) {
              console.error("⚠️ SabiAuth: Login callback failed (non-blocking)", error);
            }
          }
        } catch (err) {
          console.error("⚠️ SabiAuth: Admin check failed", err);
          setUser({ ...u, isAdmin: false } as SabiUser);
        }
      } else {
        // 3. CLEANUP
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

      // Small timeout fixes the "active file chooser" block on Mac/Chrome
      setTimeout(async () => {
        await signInWithPopup(auth, provider);
      }, 150);
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
