import { describe, expect, it } from "vitest";

import { auth } from "./server";

describe("authentication policy", () => {
  it("keeps public sign-up on student-only UUID accounts", () => {
    expect(auth.options.advanced?.database?.generateId).toBe("uuid");
    expect(auth.options.user?.additionalFields?.role).toMatchObject({
      type: "string",
      defaultValue: "student",
      input: false,
    });
    expect(auth.options.user?.additionalFields?.termsAcceptedAt).toMatchObject({
      type: "date",
      required: true,
      input: true,
      returned: false,
    });
  });

  it("uses the Alpha password and session policy", () => {
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
    expect(auth.options.emailAndPassword?.minPasswordLength).toBe(10);
    expect(auth.options.session?.expiresIn).toBe(60 * 60 * 24 * 7);
  });
});
