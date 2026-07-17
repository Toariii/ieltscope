import type { Metadata } from "next";
import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { readStudentId } from "@/features/onboarding/api-authorization";
import { AssessmentReport } from "@/features/report/assessment-report";
import { getAssessmentReportView } from "@/features/report/assessment-report-data";
import { auth } from "@/lib/auth/server";
import { createDatabase } from "@/lib/db/client";

export const metadata: Metadata = {
  title: "诊断报告 | IELTScope",
};

const database = createDatabase();

export default async function ReportPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = readStudentId(session);
  const studentName = session?.user.name?.trim() || "同学";
  const view = await getAssessmentReportView({
    db: database.db,
    userId,
    studentName,
  });

  return (
    <AppShell studentName={studentName}>
      <AssessmentReport view={view} />
    </AppShell>
  );
}
