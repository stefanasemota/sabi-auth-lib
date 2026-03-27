/**
 * @fileoverview Admin Application Service
 * Contains business logic for Admin authentication and session management.
 * Layer: Application Services (Onion Architecture)
 */
import 'server-only';
import { NextResponse, NextRequest } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
/**
 * 1. THE MIDDLEWARE FACTORY
 * Ensures Firebase compatibility and prevents redirect loops.
 *
 * LOOP-KILLER: The middleware must NEVER redirect /api/auth/* routes.
 * If the autoSessionCookie POST to /api/auth/session is intercepted before
 * it reaches the API handler, no session cookie can be set, causing the app
 * to believe the user is logged out → infinite loop.
 *
 * Recommended Next.js matcher (add to your middleware export config):
 * @example
 * export const config = {
 *   matcher: [
 *     // Skip all static files and ALL auth API routes
 *     '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
 *   ],
 * };
 */
export declare function createAdminMiddleware(adminPassword: string | undefined): (request: NextRequest) => NextResponse<unknown>;
/**
 * 2. THE LOGIN ACTION
 * Sets the __session cookie for Admin access.
 *
 * @param db - Firestore instance (Dependency Injection)
 * @param appId - App ID for logging
 * @param formData - Login form data
 * @param correctPassword - The expected admin password
 */
export declare function loginAdmin(appId: string, formData: FormData, correctPassword: string | undefined): Promise<{
    success: boolean;
    error: string;
} | {
    success: boolean;
    error?: undefined;
}>;
/**
 * SERVER SESSION HELPER
 * Verifies the __session cookie on the server.
 * Returns the raw cookie value as userId (suitable for password-based admin sessions).
 */
export declare function getSabiServerSession(): Promise<{
    userId: string;
    isAuthenticated: boolean;
} | null>;
/**
 * JWT-AWARE SESSION HELPER (v1.5.0)
 * "Dual-Engine" mode — detects and properly handles Firebase JWT session cookies.
 *
 * The caller supplies a `verifier` callback that performs the actual JWT verification
 * (e.g. firebase-admin's verifySessionCookie). This keeps the library decoupled from
 * firebase-admin while giving apps a clean, standardised way to extract the real UID.
 *
 * @example
 * // In your app:
 * const session = await getSabiVerifiedSession(async (cookie) => {
 *   const claims = await adminAuth.verifySessionCookie(cookie, true);
 *   return { userId: claims.uid };
 * });
 *
 * @param verifier - Async callback that receives the raw cookie value and returns
 *                   `{ userId: string }` on success, or `null` if the token is invalid.
 * @returns `{ userId: string; isAuthenticated: true }` on success, or `null`.
 */
export declare function getSabiVerifiedSession(verifier: (cookie: string) => Promise<{
    userId: string;
} | null>): Promise<{
    userId: string;
    isAuthenticated: boolean;
} | null>;
/**
 * 3. THE LOGOUT ACTION (Generic)
 * Clears the __session cookie and revokes tokens.
 *
 * @param auth - Firebase Auth instance for token revocation
 * @param db - Firestore instance for logging
 * @param appId - App ID for logging
 */
export declare function deleteUserSessionAction(auth: Auth, appId: string): Promise<{
    success: boolean;
}>;
/**
 * GENERIC ACTION: getAuthUserAction
 * verifying the session cookie and returning basic auth metadata.
 * NO DATABASE FETCHING. PURE SESSION VERIFICATION.
 */
export declare function getAuthUserAction(): Promise<{
    isAuthenticated: boolean;
    user: null;
    error?: undefined;
} | {
    isAuthenticated: boolean;
    user: {
        uid: string;
    };
    error?: undefined;
} | {
    isAuthenticated: boolean;
    error: any;
    user?: undefined;
}>;
/**
 * GENERIC ACTION: resolveUserIdentityAction
 * Pure Logic: Returns the finalized profile or a new user template.
 * Does NOT write to DB.
 *
 * @param userId - The user's UID
 * @param defaultRole - Role to assign if user doesn't exist (e.g., 'WAKA')
 * @param userData - The raw user document data (POJO) or null/undefined
 */
export declare function resolveUserIdentityAction(userId: string, defaultRole: string, userData: any): Promise<{
    success: boolean;
    exists: boolean;
    profile: any;
    message?: undefined;
    error?: undefined;
} | {
    success: boolean;
    exists: boolean;
    message: string;
    profile: {
        uid: string;
        role: string;
        creatorNameSet: boolean;
        createdAt: string;
        updatedAt: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    exists?: undefined;
    profile?: undefined;
    message?: undefined;
}>;
/**
 * GENERIC ACTION: updateLockedFieldAction
 * 1. Checks the lock field.
 * 2. Updates the target field.
 * 3. Sets the lock field to true.
 *
 * @param db - Firestore instance (Dependency Injection)
 * @param userId - User UID
 * @param fieldName - Field to update (e.g., 'creatorName')
 * @param value - Value to set
 * @param lockFieldName - Boolean field that locks this update (e.g., 'creatorNameSet')
 * @param pathsToRevalidate - Optional list of paths to revalidate
 */
export declare function updateLockedFieldAction(db: Firestore, userId: string, fieldName: string, value: any, lockFieldName: string, pathsToRevalidate?: string[]): Promise<{
    error: string;
    success?: undefined;
    message?: undefined;
} | {
    success: boolean;
    message: string;
    error?: undefined;
}>;
