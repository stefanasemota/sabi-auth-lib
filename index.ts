// index.ts
import { NextResponse, NextRequest } from 'next/server';

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