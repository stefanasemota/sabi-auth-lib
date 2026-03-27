"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { SabiUser, AuthContextType, SabiAuthConfig } from "./core/domain";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onIdTokenChanged,
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
  autoSessionCookie = false,
  experimentalFastRedirect = false,
  _navigateTo,
}: {
  children: React.ReactNode;
  firebaseConfig: any;
  onLoginCallback?: (uid: string) => Promise<void>;
  /** @internal - For testing only. Overrides the hard-redirect handler. */
  _navigateTo?: (url: string) => void;
} & SabiAuthConfig) => {
  const [user, setUser] = useState<SabiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  // In-memory idToken cache — reset on sign-out
  const cachedIdTokenRef = useRef<string | null>(null);

  // Stable navigate helper — uses prop injection in tests, window.location in prod
  const navigateTo = (_navigateTo ?? ((url: string) => { window.location.href = url; }));

  // Initialize Firebase services (idempotent)
  const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    /**
     * EVENT BUS: onIdTokenChanged fires on every token refresh (not just
     * sign-in / sign-out), giving us fine-grained control over caching
     * and server-sync without any polling interval.
     */
    const unsubscribe = onIdTokenChanged(auth, async (u: User | null) => {
      // Intermediate Firebase state — wait for a definitive value
      if (u === undefined) return;

      console.log("🔐 SabiAuth: Token event, identity:", u?.email ?? "null");

      if (u) {
        // 1. CACHE THE ID TOKEN
        try {
          const idToken = await u.getIdToken();
          cachedIdTokenRef.current = idToken;

          // 2. AUTO-COOKIE SYNC (optional)
          if (autoSessionCookie) {
            fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            }).catch((err) =>
              console.error("⚠️ SabiAuth: Auto session-cookie sync failed", err)
            );
          }
        } catch (tokenErr) {
          console.error("⚠️ SabiAuth: Failed to retrieve idToken", tokenErr);
        }

        // 3. LEGACY COOKIE SYNC (kept for backwards-compat with cookie-only sessions)
        document.cookie = `__session=${u.uid}; path=/; max-age=604800; SameSite=Lax;`;

        // 4. CHECK GLOBAL ADMIN STATUS
        try {
          const adminDoc = await getDoc(doc(db, "roles_admin", u.uid));

          setUser({
            ...u,
            isAdmin: adminDoc.exists(),
          } as SabiUser);

          // 5. TRIGGER SERVER-SIDE LOGIN LOGGING (if callback provided)
          if (onLoginCallback) {
            try {
              console.log("🔐 SabiAuth: Triggering login callback for", u.uid);
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
        // CLEANUP
        cachedIdTokenRef.current = null;
        setUser(null);
        document.cookie = `__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;

        // FAST REDIRECT on logout
        if (experimentalFastRedirect && typeof window !== "undefined") {
          navigateTo("/");
        }
      }

      setLoading(false);
      setIsAuthenticating(false);
    });

    return () => unsubscribe();
  }, [auth, db, autoSessionCookie, experimentalFastRedirect]);

  // <AI-LOCK-START>
  const login = async () => {
    // OPTIMISTIC UI — surface the loading state before the popup appears
    setIsAuthenticating(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      // Small timeout fixes the "active file chooser" block on Mac/Chrome
      setTimeout(async () => {
        try {
          await signInWithPopup(auth, provider);

          // FAST REDIRECT on login
          if (experimentalFastRedirect && typeof window !== "undefined") {
            navigateTo(window.location.href);
          }
        } catch (innerError) {
          console.error("SabiAuth Login Error (popup):", innerError);
          setIsAuthenticating(false);
        }
      }, 150);
    } catch (error) {
      console.error("SabiAuth Login Error:", error);
      setIsAuthenticating(false);
    }
  };
  // <AI-LOCK-END>

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticating, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within SabiAuthProvider");
  return context;
};
