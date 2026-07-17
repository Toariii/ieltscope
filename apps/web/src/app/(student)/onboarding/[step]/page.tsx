import type { Metadata } from "next";
import { redirect } from "next/navigation";

import type { OnboardingStep } from "@ielts/contracts";

import { getOnboardingSnapshot } from "@/features/onboarding/onboarding-data";
import { getAuthenticatedStudentId } from "@/features/onboarding/onboarding-server";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "建立备考档案 | IELTScope" };

const allowedSteps = new Set<OnboardingStep>(["status", "records", "goal", "review"]);

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (!allowedSteps.has(step as OnboardingStep)) redirect("/onboarding");
  const userId = await getAuthenticatedStudentId();
  const data = await getOnboardingSnapshot(userId);
  if (data.draft.step === "complete") redirect("/assessment");

  return (
    <OnboardingWizard
      initialData={data}
      initialStep={step as "status" | "records" | "goal" | "review"}
    />
  );
}
