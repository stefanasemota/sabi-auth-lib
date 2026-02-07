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

## 🚢 2. Releasing (The /ship Command)

To release a new version, follow this sequence:

1.  **Bump Version**: Manually update `version` in `package.json` (e.g., `1.3.10`).
2.  **Commit**: `git add . && git commit -m "chore: release v1.3.10"`
3.  **Tag**: `git tag v1.3.10`
4.  **Ship**: `npm run ship`
    *   *Pushes commits and tags to origin.*

## 🧪 3. Testing & Coverage

We maintain high test coverage for core logic.

*   **Run Tests**: `npm test`
    *   *(Runs `jest --coverage`)*
*   **Mocks**: 
    *   Firestore and Auth mocks are configured in `src/__tests__/`.
    *   When adding new actions, ensure you mock the `db` instance in your tests.

### Quick Tips
- **Serialized Data**: All data returned from Server Actions MUST be POJOs. Convert timestamps to ISO strings.
- **Generic Actions**: Favor dependency injection for `db` instances to keep actions generic.

---
*Build once, Sabi everywhere. 🇳🇬🔥*
