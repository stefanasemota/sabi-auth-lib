# 🎯 Initiative Brief — `@stefanasemota/sabi-auth`

## 1. Problem Statement
Consuming Next.js 15 applications in the **Sabi-Hub** ecosystem (such as **NaijaSpeak**) require standardized Firebase Authentication, session cookie synchronization across `.sabiai.work` subdomains, admin route protection, one-time locked profile mutations, and immutable security audit logging without coupling application business logic directly to Firebase Admin singletons or duplicating auth boilerplate.

## 2. Product Vision
Provide a lightweight, dependency-injected Authentication and User Management library (`@stefanasemota/sabi-auth`) that bridges client-side Firebase Auth (`SabiAuthProvider`) and server-side Next.js 15 Server Actions (`admin.service.ts`) while emitting tamper-proof security events to `@stefanasemota/sabi-logger`.

## 3. Core Capabilities
- **Client/Server Subpath Separation:** Clean subpath exports (`@stefanasemota/sabi-auth/client` and `@stefanasemota/sabi-auth/server`) guarded by `server-only` to prevent Next.js bundler boundary leaks.
- **Event-Driven Client Auth (`SabiAuthProvider`):** Reactive `onIdTokenChanged` listener with in-memory `idToken` caching, optimistic login state, cross-domain `.sabiai.work` cookie sync, and optional `/api/auth/session` synchronization.
- **Dual-Engine Session Verification:** Support for both lightweight password-protected admin sessions (`getSabiServerSession`) and verified Firebase JWT session cookies (`getSabiVerifiedSession`).
- **Loop-Killer Admin Middleware (`createAdminMiddleware`):** Protects `/admin-dashboard` routes while explicitly bypassing `/api/auth/*` endpoints to prevent redirect loops during cookie synchronization.
- **Pure Identity Resolution & Locked Fields:** Server Actions (`resolveUserIdentityAction`, `updateLockedFieldAction`) returning Next.js 15-serializable POJOs and enforcing one-time field locking in Firestore.
