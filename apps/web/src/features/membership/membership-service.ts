import { createHash } from "node:crypto";

export type MembershipSku = "vip_monthly_alpha";

export type RedeemableCode = {
  digest: string;
  suffix: string;
  sku: MembershipSku;
  status: "available" | "redeemed" | "expired" | "revoked";
  activationDeadline: Date | null;
};

export type MembershipView = {
  sku: MembershipSku | string;
  status: "active" | "expired" | "revoked";
  startsAt: Date;
  expiresAt: Date;
};

export type MembershipRepository = {
  findCodeByDigest(digest: string): Promise<RedeemableCode | null>;
  redeemCode(input: {
    digest: string;
    userId: string;
    sku: MembershipSku;
    credits: number;
    startsAt: Date;
    expiresAt: Date;
    idempotencyKey: string;
  }): Promise<boolean>;
  getCreditBalance(userId: string): Promise<number>;
  listActiveMemberships(userId: string): Promise<MembershipView[]>;
};

export type MembershipCenterView = {
  credits: number;
  memberships: Array<{
    sku: string;
    status: MembershipView["status"];
    startsAt: string;
    expiresAt: string;
  }>;
};

const skuBenefits: Record<MembershipSku, { credits: number; durationDays: number }> = {
  vip_monthly_alpha: { credits: 8, durationDays: 31 },
};

function normalizeCode(code: string) {
  return code.trim().replace(/\s+/gu, "").toUpperCase();
}

export function digestRedemptionCode(code: string) {
  return createHash("sha256").update(normalizeCode(code)).digest("hex");
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function serializeView(credits: number, memberships: MembershipView[]): MembershipCenterView {
  return {
    credits,
    memberships: memberships.map((membership) => ({
      sku: membership.sku,
      status: membership.status,
      startsAt: membership.startsAt.toISOString(),
      expiresAt: membership.expiresAt.toISOString(),
    })),
  };
}

export function createMembershipService(
  repository: MembershipRepository,
  options: {
    digestCode?: (code: string) => string;
    now?: () => Date;
  } = {},
) {
  const digestCode = options.digestCode ?? digestRedemptionCode;
  const now = options.now ?? (() => new Date());

  return {
    async getCenter(userId: string) {
      return serializeView(
        await repository.getCreditBalance(userId),
        await repository.listActiveMemberships(userId),
      );
    },

    async redeem(userId: string, rawCode: string) {
      const normalizedCode = normalizeCode(rawCode);
      if (normalizedCode.length < 6) {
        return { ok: false as const, error: "请输入完整兑换码。" };
      }

      const digest = digestCode(normalizedCode);
      const code = await repository.findCodeByDigest(digest);
      if (!code || code.status !== "available") {
        return { ok: false as const, error: "兑换码不可用或已被使用。" };
      }

      const currentTime = now();
      if (code.activationDeadline && code.activationDeadline.getTime() < currentTime.getTime()) {
        return { ok: false as const, error: "兑换码已过激活期限。" };
      }

      const benefit = skuBenefits[code.sku];
      const startsAt = currentTime;
      const expiresAt = addDays(startsAt, benefit.durationDays);
      const redeemed = await repository.redeemCode({
        digest,
        userId,
        sku: code.sku,
        credits: benefit.credits,
        startsAt,
        expiresAt,
        idempotencyKey: `redeem:${digest}:${userId}`,
      });
      if (!redeemed) {
        return { ok: false as const, error: "兑换码不可用或已被使用。" };
      }

      return {
        ok: true as const,
        data: await this.getCenter(userId),
      };
    },
  };
}
