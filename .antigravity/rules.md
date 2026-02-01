# Antigravity Rules: sabi-auth-lib

## 1. Context Gathering
- **Project Discovery**: Before suggesting any changes, always read the root `README.md` to understand the library's purpose and primary interfaces.

## 2. Structural & Architectural Rules
- **The Onion Rule**: All dependencies must point inward. The core business logic (Domain/Core) must not depend on external frameworks or infrastructure layers.
- **75-Line Hard Limit**: No single function or file shall exceed 75 lines of code. If it does, the Agent must propose a refactoring plan to modularize the logic.
- **Next.js Alignment**: Ensure all exports are compatible with Next.js 15 Server Actions and Client Components.

## 3. Quality & Testing (75% Coverage)
- **Method Coverage**: Every method and exported function must have unit test coverage of at least 75%.
- **Test Discovery**: If a new method is created, the Agent is required to generate a corresponding test file using Vitest.
- **Mocking**: Use MSW or internal mocks; avoid real network calls during testing.

## 4. Review Policy
- **Review-Driven**: All terminal executions and file overwrites require a manual review check.