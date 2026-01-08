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
            console.log("🔐 SabiAuth: State changed, UID:", u?.uid);
            if (u) {
                // 2. SET COOKIE IMMEDIATELY
                if (typeof window !== "undefined") {
                    document.cookie = `__session=${u.uid}; path=/; max-age=604800; SameSite=Lax;`;
                    console.log("🍪 SabiAuth: Cookie __session set.");
                }
                // 3. FETCH ROLE FROM FIRESTORE
                try {
                    const userDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(db, "users", u.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log("📊 SabiAuth: Firestore data found:", userData.role);
                        // Merge Firebase Auth user with Firestore Role/Credits
                        setUser({
                            ...u,
                            role: userData.role || "WAKA",
                            aiCredits: userData.aiCredits || 0,
                        });
                    }
                    else {
                        console.warn("⚠️ SabiAuth: No Firestore doc for user.");
                        setUser(u);
                    }
                }
                catch (err) {
                    console.error("❌ SabiAuth: Firestore fetch failed:", err);
                    setUser(u);
                }
            }
            else {
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
        const provider = new auth_1.GoogleAuthProvider();
        await (0, auth_1.signInWithPopup)(auth, provider);
    };
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
