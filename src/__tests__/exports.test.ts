import * as SabiAuth from "../index";

describe("Sabi Auth Library Exports", () => {
  test("should export SabiAuthProvider", () => {
    expect(SabiAuth.SabiAuthProvider).toBeDefined();
  });

  test("should export useAuth hook", () => {
    expect(SabiAuth.useAuth).toBeDefined();
  });

  test("should export getSabiServerSession helper", () => {
    expect(SabiAuth.getSabiServerSession).toBeDefined();
  });

  test("should export createAdminMiddleware factory", () => {
    expect(SabiAuth.createAdminMiddleware).toBeDefined();
  });
});
