import { onboardingErrorResponse } from "@/features/onboarding/api-authorization";
import {
  getAuthenticatedMembershipStudentId,
  redeemMembershipCode,
} from "@/features/membership/membership-server";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedMembershipStudentId();
    const input = (await request.json()) as { code?: string };
    const result = await redeemMembershipCode(userId, input.code ?? "");
    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "INVALID_REDEMPTION_CODE",
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
