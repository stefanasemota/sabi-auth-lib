import React from "react";
import { User } from "firebase/auth";
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
export declare const SabiAuthProvider: ({ children, firebaseConfig, }: {
    children: React.ReactNode;
    firebaseConfig: any;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useAuth: () => AuthContextType;
export {};
