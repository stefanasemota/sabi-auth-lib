import React from "react";
import { AuthContextType } from "./core/domain";
export declare const SabiAuthProvider: ({ children, firebaseConfig, }: {
    children: React.ReactNode;
    firebaseConfig: any;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useAuth: () => AuthContextType;
