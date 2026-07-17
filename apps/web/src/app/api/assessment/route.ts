import { onboardingErrorResponse } from "@/features/onboarding/api-authorization";
import {
  assessmentService,
  getAuthenticatedAssessmentStudentId,
} from "@/features/assessment/assessment-server";

export async function GET() {
  try {
    const userId = await getAuthenticatedAssessmentStudentId();
    return Response.json({ ok: true, data: await assessmentService.getSnapshot(userId) });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
