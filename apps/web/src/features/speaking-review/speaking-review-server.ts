import { headers } from "next/headers";

import { readStudentId } from "@/features/onboarding/api-authorization";
import { auth } from "@/lib/auth/server";
import { createDatabase } from "@/lib/db/client";

import { createSpeakingReviewRepository, ensureAlphaSpeakingPrompt } from "./speaking-review-repository";
import { createSpeakingReviewService } from "./speaking-review-service";

const database = createDatabase();

export const speakingReviewDb = database.db;
export const speakingReviewRepository = createSpeakingReviewRepository(database.db);
export const speakingReviewService = createSpeakingReviewService(speakingReviewRepository);

export async function getAuthenticatedSpeakingStudentId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return readStudentId(session);
}

export async function getSpeakingReviewPageData(userId: string) {
  const prompt = await ensureAlphaSpeakingPrompt(database.db);
  const reviews = await speakingReviewService.listReviews(userId);
  return {
    prompt,
    reviews,
  };
}
