# 🛠️ Development Guide (`dev.md`)

Local development setup, architectural boundaries, environment variables, and execution commands for `@stefanasemota/sabi-auth`.

---

## 1. Prerequisites & Setup

- **Node.js:** `v22` (pinned via `.nvmrc`)
- **Install Dependencies:**
  ```bash
  nvm use
  npm install
  ```

### Vibe-Coder Skill & Guardrail Installation
Ensure the `vibe-coding-guardrail` rules and skills (`vibe-coder`, `aos-audit-project`, `aos-vibecode`, `aos-verify`, `aos-check-for-security-issues`) are active in your agent configuration (`AGENTS.md` and `ai-rules.json`).

---

## 2. Environment Variables (Consuming Apps)

`@stefanasemota/sabi-auth` is dependency-injected and reads the following environment variables in the host Next.js application:

| Variable | Required | Description |
| :--- | :--- | :--- |
| `ADMIN_PASSWORD` | Yes (for Admin Middleware) | Shared admin credential validated by `createAdminMiddleware` and `loginAdmin`. |
| `SESSION_COOKIE_NAME` | Optional | Custom session cookie name (defaults to `__session`). |

---

## 3. Onion Architecture & Module Boundaries

Dependencies strictly point **inward**:

1. **Core (`src/core/domain.ts`):** Pure TypeScript interfaces and entities (`SabiUser`, `AuthContextType`, `SabiAuthConfig`). Zero external framework imports.
2. **Application (`src/application/admin.service.ts`):** Server-side business logic (`createAdminMiddleware`, `loginAdmin`, `getSabiServerSession`, `getSabiVerifiedSession`, `deleteUserSessionAction`, `getAuthUserAction`, `resolveUserIdentityAction`, `updateLockedFieldAction`). Guarded by `import 'server-only'`.
3. **Infrastructure & Entrypoints (`src/`):**
   - `src/SabiAuthProvider.tsx`: React Client Context Provider (`"use client"`).
   - `src/client.ts`: Client-safe barrel export (`./client`).
   - `src/server.ts`: Server-only barrel export (`./server`).
   - `src/index.ts`: Universal package entrypoint (`.`).

---

## 4. Execution Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Run TypeScript compiler in watch mode (`tsc --watch`). |
| `npm run build` | Execute BDD tests (`vitest`) followed by TypeScript build (`tsc`). |
| `npm test` | Run Jest unit test suite with coverage report (`npx jest --coverage`). |
| `npm run test:unit` | Run Jest unit tests (`npx jest`). |
| `npm run test:bdd` | Run Vitest BDD integration suite (`vitest run tests/bdd`). |
| `npm run lint` | Run strict TypeScript typecheck without emitting files (`tsc --noEmit`). |
| `npm run release:patch` | Bump patch version via `npm version patch` and push tags. |
| `npm run release:minor` | Bump minor version via `npm version minor` and push tags. |
| `npm run release:major` | Bump major version via `npm version major` and push tags. |
