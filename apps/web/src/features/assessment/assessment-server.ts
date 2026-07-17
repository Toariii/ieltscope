import { headers } from "next/headers";

import { auth } from "@/lib/auth/server";
import { createDatabase } from "@/lib/db/client";
import { readStudentId } from "@/features/onboarding/api-authorization";

import { createAssessmentRepository } from "./assessment-repository";
import { createAssessmentService } from "./assessment-service";

const database = createDatabase();

export const assessmentDb = database.db;
export const assessmentRepository = createAssessmentRepository(database.db);
export const assessmentService = createAssessmentService(assessmentRepository);

export async function getAuthenticatedAssessmentStudentId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return readStudentId(session);
}

export async function getAssessmentSnapshot(userId: string) {
  return assessmentService.getSnapshot(userId);
}
