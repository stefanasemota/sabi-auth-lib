"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_service_1 = require("../application/admin.service");
const server_1 = require("next/server");
// Mock next/server
jest.mock("next/server", () => ({
    NextResponse: {
        next: jest.fn(() => ({ type: "next" })),
        redirect: jest.fn((url) => ({ type: "redirect", url })),
    },
    NextRequest: jest.fn(),
}));
// Mock next/headers
const mockCookieStore = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
};
jest.mock("next/headers", () => ({
    cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
}));
describe("Admin Application Service", () => {
    const adminPassword = "secret_password";
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("createAdminMiddleware", () => {
        it("should allow /admin-login bypass", () => {
            const middleware = (0, admin_service_1.createAdminMiddleware)(adminPassword);
            const req = {
                nextUrl: { pathname: "/admin-login" },
                cookies: { get: () => undefined },
                url: "http://localhost/admin-login",
            };
            const res = middleware(req);
            expect(server_1.NextResponse.next).toHaveBeenCalled();
        });
        it("should redirect if ADMIN_PASSWORD is missing in env", () => {
            const middleware = (0, admin_service_1.createAdminMiddleware)(undefined);
            const req = {
                nextUrl: { pathname: "/anywhere" },
                cookies: { get: () => undefined },
                url: "http://localhost/anywhere",
            };
            const res = middleware(req);
            expect(server_1.NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/admin-login" }));
        });
        it("should redirect /admin-dashboard if unauthorized", () => {
            const middleware = (0, admin_service_1.createAdminMiddleware)(adminPassword);
            const req = {
                nextUrl: { pathname: "/admin-dashboard" },
                cookies: { get: () => ({ value: "wrong_token" }) },
                url: "http://localhost/admin-dashboard",
            };
            const res = middleware(req);
            expect(server_1.NextResponse.redirect).toHaveBeenCalled();
        });
        it("should allow /admin-dashboard if authorized", () => {
            const middleware = (0, admin_service_1.createAdminMiddleware)(adminPassword);
            const req = {
                nextUrl: { pathname: "/admin-dashboard" },
                cookies: { get: () => ({ value: adminPassword }) },
                url: "http://localhost/admin-dashboard",
            };
            const res = middleware(req);
            expect(server_1.NextResponse.next).toHaveBeenCalled();
        });
    });
    describe("loginAdmin", () => {
        it("should fail with invalid credentials", async () => {
            const formData = new FormData();
            formData.set("password", "wrong");
            const result = await (0, admin_service_1.loginAdmin)(formData, adminPassword);
            expect(result.success).toBe(false);
        });
        it("should succeed and set cookie with valid credentials", async () => {
            const formData = new FormData();
            formData.set("password", adminPassword);
            const result = await (0, admin_service_1.loginAdmin)(formData, adminPassword);
            expect(result.success).toBe(true);
            expect(mockCookieStore.set).toHaveBeenCalledWith("__session", adminPassword, expect.any(Object));
        });
    });
    describe("getSabiServerSession", () => {
        it("should return null if no session cookie", async () => {
            mockCookieStore.get.mockReturnValue(undefined);
            const session = await (0, admin_service_1.getSabiServerSession)();
            expect(session).toBeNull();
        });
        it("should return session if cookie exists", async () => {
            mockCookieStore.get.mockReturnValue({ value: "some_token" });
            const session = await (0, admin_service_1.getSabiServerSession)();
            expect(session).toEqual({
                userId: "some_token",
                isAuthenticated: true,
            });
        });
    });
    describe("logoutAdmin", () => {
        it("should delete session cookie", async () => {
            await (0, admin_service_1.logoutAdmin)();
            expect(mockCookieStore.delete).toHaveBeenCalledWith("__session");
        });
    });
});
