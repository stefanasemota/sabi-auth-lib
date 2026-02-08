/**
 * @fileoverview Admin Application Service
 * Contains business logic for Admin authentication and session management.
 * Layer: Application Services (Onion Architecture)
 */

import 'server-only';

import { NextResponse, NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { logAuthEvent } from "@stefanasemota/sabi-logger";

/**
 * 1. THE MIDDLEWARE FACTORY
 * Ensures Firebase compatibility and prevents redirect loops.
 */
export function createAdminMiddleware(adminPassword: string | undefined) {
    return function middleware(request: NextRequest) {
        const { pathname } = request.nextUrl;
        const authToken = request.cookies.get("__session")?.value;

        if (pathname.startsWith("/admin-login")) {
            return NextResponse.next();
        }

        if (!adminPassword) {
            console.error("AUTH_LIB: ADMIN_PASSWORD missing from Environment.");
            return NextResponse.redirect(new URL("/admin-login", request.url));
        }

        if (pathname.startsWith("/admin-dashboard")) {
            if (authToken !== adminPassword) {
                return NextResponse.redirect(new URL("/admin-login", request.url));
            }
        }

        return NextResponse.next();
    };
}

// ... imports are already there ...

/**
 * 2. THE LOGIN ACTION
 * Sets the __session cookie for Admin access.
 * 
 * @param db - Firestore instance (Dependency Injection)
 * @param appId - App ID for logging
 * @param formData - Login form data
 * @param correctPassword - The expected admin password
 */
export async function loginAdmin(
    appId: string,
    formData: FormData,
    correctPassword: string | undefined
) {
    const password = formData.get("password");

    if (!correctPassword || password !== correctPassword) {
        return { success: false, error: "Invalid credentials" };
    }

    const cookieStore = await cookies();

    cookieStore.set("__session", correctPassword, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Log the generic admin login
    await logAuthEvent({
        uid: "ADMIN_SHARED",
        appId,
        eventType: "LOGIN",
        metadata: { type: "admin_password" }
    });

    return { success: true };
}

/**
 * SERVER SESSION HELPER
 * Verifies the __session cookie on the server.
 */
export async function getSabiServerSession() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("__session")?.value;

    if (!sessionToken) return null;

    return {
        userId: sessionToken,
        isAuthenticated: true,
    };
}

/**
 * 3. THE LOGOUT ACTION (Generic)
 * Clears the __session cookie and revokes tokens.
 * 
 * @param auth - Firebase Auth instance for token revocation
 * @param db - Firestore instance for logging
 * @param appId - App ID for logging
 */
export async function deleteUserSessionAction(
    auth: Auth,
    appId: string
) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("__session")?.value;

    if (sessionToken) {
        try {
            // Revoke refresh tokens for the user
            await auth.revokeRefreshTokens(sessionToken);

            // Log the logout event
            await logAuthEvent({
                uid: sessionToken,
                appId,
                eventType: "LOGOUT"
            });
        } catch (error) {
            console.error("Error in deleteUserSessionAction (revoke/log):", error);
            // Non-blocking error, still clear cookie
        }
    }

    cookieStore.delete("__session");
    return { success: true };
}

// ============================================================================
// PART 4: GENERIC AUTH ACTIONS (v1.3.9)
// ============================================================================

/**
 * GENERIC ACTION: getAuthUserAction
 * verifying the session cookie and returning basic auth metadata.
 * NO DATABASE FETCHING. PURE SESSION VERIFICATION.
 */
export async function getAuthUserAction() {
    try {
        const session = await getSabiServerSession();

        if (!session || !session.isAuthenticated) {
            return { isAuthenticated: false, user: null };
        }

        return {
            isAuthenticated: true,
            user: {
                uid: session.userId,
                // We don't have email/displayName in the cookie-only session
                // The app must fetch profile if needed.
            }
        };
    } catch (error: any) {
        console.error("❌ Error in getAuthUserAction:", error);
        return { isAuthenticated: false, error: error.message };
    }
}

/**
 * GENERIC ACTION: resolveUserIdentityAction
 * Pure Logic: Returns the finalized profile or a new user template.
 * Does NOT write to DB.
 * 
 * @param userId - The user's UID
 * @param defaultRole - Role to assign if user doesn't exist (e.g., 'WAKA')
 * @param userData - The raw user document data (POJO) or null/undefined
 */
export async function resolveUserIdentityAction(userId: string, defaultRole: string, userData: any) {
    try {
        if (userData) {
            // 1. User exists, return their serialized data
            return {
                success: true,
                exists: true,
                profile: {
                    ...userData,
                    uid: userId,
                    // Mandatory serialization for Next.js 15
                    createdAt: userData?.createdAt?.toDate ? userData.createdAt.toDate().toISOString() : userData?.createdAt,
                    updatedAt: userData?.updatedAt?.toDate ? userData.updatedAt.toDate().toISOString() : userData?.updatedAt,
                }
            };
        }

        // 2. NEW USER: Create the initial profile template
        const newProfile = {
            uid: userId,
            role: defaultRole, // "WAKA", "USER", etc.
            creatorNameSet: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return {
            success: true,
            exists: false,
            message: "User profile initialized.",
            profile: newProfile
        };
    } catch (error: any) {
        console.error("❌ Error resolving user identity:", error);
        return { success: false, error: error.message };
    }
}

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
export async function updateLockedFieldAction(
    db: Firestore,
    userId: string,
    fieldName: string,
    value: any,
    lockFieldName: string,
    pathsToRevalidate: string[] = []
) {
    // 1. Validation
    if (!value || (typeof value === 'string' && value.trim().length < 2)) {
        return { error: `Invalid value for ${fieldName}.` };
    }

    try {
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return { error: "User profile not found." };
        }

        const userData = userDoc.data();

        // 2. THE SECURITY LOCK
        if (userData?.[lockFieldName] === true) {
            return {
                error: `This field is locked. Contact support to change.`
            };
        }

        // 3. ATOMIC UPDATE
        // We use a plain object update. Caller provides db, so we assume server env.
        await userRef.update({
            [fieldName]: typeof value === 'string' ? value.trim() : value,
            [lockFieldName]: true, // Lock the vault
            updatedAt: new Date().toISOString() // Assuming string storage for standard
        });

        // 4. SYNC CACHE
        if (pathsToRevalidate.length > 0) {
            pathsToRevalidate.forEach(p => revalidatePath(p));
        }

        return {
            success: true,
            message: `Locked! ${fieldName} set to: ${value}`
        };
    } catch (error: any) {
        console.error("❌ Error in updateLockedFieldAction:", error);
        return { error: "System busy. Try again later." };
    }
}