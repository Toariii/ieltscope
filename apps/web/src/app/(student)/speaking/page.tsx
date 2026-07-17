import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import {
  getAuthenticatedSpeakingStudentId,
  getSpeakingReviewPageData,
} from "@/features/speaking-review/speaking-review-server";
import { SpeakingReviewWorkbench } from "@/features/speaking-review/speaking-review-workbench";

export const metadata: Metadata = { title: "口语精批 | IELTScope" };

export default async function SpeakingReviewPage() {
  const userId = await getAuthenticatedSpeakingStudentId();
  const data = await getSpeakingReviewPageData(userId);

  return (
    <AppShell studentName="同学">
      <SpeakingReviewWorkbench
        prompt={{
          title: data.prompt.title,
          prompt: data.prompt.prompt,
          part: data.prompt.part,
        }}
        initialReviews={data.reviews}
      />
    </AppShell>
  );
}
