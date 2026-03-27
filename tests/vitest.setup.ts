import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Global Mock for fetch
global.fetch = vi.fn() as any;

// Global Mock for window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost/',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});

import { mockSignInWithPopup, mockSignOut, mockGetAuth, mockOnIdTokenChanged } from './mocks/firebase-auth';
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));
