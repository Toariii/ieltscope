import { and, desc, eq, inArray } from "drizzle-orm";

import type { AssessmentAnswerInput, AssessmentStatus, Skill } from "@ielts/contracts";

import type { createDatabase } from "@/lib/db/client";
import { assessmentAnswers, assessmentEvaluations, assessments } from "@/lib/db/schema";

import type {
  AssessmentRepository,
  StoredAssessment,
  StoredAssessmentAnswer,
  StoredAssessmentEvaluation,
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

function readEvaluationStatus(value: string) {
  return ["queued", "processing", "completed", "failed"].includes(value)
    ? (value as StoredAssessmentEvaluation["status"])
    : "queued";
}

function readEvaluationStage(value: string) {
  return ["ai_initial_scoring", "teacher_calibration", "report_generation"].includes(value)
    ? (value as StoredAssessmentEvaluation["stage"])
    : "ai_initial_scoring";
}

function toStoredEvaluation(
  row: typeof assessmentEvaluations.$inferSelect,
): StoredAssessmentEvaluation {
  return {
    id: row.id,
    assessmentId: row.assessmentId,
    status: readEvaluationStatus(row.status),
    stage: readEvaluationStage(row.stage),
    rubricVersion: row.rubricVersion,
    provider: row.provider,
    model: row.model,
    queuedAt: row.queuedAt,
    processingStartedAt: row.processingStartedAt,
    teacherCalibrationRequestedAt: row.teacherCalibrationRequestedAt,
    completedAt: row.completedAt,
    failedAt: row.failedAt,
    failureCode: row.failureCode,
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

    async findEvaluationByAssessment(assessmentId) {
      const [evaluation] = await db
        .select()
        .from(assessmentEvaluations)
        .where(eq(assessmentEvaluations.assessmentId, assessmentId))
        .limit(1);
      return evaluation ? toStoredEvaluation(evaluation) : null;
    },

    async enqueueEvaluation(assessment, queuedAt) {
      const [evaluation] = await db
        .insert(assessmentEvaluations)
        .values({
          assessmentId: assessment.id,
          userId: assessment.userId,
          status: "queued",
          stage: "ai_initial_scoring",
          queuedAt,
        })
        .onConflictDoUpdate({
          target: assessmentEvaluations.assessmentId,
          set: { updatedAt: new Date() },
        })
        .returning();
      return toStoredEvaluation(evaluation);
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
