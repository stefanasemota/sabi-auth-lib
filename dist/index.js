"use strict";
// index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.SabiAuthProvider = void 0;
exports.createAdminMiddleware = createAdminMiddleware;
exports.loginAdmin = loginAdmin;
exports.logoutAdmin = logoutAdmin;
const SabiAuthProvider_1 = require("./SabiAuthProvider");
Object.defineProperty(exports, "SabiAuthProvider", { enumerable: true, get: function () { return SabiAuthProvider_1.SabiAuthProvider; } });
Object.defineProperty(exports, "useAuth", { enumerable: true, get: function () { return SabiAuthProvider_1.useAuth; } });
const server_1 = require("next/server");
/**
 * 1. THE MIDDLEWARE FACTORY
 * Ensures Firebase compatibility and prevents redirect loops.
 */
function createAdminMiddleware(adminPassword) {
    return function middleware(request) {
        const { pathname } = request.nextUrl;
        const authToken = request.cookies.get('__session')?.value;
        // A. LOOP BREAKER: Always allow the login page
        if (pathname.startsWith('/admin-login')) {
            return server_1.NextResponse.next();
        }
        // B. Security: Fail-closed if no password is set
        if (!adminPassword) {
            console.error("AUTH_LIB: ADMIN_PASSWORD missing from Environment.");
            return server_1.NextResponse.redirect(new URL('/admin-login', request.url));
        }
        // C. Protect Admin Dashboard
        if (pathname.startsWith('/admin-dashboard')) {
            if (authToken !== adminPassword) {
                return server_1.NextResponse.redirect(new URL('/admin-login', request.url));
            }
        }
        return server_1.NextResponse.next();
    };
}
/**
 * 2. THE LOGIN ACTION
 * Handles the cookie setting using the required Firebase name.
 */
async function loginAdmin(formData, correctPassword) {
    const password = formData.get('password');
    if (!correctPassword || password !== correctPassword) {
        return { success: false, error: "Invalid credentials" };
    }
    // Import 'cookies' dynamically to avoid issues in some environments
    const { cookies } = await Promise.resolve().then(() => __importStar(require('next/headers')));
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
 * 3. THE LOGOUT ACTION
 * Clears the __session cookie to log the user out.
 */
async function logoutAdmin() {
    // Dynamic import prevents this from breaking in non-server environments
    const { cookies } = await Promise.resolve().then(() => __importStar(require('next/headers')));
    // In Next.js 14.2.5, we call cookies() directly. 
    // We use 'await' here to be "Future-Proof" for Next.js 15.
    const cookieStore = await cookies();
    cookieStore.delete('__session');
    return { success: true };
}
