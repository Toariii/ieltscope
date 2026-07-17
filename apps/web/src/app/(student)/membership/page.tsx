import type { Metadata } from "next";
import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { MembershipCenter } from "@/features/membership/membership-center";
import { getMembershipCenterData } from "@/features/membership/membership-server";
import { readStudentId } from "@/features/onboarding/api-authorization";
import { auth } from "@/lib/auth/server";

export const metadata: Metadata = { title: "会员中心 | IELTScope" };

export default async function MembershipPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = readStudentId(session);
  const studentName = session?.user.name?.trim() || "同学";
  const data = await getMembershipCenterData(userId);

  return (
    <AppShell studentName={studentName}>
      <MembershipCenter initialData={data} />
    </AppShell>
  );
}
