/**
 * @fileoverview Server-side exports for @stefanasemota/sabi-auth
 * Server-only code with Node.js dependencies (firebase-admin, sabi-logger)
 */

import 'server-only';

export {
    createAdminMiddleware,
    getAuthUserAction,
    getSabiServerSession,
    loginAdmin,
    deleteUserSessionAction,
    resolveUserIdentityAction,
    updateLockedFieldAction,
} from "./application/admin.service";

export { logAuthEvent } from "@stefanasemota/sabi-logger";
