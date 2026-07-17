import { and, eq, gte, inArray, sum } from "drizzle-orm";

import type { createDatabase } from "@/lib/db/client";
import { learningEvents, streaks } from "@/lib/db/schema";

import type { LearningProgressRepository, StoredStreak } from "./learning-progress-service";

type Database = ReturnType<typeof createDatabase>["db"];

function toStreak(row: typeof streaks.$inferSelect): StoredStreak {
  return {
    activeDays: row.activeDays,
    longestDays: row.longestDays,
    lastActiveDate: row.lastActiveDate,
    rewardCycle: row.rewardCycle,
  };
}

export function createLearningProgressRepository(db: Database): LearningProgressRepository {
  return {
    async recordEvent(input) {
      await db.insert(learningEvents).values({
        userId: input.userId,
        skill: input.skill,
        eventType: input.eventType,
        durationSeconds: input.durationSeconds,
        outcome: input.outcome,
        occurredAt: input.occurredAt,
      });
    },

    async listVocabularyEvents(userId) {
      const rows = await db
        .select({
          eventType: learningEvents.eventType,
          durationSeconds: learningEvents.durationSeconds,
          outcome: learningEvents.outcome,
          occurredAt: learningEvents.occurredAt,
        })
        .from(learningEvents)
        .where(
          and(
            eq(learningEvents.userId, userId),
            inArray(learningEvents.eventType, ["vocabulary_mastered", "vocabulary_review"]),
          ),
        )
        .orderBy(learningEvents.occurredAt);
      return rows;
    },

    async getStreak(userId) {
      const [row] = await db
        .select()
        .from(streaks)
        .where(eq(streaks.userId, userId))
        .limit(1);
      return row ? toStreak(row) : null;
    },

    async saveStreak(userId, streak) {
      await db
        .insert(streaks)
        .values({
          userId,
          activeDays: streak.activeDays,
          longestDays: streak.longestDays,
          lastActiveDate: streak.lastActiveDate,
          rewardCycle: streak.rewardCycle,
        })
        .onConflictDoUpdate({
          target: streaks.userId,
          set: {
            activeDays: streak.activeDays,
            longestDays: streak.longestDays,
            lastActiveDate: streak.lastActiveDate,
            rewardCycle: streak.rewardCycle,
            updatedAt: new Date(),
          },
        });
    },

    async getLearningSecondsSince(userId, since) {
      const [row] = await db
        .select({ total: sum(learningEvents.durationSeconds) })
        .from(learningEvents)
        .where(and(eq(learningEvents.userId, userId), gte(learningEvents.occurredAt, since)));
      return Number(row?.total ?? 0);
    },
  };
}
