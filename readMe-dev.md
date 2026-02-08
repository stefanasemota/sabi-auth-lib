# 🛠 @stefan/sabi-auth Development Guide

Welcome! This guide helps you maintain the library and ensure high quality.

## 🧅 1. Architecture Summary (Onion)

We strictly follow **Onion Architecture**. Dependencies flow **inward**.

*   **Core (`src/core/`)**: Pure TypeScript interfaces and entities (e.g., `SabiUser`).
    *   *Rule*: NO imports from outside Core.
*   **Application (`src/application/`)**: Business logic and use cases (e.g., `admin.service.ts`).
    *   *Rule*: Can import Core, but NOT React/UI.
*   **Infrastructure (`src/`)**: Framework code (React Provider, Next.js).
    *   *Rule*: Binds App Services to the UI.

## 🚢 2. Releasing

To release a new version, run one of the following commands:

*   **Patch**: `npm run release:patch` (v1.0.0 → v1.0.1)
*   **Minor**: `npm run release:minor` (v1.0.0 → v1.1.0)
*   **Major**: `npm run release:major` (v1.0.0 → v2.0.0)

> These commands automatically:
> 1.  Bump version in `package.json`
> 2.  Create a git tag
> 3.  Push commits and tags to origin (triggering CI/CD)

## 🧪 3. Testing & Coverage

We maintain high test coverage for core logic.

*   **Run Tests**: `npm test`
    *   *(Runs `jest --coverage`)*
*   **Mocks**: 
    *   Firestore and Auth mocks are configured in `src/__tests__/`.
    *   **Note**: As of v1.3.14, `db` (Firestore) is NO LONGER required for `loginAdmin` or `deleteUserSessionAction`. Logging handles itself internally.

### Quick Tips
- **Serialized Data**: All data returned from Server Actions MUST be POJOs. Convert timestamps to ISO strings.
- **Standalone Logger**: We now use `@stefanasemota/sabi-logger` v2.0+ which does not require dependency injection for `db`.

---
*Build once, Sabi everywhere. 🇳🇬🔥*
