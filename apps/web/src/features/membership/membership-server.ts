import { headers } from "next/headers";

import { readStudentId } from "@/features/onboarding/api-authorization";
import { auth } from "@/lib/auth/server";
import { createDatabase } from "@/lib/db/client";

import { createMembershipRepository, ensureAlphaRedemptionCode } from "./membership-repository";
import { createMembershipService } from "./membership-service";

const database = createDatabase();

export const membershipDb = database.db;
export const membershipRepository = createMembershipRepository(database.db);
export const membershipService = createMembershipService(membershipRepository);

export async function getAuthenticatedMembershipStudentId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return readStudentId(session);
}

export async function getMembershipCenterData(userId: string) {
  await ensureAlphaRedemptionCode(database.db);
  return membershipService.getCenter(userId);
}

export async function redeemMembershipCode(userId: string, code: string) {
  await ensureAlphaRedemptionCode(database.db);
  return membershipService.redeem(userId, code);
}
