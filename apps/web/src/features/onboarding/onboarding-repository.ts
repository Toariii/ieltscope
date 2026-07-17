import { and, count, desc, eq } from "drizzle-orm";

import {
  fromBandUnits,
  skills,
  toBandUnits,
  type GoalInput,
  type OnboardingStep,
  type Skill,
  type StatusInput,
} from "@ielts/contracts";

import type { createDatabase } from "@/lib/db/client";
import { examRecords, goals, studentProfiles } from "@/lib/db/schema";

import type { OnboardingDraft, OnboardingRepository } from "./onboarding-service";

type Database = ReturnType<typeof createDatabase>["db"];

const validSteps = new Set<OnboardingStep>([
  "status",
  "records",
  "goal",
  "review",
  "complete",
]);

function readStep(value: string | null | undefined): OnboardingStep {
  return value && validSteps.has(value as OnboardingStep) ? (value as OnboardingStep) : "status";
}

function decodeMinimumSkills(value: Partial<Record<Skill, number>> | null) {
  const decoded: Partial<Record<Skill, number>> = {};
  for (const skill of skills) {
    const units = value?.[skill];
    if (units !== undefined) decoded[skill] = fromBandUnits(units);
  }
  return decoded;
}

function encodeMinimumSkills(value: GoalInput["minimumSkills"]) {
  return Object.fromEntries(
    Object.entries(value).map(([skill, score]) => [skill, toBandUnits(score)]),
  ) as Partial<Record<Skill, number>>;
}

export function createOnboardingRepository(db: Database): OnboardingRepository {
  return {
    async getDraft(userId): Promise<OnboardingDraft> {
      const [profile] = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, userId))
        .limit(1);
      const [activeGoal] = await db
        .select()
        .from(goals)
        .where(and(eq(goals.userId, userId), eq(goals.active, true)))
        .orderBy(desc(goals.createdAt))
        .limit(1);
      const [recordCount] = await db
        .select({ value: count() })
        .from(examRecords)
        .where(eq(examRecords.userId, userId));

      return {
        step: readStep(profile?.onboardingStep),
        status:
          profile?.hasRecentScores === null || profile?.hasRecentScores === undefined
            ? null
            : { hasRecentScores: profile.hasRecentScores },
        goal: activeGoal
          ? {
              targetOverall: fromBandUnits(activeGoal.targetOverall),
              targetExamDate: activeGoal.targetExamDate
                ? activeGoal.targetExamDate.toISOString().slice(0, 10)
                : "",
              weeklyMinutes: activeGoal.weeklyMinutes,
              minimumSkills: decodeMinimumSkills(activeGoal.minimumSkills),
            }
          : null,
        completedAt: profile?.onboardingCompletedAt ?? null,
        recordsCount: Number(recordCount?.value ?? 0),
      };
    },

    async saveStatus(userId: string, value: StatusInput) {
      await db
        .insert(studentProfiles)
        .values({ userId, hasRecentScores: value.hasRecentScores, onboardingStep: "records" })
        .onConflictDoUpdate({
          target: studentProfiles.userId,
          set: {
            hasRecentScores: value.hasRecentScores,
            onboardingStep: "records",
            updatedAt: new Date(),
          },
        });
    },

    async saveGoal(userId: string, value: GoalInput) {
      await db.transaction(async (tx) => {
        await tx.update(goals).set({ active: false, updatedAt: new Date() }).where(eq(goals.userId, userId));
        await tx.insert(goals).values({
          userId,
          targetExamDate: new Date(`${value.targetExamDate}T00:00:00Z`),
          targetOverall: toBandUnits(value.targetOverall),
          minimumSkills: encodeMinimumSkills(value.minimumSkills),
          weeklyMinutes: value.weeklyMinutes,
          active: true,
        });
        await tx
          .insert(studentProfiles)
          .values({ userId, weeklyMinutes: value.weeklyMinutes, onboardingStep: "review" })
          .onConflictDoUpdate({
            target: studentProfiles.userId,
            set: {
              weeklyMinutes: value.weeklyMinutes,
              onboardingStep: "review",
              updatedAt: new Date(),
            },
          });
      });
    },

    async completeInTransaction(userId: string) {
      await db.transaction(async (tx) => {
        await tx
          .update(studentProfiles)
          .set({
            onboardingStep: "complete",
            onboardingCompletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(studentProfiles.userId, userId));
      });
    },
  };
}
