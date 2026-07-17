import { and, desc, eq, inArray } from "drizzle-orm";

import type { AssessmentAnswerInput, AssessmentStatus, Skill } from "@ielts/contracts";

import type { createDatabase } from "@/lib/db/client";
import { assessmentAnswers, assessments } from "@/lib/db/schema";

import type {
  AssessmentRepository,
  StoredAssessment,
  StoredAssessmentAnswer,
} from "./assessment-service";

type Database = ReturnType<typeof createDatabase>["db"];

function readStatus(value: string): AssessmentStatus {
  return ["draft", "in_progress", "submitted", "completed"].includes(value)
    ? (value as AssessmentStatus)
    : "draft";
}

function readSection(value: string | null): Skill | null {
  return value === "listening" ||
    value === "reading" ||
    value === "writing" ||
    value === "speaking"
    ? value
    : null;
}

function toStoredAssessment(row: typeof assessments.$inferSelect): StoredAssessment {
  return {
    id: row.id,
    userId: row.userId,
    status: readStatus(row.status),
    currentSection: readSection(row.currentSection),
    startedAt: row.startedAt,
    submittedAt: row.submittedAt,
    completedAt: row.completedAt,
  };
}

function toStoredAnswer(row: typeof assessmentAnswers.$inferSelect): StoredAssessmentAnswer {
  return {
    id: row.id,
    answer: row.answer as AssessmentAnswerInput,
  };
}

export function createAssessmentRepository(db: Database): AssessmentRepository {
  return {
    async findActiveByUser(userId) {
      const [assessment] = await db
        .select()
        .from(assessments)
        .where(
          and(
            eq(assessments.userId, userId),
            inArray(assessments.status, ["draft", "in_progress", "submitted"]),
          ),
        )
        .orderBy(desc(assessments.createdAt))
        .limit(1);
      return assessment ? toStoredAssessment(assessment) : null;
    },

    async create(userId) {
      const [assessment] = await db
        .insert(assessments)
        .values({ userId, status: "draft", currentSection: "listening" })
        .returning();
      return toStoredAssessment(assessment);
    },

    async listAnswers(assessmentId) {
      const rows = await db
        .select()
        .from(assessmentAnswers)
        .where(eq(assessmentAnswers.assessmentId, assessmentId))
        .orderBy(assessmentAnswers.createdAt);
      return rows.map(toStoredAnswer);
    },

    async saveAnswer(assessmentId, input) {
      const rows = await db
        .select()
        .from(assessmentAnswers)
        .where(eq(assessmentAnswers.assessmentId, assessmentId));
      const existing = rows.find(
        (row) => (row.answer as AssessmentAnswerInput).questionId === input.questionId,
      );
      const values = {
        assessmentId,
        section: input.section,
        answer: input,
        durationSeconds: input.durationSeconds,
        updatedAt: new Date(),
      };

      if (existing) {
        await db.update(assessmentAnswers).set(values).where(eq(assessmentAnswers.id, existing.id));
      } else {
        await db.insert(assessmentAnswers).values(values);
      }
    },

    async updateProgress(assessmentId, value) {
      await db
        .update(assessments)
        .set({ ...value, updatedAt: new Date() })
        .where(eq(assessments.id, assessmentId));
    },
  };
}
