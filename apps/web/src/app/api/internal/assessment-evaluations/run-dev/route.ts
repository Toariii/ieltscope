import { OnboardingHttpError, onboardingErrorResponse } from "@/features/onboarding/api-authorization";
import { assessmentDb, getAuthenticatedAssessmentStudentId } from "@/features/assessment/assessment-server";
import { createDevAssessmentScoringRepository } from "@/features/assessment-evaluation/dev-simulator-repository";
import { createDevAssessmentScoringSimulator } from "@/features/assessment-evaluation/dev-simulator";

export async function POST() {
  if (process.env.ENABLE_DEV_EVALUATION_SIMULATOR !== "true") {
    return onboardingErrorResponse(
      new OnboardingHttpError(404, "开发期评分入口未开启", "DEV_SIMULATOR_DISABLED"),
    );
  }

  try {
    const userId = await getAuthenticatedAssessmentStudentId();
    const repository = createDevAssessmentScoringRepository(assessmentDb);
    const simulator = createDevAssessmentScoringSimulator(repository);
    return Response.json({ ok: true, data: await simulator.runForUser(userId) });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "没有可完成评分的已提交诊断" || error.message === "诊断评分任务不存在")
    ) {
      return onboardingErrorResponse(new OnboardingHttpError(400, error.message, "NO_SCORING_JOB"));
    }
    return onboardingErrorResponse(error);
  }
}
