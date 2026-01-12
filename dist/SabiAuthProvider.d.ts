import React from "react";
import { User } from "firebase/auth";
/**
 * GENERIC USER TYPE
 * Extends standard Firebase User with a simple isAdmin flag.
 * All app-specific roles (Gbedu, VIP, etc.) live in the app, not here.
 */
interface SabiUser extends User {
    isAdmin: boolean;
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
