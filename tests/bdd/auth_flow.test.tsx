import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { SabiAuthProvider, useAuth } from '../../src/SabiAuthProvider.tsx';
import * as firebaseAuth from 'firebase/auth';

/**
 * BDD-Szenarien für sabi-auth v1.6.0
 * Fokus: Google OAuth Flow, Auto-Cookie Sync & Fast Redirect
 */

// Mocks für die Infrastruktur
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onIdTokenChanged: vi.fn(() => vi.fn()),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {
    setCustomParameters = vi.fn();
  },
  signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

const TestComponent = () => {
  const { login, logout, isAuthenticating, user } = useAuth();
  
  return (
    <div>
      <span data-testid="is-authenticating">{isAuthenticating.toString()}</span>
      <span data-testid="id-token">{user ? 'has_token' : 'no_token'}</span>
      <button data-testid="login" onClick={login}>Login</button>
      <button data-testid="logout" onClick={logout}>Logout</button>
    </div>
  );
};

describe('Feature: Google OAuth Authentifizierungs-Flow', () => {
  const mockConfig = {
    apiKey: 'test-api-key',
    authDomain: 'test.firebaseapp.com',
    projectId: 'test-project',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ status: 'success' }) }));
    
    // Mock für window.location.href (da jsdom es schützt)
    const locationMock = {
      _href: 'http://localhost:3000',
      get href() { return this._href; },
      set href(val) { this._href = val.startsWith('/') ? `http://localhost:3000${val}` : val; }
    };
    // We navigate inside JS by setting href
    delete (window as any).location;
    window.location = locationMock as any;
  });

  it('Szenario: Erfolgreicher Login mit automatischer Cookie-Synchronisierung', async () => {
    window.location.href = 'http://localhost:3000/dashboard'; // Setup current path

    render(
      <SabiAuthProvider firebaseConfig={mockConfig} autoSessionCookie={true} experimentalFastRedirect={true}>
        <TestComponent />
      </SabiAuthProvider>
    );

    // GIVEN: Ein nicht authentifizierter Benutzer auf der Login-Seite
    const mockUser = { 
      uid: 'user_123', 
      getIdToken: vi.fn().mockResolvedValue('fake_id_token_xyz') 
    };
    (firebaseAuth.signInWithPopup as any).mockResolvedValue({ user: mockUser });

    // WHEN: Der Benutzer auf "Mit Google anmelden" klickt
    act(() => {
      screen.getByTestId('login').click();
    });

    // THEN: Die Library sollte sofort den Ladezustand anzeigen (Optimistic UI)
    expect(screen.getByTestId('is-authenticating').textContent).toBe("true");

    // Advance setTimeout
    await act(async () => {
      await new Promise(r => setTimeout(r, 200));
    });

    // AND: Die Library sollte das Token automatisch an die Session-API senden
    // Simulate onIdTokenChanged firing
    const idTokenCallback = (firebaseAuth.onIdTokenChanged as any).mock.calls[0][1];
    await act(async () => {
      await idTokenCallback(mockUser);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ idToken: 'fake_id_token_xyz' })
      }));
    });

    // AND: Ein harter Redirect zum/auf dem Dashboard sollte ausgelöst werden 
    expect(window.location.href).toBe('http://localhost:3000/dashboard');
  });

  it('Szenario: Fehlerbehandlung bei fehlgeschlagener Cookie-Synchronisierung', async () => {
    // AND: Die Server-API ist nicht erreichbar (ECONNRESET Simulation)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    render(
      <SabiAuthProvider firebaseConfig={mockConfig} autoSessionCookie={true} experimentalFastRedirect={true}>
        <TestComponent />
      </SabiAuthProvider>
    );

    // GIVEN: Ein Benutzer versucht sich einzuloggen
    const mockUser = { uid: 'user_123', getIdToken: vi.fn().mockResolvedValue('token') };
    (firebaseAuth.signInWithPopup as any).mockRejectedValue(new Error('auth/popup-closed-by-user'));

    // WHEN: Der Login-Prozess läuft
    act(() => {
      screen.getByTestId('login').click();
    });

    expect(screen.getByTestId('is-authenticating').textContent).toBe("true");

    // Advance setTimeout
    await act(async () => {
      await new Promise(r => setTimeout(r, 200));
    });

    // THEN: Der Ladezustand sollte bei einem Fehler zurückgesetzt werden
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticating').textContent).toBe("false");
    });
  });

  it('Szenario: Sicherer Logout mit Cookie-Löschung', async () => {
    render(
      <SabiAuthProvider firebaseConfig={mockConfig} autoSessionCookie={true} experimentalFastRedirect={true}>
        <TestComponent />
      </SabiAuthProvider>
    );

    // GIVEN: Ein authentifizierter Benutzer
    const idTokenCallback = (firebaseAuth.onIdTokenChanged as any).mock.calls[0][1];
    await act(async () => {
      await idTokenCallback({ uid: 'user_123', getIdToken: vi.fn().mockResolvedValue('dummy') });
    });

    // WHEN: Der Benutzer sich abmeldet
    act(() => {
      screen.getByTestId('logout').click();
    });

    await waitFor(() => {
      expect(firebaseAuth.signOut).toHaveBeenCalled();
    });

    // Trigger onIdTokenChanged with null (simulating logout emission)
    await act(async () => {
      await idTokenCallback(null);
    });

    // THEN: Das Session-Cookie sollte auf dem Server gelöscht werden
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({
        method: 'DELETE'
      }));
    });

    // AND: Ein harter Redirect zur Startseite sollte erfolgen
    expect(window.location.href).toBe('http://localhost:3000/');
  });

  it('Szenario: Token-Refresh im Hintergrund', async () => {
    render(
      <SabiAuthProvider firebaseConfig={mockConfig} autoSessionCookie={true} experimentalFastRedirect={true}>
        <TestComponent />
      </SabiAuthProvider>
    );

    // GIVEN: Die Firebase-Session wird im Hintergrund aktualisiert
    const tokenCallback = (firebaseAuth.onIdTokenChanged as any).mock.calls[0][1];

    // WHEN: Ein neues Token von Firebase emittiert wird
    const newUser = { uid: 'user_123', getIdToken: vi.fn().mockResolvedValue('new_token_abc') };
    
    await act(async () => {
      await tokenCallback(newUser);
    });

    // THEN: Die Library sollte das neue Token sofort cachen (wir testen ob state has_token ist)
    expect(screen.getByTestId('id-token').textContent).toBe('has_token');

    // AND: Die Session auf dem Server sollte automatisch aktualisiert werden
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ idToken: 'new_token_abc' })
      }));
    });
  });
});
