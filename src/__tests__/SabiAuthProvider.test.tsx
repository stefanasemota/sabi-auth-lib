/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SabiAuthProvider, useAuth } from '../SabiAuthProvider';
import { onIdTokenChanged, signInWithPopup, signOut } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

// --- MOCKS ---

const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    getIdToken: jest.fn().mockResolvedValue('fake-id-token-123'),
};

// Mock Firebase App
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(),
    getApps: jest.fn(() => []),
}));

// Mock Firebase Auth — includes onIdTokenChanged for v0.3.0
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({
        setCustomParameters: jest.fn(),
    })),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    onIdTokenChanged: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
}));

// Test Component to consume the Context
const TestConsumer = () => {
    const { user, loading, isAuthenticating, login, logout } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (isAuthenticating) return <div data-testid="authenticating">Authenticating...</div>;
    if (!user) return <button onClick={login}>Login</button>;
    return (
        <div>
            <span data-testid="user-email">{user.email}</span>
            <span data-testid="is-admin">{user.isAdmin ? 'ADMIN' : 'USER'}</span>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe('SabiAuthProvider', () => {
    const firebaseConfig = { apiKey: 'test' };

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn().mockResolvedValue({ ok: true });
    });

    // =========================================================================
    // EXISTING TESTS (backwards-compat)
    // =========================================================================

    it('renders loading state initially', () => {
        (onIdTokenChanged as jest.Mock).mockImplementation(() => jest.fn());
        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );
        expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('handles unauthenticated state', async () => {
        (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn();
        });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        await waitFor(() => expect(screen.getByText('Login')).toBeDefined());
    });

    it('handles authenticated regular user (NOT admin)', async () => {
        (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(mockUser);
            return jest.fn();
        });
        (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        await waitFor(() => expect(screen.getByTestId('user-email').textContent).toBe(mockUser.email));
        expect(screen.getByTestId('is-admin').textContent).toBe('USER');
    });

    it('handles authenticated ADMIN user', async () => {
        (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(mockUser);
            return jest.fn();
        });
        (getDoc as jest.Mock).mockResolvedValue({ exists: () => true });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        await waitFor(() => expect(screen.getByTestId('is-admin').textContent).toBe('ADMIN'));
    });

    it('ignores undefined user from Firebase (intermediate state)', async () => {
        (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(undefined);
            return jest.fn();
        });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('handles Firestore error gracefully (defaults to non-admin)', async () => {
        (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(mockUser);
            return jest.fn();
        });
        (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore failed'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        await waitFor(() => expect(screen.getByTestId('is-admin').textContent).toBe('USER'));
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Admin check failed'),
            expect.any(Error)
        );
        consoleSpy.mockRestore();
    });

    it('calls logout function', async () => {
        (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(mockUser);
            return jest.fn();
        });
        (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
        (signOut as jest.Mock).mockResolvedValue(undefined);

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        await waitFor(() => screen.getByText('Logout'));

        act(() => {
            screen.getByText('Logout').click();
        });

        expect(signOut).toHaveBeenCalled();
    });

    it('calls onLoginCallback when user signs in', async () => {
        const onLoginCallback = jest.fn().mockResolvedValue(undefined);
        (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(mockUser);
            return jest.fn();
        });
        (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig} onLoginCallback={onLoginCallback}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        await waitFor(() => expect(onLoginCallback).toHaveBeenCalledWith(mockUser.uid));
    });

    it('handles onLoginCallback errors gracefully', async () => {
        const onLoginCallback = jest.fn().mockRejectedValue(new Error('Callback failed'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(mockUser);
            return jest.fn();
        });
        (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig} onLoginCallback={onLoginCallback}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        await waitFor(() => expect(onLoginCallback).toHaveBeenCalled());
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Login callback failed'),
            expect.any(Error)
        );
        consoleSpy.mockRestore();
    });

    // =========================================================================
    // v0.3.0 TESTS
    // =========================================================================

    describe('v0.3.0: Optimistic UI — isAuthenticating', () => {
        it('sets isAuthenticating to true immediately when login() is called', async () => {
            (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
                callback(null); // no user
                return jest.fn();
            });

            // signInWithPopup never resolves so isAuthenticating stays true
            (signInWithPopup as jest.Mock).mockImplementation(() => new Promise(() => { }));

            render(
                <SabiAuthProvider firebaseConfig={firebaseConfig}>
                    <TestConsumer />
                </SabiAuthProvider>
            );

            await waitFor(() => screen.getByText('Login'));

            act(() => {
                screen.getByText('Login').click();
            });

            await waitFor(() =>
                expect(screen.getByTestId('authenticating')).toBeDefined()
            );
        });
    });

    describe('v0.3.0: autoSessionCookie — automatic server sync', () => {
        it('POSTs to /api/auth/session when autoSessionCookie is true and token refreshes', async () => {
            (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
                callback(mockUser);
                return jest.fn();
            });
            (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

            render(
                <SabiAuthProvider firebaseConfig={firebaseConfig} autoSessionCookie={true}>
                    <TestConsumer />
                </SabiAuthProvider>
            );

            await waitFor(() => screen.getByTestId('user-email'));

            expect(global.fetch).toHaveBeenCalledWith(
                '/api/auth/session',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: 'fake-id-token-123' }),
                })
            );
        });

        it('does NOT call fetch when autoSessionCookie is false (default)', async () => {
            (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
                callback(mockUser);
                return jest.fn();
            });
            (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

            render(
                <SabiAuthProvider firebaseConfig={firebaseConfig}>
                    <TestConsumer />
                </SabiAuthProvider>
            );

            await waitFor(() => screen.getByTestId('user-email'));
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    describe('v0.3.0: experimentalFastRedirect — hard navigation', () => {
        it('calls _navigateTo("/") on logout when experimentalFastRedirect is true', async () => {
            const mockNavigate = jest.fn();

            (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
                callback(mockUser);
                return jest.fn();
            });
            (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
            (signOut as jest.Mock).mockImplementation(async () => {
                const lastCallback = (onIdTokenChanged as jest.Mock).mock.calls[0][1];
                lastCallback(null);
            });

            render(
                <SabiAuthProvider
                    firebaseConfig={firebaseConfig}
                    experimentalFastRedirect={true}
                    _navigateTo={mockNavigate}
                >
                    <TestConsumer />
                </SabiAuthProvider>
            );

            await waitFor(() => screen.getByText('Logout'));

            await act(async () => {
                screen.getByText('Logout').click();
            });

            await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
        });

        it('does NOT call _navigateTo on logout when experimentalFastRedirect is false (default)', async () => {
            const mockNavigate = jest.fn();

            (onIdTokenChanged as jest.Mock).mockImplementation((auth, callback) => {
                callback(mockUser);
                return jest.fn();
            });
            (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
            (signOut as jest.Mock).mockImplementation(async () => {
                const lastCallback = (onIdTokenChanged as jest.Mock).mock.calls[0][1];
                lastCallback(null);
            });

            render(
                <SabiAuthProvider
                    firebaseConfig={firebaseConfig}
                    _navigateTo={mockNavigate}
                >
                    <TestConsumer />
                </SabiAuthProvider>
            );

            await waitFor(() => screen.getByText('Logout'));

            await act(async () => {
                screen.getByText('Logout').click();
            });

            await waitFor(() => screen.getByText('Login'));
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
