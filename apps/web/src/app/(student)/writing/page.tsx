import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import {
  getAuthenticatedWritingStudentId,
  getWritingReviewPageData,
} from "@/features/writing-review/writing-review-server";
import { WritingReviewWorkbench } from "@/features/writing-review/writing-review-workbench";

export const metadata: Metadata = { title: "写作精批 | IELTScope" };

export default async function WritingReviewPage() {
  const userId = await getAuthenticatedWritingStudentId();
  const data = await getWritingReviewPageData(userId);

  return (
    <AppShell studentName="同学">
      <WritingReviewWorkbench
        prompt={{ title: data.prompt.title, prompt: data.prompt.prompt }}
        initialReviews={data.reviews}
      />
    </AppShell>
  );
}
