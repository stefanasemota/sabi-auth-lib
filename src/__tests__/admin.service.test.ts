
import { createAdminMiddleware, loginAdmin, logoutAdmin, getSabiServerSession } from "../application/admin.service";
import { NextResponse } from "next/server";

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
            const middleware = createAdminMiddleware(adminPassword);
            const req = {
                nextUrl: { pathname: "/admin-login" },
                cookies: { get: () => undefined },
                url: "http://localhost/admin-login",
            } as any;

            const res = middleware(req);
            expect(NextResponse.next).toHaveBeenCalled();
        });

        it("should redirect if ADMIN_PASSWORD is missing in env", () => {
            const middleware = createAdminMiddleware(undefined);
            const req = {
                nextUrl: { pathname: "/anywhere" },
                cookies: { get: () => undefined },
                url: "http://localhost/anywhere",
            } as any;

            const res = middleware(req);
            expect(NextResponse.redirect).toHaveBeenCalledWith(
                expect.objectContaining({ pathname: "/admin-login" })
            );
        });

        it("should redirect /admin-dashboard if unauthorized", () => {
            const middleware = createAdminMiddleware(adminPassword);
            const req = {
                nextUrl: { pathname: "/admin-dashboard" },
                cookies: { get: () => ({ value: "wrong_token" }) },
                url: "http://localhost/admin-dashboard",
            } as any;

            const res = middleware(req);
            expect(NextResponse.redirect).toHaveBeenCalled();
        });

        it("should allow /admin-dashboard if authorized", () => {
            const middleware = createAdminMiddleware(adminPassword);
            const req = {
                nextUrl: { pathname: "/admin-dashboard" },
                cookies: { get: () => ({ value: adminPassword }) },
                url: "http://localhost/admin-dashboard",
            } as any;

            const res = middleware(req);
            expect(NextResponse.next).toHaveBeenCalled();
        });
    });

    describe("loginAdmin", () => {
        it("should fail with invalid credentials", async () => {
            const formData = new FormData();
            formData.set("password", "wrong");
            const result = await loginAdmin(formData, adminPassword);
            expect(result.success).toBe(false);
        });

        it("should succeed and set cookie with valid credentials", async () => {
            const formData = new FormData();
            formData.set("password", adminPassword);
            const result = await loginAdmin(formData, adminPassword);

            expect(result.success).toBe(true);
            expect(mockCookieStore.set).toHaveBeenCalledWith(
                "__session",
                adminPassword,
                expect.any(Object)
            );
        });
    });

    describe("getSabiServerSession", () => {
        it("should return null if no session cookie", async () => {
            mockCookieStore.get.mockReturnValue(undefined);
            const session = await getSabiServerSession();
            expect(session).toBeNull();
        });

        it("should return session if cookie exists", async () => {
            mockCookieStore.get.mockReturnValue({ value: "some_token" });
            const session = await getSabiServerSession();
            expect(session).toEqual({
                userId: "some_token",
                isAuthenticated: true,
            });
        });
    });

    describe("logoutAdmin", () => {
        it("should delete session cookie", async () => {
            await logoutAdmin();
            expect(mockCookieStore.delete).toHaveBeenCalledWith("__session");
        });
    });
});
