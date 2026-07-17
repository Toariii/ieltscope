import { validateExamScoreInput, type ExamScoreInput } from "@ielts/contracts";

import { onboardingErrorResponse, OnboardingHttpError } from "@/features/onboarding/api-authorization";
import {
  countExamReferences,
  deleteManualRecord,
  getOnboardingSnapshot,
  saveManualRecord,
} from "@/features/onboarding/onboarding-data";
import { getAuthenticatedStudentId } from "@/features/onboarding/onboarding-server";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedStudentId();
    if ((await countExamReferences(userId)) >= 5) {
      throw new OnboardingHttpError(400, "最多添加 5 份考试记录", "RECORD_LIMIT");
    }
    const input = (await request.json()) as ExamScoreInput;
    const validation = validateExamScoreInput(input);
    if (!validation.ok) {
      return Response.json(
        { ok: false, error: { code: "INVALID_RECORD", message: "请检查成绩记录", fields: validation.errors } },
        { status: 400 },
      );
    }
    await saveManualRecord(userId, input);
    return Response.json({ ok: true, data: await getOnboardingSnapshot(userId) }, { status: 201 });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthenticatedStudentId();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new OnboardingHttpError(400, "缺少记录 ID", "MISSING_ID");
    const deleted = await deleteManualRecord(userId, id);
    if (!deleted) throw new OnboardingHttpError(404, "记录不存在", "NOT_FOUND");
    return Response.json({ ok: true, data: await getOnboardingSnapshot(userId) });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
