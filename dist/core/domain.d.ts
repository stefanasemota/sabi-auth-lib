/**
 * @fileoverview Domain Core Layer
 * Contains pure domain entities and interfaces.
 * DEPENDENCY RULE: No dependencies on outer layers (Infrastructure, UI).
 */
import { User } from "firebase/auth";
/**
 * GENERIC USER TYPE
 * Extends standard Firebase User with a simple isAdmin flag.
 * All app-specific roles (Gbedu, VIP, etc.) live in the app, not here.
 */
export interface SabiUser extends User {
    isAdmin: boolean;
}
/**
 * v0.3.0 CONFIGURATION OPTIONS
 * Optional flags passed to SabiAuthProvider for advanced behaviour.
 */
export interface SabiAuthConfig {
    /**
     * When true, the library automatically POSTs `{ idToken }` to
     * `/api/auth/session` after every token refresh, keeping server-side
     * session cookies in sync without manual wiring.
     */
    autoSessionCookie?: boolean;
    /**
     * When true, login and logout trigger a full hard-redirect via
     * `window.location.href` instead of relying on the SPA router.
     * Useful for apps where server components must re-render cleanly
     * after an auth change.
     */
    experimentalFastRedirect?: boolean;
}
export interface AuthContextType {
    user: SabiUser | null;
    loading: boolean;
    /**
     * True from the moment `login()` is called until Firebase resolves
     * the auth popup (optimistic UI signal).
     */
    isAuthenticating: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}
