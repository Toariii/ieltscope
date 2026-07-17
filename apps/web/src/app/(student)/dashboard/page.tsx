import type { Metadata } from "next";
import { headers } from "next/headers";
import { and, desc, eq, inArray } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { StudentDashboard } from "@/features/dashboard/student-dashboard";
import { demoStudentWorkbench } from "@/features/dashboard/student-workbench-data";
import { studyPlanToWorkbenchView } from "@/features/dashboard/student-workbench-real-data";
import { getDashboardLearningStats } from "@/features/learning-progress/learning-progress-server";
import { membershipRepository } from "@/features/membership/membership-server";
import { onboardingDb, onboardingService } from "@/features/onboarding/onboarding-server";
import { getStudyPlanView } from "@/features/study-plan/study-plan-data";
import { auth } from "@/lib/auth/server";
import { assessmentEvaluations, assessments } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "学习工作台 | IELTScope",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const studentName = session?.user.name?.trim() || "同学";
  const userId = session?.user.id;
  let data = { ...demoStudentWorkbench, studentName };
  let stage: "onboarding" | "assessment" | "assessmentSubmitted" | "ready" = "onboarding";
  let assessmentEvaluation: {
    status: "queued" | "processing" | "completed" | "failed";
    stage: "ai_initial_scoring" | "teacher_calibration" | "report_generation";
    rubricVersion: string;
    queuedAt: string | null;
  } | null = null;

  if (userId) {
    const draft = await onboardingService.getDraft(userId);
    if (draft.completedAt) {
      const [latestAssessment] = await onboardingDb
        .select({ id: assessments.id, status: assessments.status })
        .from(assessments)
        .where(
          and(
            eq(assessments.userId, userId),
            inArray(assessments.status, ["draft", "in_progress", "submitted", "completed"]),
          ),
        )
        .orderBy(desc(assessments.updatedAt), desc(assessments.createdAt))
        .limit(1);
      if (latestAssessment?.status === "completed") {
        const planView = await getStudyPlanView({
          db: onboardingDb,
          userId,
          studentName,
        });
        if (planView.state === "ready") {
          const [credits, learningStats] = await Promise.all([
            membershipRepository.getCreditBalance(userId),
            getDashboardLearningStats(userId),
          ]);
          stage = "ready";
          data = studyPlanToWorkbenchView(planView, {
            credits,
            streakDays: learningStats.streakDays,
            completedMinutes: learningStats.completedMinutes,
          });
        } else {
          stage = "assessment";
        }
      } else if (latestAssessment?.status === "submitted") {
        stage = "assessmentSubmitted";
        const [evaluation] = await onboardingDb
          .select({
            status: assessmentEvaluations.status,
            stage: assessmentEvaluations.stage,
            rubricVersion: assessmentEvaluations.rubricVersion,
            queuedAt: assessmentEvaluations.queuedAt,
          })
          .from(assessmentEvaluations)
          .where(eq(assessmentEvaluations.assessmentId, latestAssessment.id))
          .limit(1);
        assessmentEvaluation = evaluation
          ? {
              ...evaluation,
              queuedAt: evaluation.queuedAt.toISOString(),
            }
          : null;
      } else {
        stage = "assessment";
      }
    }
  }

  return (
    <AppShell studentName={studentName}>
      <StudentDashboard data={data} stage={stage} assessmentEvaluation={assessmentEvaluation} />
    </AppShell>
  );
}
