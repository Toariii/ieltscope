import type { GoalInput, StatusInput } from "@ielts/contracts";

import { onboardingErrorResponse, OnboardingHttpError } from "@/features/onboarding/api-authorization";
import { getOnboardingSnapshot } from "@/features/onboarding/onboarding-data";
import {
  getAuthenticatedStudentId,
  onboardingService,
} from "@/features/onboarding/onboarding-server";

export async function GET() {
  try {
    const userId = await getAuthenticatedStudentId();
    return Response.json({ ok: true, data: await getOnboardingSnapshot(userId) });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getAuthenticatedStudentId();
    const body = (await request.json()) as
      | { kind: "status"; value: StatusInput }
      | { kind: "goal"; value: GoalInput };

    if (body.kind === "status") {
      await onboardingService.saveStatus(userId, body.value);
    } else if (body.kind === "goal") {
      const result = await onboardingService.saveGoal(userId, body.value);
      if (!result.ok) {
        return Response.json(
          { ok: false, error: { code: "INVALID_GOAL", message: "请检查目标设置", fields: result.errors } },
          { status: 400 },
        );
      }
    } else {
      throw new OnboardingHttpError(400, "无法识别的建档步骤", "INVALID_STEP");
    }

    return Response.json({ ok: true, data: await getOnboardingSnapshot(userId) });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
