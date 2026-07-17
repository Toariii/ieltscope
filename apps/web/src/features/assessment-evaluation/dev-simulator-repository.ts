import { and, desc, eq, inArray } from "drizzle-orm";

import type { AssessmentAnswerInput } from "@ielts/contracts";

import type { createDatabase } from "@/lib/db/client";
import { assessmentAnswers, assessmentEvaluations, assessments, skillEstimates } from "@/lib/db/schema";

import type { StoredAssessment, StoredAssessmentEvaluation } from "@/features/assessment/assessment-service";

import {
  devAssessmentScoringModel,
  devAssessmentScoringProvider,
  devAssessmentScoringRubricVersion,
  type AssessmentEvaluationSimulatorRepository,
  type DevSkillEstimate,
} from "./dev-simulator";

type Database = ReturnType<typeof createDatabase>["db"];

function readAssessmentStatus(value: string): StoredAssessment["status"] {
  return ["draft", "in_progress", "submitted", "completed"].includes(value)
    ? (value as StoredAssessment["status"])
    : "draft";
}

function readSkill(value: string | null): StoredAssessment["currentSection"] {
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
    status: readAssessmentStatus(row.status),
    currentSection: readSkill(row.currentSection),
    startedAt: row.startedAt,
    submittedAt: row.submittedAt,
    completedAt: row.completedAt,
  };
}

function readEvaluationStatus(value: string): StoredAssessmentEvaluation["status"] {
  return ["queued", "processing", "completed", "failed"].includes(value)
    ? (value as StoredAssessmentEvaluation["status"])
    : "queued";
}

function readEvaluationStage(value: string): StoredAssessmentEvaluation["stage"] {
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

export function createDevAssessmentScoringRepository(
  db: Database,
): AssessmentEvaluationSimulatorRepository {
  return {
    async findLatestScorableAssessment(userId) {
      const [assessment] = await db
        .select()
        .from(assessments)
        .where(
          and(eq(assessments.userId, userId), inArray(assessments.status, ["submitted", "completed"])),
        )
        .orderBy(desc(assessments.submittedAt), desc(assessments.createdAt))
        .limit(1);
      return assessment ? toStoredAssessment(assessment) : null;
    },

    async listAnswers(assessmentId) {
      const rows = await db
        .select()
        .from(assessmentAnswers)
        .where(eq(assessmentAnswers.assessmentId, assessmentId));
      return rows.map((row) => ({
        id: row.id,
        answer: row.answer as AssessmentAnswerInput,
      }));
    },

    async findEvaluationByAssessment(assessmentId) {
      const [evaluation] = await db
        .select()
        .from(assessmentEvaluations)
        .where(eq(assessmentEvaluations.assessmentId, assessmentId))
        .limit(1);
      return evaluation ? toStoredEvaluation(evaluation) : null;
    },

    async markEvaluationProcessing(evaluationId, processingStartedAt) {
      await db
        .update(assessmentEvaluations)
        .set({
          status: "processing",
          stage: "ai_initial_scoring",
          provider: devAssessmentScoringProvider,
          model: devAssessmentScoringModel,
          rubricVersion: devAssessmentScoringRubricVersion,
          processingStartedAt,
          failedAt: null,
          failureCode: null,
          updatedAt: new Date(),
        })
        .where(eq(assessmentEvaluations.id, evaluationId));
    },

    async upsertSkillEstimate(estimate: DevSkillEstimate) {
      const [existing] = await db
        .select({ id: skillEstimates.id })
        .from(skillEstimates)
        .where(
          and(
            eq(skillEstimates.userId, estimate.userId),
            eq(skillEstimates.assessmentId, estimate.assessmentId),
            eq(skillEstimates.skill, estimate.skill),
          ),
        )
        .limit(1);

      const values = {
        userId: estimate.userId,
        assessmentId: estimate.assessmentId,
        skill: estimate.skill,
        estimatedScore: estimate.estimatedScore,
        lowScore: estimate.lowScore,
        highScore: estimate.highScore,
        confidence: estimate.confidence,
        rationale: estimate.rationale,
        updatedAt: new Date(),
      };

      if (existing) {
        await db.update(skillEstimates).set(values).where(eq(skillEstimates.id, existing.id));
        return;
      }

      await db.insert(skillEstimates).values(values);
    },

    async completeEvaluation(evaluationId, value) {
      await db
        .update(assessmentEvaluations)
        .set({
          status: "completed",
          stage: "report_generation",
          completedAt: value.completedAt,
          reportSummary: value.reportSummary,
          updatedAt: new Date(),
        })
        .where(eq(assessmentEvaluations.id, evaluationId));
    },

    async completeAssessment(assessmentId, completedAt) {
      await db
        .update(assessments)
        .set({ status: "completed", completedAt, updatedAt: new Date() })
        .where(eq(assessments.id, assessmentId));
    },
  };
}
