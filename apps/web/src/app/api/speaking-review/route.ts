import { onboardingErrorResponse } from "@/features/onboarding/api-authorization";
import {
  consumeMembershipReviewCredit,
  membershipService,
} from "@/features/membership/membership-server";
import {
  getAuthenticatedSpeakingStudentId,
  speakingReviewService,
} from "@/features/speaking-review/speaking-review-server";
import {
  validateSpeakingTranscriptInput,
  type SpeakingTranscriptSubmitInput,
} from "@/features/speaking-review/speaking-review-service";

function invalidSpeakingResponse(errors: Record<string, string>) {
  return Response.json(
    {
      ok: false,
      error: {
        code: "INVALID_SPEAKING_TRANSCRIPT",
        message: "请检查口语回答内容",
        fields: errors,
      },
    },
    { status: 400 },
  );
}

function insufficientCreditsResponse(message: string) {
  return Response.json(
    {
      ok: false,
      error: {
        code: "INSUFFICIENT_REVIEW_CREDITS",
        message,
      },
    },
    { status: 402 },
  );
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedSpeakingStudentId();
    const input = (await request.json()) as SpeakingTranscriptSubmitInput;
    const validation = validateSpeakingTranscriptInput(input);
    if (!validation.ok) return invalidSpeakingResponse(validation.errors);

    const center = await membershipService.getCenter(userId);
    if (center.credits < 1) {
      return insufficientCreditsResponse("VIP 精批余额不足，请先到会员中心兑换后再提交。");
    }

    const result = await speakingReviewService.submitTranscript(userId, input);
    if (!result.ok) {
      return invalidSpeakingResponse(result.errors);
    }

    const creditResult = await consumeMembershipReviewCredit(userId, {
      kind: "speaking",
      referenceId: result.data.evaluation.id,
    });
    if (!creditResult.ok) {
      return insufficientCreditsResponse(creditResult.error);
    }

    return Response.json({ ok: true, data: result.data });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
