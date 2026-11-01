# @stefanasemota/sabi-auth

[![Version](https://img.shields.io/badge/version-1.6.2-blue.svg)](https://github.com/stefanasemota/sabi-auth-lib)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth%20%7C%20Hosting-FFCA28?logo=firebase&logoColor=white)]()
[![Gemini](https://img.shields.io/badge/Gemini-AI%20Powered-8E75B2?logo=google-gemini&logoColor=white)]()

A lightweight, generic Authentication & User Management library for Next.js and Firebase. Designed to bridge the gap between Firebase Auth and Firestore with pure, dependency-injected Server Actions.

> **Published on npm:** `@stefanasemota/sabi-auth`

## 🏗️ Architectural Summary

`@stefanasemota/sabi-auth` follows an **Onion Architecture** (`src/core/` → `src/application/` → `src/`) with conditional client/server exports (`@stefanasemota/sabi-auth/client` and `@stefanasemota/sabi-auth/server`) and decoupled immutable audit logging via `@stefanasemota/sabi-logger`:

- **Core (`src/core/domain.ts`):** Framework-agnostic TypeScript entities and contracts (`SabiUser`, `AuthContextType`, `SabiAuthConfig`).
- **Application (`src/application/admin.service.ts`):** Server-only Next.js 15 session management, loop-killer middleware (`createAdminMiddleware`), dual-engine JWT verification (`getSabiVerifiedSession`), identity resolution (`resolveUserIdentityAction`), and locked field mutations (`updateLockedFieldAction`).
- **Infrastructure (`src/SabiAuthProvider.tsx`):** React Client Provider subscribing to `onIdTokenChanged` with in-memory token caching, optimistic login state, cross-domain `.sabiai.work` session cookies, and optional `/api/auth/session` synchronization.

## 🚀 Features

- **Dependency Injection:** Pass your own Firestore instance. No hardcoded logic.
- **Next.js 15 Ready:** Fully serialized data for Server/Client boundaries.
- **Identity Resolution:** Pure logic that finalizes profile POJOs or generates new user templates.
- **Locked Fields:** Professional-grade one-time identity verification logic.
- **Unit Tested:** 100% coverage on core auth services.

## 📦 Installation

Install from npm:

```bash
npm install @stefanasemota/sabi-auth
```

Or install directly from GitHub:

```bash
npm install git+https://github.com/stefanasemota/sabi-auth-lib.git#v1.3.10
```

## 🛠️ Configuration

The library expects the following environment variables to be handled by your parent app:

- `SESSION_COOKIE_NAME` (Optional)
- `ADMIN_PASSWORD` (Required for Middleware)

### Peer Dependencies

Ensure your project has the following installed:

```bash
npm install firebase firebase-admin next react react-dom
```

## 📖 Usage

### 1. Resolve User Identity
Pure logic function that finalizes a user profile or generates a new template.

```typescript
import { resolveUserIdentityAction } from "@stefanasemota/sabi-auth";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const userDoc = await db.collection("users").doc(userId).get();
const userData = userDoc.exists ? userDoc.data() : null;

const result = await resolveUserIdentityAction(
  userId,
  "WAKA", // defaultRole
  userData // POJO from Firestore or null
);
```

### 2. Get Authenticated User
Validate the session and get the user's basic metadata.

```typescript
import { getAuthUserAction } from "@stefanasemota/sabi-auth";

const { isAuthenticated, user } = await getAuthUserAction();
```

### 3. Update Locked Fields
Set a field (like `creatorName`) that can only be set once.

```typescript
import { updateLockedFieldAction } from "@stefanasemota/sabi-auth";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

await updateLockedFieldAction(
  db,
  "user-123",
  "creatorName",
  "Burna Boy Jr",
  "creatorNameSet"
);
```

### 4. Middleware Protection
Protect admin routes using the middleware factory.

```typescript
import { createAdminMiddleware } from "@stefanasemota/sabi-auth";

export const middleware = createAdminMiddleware(process.env.ADMIN_PASSWORD);

export const config = {
  matcher: ['/admin-dashboard/:path*', '/admin-login'],
};
```

## 🧪 Development & Testing

```bash
npm run dev        # TypeScript watch mode
npm test           # Run Jest unit tests with coverage
npm run test:unit  # Run Jest unit tests
npm run test:bdd   # Run Vitest BDD integration tests
npm run lint       # Run TypeScript strict typecheck
npm run build      # Run BDD tests and compile TypeScript
```

To release a new version:

```bash
npm run release:patch # or release:minor / release:major
```

## 📄 License
MIT © Stefan Asemota

---

Powered by <a href="https://github.com/stefanasemota/vibe-coding-guardrail">aos Vibe Coding Guardrail</a> | Fuel the Project - Buy me a coffee: <a href="https://buymeacoffee.com/stephanasex">https://buymeacoffee.com/stephanasex</a>
