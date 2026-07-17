import { describe, expect, it } from "vitest";

import type { GoalInput, StatusInput } from "@ielts/contracts";

import {
  createOnboardingService,
  type OnboardingDraft,
  type OnboardingRepository,
} from "./onboarding-service";

const validGoal: GoalInput = {
  targetOverall: 7,
  targetExamDate: "2026-10-10",
  weeklyMinutes: 600,
  minimumSkills: { writing: 6.5 },
};

function createMemoryRepository() {
  const drafts = new Map<string, OnboardingDraft>();
  const createdPlans: string[] = [];

  const ensure = (userId: string) => {
    const current = drafts.get(userId) ?? {
      step: "status" as const,
      status: null,
      goal: null,
      completedAt: null,
      recordsCount: 0,
    };
    drafts.set(userId, current);
    return current;
  };

  const repository: OnboardingRepository = {
    async getDraft(userId) {
      return ensure(userId);
    },
    async saveStatus(userId, status) {
      drafts.set(userId, { ...ensure(userId), status, step: "records" });
    },
    async saveGoal(userId, goal) {
      drafts.set(userId, { ...ensure(userId), goal, step: "review" });
    },
    async completeInTransaction(userId) {
      drafts.set(userId, {
        ...ensure(userId),
        step: "complete",
        completedAt: new Date("2026-07-16T12:00:00Z"),
      });
    },
  };

  return { repository, drafts, createdPlans };
}

describe("onboarding service", () => {
  it("saves steps and completes onboarding without creating a plan", async () => {
    const memory = createMemoryRepository();
    const service = createOnboardingService(memory.repository, {
      now: () => new Date("2026-07-16T00:00:00Z"),
    });

    await service.saveStatus("user-1", { hasRecentScores: false });
    await service.saveGoal("user-1", validGoal);
    await service.complete("user-1");

    expect(memory.drafts.get("user-1")).toMatchObject({
      step: "complete",
      status: { hasRecentScores: false },
      goal: validGoal,
      completedAt: expect.any(Date),
    });
    expect(memory.createdPlans).toHaveLength(0);
  });

  it("rejects completion until status and goal are present", async () => {
    const memory = createMemoryRepository();
    const service = createOnboardingService(memory.repository);

    await expect(service.complete("user-1")).rejects.toThrow("档案信息尚未完成");
  });

  it("returns field errors without persisting an invalid goal", async () => {
    const memory = createMemoryRepository();
    const service = createOnboardingService(memory.repository, {
      now: () => new Date("2026-07-16T00:00:00Z"),
    });
    const invalidGoal: GoalInput = { ...validGoal, targetOverall: 5.25 };

    const result = await service.saveGoal("user-1", invalidGoal);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected invalid goal result");
    expect(result.errors.targetOverall).toBeDefined();
    expect(memory.drafts.has("user-1")).toBe(false);
  });

  it("accepts either recent-score choice", async () => {
    const memory = createMemoryRepository();
    const service = createOnboardingService(memory.repository);
    const status: StatusInput = { hasRecentScores: true };

    await service.saveStatus("user-1", status);

    expect(memory.drafts.get("user-1")?.status).toEqual(status);
  });
});
