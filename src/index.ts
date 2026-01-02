// index.ts

import { SabiAuthProvider, useAuth } from './SabiAuthProvider';
import { NextResponse, NextRequest } from 'next/server';

// Explicitly export them by name
export { SabiAuthProvider, useAuth };

/**
 * 1. THE MIDDLEWARE FACTORY
 * Ensures Firebase compatibility and prevents redirect loops.
 */
export function createAdminMiddleware(adminPassword: string | undefined) {
  return function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authToken = request.cookies.get('__session')?.value;

    // A. LOOP BREAKER: Always allow the login page
    if (pathname.startsWith('/admin-login')) {
      return NextResponse.next();
    }

    // B. Security: Fail-closed if no password is set
    if (!adminPassword) {
      console.error("AUTH_LIB: ADMIN_PASSWORD missing from Environment.");
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }

    // C. Protect Admin Dashboard
    if (pathname.startsWith('/admin-dashboard')) {
      if (authToken !== adminPassword) {
        return NextResponse.redirect(new URL('/admin-login', request.url));
      }
    }

    return NextResponse.next();
  };
}

/**
 * 2. THE LOGIN ACTION
 * Handles the cookie setting using the required Firebase name.
 */
export async function loginAdmin(formData: FormData, correctPassword: string | undefined) {
  const password = formData.get('password');

  if (!correctPassword || password !== correctPassword) {
    return { success: false, error: "Invalid credentials" };
  }

  // Import 'cookies' dynamically to avoid issues in some environments
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  cookieStore.set('__session', correctPassword, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return { success: true };
}


/**
 * SERVER SESSION HELPER
 * Reads the Firebase session cookie or Auth header.
 */
export async function getSabiServerSession(req?: NextRequest) {
  // We use dynamic imports for 'next/headers' to prevent 
  // client-side bundling errors in your library.
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  // Firebase Auth usually stores the token in a cookie named '__session'
  // (This is required if you use Firebase Hosting)
  const sessionToken = cookieStore.get('__session')?.value;

  if (!sessionToken) return null;

  // For now, we return the raw token or a mock object.
  // In a full implementation, you would use firebase-admin here to verify.
  return {
    userId: sessionToken, // We'll store the UID in the cookie for simplicity
    isAuthenticated: true
  };
}

/**
 * 3. THE LOGOUT ACTION
 * Clears the __session cookie to log the user out.
 */
export async function logoutAdmin() {
    // Dynamic import prevents this from breaking in non-server environments
    const { cookies } = await import('next/headers');
    
    // In Next.js 14.2.5, we call cookies() directly. 
    // We use 'await' here to be "Future-Proof" for Next.js 15.
    const cookieStore = await cookies();
    
    cookieStore.delete('__session');
    
    return { success: true };
}