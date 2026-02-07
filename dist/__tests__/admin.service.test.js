"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_service_1 = require("../application/admin.service");
// Mock dependencies
jest.mock('../application/admin.service', () => {
    const originalModule = jest.requireActual('../application/admin.service');
    return {
        ...originalModule,
        getSabiServerSession: jest.fn(),
    };
});
const mockCookieStore = {
    get: jest.fn(),
    delete: jest.fn(),
    set: jest.fn()
};
// Mock Next.js headers and cache
jest.mock("next/headers", () => ({
    cookies: jest.fn().mockReturnValue(mockCookieStore)
}));
jest.mock("next/cache", () => ({
    revalidatePath: jest.fn()
}));
describe('Admin Service (Generic Auth Actions)', () => {
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
            expect(result.error).toContain('System busy'); // Catches the thrown error
        });
    });
});
