# 🛠 @stefan/sabi-auth Development Guide

Welcome back! Here is everything you need to know to get productive in 5 minutes.

## 🧅 1. Architecture Summary (Onion)

We strictly follow **Onion Architecture**. Dependencies flow **inward**.

*   **Core (`src/core/`)**: Pure TypeScript interfaces and entities (e.g., `SabiUser`, `AuthContextType`).
    *   *Rule*: NO imports from outside Core.
*   **Application (`src/application/`)**: Business logic and use cases (e.g., `admin.service.ts`).
    *   *Rule*: Can import Core, but NOT React/UI.
*   **Infrastructure (`src/`)**: Framework code (React Provider, Next.js).
    *   *Rule*: Binds App Services to the UI.

## 🚢 2. The /ship Command

To release a new version, we use a strict "tag-first" workflow enforced by Git hooks.

**The Workflow:**
1.  **Bump Version**: `npm version <patch|minor|major>`
    *   *Auto-updates `package.json` AND creates a Git tag.*
2.  **Ship It**: `npm run ship`
    *   *Pushes commits and tags to origin.*

> **Why?** A `pre-push` hook blocks any push where `package.json` version != Git Tag. This command ensures they stay synced.

## 🧪 3. Testing & Coverage (The 80% Rule)

We maintain **>80% test coverage**.

*   **Run Tests**: `npm test`
    *   *(Runs `jest --coverage`)*
*   **Target**: Check the table output. Low coverage? Write tests in `src/__tests__/`.

### Quick Tips
*   **Jest + JSdom** is configured for React component testing.
*   **Firebase Mocks** are already set up in `src/__tests__/SabiAuthProvider.test.tsx`. Copy pattern if needed.

---
*Now get back to coding! 🇳🇬🔥*
