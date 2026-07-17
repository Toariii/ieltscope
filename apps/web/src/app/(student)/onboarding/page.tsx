import { redirect } from "next/navigation";

import { getAuthenticatedStudentId, onboardingService } from "@/features/onboarding/onboarding-server";

export const dynamic = "force-dynamic";

export default async function OnboardingIndexPage() {
  const userId = await getAuthenticatedStudentId();
  const draft = await onboardingService.getDraft(userId);
  redirect(draft.step === "complete" ? "/assessment" : `/onboarding/${draft.step}`);
}
