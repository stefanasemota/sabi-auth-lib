"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.SabiAuthProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
// 1. ADD THESE FIRESTORE IMPORTS
const firestore_1 = require("firebase/firestore");
const AuthContext = (0, react_1.createContext)(undefined);
const SabiAuthProvider = ({ children, firebaseConfig, }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)(firebaseConfig) : (0, app_1.getApps)()[0];
    const auth = (0, auth_1.getAuth)(app);
    const db = (0, firestore_1.getFirestore)(app); // Initialize Firestore
    (0, react_1.useEffect)(() => {
        const unsubscribe = (0, auth_1.onAuthStateChanged)(auth, async (u) => {
            // 1. Only process if 'u' is actually present or explicitly null
            if (u === undefined)
                return;
            console.log("🔐 SabiAuth: State changed, UID:", u?.uid);
            if (u) {
                // Set Cookie
                document.cookie = `__session=${u.uid}; path=/; max-age=604800; SameSite=Lax;`;
                // Fetch Firestore Role
                const userDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(db, "users", u.uid));
                const userData = userDoc.data();
                setUser({
                    ...u,
                    role: userData?.role || "WAKA",
                    aiCredits: userData?.aiCredits || 0,
                });
            }
            else {
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
            // THE FIX: Use Popup again, but wrap it in a small timeout
            // This ensures any "active file chooser" is fully cleared by the browser first
            setTimeout(async () => {
                await (0, auth_1.signInWithPopup)(auth, provider);
            }, 100);
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
