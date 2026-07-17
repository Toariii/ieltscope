import { onboardingErrorResponse } from "@/features/onboarding/api-authorization";
import {
  getAuthenticatedStudentId,
  onboardingService,
} from "@/features/onboarding/onboarding-server";

export async function POST() {
  try {
    const userId = await getAuthenticatedStudentId();
    await onboardingService.complete(userId);
    return Response.json({ ok: true, data: { redirectTo: "/assessment" } });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
