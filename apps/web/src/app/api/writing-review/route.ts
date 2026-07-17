import { onboardingErrorResponse } from "@/features/onboarding/api-authorization";
import {
  consumeMembershipReviewCredit,
  membershipService,
} from "@/features/membership/membership-server";
import {
  getAuthenticatedWritingStudentId,
  writingReviewService,
} from "@/features/writing-review/writing-review-server";
import {
  validateWritingDraftInput,
  type WritingDraftSubmitInput,
} from "@/features/writing-review/writing-review-service";

function invalidWritingResponse(errors: Record<string, string>) {
  return Response.json(
    {
      ok: false,
      error: {
        code: "INVALID_WRITING_DRAFT",
        message: "请检查作文内容",
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
    const userId = await getAuthenticatedWritingStudentId();
    const input = (await request.json()) as WritingDraftSubmitInput;
    const validation = validateWritingDraftInput(input);
    if (!validation.ok) return invalidWritingResponse(validation.errors);

    const center = await membershipService.getCenter(userId);
    if (center.credits < 1) {
      return insufficientCreditsResponse("VIP 精批余额不足，请先到会员中心兑换后再提交。");
    }

    const result = await writingReviewService.submitDraft(userId, input);
    if (!result.ok) {
      return invalidWritingResponse(result.errors);
    }

    const creditResult = await consumeMembershipReviewCredit(userId, {
      kind: "writing",
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
