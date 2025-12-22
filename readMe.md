Here is the updated `README.md` for **sabi-auth-lib**. 

The name "**Sabi**" (meaning *to know* or *to be knowledgeable* in Pidgin English) is perfect for an auth library—it’s the part of your app that "sabis" who the admin is!

***

# 🔐 sabi-auth-lib

**Sabi-auth-lib** is a shared authentication module built for **Next.js** applications hosted on **Firebase App Hosting**. 

It eliminates recurring bugs caused by "AI hallucinations" and Firebase-specific infrastructure quirks (like cookie stripping and redirect loops) by providing a single, tested source of truth for your admin gates.

## 🇳🇬 Why "Sabi"?
In Pidgin, if you **sabi**, you know. This library ensures your app always *sabis* the difference between a real admin and a stranger.

## 🚀 Key Features
*   **Firebase Optimized:** Automatically uses the `__session` cookie name (the only cookie Firebase Hosting doesn't strip).
*   **Loop Protection:** The middleware factory includes a "Loop Breaker" that prevents the infinite redirect bug.
*   **Simplified API:** No complex Firebase Admin/Client SDK mixing. Just pure Next.js logic.

---

## 📦 Installation

Install the library directly from your private GitHub repository:

```bash
npm install github:YOUR_GITHUB_USERNAME/sabi-auth-lib
```

---

## ⚙️ Project Configuration

### 1. `next.config.js` (Required)
Since this library is shared as TypeScript source code, you must tell Next.js to compile it.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@stefan/sabi-auth'], // Use the name from your library's package.json
};

module.exports = nextConfig;
```

### 2. Firebase Secrets
Your production environment needs the `ADMIN_PASSWORD` secret set.

1.  **Set secret:** `firebase apphosting:secrets:set ADMIN_PASSWORD`
2.  **Update `apphosting.yaml`:**
    ```yaml
    env:
      - variable: ADMIN_PASSWORD
        secret: ADMIN_PASSWORD
    ```

---

## 🛠 Usage

### 1. Protect your routes (`middleware.ts`)
Create this file in your root directory. It uses the "Gatekeeper" factory to protect your dashboard.

```typescript
import { createAdminMiddleware } from '@stefan/sabi-auth';

// Pass your environment variable into the factory
export const middleware = createAdminMiddleware(process.env.ADMIN_PASSWORD);

export const config = {
  // Matches the dashboard AND the login page to ensure loop protection
  matcher: ['/admin-dashboard/:path*', '/admin-login'],
};
```

### 2. Create the login page (`app/admin-login/page.tsx`)
Use the `loginAdmin` server action to set the secure session.

```typescript
import { loginAdmin } from '@stefan/sabi-auth';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  async function handleAction(formData: FormData) {
    'use server';
    
    // The library handles the __session cookie logic for you
    const result = await loginAdmin(formData, process.env.ADMIN_PASSWORD);
    
    if (result.success) {
      redirect('/admin-dashboard');
    }
  }

  return (
    <form action={handleAction}>
      <h1>Admin Login</h1>
      <input name="password" type="password" placeholder="Enter Secret" required />
      <button type="submit">Enter Dashboard</button>
    </form>
  );
}
```

---

## 🛠 Maintenance

### Updating across all 5 apps
If you find a bug or want to change the session duration:
1.  Edit the code in your `sabi-auth-lib` repository.
2.  Push changes to GitHub.
3.  In each of your 5 apps, run:
    ```bash
    npm update @stefan/sabi-auth
    ```

## 🛡 Security Note
**Never** commit your actual password to this library or your apps. Always use the `ADMIN_PASSWORD` environment variable. The library is designed to "fail-closed"—if the password is missing, nobody gets in.