import { headers } from "next/headers";

import { readStudentId } from "@/features/onboarding/api-authorization";
import { auth } from "@/lib/auth/server";
import { createDatabase } from "@/lib/db/client";

import { createLearningProgressRepository } from "./learning-progress-repository";
import { createLearningProgressService } from "./learning-progress-service";

const database = createDatabase();

export const learningProgressDb = database.db;
export const learningProgressRepository = createLearningProgressRepository(database.db);
export const learningProgressService = createLearningProgressService(learningProgressRepository);

export async function getAuthenticatedLearningStudentId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return readStudentId(session);
}

export async function getVocabularyProgressData(userId: string) {
  return learningProgressService.getVocabularyProgress(userId);
}

export async function getDashboardLearningStats(userId: string) {
  return learningProgressService.getDashboardLearningStats(userId);
}
