import { vi } from 'vitest';

export const mockGetIdToken = vi.fn().mockResolvedValue('mocked_id_token');

export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  getIdToken: mockGetIdToken,
};

export const mockSignInWithPopup = vi.fn().mockResolvedValue({ user: mockUser });
export const mockSignOut = vi.fn().mockResolvedValue(undefined);

// Helper array to store registered callbacks for onIdTokenChanged
export const onIdTokenChangedCallbacks: ((user: any) => void)[] = [];

export const mockOnIdTokenChanged = vi.fn((auth, callback) => {
  onIdTokenChangedCallbacks.push(callback);
  // Initially trigger with null or existing user based on needs, we'll keep it simple
  return () => {
    // Unsubscribe function
    const index = onIdTokenChangedCallbacks.indexOf(callback);
    if (index > -1) {
      onIdTokenChangedCallbacks.splice(index, 1);
    }
  };
});

// Mock for getAuth
export const mockGetAuth = vi.fn(() => ({
  currentUser: null,
}));

export const triggerIdTokenChanged = (user: any) => {
  onIdTokenChangedCallbacks.forEach(cb => cb(user));
};

vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>();
  return {
    ...actual,
    getAuth: mockGetAuth,
    signInWithPopup: mockSignInWithPopup,
    signOut: mockSignOut,
    onIdTokenChanged: mockOnIdTokenChanged,
    GoogleAuthProvider: class {
        constructor() {}
        setCustomParameters = vi.fn();
    },
  };
});
