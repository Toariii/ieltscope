import type { Metadata } from "next";
import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { readStudentId } from "@/features/onboarding/api-authorization";
import { StudyPlan } from "@/features/study-plan/study-plan";
import { getStudyPlanView } from "@/features/study-plan/study-plan-data";
import { auth } from "@/lib/auth/server";
import { createDatabase } from "@/lib/db/client";

export const metadata: Metadata = {
  title: "学习计划 | IELTScope",
};

const database = createDatabase();

export default async function PlanPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = readStudentId(session);
  const studentName = session?.user.name?.trim() || "同学";
  const view = await getStudyPlanView({
    db: database.db,
    userId,
    studentName,
  });

  return (
    <AppShell studentName={studentName}>
      <StudyPlan view={view} />
    </AppShell>
  );
}
