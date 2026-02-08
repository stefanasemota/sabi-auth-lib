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
const SabiAuthProvider = ({ children, firebaseConfig, onLoginCallback, }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    // Initialize Firebase services
    const app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)(firebaseConfig) : (0, app_1.getApps)()[0];
    const auth = (0, auth_1.getAuth)(app);
    const db = (0, firestore_1.getFirestore)(app);
    (0, react_1.useEffect)(() => {
        const unsubscribe = (0, auth_1.onAuthStateChanged)(auth, async (u) => {
            // Logic: Wait for explicit result from Firebase
            if (u === undefined)
                return;
            console.log("🔐 SabiAuth: Identity established:", u?.email);
            if (u) {
                // 1. SYNC COOKIE FOR SERVER COMPONENTS
                // This allows Next.js Middleware and Server Actions to see the UID
                document.cookie = `__session=${u.uid}; path=/; max-age=604800; SameSite=Lax;`;
                // 2. CHECK GLOBAL ADMIN STATUS
                // Every Sabi app uses 'roles_admin' for the owner/moderators
                try {
                    const adminDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(db, "roles_admin", u.uid));
                    setUser({
                        ...u,
                        isAdmin: adminDoc.exists(),
                    });
                    // 3. TRIGGER SERVER-SIDE LOGIN LOGGING (if callback provided)
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
            const provider = new auth_1.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });
            // Small timeout fixes the "active file chooser" block on Mac/Chrome
            setTimeout(async () => {
                await (0, auth_1.signInWithPopup)(auth, provider);
            }, 150);
        }
        catch (error) {
            console.error("SabiAuth Login Error:", error);
        }
    };
    // <AI-LOCK-END>
    const logout = async () => {
        await (0, auth_1.signOut)(auth);
    };
    return ((0, jsx_runtime_1.jsx)(AuthContext.Provider, { value: { user, loading, login, logout }, children: children }));
};
exports.SabiAuthProvider = SabiAuthProvider;
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context)
        throw new Error("useAuth must be used within SabiAuthProvider");
    return context;
};
exports.useAuth = useAuth;
