Here is the updated, comprehensive `README.md` for **sabi-auth-lib**. It now includes the **Logout** functionality and the critical **Transpilation** step to ensure your future apps don't throw the "Module not found" error.

***

# 🔐 sabi-auth-lib

**sabi-auth-lib** is a shared authentication module designed specifically for **Next.js** applications (v14.2+) hosted on **Firebase App Hosting**. 

It eliminates recurring bugs like "AI hallucinations," redirect loops, and Firebase cookie stripping by providing a single, tested source of truth for your admin security.

## 🚀 Key Features
*   **Firebase Native:** Automatically uses the `__session` cookie (the only cookie Firebase doesn't strip).
*   **Loop Protection:** Built-in "Loop Breaker" in the middleware factory.
*   **Future-Proof:** Prepared for Next.js 15 async headers while remaining compatible with 14.2.x.
*   **Zero-SDK Conflict:** Uses standard Next.js headers; no mixing of Firebase Admin/Client SDKs required.

---

## 📦 1. Installation

Install the library directly from your private GitHub repository:

```bash
npm install github:YOUR_GITHUB_USERNAME/sabi-auth-lib
```

---

## ⚙️ 2. Configuration

### A. `next.config.js` (CRITICAL)
Next.js must be told to transpile this library since it is shared as TypeScript source code.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Replace with the 'name' from your library's package.json
  transpilePackages: ['@stefan/sabi-auth'], 
};

module.exports = nextConfig;
```

### B. Firebase Secrets
1.  **Set the secret:** `firebase apphosting:secrets:set ADMIN_PASSWORD`
2.  **Map it in `apphosting.yaml`:**
    ```yaml
    env:
      - variable: ADMIN_PASSWORD
        secret: ADMIN_PASSWORD
    ```

---

## 🛠 3. Usage

### A. Protect Routes (`middleware.ts`)
Create this in your project root. The factory handles the logic; you just provide the password.

```typescript
import { createAdminMiddleware } from '@stefan/sabi-auth';

export const middleware = createAdminMiddleware(process.env.ADMIN_PASSWORD);

export const config = {
  // Always include /admin-login in the matcher for loop protection
  matcher: ['/admin-dashboard/:path*', '/admin-login'],
};
```

### B. Admin Login (`app/admin-login/actions.ts`)
Use the `loginAdmin` action to verify the password and set the `__session` cookie.

```typescript
'use server';
import { loginAdmin } from '@stefan/sabi-auth';
import { redirect } from 'next/navigation';

export async function handleLogin(prevState: any, formData: FormData) {
  const result = await loginAdmin(formData, process.env.ADMIN_PASSWORD);
  if (result.success) redirect('/admin-dashboard');
  return { error: "Invalid Credentials" };
}
```

### C. Admin Logout (New!)
Use the `logoutAdmin` action in a client component to clear the session.

```tsx
'use client';
import { logoutAdmin } from '@stefan/sabi-auth';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAdmin();
    router.push('/admin-login');
    router.refresh();
  };

  return <button onClick={handleLogout}>Sign Out</button>;
}
```

---

## 🛠 4. Maintenance

### Updating Your Apps
When you add features to the library (like you just did with Logout):
1.  Push changes to the `sabi-auth-lib` GitHub repo.
2.  In your app project terminal, run:
    ```bash
    npm update @stefan/sabi-auth
    ```

## 🛡 5. Troubleshooting
*   **Redirect Loop?** Ensure your `middleware.ts` matcher includes `/admin-login`.
*   **Cookie Missing in Production?** Ensure the cookie name in the library is `__session`. Firebase strips all other names.
*   **Module Not Found?** Ensure `transpilePackages` is set in `next.config.js`.

---
**Build once, Sabi everywhere.** 🇳🇬🔥