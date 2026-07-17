import type { Metadata } from "next";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { StudentDashboard } from "@/features/dashboard/student-dashboard";
import { demoStudentWorkbench } from "@/features/dashboard/student-workbench-data";
import { onboardingDb, onboardingService } from "@/features/onboarding/onboarding-server";
import { auth } from "@/lib/auth/server";
import { assessments } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "学习工作台 | IELTScope",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const studentName = session?.user.name?.trim() || "同学";
  const userId = session?.user.id;
  const data = { ...demoStudentWorkbench, studentName };
  let stage: "onboarding" | "assessment" | "ready" = "onboarding";

  if (userId) {
    const draft = await onboardingService.getDraft(userId);
    if (draft.completedAt) {
      const [completedAssessment] = await onboardingDb
        .select({ id: assessments.id })
        .from(assessments)
        .where(and(eq(assessments.userId, userId), eq(assessments.status, "completed")))
        .limit(1);
      stage = completedAssessment ? "ready" : "assessment";
    }
  }

  return (
    <AppShell studentName={studentName}>
      <StudentDashboard data={data} stage={stage} />
    </AppShell>
  );
}
