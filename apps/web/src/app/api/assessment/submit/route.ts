import { OnboardingHttpError, onboardingErrorResponse } from "@/features/onboarding/api-authorization";
import {
  assessmentService,
  getAuthenticatedAssessmentStudentId,
} from "@/features/assessment/assessment-server";

export async function POST() {
  try {
    const userId = await getAuthenticatedAssessmentStudentId();
    return Response.json({ ok: true, data: await assessmentService.submit(userId) });
  } catch (error) {
    if (error instanceof Error && error.message === "请先完成四科诊断题目") {
      return onboardingErrorResponse(
        new OnboardingHttpError(400, error.message, "ASSESSMENT_INCOMPLETE"),
      );
    }
    return onboardingErrorResponse(error);
  }
}
