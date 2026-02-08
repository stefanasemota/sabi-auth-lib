"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/__tests__/exports.test.ts
// Mock the logger dependency before imports ensuring it's available for indirect imports
jest.mock("@stefanasemota/sabi-logger", () => ({
    logAuthEvent: jest.fn(),
}), { virtual: true });
const index_1 = require("../index"); // Points directly to src/index.ts
describe("Sabi Auth Library: Package Integrity", () => {
    test("should have all required client exports", () => {
        expect(index_1.SabiAuthProvider).toBeDefined();
        expect(index_1.useAuth).toBeDefined();
    });
    test("should have all required server exports", () => {
        expect(index_1.getSabiServerSession).toBeDefined();
        expect(index_1.createAdminMiddleware).toBeDefined();
        expect(index_1.loginAdmin).toBeDefined();
        expect(index_1.deleteUserSessionAction).toBeDefined();
    });
    test("exports should be valid functions/components", () => {
        expect(typeof index_1.loginAdmin).toBe("function");
        expect(typeof index_1.useAuth).toBe("function");
        expect(typeof index_1.SabiAuthProvider).toBe("function");
        expect(typeof index_1.deleteUserSessionAction).toBe("function");
    });
});
