/**
 * @fileoverview Sabi Auth Library Entry Point
 * Exports both Client-side Provider/Hook and Server-side Middleware/Session helpers.
 */

import { SabiAuthProvider, useAuth } from "./SabiAuthProvider";

// 1. Re-export Client Components
export { SabiAuthProvider, useAuth };

// 2. Re-export Application Services
export {
  createAdminMiddleware,
  loginAdmin,
  getSabiServerSession,
  logoutAdmin,
} from "./application/admin.service";
