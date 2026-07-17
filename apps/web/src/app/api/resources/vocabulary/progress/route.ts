import { onboardingErrorResponse } from "@/features/onboarding/api-authorization";
import {
  getAuthenticatedLearningStudentId,
  learningProgressService,
} from "@/features/learning-progress/learning-progress-server";
import type { VocabularyLearningStatus } from "@/features/learning-progress/learning-progress-service";

function isVocabularyStatus(value: unknown): value is VocabularyLearningStatus {
  return value === "mastered" || value === "review";
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedLearningStudentId();
    const input = (await request.json()) as { resourceId?: string; status?: unknown };
    if (!input.resourceId || !isVocabularyStatus(input.status)) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "INVALID_VOCABULARY_PROGRESS",
            message: "请选择有效的词汇和学习状态。",
          },
        },
        { status: 400 },
      );
    }

    const result = await learningProgressService.recordVocabularyStatus(userId, {
      resourceId: input.resourceId,
      status: input.status,
    });
    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "INVALID_VOCABULARY_PROGRESS",
            message: result.error,
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
