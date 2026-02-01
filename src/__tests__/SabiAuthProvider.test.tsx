/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SabiAuthProvider, useAuth } from '../SabiAuthProvider';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

// --- MOCKS ---

const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
};

// Mock Firebase App
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(),
    getApps: jest.fn(() => []), // Return empty array to trigger init
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
}));

// Test Component to consume the Context
const TestConsumer = () => {
    const { user, loading, login, logout } = useAuth();
    if (loading) return <div>Loading...</div>;
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
        // Default: not loading immediately is hard because effect runs async.
        // We mock onAuthStateChanged to *not* fire immediately unless we trigger it.
    });

    it('renders loading state initially', () => {
        (onAuthStateChanged as jest.Mock).mockImplementation(() => jest.fn());
        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );
        expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('handles unauthenticated state', async () => {
        // Simulate Firebase returning null (no user)
        (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
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
        // 1. Auth indicates user exists
        (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(mockUser);
            return jest.fn();
        });

        // 2. Firestore says admin doc does NOT exist
        (getDoc as jest.Mock).mockResolvedValue({
            exists: () => false,
        });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        await waitFor(() => expect(screen.getByTestId('user-email').textContent).toBe(mockUser.email));
        expect(screen.getByTestId('is-admin').textContent).toBe('USER');
    });

    it('handles authenticated ADMIN user', async () => {
        // 1. Auth indicates user exists
        (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(mockUser);
            return jest.fn();
        });

        // 2. Firestore says admin doc DOES exist
        (getDoc as jest.Mock).mockResolvedValue({
            exists: () => true,
        });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        await waitFor(() => expect(screen.getByTestId('is-admin').textContent).toBe('ADMIN'));
    });

    it('ignores undefined user from Firebase (intermediate state)', async () => {
        (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
            // Trigger undefined first
            callback(undefined);
            return jest.fn();
        });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        // Should still be loading because undefined means "wait"
        expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('handles Firestore error gracefully (defaults to non-admin)', async () => {
        // 1. Auth exists
        (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(mockUser);
            return jest.fn();
        });

        // 2. Firestore throws error
        (getDoc as jest.Mock).mockRejectedValue(new Error("Firestore failed"));

        // Spy on console.error to keep output clean, valid test ensures we caught it
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        await waitFor(() => expect(screen.getByTestId('is-admin').textContent).toBe('USER'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Admin check failed'), expect.any(Error));
        consoleSpy.mockRestore();
    });

    it.skip('calls login function', async () => {
        (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn();
        });

        render(
            <SabiAuthProvider firebaseConfig={firebaseConfig}>
                <TestConsumer />
            </SabiAuthProvider>
        );

        await waitFor(() => screen.getByText('Login'));

        // Use real timers (default) and wait for the timeout
        act(() => {
            screen.getByText('Login').click();
        });

        // Timeout is 150ms, waitFor defaults to 1000ms
        await waitFor(() => expect(signInWithPopup).toHaveBeenCalled());
    });

    it('calls logout function', async () => {
        (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(mockUser);
            return jest.fn();
        });
        (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

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
});
