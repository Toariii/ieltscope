import { type AssessmentAnswerInput } from "@ielts/contracts";

import { onboardingErrorResponse } from "@/features/onboarding/api-authorization";
import {
  assessmentService,
  getAuthenticatedAssessmentStudentId,
} from "@/features/assessment/assessment-server";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedAssessmentStudentId();
    const input = (await request.json()) as AssessmentAnswerInput;
    const result = await assessmentService.saveAnswer(userId, input);
    if (!result.ok) {
      return Response.json(
        { ok: false, error: { code: "INVALID_ASSESSMENT_ANSWER", message: "请检查诊断作答", fields: result.errors } },
        { status: 400 },
      );
    }
    return Response.json({ ok: true, data: result.data });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
