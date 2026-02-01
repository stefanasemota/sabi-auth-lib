"use strict";
/**
 * @fileoverview Admin Application Service
 * Contains business logic for Admin authentication and session management.
 * Layer: Application Services (Onion Architecture)
 */
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
exports.createAdminMiddleware = createAdminMiddleware;
exports.loginAdmin = loginAdmin;
exports.getSabiServerSession = getSabiServerSession;
exports.logoutAdmin = logoutAdmin;
const server_1 = require("next/server");
/**
 * 1. THE MIDDLEWARE FACTORY
 * Ensures Firebase compatibility and prevents redirect loops.
 */
function createAdminMiddleware(adminPassword) {
    return function middleware(request) {
        const { pathname } = request.nextUrl;
        const authToken = request.cookies.get("__session")?.value;
        if (pathname.startsWith("/admin-login")) {
            return server_1.NextResponse.next();
        }
        if (!adminPassword) {
            console.error("AUTH_LIB: ADMIN_PASSWORD missing from Environment.");
            return server_1.NextResponse.redirect(new URL("/admin-login", request.url));
        }
        if (pathname.startsWith("/admin-dashboard")) {
            if (authToken !== adminPassword) {
                return server_1.NextResponse.redirect(new URL("/admin-login", request.url));
            }
        }
        return server_1.NextResponse.next();
    };
}
/**
 * 2. THE LOGIN ACTION
 * Sets the __session cookie for Admin access.
 */
async function loginAdmin(formData, correctPassword) {
    const password = formData.get("password");
    if (!correctPassword || password !== correctPassword) {
        return { success: false, error: "Invalid credentials" };
    }
    const { cookies } = await Promise.resolve().then(() => __importStar(require("next/headers")));
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
async function getSabiServerSession(req) {
    const { cookies } = await Promise.resolve().then(() => __importStar(require("next/headers")));
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("__session")?.value;
    if (!sessionToken)
        return null;
    return {
        userId: sessionToken,
        isAuthenticated: true,
    };
}
/**
 * 3. THE LOGOUT ACTION
 * Clears the __session cookie.
 */
async function logoutAdmin() {
    const { cookies } = await Promise.resolve().then(() => __importStar(require("next/headers")));
    const cookieStore = await cookies();
    cookieStore.delete("__session");
    return { success: true };
}
