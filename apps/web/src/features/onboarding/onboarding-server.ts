import { headers } from "next/headers";

import { auth } from "@/lib/auth/server";
import { createDatabase } from "@/lib/db/client";
import { createConfiguredPrivateObjectStore } from "@/lib/storage/s3-private-object-store";

import { readStudentId } from "./api-authorization";
import { createOnboardingRepository } from "./onboarding-repository";
import { createOnboardingService } from "./onboarding-service";

const database = createDatabase();

export const onboardingDb = database.db;
export const onboardingClient = database.client;
export const onboardingRepository = createOnboardingRepository(database.db);
export const onboardingService = createOnboardingService(onboardingRepository);

let objectStore: ReturnType<typeof createConfiguredPrivateObjectStore> | undefined;

export function getOnboardingObjectStore() {
  objectStore ??= createConfiguredPrivateObjectStore();
  return objectStore;
}

export async function getAuthenticatedStudentId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return readStudentId(session);
}
