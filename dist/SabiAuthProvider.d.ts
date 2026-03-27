import React from "react";
import { AuthContextType, SabiAuthConfig } from "./core/domain";
export declare const SabiAuthProvider: ({ children, firebaseConfig, onLoginCallback, autoSessionCookie, experimentalFastRedirect, _navigateTo, }: {
    children: React.ReactNode;
    firebaseConfig: any;
    onLoginCallback?: (uid: string) => Promise<void>;
    /** @internal - For testing only. Overrides the hard-redirect handler. */
    _navigateTo?: (url: string) => void;
} & SabiAuthConfig) => import("react/jsx-runtime").JSX.Element;
export declare const useAuth: () => AuthContextType;
