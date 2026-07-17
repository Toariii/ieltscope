import { headers } from "next/headers";

import { readStudentId } from "@/features/onboarding/api-authorization";
import { auth } from "@/lib/auth/server";
import { createDatabase } from "@/lib/db/client";

import { createWritingReviewRepository, ensureAlphaWritingPrompt } from "./writing-review-repository";
import { createWritingReviewService } from "./writing-review-service";

const database = createDatabase();

export const writingReviewDb = database.db;
export const writingReviewRepository = createWritingReviewRepository(database.db);
export const writingReviewService = createWritingReviewService(writingReviewRepository);

export async function getAuthenticatedWritingStudentId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return readStudentId(session);
}

export async function getWritingReviewPageData(userId: string) {
  const prompt = await ensureAlphaWritingPrompt(database.db);
  const reviews = await writingReviewService.listReviews(userId);
  return {
    prompt,
    reviews,
  };
}
