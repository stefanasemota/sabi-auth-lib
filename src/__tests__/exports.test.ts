// src/__tests__/exports.test.ts
import {
  SabiAuthProvider,
  useAuth,
  getSabiServerSession,
  createAdminMiddleware,
  loginAdmin,
  deleteUserSessionAction,
} from "../index"; // Points directly to src/index.ts

describe("Sabi Auth Library: Package Integrity", () => {
  test("should have all required client exports", () => {
    expect(SabiAuthProvider).toBeDefined();
    expect(useAuth).toBeDefined();
  });

  test("should have all required server exports", () => {
    expect(getSabiServerSession).toBeDefined();
    expect(createAdminMiddleware).toBeDefined();
    expect(loginAdmin).toBeDefined();
    expect(deleteUserSessionAction).toBeDefined();
  });

  test("exports should be valid functions/components", () => {
    expect(typeof loginAdmin).toBe("function");
    expect(typeof useAuth).toBe("function");
    expect(typeof SabiAuthProvider).toBe("function");
    expect(typeof deleteUserSessionAction).toBe("function");
  });
});
