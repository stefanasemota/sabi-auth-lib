# @stefanasemota/sabi-auth

[![Version](https://img.shields.io/github/v/tag/stefanasemota/sabi-auth-lib?label=version&color=orange)](https://github.com/stefanasemota/sabi-auth-lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, generic Authentication & User Management library for Next.js and Firebase. Designed to bridge the gap between Firebase Auth and Firestore with pure, dependency-injected Server Actions.

> **Published on npm:** `@stefanasemota/sabi-auth`

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

To run the test suite:

```bash
npm test
```

To release a new version:

```bash
npm run ship
```

## 📄 License
MIT © Stefan Asemota
