import { NextResponse, NextRequest } from 'next/server';
/**
 * 1. THE MIDDLEWARE FACTORY
 * Ensures Firebase compatibility and prevents redirect loops.
 */
export declare function createAdminMiddleware(adminPassword: string | undefined): (request: NextRequest) => NextResponse<unknown>;
/**
 * 2. THE LOGIN ACTION
 * Handles the cookie setting using the required Firebase name.
 */
export declare function loginAdmin(formData: FormData, correctPassword: string | undefined): Promise<{
    success: boolean;
    error: string;
} | {
    success: boolean;
    error?: undefined;
}>;
/**
 * 3. THE LOGOUT ACTION
 * Clears the __session cookie to log the user out.
 */
export declare function logoutAdmin(): Promise<{
    success: boolean;
}>;
