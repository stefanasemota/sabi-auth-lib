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
export interface AuthContextType {
    user: SabiUser | null;
    loading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}
