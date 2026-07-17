import { and, desc, eq, gt, sql, sum } from "drizzle-orm";

import type { createDatabase } from "@/lib/db/client";
import { creditLedger, memberships, redemptionCodes } from "@/lib/db/schema";

import {
  digestRedemptionCode,
  type MembershipRepository,
  type MembershipSku,
  type MembershipView,
  type RedeemableCode,
} from "./membership-service";

type Database = ReturnType<typeof createDatabase>["db"];

export const alphaRedemptionCode = "IELTSCOPE-ALPHA-2026";

function readSku(value: string): MembershipSku {
  return value === "vip_monthly_alpha" ? "vip_monthly_alpha" : "vip_monthly_alpha";
}

function toCode(row: typeof redemptionCodes.$inferSelect): RedeemableCode {
  return {
    digest: row.codeDigest,
    suffix: row.displaySuffix,
    sku: readSku(row.sku),
    status: row.status,
    activationDeadline: row.activationDeadline,
  };
}

function toMembership(row: typeof memberships.$inferSelect): MembershipView {
  return {
    sku: row.sku,
    status: row.status,
    startsAt: row.startsAt,
    expiresAt: row.expiresAt,
  };
}

export async function ensureAlphaRedemptionCode(db: Database) {
  const digest = digestRedemptionCode(alphaRedemptionCode);
  await db
    .insert(redemptionCodes)
    .values({
      codeDigest: digest,
      displaySuffix: "2026",
      sku: "vip_monthly_alpha",
      status: "available",
      activationDeadline: new Date("2027-01-01T00:00:00Z"),
    })
    .onConflictDoNothing();
}

export function createMembershipRepository(db: Database): MembershipRepository {
  return {
    async findCodeByDigest(digest) {
      const [code] = await db
        .select()
        .from(redemptionCodes)
        .where(eq(redemptionCodes.codeDigest, digest))
        .limit(1);
      return code ? toCode(code) : null;
    },

    async redeemCode(input) {
      const now = new Date();
      const [updated] = await db
        .update(redemptionCodes)
        .set({
          status: "redeemed",
          redeemedBy: input.userId,
          redeemedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(redemptionCodes.codeDigest, input.digest),
            eq(redemptionCodes.status, "available"),
          ),
        )
        .returning({ id: redemptionCodes.id });

      if (!updated) return false;

      await db.insert(memberships).values({
        userId: input.userId,
        sku: input.sku,
        status: "active",
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
      });
      await db
        .insert(creditLedger)
        .values({
          userId: input.userId,
          delta: input.credits,
          reason: "redemption",
          referenceType: "redemption_code",
          referenceId: updated.id,
          idempotencyKey: input.idempotencyKey,
        })
        .onConflictDoNothing();

      return true;
    },

    async getCreditBalance(userId) {
      const [row] = await db
        .select({ total: sum(creditLedger.delta) })
        .from(creditLedger)
        .where(eq(creditLedger.userId, userId));
      return Number(row?.total ?? 0);
    },

    async consumeCredit(input) {
      const [balanceRow] = await db
        .select({ total: sum(creditLedger.delta) })
        .from(creditLedger)
        .where(eq(creditLedger.userId, input.userId));
      if (Number(balanceRow?.total ?? 0) < input.credits) return false;

      const [entry] = await db
        .insert(creditLedger)
        .values({
          userId: input.userId,
          delta: -input.credits,
          reason: input.reason,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          idempotencyKey: input.idempotencyKey,
        })
        .onConflictDoNothing()
        .returning({ id: creditLedger.id });

      return Boolean(entry);
    },

    async listActiveMemberships(userId) {
      const rows = await db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, userId),
            eq(memberships.status, "active"),
            gt(memberships.expiresAt, sql`now()`),
          ),
        )
        .orderBy(desc(memberships.expiresAt));
      return rows.map(toMembership);
    },
  };
}
