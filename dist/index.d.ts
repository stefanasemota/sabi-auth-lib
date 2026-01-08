/**
 * @fileoverview Sabi Auth Library Entry Point
 * Exports both Client-side Provider/Hook and Server-side Middleware/Session helpers.
 */
import { SabiAuthProvider, useAuth } from "./SabiAuthProvider";
import { NextResponse, NextRequest } from "next/server";
export { SabiAuthProvider, useAuth };
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
export declare function getSabiServerSession(req?: NextRequest): Promise<{
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
