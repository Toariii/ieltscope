import { describe, expect, it } from "vitest";

import {
  createLearningProgressService,
  type LearningProgressRepository,
  type StoredLearningEvent,
  type StoredStreak,
} from "./learning-progress-service";

function createMemoryRepository(seed: { streak?: StoredStreak; events?: StoredLearningEvent[] } = {}) {
  let streak = seed.streak ?? null;
  const events = [...(seed.events ?? [])];

  const repository: LearningProgressRepository = {
    async recordEvent(input) {
      events.push({
        eventType: input.eventType,
        durationSeconds: input.durationSeconds,
        outcome: input.outcome,
        occurredAt: input.occurredAt,
      });
    },
    async listVocabularyEvents() {
      return events.filter((event) => event.eventType.startsWith("vocabulary_"));
    },
    async getStreak() {
      return streak;
    },
    async saveStreak(_userId, value) {
      streak = value;
    },
    async getLearningSecondsSince(_userId, since) {
      return events
        .filter((event) => event.occurredAt.getTime() >= since.getTime())
        .reduce((total, event) => total + event.durationSeconds, 0);
    },
  };

  return repository;
}

describe("createLearningProgressService", () => {
  it("records mastered vocabulary and returns progress plus learning stats", async () => {
    const service = createLearningProgressService(createMemoryRepository(), {
      now: () => new Date("2026-07-17T08:00:00Z"),
    });

    const result = await service.recordVocabularyStatus("student-1", {
      resourceId: "vocab-6-flexible",
      status: "mastered",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.masteredIds).toContain("vocab-6-flexible");
    expect(result.data.reviewIds).not.toContain("vocab-6-flexible");
    expect(result.data.streakDays).toBe(1);
    expect(result.data.weeklyMinutes).toBe(2);
  });

  it("keeps the latest vocabulary status when a word is moved back to review", async () => {
    const repository = createMemoryRepository();
    const service = createLearningProgressService(repository, {
      now: () => new Date("2026-07-17T08:00:00Z"),
    });

    await service.recordVocabularyStatus("student-1", {
      resourceId: "vocab-6-flexible",
      status: "mastered",
    });
    const result = await service.recordVocabularyStatus("student-1", {
      resourceId: "vocab-6-flexible",
      status: "review",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.masteredIds).not.toContain("vocab-6-flexible");
    expect(result.data.reviewIds).toContain("vocab-6-flexible");
  });

  it("continues a streak only when the last active day is yesterday", async () => {
    const service = createLearningProgressService(
      createMemoryRepository({
        streak: {
          activeDays: 4,
          longestDays: 8,
          lastActiveDate: "2026-07-16",
          rewardCycle: 0,
        },
      }),
      { now: () => new Date("2026-07-17T08:00:00Z") },
    );

    const result = await service.recordVocabularyStatus("student-1", {
      resourceId: "vocab-65-allocate",
      status: "mastered",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.streakDays).toBe(5);
  });

  it("rejects unknown vocabulary resource ids", async () => {
    const service = createLearningProgressService(createMemoryRepository());

    await expect(
      service.recordVocabularyStatus("student-1", {
        resourceId: "missing",
        status: "mastered",
      }),
    ).resolves.toEqual({
      ok: false,
      error: "词汇条目不存在或暂未发布。",
    });
  });
});
