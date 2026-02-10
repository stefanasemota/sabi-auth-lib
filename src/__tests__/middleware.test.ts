jest.mock('server-only', () => ({}));

import { createAdminMiddleware } from '../application/admin.service';
import { NextRequest, NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        next: jest.fn().mockReturnValue({ type: 'next' }),
        redirect: jest.fn().mockImplementation((url) => ({ type: 'redirect', url })),
    },
}));

describe('Admin Middleware', () => {
    const adminPassword = 'secret-password';
    const middleware = createAdminMiddleware(adminPassword);

    const createMockRequest = (pathname: string, sessionValue?: string) => {
        return {
            nextUrl: { pathname },
            url: `http://localhost:3000${pathname}`,
            cookies: {
                get: jest.fn().mockReturnValue(sessionValue ? { value: sessionValue } : undefined),
            },
        } as unknown as NextRequest;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should allow access to /admin-login without a session', () => {
        const req = createMockRequest('/admin-login');
        const res = middleware(req);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(res).toEqual({ type: 'next' });
    });

    it('should redirect to /admin-login if adminPassword is missing', () => {
        const brokenMiddleware = createAdminMiddleware(undefined);
        const req = createMockRequest('/admin-dashboard');

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const res = brokenMiddleware(req);

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ADMIN_PASSWORD missing'));
        expect(NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({
            pathname: '/admin-login'
        }));
        expect(res).toEqual({ type: 'redirect', url: expect.any(Object) });

        consoleSpy.mockRestore();
    });

    it('should redirect to /admin-login if /admin-dashboard is accessed without session', () => {
        const req = createMockRequest('/admin-dashboard');
        const res = middleware(req);

        expect(NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({
            pathname: '/admin-login'
        }));
        expect(res).toEqual({ type: 'redirect', url: expect.any(Object) });
    });

    it('should redirect to /admin-login if session token does not match password', () => {
        const req = createMockRequest('/admin-dashboard', 'wrong-password');
        const res = middleware(req);

        expect(NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({
            pathname: '/admin-login'
        }));
    });

    it('should allow access to /admin-dashboard if session token matches password', () => {
        const req = createMockRequest('/admin-dashboard', adminPassword);
        const res = middleware(req);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(res).toEqual({ type: 'next' });
    });

    it('should allow access to non-admin routes even without session', () => {
        const req = createMockRequest('/any-other-route');
        const res = middleware(req);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(res).toEqual({ type: 'next' });
    });
});
