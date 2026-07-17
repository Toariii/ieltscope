import { onboardingErrorResponse } from "@/features/onboarding/api-authorization";
import {
  getAuthenticatedSpeakingStudentId,
  speakingReviewService,
} from "@/features/speaking-review/speaking-review-server";
import type { SpeakingTranscriptSubmitInput } from "@/features/speaking-review/speaking-review-service";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedSpeakingStudentId();
    const input = (await request.json()) as SpeakingTranscriptSubmitInput;
    const result = await speakingReviewService.submitTranscript(userId, input);
    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "INVALID_SPEAKING_TRANSCRIPT",
            message: "请检查口语回答内容",
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
