"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.SabiAuthProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const AuthContext = (0, react_1.createContext)(undefined);
const SabiAuthProvider = ({ children, firebaseConfig, onLoginCallback, autoSessionCookie = false, experimentalFastRedirect = false, _navigateTo, }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [isAuthenticating, setIsAuthenticating] = (0, react_1.useState)(false);
    // In-memory idToken cache — reset on sign-out
    const cachedIdTokenRef = (0, react_1.useRef)(null);
    // Stable navigate helper — uses prop injection in tests, window.location in prod
    const navigateTo = (_navigateTo ?? ((url) => { window.location.href = url; }));
    // Initialize Firebase services (idempotent)
    const app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)(firebaseConfig) : (0, app_1.getApps)()[0];
    const auth = (0, auth_1.getAuth)(app);
    const db = (0, firestore_1.getFirestore)(app);
    (0, react_1.useEffect)(() => {
        /**
         * EVENT BUS: onIdTokenChanged fires on every token refresh (not just
         * sign-in / sign-out), giving us fine-grained control over caching
         * and server-sync without any polling interval.
         */
        const unsubscribe = (0, auth_1.onIdTokenChanged)(auth, async (u) => {
            // Intermediate Firebase state — wait for a definitive value
            if (u === undefined)
                return;
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
                        }).catch((err) => console.error("⚠️ SabiAuth: Auto session-cookie sync failed", err));
                    }
                }
                catch (tokenErr) {
                    console.error("⚠️ SabiAuth: Failed to retrieve idToken", tokenErr);
                }
                // 3. LEGACY COOKIE SYNC (kept for backwards-compat with cookie-only sessions)
                document.cookie = `__session=${u.uid}; path=/; max-age=604800; SameSite=Lax;`;
                // 4. CHECK GLOBAL ADMIN STATUS
                try {
                    const adminDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(db, "roles_admin", u.uid));
                    setUser({
                        ...u,
                        isAdmin: adminDoc.exists(),
                    });
                    // 5. TRIGGER SERVER-SIDE LOGIN LOGGING (if callback provided)
                    if (onLoginCallback) {
                        try {
                            console.log("🔐 SabiAuth: Triggering login callback for", u.uid);
                            await onLoginCallback(u.uid);
                        }
                        catch (error) {
                            console.error("⚠️ SabiAuth: Login callback failed (non-blocking)", error);
                        }
                    }
                }
                catch (err) {
                    console.error("⚠️ SabiAuth: Admin check failed", err);
                    setUser({ ...u, isAdmin: false });
                }
            }
            else {
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
            const provider = new auth_1.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });
            // Small timeout fixes the "active file chooser" block on Mac/Chrome
            setTimeout(async () => {
                try {
                    await (0, auth_1.signInWithPopup)(auth, provider);
                    // FAST REDIRECT on login
                    if (experimentalFastRedirect && typeof window !== "undefined") {
                        navigateTo(window.location.href);
                    }
                }
                catch (innerError) {
                    console.error("SabiAuth Login Error (popup):", innerError);
                    setIsAuthenticating(false);
                }
            }, 150);
        }
        catch (error) {
            console.error("SabiAuth Login Error:", error);
            setIsAuthenticating(false);
        }
    };
    // <AI-LOCK-END>
    const logout = async () => {
        await (0, auth_1.signOut)(auth);
    };
    return ((0, jsx_runtime_1.jsx)(AuthContext.Provider, { value: { user, loading, isAuthenticating, login, logout }, children: children }));
};
exports.SabiAuthProvider = SabiAuthProvider;
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context)
        throw new Error("useAuth must be used within SabiAuthProvider");
    return context;
};
exports.useAuth = useAuth;
