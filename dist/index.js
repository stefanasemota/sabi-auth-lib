"use strict";
/**
 * @fileoverview Sabi Auth Library Entry Point
 * Exports both Client-side Provider/Hook and Server-side Middleware/Session helpers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutAdmin = exports.getSabiServerSession = exports.loginAdmin = exports.createAdminMiddleware = exports.useAuth = exports.SabiAuthProvider = void 0;
const SabiAuthProvider_1 = require("./SabiAuthProvider");
Object.defineProperty(exports, "SabiAuthProvider", { enumerable: true, get: function () { return SabiAuthProvider_1.SabiAuthProvider; } });
Object.defineProperty(exports, "useAuth", { enumerable: true, get: function () { return SabiAuthProvider_1.useAuth; } });
// 2. Re-export Application Services
var admin_service_1 = require("./application/admin.service");
Object.defineProperty(exports, "createAdminMiddleware", { enumerable: true, get: function () { return admin_service_1.createAdminMiddleware; } });
Object.defineProperty(exports, "loginAdmin", { enumerable: true, get: function () { return admin_service_1.loginAdmin; } });
Object.defineProperty(exports, "getSabiServerSession", { enumerable: true, get: function () { return admin_service_1.getSabiServerSession; } });
Object.defineProperty(exports, "logoutAdmin", { enumerable: true, get: function () { return admin_service_1.logoutAdmin; } });
