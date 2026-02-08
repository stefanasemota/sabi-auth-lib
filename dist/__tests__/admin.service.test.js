"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_service_1 = require("../application/admin.service");
// Mock Next.js headers with a factory that allows dynamic return values
jest.mock("next/headers", () => ({
    cookies: jest.fn(),
}));
jest.mock("next/cache", () => ({
    revalidatePath: jest.fn()
}));
jest.mock("@stefanasemota/sabi-logger", () => ({
    logAuthEvent: jest.fn()
}), { virtual: true });
describe('Admin Service (Generic Auth Actions)', () => {
    // Setup the mock return value before tests
    const mockCookieStore = {
        get: jest.fn(),
        delete: jest.fn(),
        set: jest.fn()
    };
    // We need to access the mocked cookies function to set its return value
    const { cookies } = require("next/headers");
    beforeEach(() => {
        jest.clearAllMocks();
        cookies.mockReturnValue(Promise.resolve(mockCookieStore));
    });
    describe('getAuthUserAction', () => {
        it('should return isAuthenticated: false if session is invalid', async () => {
            mockCookieStore.get.mockReturnValue(undefined);
            const result = await (0, admin_service_1.getAuthUserAction)();
            expect(result).toEqual({ isAuthenticated: false, user: null });
        });
        it('should return user metadata if session is valid', async () => {
            mockCookieStore.get.mockReturnValue({ value: '123' });
            const result = await (0, admin_service_1.getAuthUserAction)();
            expect(result).toEqual({
                isAuthenticated: true,
                user: { uid: '123' }
            });
        });
    });
    describe('resolveUserIdentityAction', () => {
        it('should return existing user profile with serialized dates', async () => {
            const mockDate = new Date('2023-01-01');
            const mockUserData = {
                role: 'USER',
                createdAt: { toDate: () => mockDate },
                updatedAt: { toDate: () => mockDate } // Mock Firestore Timestamp
            };
            const result = await (0, admin_service_1.resolveUserIdentityAction)('user-123', 'WAKA', mockUserData);
            expect(result).toEqual({
                success: true,
                exists: true,
                profile: {
                    role: 'USER',
                    uid: 'user-123',
                    createdAt: mockDate.toISOString(),
                    updatedAt: mockDate.toISOString()
                }
            });
        });
        it('should return new user template if user does not exist', async () => {
            const result = await (0, admin_service_1.resolveUserIdentityAction)('new-user', 'GUEST', null);
            expect(result.exists).toBe(false);
            expect(result.profile.role).toBe('GUEST');
            expect(result.profile.uid).toBe('new-user');
            expect(result.profile.creatorNameSet).toBe(false);
            expect(typeof result.profile.createdAt).toBe('string');
        });
    });
    describe('loginAdmin', () => {
        let mockDb;
        const mockFormData = new FormData();
        mockFormData.append('password', 'secure-password');
        beforeEach(() => {
            mockDb = { collection: jest.fn() };
        });
        it('should return error for invalid credentials', async () => {
            const { loginAdmin } = require('../application/admin.service');
            const result = await loginAdmin('app-id', mockFormData, 'wrong-password');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid credentials');
        });
        it('should set cookie and log event on success', async () => {
            const { loginAdmin } = require('../application/admin.service');
            const { logAuthEvent } = require('@stefanasemota/sabi-logger');
            const result = await loginAdmin('app-id', mockFormData, 'secure-password');
            expect(result.success).toBe(true);
            expect(mockCookieStore.set).toHaveBeenCalledWith('__session', 'secure-password', expect.any(Object));
            expect(logAuthEvent).toHaveBeenCalledWith({
                uid: 'ADMIN_SHARED',
                appId: 'app-id',
                eventType: 'LOGIN',
                metadata: { type: 'admin_password' }
            });
        });
    });
    describe('deleteUserSessionAction', () => {
        let mockDb;
        let mockAuth;
        beforeEach(() => {
            mockDb = { collection: jest.fn() };
            mockAuth = { revokeRefreshTokens: jest.fn() };
        });
        it('should revoke tokens, log logout, and delete cookie', async () => {
            mockCookieStore.get.mockReturnValue({ value: 'user-123' });
            const { deleteUserSessionAction } = require('../application/admin.service');
            const { logAuthEvent } = require('@stefanasemota/sabi-logger');
            const result = await deleteUserSessionAction(mockAuth, 'app-id');
            expect(result.success).toBe(true);
            expect(mockAuth.revokeRefreshTokens).toHaveBeenCalledWith('user-123');
            expect(logAuthEvent).toHaveBeenCalledWith({
                uid: 'user-123',
                appId: 'app-id',
                eventType: 'LOGOUT'
            });
            expect(mockCookieStore.delete).toHaveBeenCalledWith('__session');
        });
        it('should handle errors cleanly (non-blocking)', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            mockCookieStore.get.mockReturnValue({ value: 'user-123' });
            mockAuth.revokeRefreshTokens.mockRejectedValue(new Error('Firebase error'));
            const { deleteUserSessionAction } = require('../application/admin.service');
            // Should not throw
            const result = await deleteUserSessionAction(mockAuth, 'app-id');
            expect(result.success).toBe(true);
            expect(mockCookieStore.delete).toHaveBeenCalledWith('__session');
            // Verify error logging but suppress output
            expect(consoleSpy).toHaveBeenCalledWith("Error in deleteUserSessionAction (revoke/log):", expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
    describe('updateLockedFieldAction', () => {
        let mockDb;
        let mockDocGet;
        let mockDocUpdate;
        beforeEach(() => {
            mockDocGet = jest.fn();
            mockDocUpdate = jest.fn();
            mockDb = {
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue({
                        get: mockDocGet,
                        update: mockDocUpdate
                    })
                })
            };
        });
        it('should update field if not locked', async () => {
            mockDocGet.mockResolvedValue({
                exists: true,
                data: () => ({ creatorNameSet: false })
            });
            const result = await (0, admin_service_1.updateLockedFieldAction)(mockDb, 'user-123', 'creatorName', 'New Name', 'creatorNameSet');
            expect(result.success).toBe(true);
            expect(mockDocUpdate).toHaveBeenCalledWith(expect.objectContaining({
                creatorName: 'New Name',
                creatorNameSet: true
            }));
        });
        it('should fail if field is already locked', async () => {
            mockDocGet.mockResolvedValue({
                exists: true,
                data: () => ({ creatorNameSet: true })
            });
            const result = await (0, admin_service_1.updateLockedFieldAction)(mockDb, 'user-123', 'creatorName', 'New Name', 'creatorNameSet');
            expect(result.error).toContain('locked');
            expect(mockDocUpdate).not.toHaveBeenCalled();
        });
        it('should throw error if user does not exist', async () => {
            mockDocGet.mockResolvedValue({ exists: false });
            const result = await (0, admin_service_1.updateLockedFieldAction)(mockDb, 'user-123', 'creatorName', 'New Name', 'creatorNameSet');
            expect(result.error).toContain('User profile not found');
        });
    });
});
