import { describe, expect, it } from "vitest";

import {
  createMembershipService,
  type MembershipRepository,
  type MembershipSku,
} from "./membership-service";

function createMemoryRepository(seed: {
  codes: Array<{
    digest: string;
    suffix: string;
    sku: MembershipSku;
    status: "available" | "redeemed" | "expired" | "revoked";
    activationDeadline?: Date | null;
  }>;
  credits?: number;
}): MembershipRepository {
  const codes = new Map(seed.codes.map((code) => [code.digest, { ...code, redeemedBy: null as string | null }]));
  const memberships: Array<{ userId: string; sku: MembershipSku; startsAt: Date; expiresAt: Date }> = [];
  const ledger: Array<{ userId: string; delta: number; reason: string; idempotencyKey: string }> = [];

  return {
    async findCodeByDigest(digest) {
      const code = codes.get(digest);
      return code
        ? {
            digest,
            suffix: code.suffix,
            sku: code.sku,
            status: code.status,
            activationDeadline: code.activationDeadline ?? null,
          }
        : null;
    },
    async redeemCode(input) {
      const code = codes.get(input.digest);
      if (!code || code.status !== "available") return false;
      code.status = "redeemed";
      code.redeemedBy = input.userId;
      memberships.push({
        userId: input.userId,
        sku: input.sku,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
      });
      ledger.push({
        userId: input.userId,
        delta: input.credits,
        reason: "redemption",
        idempotencyKey: input.idempotencyKey,
      });
      return true;
    },
    async getCreditBalance(userId) {
      return (seed.credits ?? 0) + ledger.filter((entry) => entry.userId === userId).reduce((total, entry) => total + entry.delta, 0);
    },
    async listActiveMemberships(userId) {
      return memberships
        .filter((membership) => membership.userId === userId)
        .map((membership) => ({ ...membership, status: "active" as const }));
    },
  };
}

describe("createMembershipService", () => {
  it("redeems an available code and grants membership plus review credits", async () => {
    const service = createMembershipService(
      createMemoryRepository({
        codes: [{ digest: "digest-ok", suffix: "1234", sku: "vip_monthly_alpha", status: "available" }],
      }),
      { digestCode: () => "digest-ok", now: () => new Date("2026-07-17T00:00:00Z") },
    );

    const result = await service.redeem("student-1", "IELTSCOPE-1234");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.credits).toBe(8);
    expect(result.data.memberships[0]).toMatchObject({
      sku: "vip_monthly_alpha",
      status: "active",
    });
  });

  it("rejects already redeemed or missing codes", async () => {
    const service = createMembershipService(
      createMemoryRepository({
        codes: [{ digest: "digest-used", suffix: "9999", sku: "vip_monthly_alpha", status: "redeemed" }],
      }),
      { digestCode: () => "digest-used" },
    );

    await expect(service.redeem("student-1", "IELTSCOPE-9999")).resolves.toEqual({
      ok: false,
      error: "兑换码不可用或已被使用。",
    });
  });

  it("rejects expired activation codes", async () => {
    const service = createMembershipService(
      createMemoryRepository({
        codes: [
          {
            digest: "digest-expired",
            suffix: "0000",
            sku: "vip_monthly_alpha",
            status: "available",
            activationDeadline: new Date("2026-07-01T00:00:00Z"),
          },
        ],
      }),
      { digestCode: () => "digest-expired", now: () => new Date("2026-07-17T00:00:00Z") },
    );

    await expect(service.redeem("student-1", "IELTSCOPE-0000")).resolves.toEqual({
      ok: false,
      error: "兑换码已过激活期限。",
    });
  });
});
