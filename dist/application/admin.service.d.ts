/**
 * @fileoverview Admin Application Service
 * Contains business logic for Admin authentication and session management.
 * Layer: Application Services (Onion Architecture)
 */
import { NextResponse, NextRequest } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
/**
 * 1. THE MIDDLEWARE FACTORY
 * Ensures Firebase compatibility and prevents redirect loops.
 */
export declare function createAdminMiddleware(adminPassword: string | undefined): (request: NextRequest) => NextResponse<unknown>;
/**
 * 2. THE LOGIN ACTION
 * Sets the __session cookie for Admin access.
 */
export declare function loginAdmin(formData: FormData, correctPassword: string | undefined): Promise<{
    success: boolean;
    error: string;
} | {
    success: boolean;
    error?: undefined;
}>;
/**
 * SERVER SESSION HELPER
 * Verifies the __session cookie on the server.
 */
export declare function getSabiServerSession(): Promise<{
    userId: string;
    isAuthenticated: boolean;
} | null>;
/**
 * 3. THE LOGOUT ACTION
 * Clears the __session cookie.
 */
export declare function logoutAdmin(): Promise<{
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
