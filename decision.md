# 🏛️ Architectural Decision Records (`decision.md`)

All entries are ordered **newest at the top, oldest at the bottom** using `DD.MM.YYYY` dates.

---

## [01.11.2026] — AOS Project Audit & Scaffolding Compliance Alignment
- **Origin:** `aos-audit-project` compliance audit
- **Context:** Repository lacked standardized `vibe-coding-guardrail` documentation (`initiative.md`, `dev.md`, `decision.md`, `aos-audit.md`), root `AGENTS.md` / `ai-rules.json`, `.nvmrc`, secret exclusions in `.gitignore`, 5-badge header + community footer in `README.md`, and complete metadata/scripts in `package.json`.
- **Decision:** Added `initiative.md`, `dev.md`, `decision.md`, `aos-audit.md`, `AGENTS.md`, `ai-rules.json`, and `.nvmrc` (Node 22); updated `readMe.md` with the 5-badge header and community footer; enriched `package.json` metadata (`description`, `author`, `keywords`, `repository`, `dev`/`test:unit`/`lint` scripts) without altering version `1.6.2`; hardened `.gitignore` secret patterns; and standardized all dates to `DD.MM.YYYY` with newest entries at the top.
- **Impact:** Full compliance with the `vibe-coder` Architectural Summary while preserving existing package exports, version tag sync (`1.6.2`), and unit/BDD test suites.

---

## [27.03.2026] — Vitest BDD Test Harness, Loop-Killer Middleware & `onIdTokenChanged` Event Bus (v1.6.0 – v1.6.2)
- **Origin:** Release engineering (`v1.6.0`, `v1.6.1`, `v1.6.2`)
- **Context:** Consuming apps experienced redirect loops when `/api/auth/session` requests were intercepted by `createAdminMiddleware`, and client auth needed reliable token caching, optimistic UI states, and BDD verification.
- **Decision:** Switched `SabiAuthProvider` to `onIdTokenChanged` with in-memory token caching, optimistic `isAuthenticating` state, and `autoSessionCookie` / `experimentalFastRedirect` options; added a `/api/auth/*` bypass ("Loop-Killer") in `createAdminMiddleware`; and added a Vitest BDD test suite (`tests/bdd/auth_flow.test.tsx`) alongside Jest unit tests.
- **Impact:** Eliminated middleware redirect loops during session cookie sync and verified end-to-end client auth lifecycle before every build.

---

## [27.02.2026] — Dual-Engine JWT Session Verification (`getSabiVerifiedSession`) (v1.5.0)
- **Origin:** Feature evolution (`4eed205`)
- **Context:** Host applications needed to verify real Firebase JWT session cookies on the server without tightly coupling `@stefanasemota/sabi-auth` to a specific `firebase-admin` instance.
- **Decision:** Introduced `getSabiVerifiedSession(verifier)` accepting an async callback (`(cookie: string) => Promise<{ userId: string } | null>`) alongside the existing cookie-only `getSabiServerSession()`.
- **Impact:** Enabled cryptographic Firebase Admin session cookie verification while keeping `firebase-admin` decoupled via dependency injection.

---

## [08.02.2026] — Client/Server Conditional Subpath Exports & Standalone Audit Logger (v1.4.0 – v1.4.4)
- **Origin:** Next.js 15 boundary separation (`02ae1a9`, `ad8a0f0`, `a162ec0`)
- **Context:** Importing server-only Next.js headers/cookies in client components caused bundler errors in Next.js 15 applications.
- **Decision:** Split package entrypoints into `@stefanasemota/sabi-auth/client` and `@stefanasemota/sabi-auth/server`, guarded server actions with `server-only`, added `onLoginCallback` to `SabiAuthProvider`, and integrated standalone `@stefanasemota/sabi-logger` v2.0+.
- **Impact:** Clean Next.js 15 Server/Client module boundaries and automatic immutable security audit logging without passing Firestore instances into login/logout actions.
