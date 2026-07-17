export type UserRole = "student" | "teacher" | "academic_lead" | "admin";

export const canAnnotate = (role: UserRole) =>
  role === "teacher" || role === "academic_lead" || role === "admin";

export const canAccessAdmin = (role: UserRole) =>
  role === "academic_lead" || role === "admin";

export type StaffRouteDecision = "allow" | "login" | "forbidden";

export function authorizeStaffPath(
  pathname: string,
  role: UserRole | null,
): StaffRouteDecision {
  if (!role) {
    return "login";
  }

  if (pathname === "/admin/annotations" || pathname.startsWith("/admin/annotations/")) {
    return canAnnotate(role) ? "allow" : "forbidden";
  }

  return canAccessAdmin(role) ? "allow" : "forbidden";
}
