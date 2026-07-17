import { describe, expect, it } from "vitest";

import {
  authorizeStaffPath,
  canAccessAdmin,
  canAnnotate,
} from "./permissions";

describe("role permissions", () => {
  it("allows teachers to annotate but not administer users", () => {
    expect(canAnnotate("teacher")).toBe(true);
    expect(canAccessAdmin("teacher")).toBe(false);
  });

  it("keeps students out of staff tools", () => {
    expect(canAnnotate("student")).toBe(false);
    expect(canAccessAdmin("student")).toBe(false);
  });

  it("allows academic leads and admins to administer users", () => {
    expect(canAccessAdmin("academic_lead")).toBe(true);
    expect(canAccessAdmin("admin")).toBe(true);
  });
});

describe("staff route authorization", () => {
  it("redirects signed-out visitors to login", () => {
    expect(authorizeStaffPath("/admin/annotations", null)).toBe("login");
  });

  it("lets teachers reach annotations only", () => {
    expect(authorizeStaffPath("/admin/annotations", "teacher")).toBe("allow");
    expect(authorizeStaffPath("/admin", "teacher")).toBe("forbidden");
    expect(authorizeStaffPath("/admin/users", "teacher")).toBe("forbidden");
  });

  it("keeps students out and allows academic leads", () => {
    expect(authorizeStaffPath("/admin/annotations", "student")).toBe("forbidden");
    expect(authorizeStaffPath("/admin/users", "academic_lead")).toBe("allow");
  });
});
