import { describe, expect, it } from "vitest";
import { assertOwnsInstallation, AuthorizationError } from "@/lib/authorize-installation";

describe("assertOwnsInstallation", () => {
  it("passes when the installation is in the list", () => {
    expect(() => assertOwnsInstallation(2, [{ id: 1 }, { id: 2 }])).not.toThrow();
  });

  it("throws a 403 AuthorizationError when the installation is not in the list", () => {
    expect(() => assertOwnsInstallation(99, [{ id: 1 }])).toThrow(AuthorizationError);
    try {
      assertOwnsInstallation(99, [{ id: 1 }]);
      throw new Error("expected assertOwnsInstallation to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AuthorizationError);
      expect((err as AuthorizationError).status).toBe(403);
    }
  });
});
