import React from "react";
import { AuthContextType } from "./core/domain";
export declare const SabiAuthProvider: ({ children, firebaseConfig, onLoginCallback, }: {
    children: React.ReactNode;
    firebaseConfig: any;
    onLoginCallback?: (uid: string) => Promise<void>;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useAuth: () => AuthContextType;
