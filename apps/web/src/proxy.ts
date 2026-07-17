import { NextRequest, NextResponse } from "next/server";

import {
  authorizeStaffPath,
  type UserRole,
} from "@/features/auth/permissions";
import { auth } from "@/lib/auth/server";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const rawRole = session?.user.role;
  const role: UserRole | null =
    rawRole === "student" ||
    rawRole === "teacher" ||
    rawRole === "academic_lead" ||
    rawRole === "admin"
      ? rawRole
      : null;
  const decision = authorizeStaffPath(request.nextUrl.pathname, role);

  if (decision === "login") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackURL", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (decision === "forbidden") {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
