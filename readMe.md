# 🔐 @stefan/sabi-auth (v1.1.3)

**@stefan/sabi-auth** is a robust, strictly-typed authentication and identity layer designed for the Sabi AI ecosystem. It provides a unified source of truth for both **Admin Security** and **User Monetization** in Next.js applications hosted on Firebase App Hosting.

## 🚀 Key Features

*   **Dual-Layer Auth:** Unified handling of Admin Password protection AND Firebase User Identity.
*   **Firebase Native:** Optimized for the `__session` cookie to bypass Firebase's aggressive cookie stripping.
*   **Strictly Typed:** Full TypeScript support with verified `dist` outputs to eliminate "undefined" component errors.

---

## 🏗 Architecture (Onion)

This project follows **Onion Architecture** principles to ensure modularity and testability.

*   **Core Layer (`src/core/`)**: Contains pure domain definitions (`description.ts`). No external dependencies.
*   **Application Services (`src/application/`)**: Contains business logic (`admin.service.ts`). Orchestrates data flow.
*   **Infrastructure (`src/`)**: Components (`SabiAuthProvider.tsx`) that bind the core to frameworks (Next.js, Firebase).

Dependencies always point **inward**: Infrastructure -> Application -> Core.

---

## 📦 1. Installation

Install the library directly from your GitHub repository using the version tag:

```bash
npm install github:stefanasemota/sabi-auth-lib.git#v1.1.3
```

## ⚙️ 2. Configuration

### A. Next.js Configuration (next.config.js)

To ensure Next.js correctly handles the library's TypeScript/ESM output, add it to `transpilePackages`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@stefan/sabi-auth'], 
};

module.exports = nextConfig;
```

### B. Environment Variables (.env.local)

The library requires your Firebase Client configuration to initialize the Auth Provider.

```text
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... other Firebase keys
```

## 🛠 3. Client-Side Usage (Identity & UI)

### A. Root Provider (layout.tsx)

Wrap your application in the `SabiAuthProvider`. This initializes the Firebase heartbeat and makes user data available app-wide.

```tsx
import { SabiAuthProvider } from '@stefan/sabi-auth';

const firebaseConfig = { /* your config */ };

export default function RootLayout({ children }) {
  return (
    <SabiAuthProvider firebaseConfig={firebaseConfig}>
      {children}
    </SabiAuthProvider>
  );
}
```

### B. Accessing User Status (useAuth)

Use the hook to check roles (`WAKA`, `GBEDU`, `KPATAKPATA`) and trigger login popups.

```tsx
'use client';
import { useAuth } from '@stefan/sabi-auth';

export function PremiumFeature() {
  const { user, login, loading } = useAuth();
  const isPremium = user?.role === 'GBEDU' || user?.role === 'KPATAKPATA';

  if (loading) return <span>Loading...</span>;
  if (!user) return <button onClick={login}>Login with Google</button>;

  return isPremium ? <p>Full Afrobeat Unlocked! 🎸</p> : <p>Upgrade to Gbedu</p>;
}
```

## 🛠 4. Server-Side Usage (Fulfillment & Webhooks)

### A. Protecting API Routes (getSabiServerSession)

Use this helper in your Server Actions or Route Handlers (like Stripe Checkout) to verify the user's identity via the `__session` cookie.

```typescript
import { getSabiServerSession } from '@stefan/sabi-auth';

export async function POST(req: Request) {
  const session = await getSabiServerSession(req);
  
  if (!session?.userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // Use session.userId to create Stripe sessions
}
```

### B. Admin Middleware Factory

Protect your `/admin` dashboards using the built-in middleware factory.

```typescript
import { createAdminMiddleware } from '@stefan/sabi-auth';

export const middleware = createAdminMiddleware(process.env.ADMIN_PASSWORD);

export const config = {
  matcher: ['/admin-dashboard/:path*', '/admin-login'],
};
```

## 🏗 5. Library Maintenance (For Developers)

### Build & Release Flow

This library follows a strict build process to ensure `dist/` files are always in sync with GitHub tags.

1. **Restructure Source:** Code lives in `/src`, compiles to `/dist`.
2. **Quality Standards:**
    *   **Max File Size:** 75 lines. (Refactor if exceeded).
    *   **Test Coverage:** Minimum 75% logic coverage.
3. **Run Tests:** `npm test`
4. **Generate Build:** `npm run build`
5. **Grep Check:** `grep "exports.SabiAuthProvider" dist/index.js`
6. **Tag & Push:**

```bash
git add . && git commit -m "feat: release v1.1.3"
git tag -a v1.1.3 -m "Stable production release"
git push origin main --tags
```

## 🛡 6. Troubleshooting

*   **Component is undefined?** Ensure you are using Named Imports: `import { SabiAuthProvider }`.
*   **Types not found?** Ensure your `package.json` includes `"types": "dist/index.d.ts"`.
*   **Firebase Init Error?** Double-check that you are passing the `firebaseConfig` object to the provider in your root layout.

---

**Build once, Sabi everywhere. 🇳🇬🔥**
