import { onboardingErrorResponse } from "@/features/onboarding/api-authorization";
import {
  getAuthenticatedWritingStudentId,
  writingReviewService,
} from "@/features/writing-review/writing-review-server";
import type { WritingDraftSubmitInput } from "@/features/writing-review/writing-review-service";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedWritingStudentId();
    const input = (await request.json()) as WritingDraftSubmitInput;
    const result = await writingReviewService.submitDraft(userId, input);
    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "INVALID_WRITING_DRAFT",
            message: "请检查作文内容",
            fields: result.errors,
          },
        },
        { status: 400 },
      );
    }

    return Response.json({ ok: true, data: result.data });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
