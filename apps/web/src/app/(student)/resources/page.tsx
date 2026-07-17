import type { Metadata } from "next";
import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { readStudentId } from "@/features/onboarding/api-authorization";
import { ResourceCenter } from "@/features/resources/resource-center";
import { isResourceTab, type ResourceTab } from "@/features/resources/resource-catalog";
import { auth } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "资源中心 | IELTScope",
};

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  readStudentId(session);
  const studentName = session?.user.name?.trim() || "同学";
  const params = await searchParams;
  const initialTab: ResourceTab = isResourceTab(params.tab) ? params.tab : "vocabulary";

  return (
    <AppShell studentName={studentName}>
      <ResourceCenter initialTab={initialTab} />
    </AppShell>
  );
}
