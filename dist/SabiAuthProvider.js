"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.SabiAuthProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const AuthContext = (0, react_1.createContext)(undefined);
const SabiAuthProvider = ({ children, firebaseConfig }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    // Initialize Firebase Client
    const app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)(firebaseConfig) : (0, app_1.getApps)()[0];
    const auth = (0, auth_1.getAuth)(app);
    (0, react_1.useEffect)(() => {
        const unsubscribe = (0, auth_1.onAuthStateChanged)(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [auth]);
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
        throw new Error('useAuth must be used within SabiAuthProvider');
    return context;
};
exports.useAuth = useAuth;
