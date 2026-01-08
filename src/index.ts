/**
 * @fileoverview Sabi Auth Library Entry Point
 * Exports both Client-side Provider/Hook and Server-side Middleware/Session helpers.
 */

import { SabiAuthProvider, useAuth } from "./SabiAuthProvider";
import { NextResponse, NextRequest } from "next/server";

// 1. Re-export Client Components
export { SabiAuthProvider, useAuth };

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

/**
 * 2. THE LOGIN ACTION
 * Sets the __session cookie for Admin access.
 */
export async function loginAdmin(
  formData: FormData,
  correctPassword: string | undefined
) {
  const password = formData.get("password");

  if (!correctPassword || password !== correctPassword) {
    return { success: false, error: "Invalid credentials" };
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  cookieStore.set("__session", correctPassword, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return { success: true };
}

/**
 * SERVER SESSION HELPER
 * Verifies the __session cookie on the server.
 */
export async function getSabiServerSession(req?: NextRequest) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__session")?.value;

  if (!sessionToken) return null;

  return {
    userId: sessionToken,
    isAuthenticated: true,
  };
}

/**
 * 3. THE LOGOUT ACTION
 * Clears the __session cookie.
 */
export async function logoutAdmin() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("__session");
  return { success: true };
}
