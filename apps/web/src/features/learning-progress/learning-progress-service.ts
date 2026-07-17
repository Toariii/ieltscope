import type { Skill } from "@ielts/contracts";

import { resourceCatalog, type VocabularyEntry } from "@/features/resources/resource-catalog";

export type VocabularyLearningStatus = "mastered" | "review";

export type StoredLearningEvent = {
  eventType: string;
  durationSeconds: number;
  outcome: Record<string, unknown> | null;
  occurredAt: Date;
};

export type StoredStreak = {
  activeDays: number;
  longestDays: number;
  lastActiveDate: string | null;
  rewardCycle: number;
};

export type LearningProgressRepository = {
  recordEvent(input: {
    userId: string;
    skill: Skill;
    eventType: string;
    durationSeconds: number;
    outcome: Record<string, unknown>;
    occurredAt: Date;
  }): Promise<void>;
  listVocabularyEvents(userId: string): Promise<StoredLearningEvent[]>;
  getStreak(userId: string): Promise<StoredStreak | null>;
  saveStreak(userId: string, streak: StoredStreak): Promise<void>;
  getLearningSecondsSince(userId: string, since: Date): Promise<number>;
};

export type VocabularyProgressView = {
  masteredIds: string[];
  reviewIds: string[];
  streakDays: number;
  weeklyMinutes: number;
};

const vocabularyById = new Map(resourceCatalog.vocabulary.map((entry) => [entry.id, entry]));

function dateKey(date: Date, timeZone = "Asia/Shanghai") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dateKeyToUtcDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function updateStreak(current: StoredStreak | null, occurredAt: Date): StoredStreak {
  const today = dateKey(occurredAt);
  if (current?.lastActiveDate === today) return current;

  const previousDay = current?.lastActiveDate ? dateKeyToUtcDay(current.lastActiveDate) : null;
  const todayDay = dateKeyToUtcDay(today);
  const continued = previousDay !== null && todayDay - previousDay === 24 * 60 * 60 * 1000;
  const activeDays = continued ? (current?.activeDays ?? 0) + 1 : 1;

  return {
    activeDays,
    longestDays: Math.max(activeDays, current?.longestDays ?? 0),
    lastActiveDate: today,
    rewardCycle: current?.rewardCycle ?? 0,
  };
}

function weekStart(date: Date) {
  const key = dateKey(date);
  const start = new Date(`${key}T00:00:00.000Z`);
  const day = start.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
}

function isVocabularyLearningStatus(value: unknown): value is VocabularyLearningStatus {
  return value === "mastered" || value === "review";
}

function readVocabularyStatus(event: StoredLearningEvent) {
  const resourceId = event.outcome?.resourceId;
  const status = event.outcome?.status;
  if (typeof resourceId !== "string") return null;
  if (!isVocabularyLearningStatus(status)) return null;
  if (!vocabularyById.has(resourceId)) return null;
  return { resourceId, status };
}

function progressFromEvents(events: StoredLearningEvent[]) {
  const latest = new Map<string, VocabularyLearningStatus>();
  for (const event of [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())) {
    const status = readVocabularyStatus(event);
    if (status) latest.set(status.resourceId, status.status);
  }

  return {
    masteredIds: [...latest.entries()]
      .filter(([, status]) => status === "mastered")
      .map(([id]) => id),
    reviewIds: [...latest.entries()]
      .filter(([, status]) => status === "review")
      .map(([id]) => id),
  };
}

function vocabularyOutcome(entry: VocabularyEntry, status: VocabularyLearningStatus) {
  return {
    resourceType: "vocabulary",
    resourceId: entry.id,
    status,
    band: entry.band,
    word: entry.word,
  };
}

export function createLearningProgressService(
  repository: LearningProgressRepository,
  options: { now?: () => Date } = {},
) {
  const now = options.now ?? (() => new Date());

  return {
    async getVocabularyProgress(userId: string): Promise<VocabularyProgressView> {
      const currentTime = now();
      const [events, streak, seconds] = await Promise.all([
        repository.listVocabularyEvents(userId),
        repository.getStreak(userId),
        repository.getLearningSecondsSince(userId, weekStart(currentTime)),
      ]);
      const progress = progressFromEvents(events);
      return {
        ...progress,
        streakDays: streak?.activeDays ?? 0,
        weeklyMinutes: Math.round(seconds / 60),
      };
    },

    async recordVocabularyStatus(
      userId: string,
      input: { resourceId: string; status: VocabularyLearningStatus },
    ) {
      const entry = vocabularyById.get(input.resourceId);
      if (!entry) {
        return {
          ok: false as const,
          error: "词汇条目不存在或暂未发布。",
        };
      }

      const currentTime = now();
      await repository.recordEvent({
        userId,
        skill: "reading",
        eventType: `vocabulary_${input.status}`,
        durationSeconds: input.status === "mastered" ? 120 : 75,
        outcome: vocabularyOutcome(entry, input.status),
        occurredAt: currentTime,
      });
      await repository.saveStreak(userId, updateStreak(await repository.getStreak(userId), currentTime));

      return {
        ok: true as const,
        data: await this.getVocabularyProgress(userId),
      };
    },

    async getDashboardLearningStats(userId: string) {
      const currentTime = now();
      const [streak, seconds] = await Promise.all([
        repository.getStreak(userId),
        repository.getLearningSecondsSince(userId, weekStart(currentTime)),
      ]);
      return {
        streakDays: streak?.activeDays ?? 0,
        completedMinutes: Math.round(seconds / 60),
      };
    },
  };
}
