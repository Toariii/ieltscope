import { describe, expect, it } from "vitest";

import { assertOwnership, readStudentId } from "./api-authorization";

describe("onboarding API authorization", () => {
  it("rejects anonymous sessions", () => {
    expect(() => readStudentId(null)).toThrow("请先登录");
  });

  it("returns the authenticated user id", () => {
    expect(readStudentId({ user: { id: "user-1" } })).toBe("user-1");
  });

  it("rejects resources owned by another student", () => {
    expect(() => assertOwnership("user-1", { userId: "user-2" })).toThrow("无权访问");
  });
});
