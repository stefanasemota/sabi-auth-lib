jest.mock('server-only', () => ({}));

import {
    resolveUserIdentityAction,
    updateLockedFieldAction,
    getAuthUserAction
} from '../application/admin.service';
import { getSabiServerSession } from '../application/admin.service';

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
        (cookies as jest.Mock).mockReturnValue(Promise.resolve(mockCookieStore));
    });

    describe('getAuthUserAction', () => {
        it('should return isAuthenticated: false if session is invalid', async () => {
            mockCookieStore.get.mockReturnValue(undefined);
            const result = await getAuthUserAction();
            expect(result).toEqual({ isAuthenticated: false, user: null });
        });

        it('should return user metadata if session is valid', async () => {
            mockCookieStore.get.mockReturnValue({ value: '123' });
            const result = await getAuthUserAction();
        });

        it('should return error if getSabiServerSession throws', async () => {
            const { getAuthUserAction } = require('../application/admin.service');
            // Mock getSabiServerSession to throw by forcing cookies to throw
            (cookies as jest.Mock).mockImplementationOnce(() => { throw new Error('Cookie error'); });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const result = await getAuthUserAction();

            expect(result.isAuthenticated).toBe(false);
            expect(result.error).toBe('Cookie error');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
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

            const result = await resolveUserIdentityAction('user-123', 'WAKA', mockUserData);

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
            const result = await resolveUserIdentityAction('new-user', 'GUEST', null);

            expect(result.exists).toBe(false);
            expect(result.profile.role).toBe('GUEST');
            expect(result.profile.uid).toBe('new-user');
            expect(result.profile.creatorNameSet).toBe(false);
        });

        it('should handle errors during identity resolution', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            // Pass something that will crash the date conversion
            const result = await resolveUserIdentityAction('user-123', 'WAKA', { createdAt: { toDate: () => { throw new Error('Date error'); } } });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Date error');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });


    describe('loginAdmin', () => {
        let mockDb: any;
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
            expect(mockCookieStore.set).toHaveBeenCalledWith(
                '__session',
                'secure-password',
                expect.any(Object)
            );
            expect(logAuthEvent).toHaveBeenCalledWith({
                uid: 'ADMIN_SHARED',
                appId: 'app-id',
                eventType: 'LOGIN',
                metadata: { type: 'admin_password' }
            });
        });
    });

    describe('deleteUserSessionAction', () => {
        let mockDb: any;
        let mockAuth: any;

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
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error in deleteUserSessionAction (revoke/log):",
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('updateLockedFieldAction', () => {
        let mockDb: any;
        let mockDocGet: jest.Mock;
        let mockDocUpdate: jest.Mock;

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

            const result = await updateLockedFieldAction(
                mockDb,
                'user-123',
                'creatorName',
                'New Name',
                'creatorNameSet'
            );

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

            const result = await updateLockedFieldAction(
                mockDb,
                'user-123',
                'creatorName',
                'New Name',
                'creatorNameSet'
            );

            expect(result.error).toContain('locked');
            expect(mockDocUpdate).not.toHaveBeenCalled();
        });

        it('should throw error if user does not exist', async () => {
            mockDocGet.mockResolvedValue({ exists: false });

            const result = await updateLockedFieldAction(
                mockDb,
                'user-123',
                'creatorName',
                'New Name',
                'creatorNameSet'
            );

            expect(result.error).toContain('User profile not found');
        });
        it('should return error for invalid value', async () => {
            const result = await updateLockedFieldAction(mockDb, 'u1', 'f1', ' ', 'l1');
            expect(result.error).toContain('Invalid value');
        });

        it('should call revalidatePath if paths are provided', async () => {
            const { revalidatePath } = require("next/cache");
            mockDocGet.mockResolvedValue({
                exists: true,
                data: () => ({ creatorNameSet: false })
            });

            await updateLockedFieldAction(
                mockDb,
                'user-123',
                'creatorName',
                'New Name',
                'creatorNameSet',
                ['/admin']
            );

            expect(revalidatePath).toHaveBeenCalledWith('/admin');
        });

        it('should handle non-string values correctly', async () => {
            mockDocGet.mockResolvedValue({
                exists: true,
                data: () => ({ lockField: false })
            });

            await updateLockedFieldAction(
                mockDb,
                'user-123',
                'metadata',
                { key: 'value' },
                'lockField'
            );

            expect(mockDocUpdate).toHaveBeenCalledWith(expect.objectContaining({
                metadata: { key: 'value' }
            }));
        });

        it('should handle database errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            mockDocGet.mockRejectedValue(new Error('DB Down'));

            const result = await updateLockedFieldAction(
                mockDb,
                'user-123',
                'creatorName',
                'New Name',
                'creatorNameSet'
            );

            expect(result.error).toBe('System busy. Try again later.');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
