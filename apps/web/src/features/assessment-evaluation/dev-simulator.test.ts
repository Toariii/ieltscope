import { describe, expect, it } from "vitest";

import type { AssessmentAnswerInput } from "@ielts/contracts";

import type { StoredAssessment, StoredAssessmentEvaluation } from "@/features/assessment/assessment-service";

import {
  createDevAssessmentScoringSimulator,
  type AssessmentEvaluationSimulatorRepository,
  type DevSkillEstimate,
} from "./dev-simulator";

const answers: AssessmentAnswerInput[] = [
  { questionId: "listening-main-idea", section: "listening", value: "A", durationSeconds: 90 },
  { questionId: "vocab-context-1", section: "reading", value: "B", durationSeconds: 75 },
  {
    questionId: "writing-diagnostic-task",
    section: "writing",
    value:
      "Public transport should be improved because it reduces traffic and helps students commute reliably. " +
      "A stronger bus and metro system also lowers pollution and gives families more affordable choices. " +
      "However, governments need to plan routes carefully, otherwise investment may not reach people who need it most.",
    durationSeconds: 900,
  },
  {
    questionId: "speaking-part2-sample",
    section: "speaking",
    value:
      "I would describe a quiet study room near my office. I usually go there after work because the atmosphere helps me focus and I can review vocabulary before speaking practice.",
    durationSeconds: 180,
  },
];

function createMemoryRepository() {
  const assessment: StoredAssessment = {
    id: "assessment-1",
    userId: "user-1",
    status: "submitted",
    currentSection: "speaking",
    startedAt: new Date("2026-07-17T01:00:00Z"),
    submittedAt: new Date("2026-07-17T02:00:00Z"),
    completedAt: null,
  };
  const evaluation: StoredAssessmentEvaluation = {
    id: "evaluation-1",
    assessmentId: assessment.id,
    status: "queued",
    stage: "ai_initial_scoring",
    rubricVersion: "diagnostic-alpha-v1",
    provider: null,
    model: null,
    queuedAt: new Date("2026-07-17T02:00:00Z"),
    processingStartedAt: null,
    teacherCalibrationRequestedAt: null,
    completedAt: null,
    failedAt: null,
    failureCode: null,
  };
  const estimates = new Map<string, DevSkillEstimate>();

  const repository: AssessmentEvaluationSimulatorRepository = {
    async findLatestScorableAssessment(userId) {
      return assessment.userId === userId &&
        (assessment.status === "submitted" || assessment.status === "completed")
        ? assessment
        : null;
    },
    async listAnswers() {
      return answers.map((answer) => ({ id: `answer-${answer.questionId}`, answer }));
    },
    async findEvaluationByAssessment() {
      return evaluation;
    },
    async markEvaluationProcessing(_evaluationId, processingStartedAt) {
      evaluation.status = "processing";
      evaluation.stage = "ai_initial_scoring";
      evaluation.processingStartedAt = processingStartedAt;
    },
    async upsertSkillEstimate(estimate) {
      estimates.set(estimate.skill, estimate);
    },
    async completeEvaluation(_evaluationId, value) {
      evaluation.status = "completed";
      evaluation.stage = "report_generation";
      evaluation.completedAt = value.completedAt;
    },
    async completeAssessment(_assessmentId, completedAt) {
      assessment.status = "completed";
      assessment.completedAt = completedAt;
    },
  };

  return { assessment, evaluation, estimates, repository };
}

describe("development assessment scoring simulator", () => {
  it("moves a submitted diagnostic to completed and writes four skill estimates", async () => {
    const memory = createMemoryRepository();
    const simulator = createDevAssessmentScoringSimulator(memory.repository, {
      now: () => new Date("2026-07-17T03:00:00Z"),
    });

    const result = await simulator.runForUser("user-1");

    expect(result).toMatchObject({
      assessmentId: "assessment-1",
      evaluationId: "evaluation-1",
      completedAt: "2026-07-17T03:00:00.000Z",
    });
    expect(result.estimates).toHaveLength(4);
    expect(memory.assessment.status).toBe("completed");
    expect(memory.evaluation.status).toBe("completed");
    expect(memory.evaluation.stage).toBe("report_generation");
    expect(memory.estimates.size).toBe(4);
    expect(memory.estimates.get("writing")).toMatchObject({
      estimatedScore: 11,
      lowScore: 10,
      highScore: 12,
      confidence: "0.610",
      rationale: { source: "dev_simulator" },
    });
  });

  it("updates the same four skill slots when rerun", async () => {
    const memory = createMemoryRepository();
    const simulator = createDevAssessmentScoringSimulator(memory.repository, {
      now: () => new Date("2026-07-17T03:00:00Z"),
    });

    await simulator.runForUser("user-1");
    await simulator.runForUser("user-1");

    expect(memory.estimates.size).toBe(4);
  });

  it("fails clearly when there is no submitted diagnostic", async () => {
    const memory = createMemoryRepository();
    memory.assessment.status = "draft";
    const simulator = createDevAssessmentScoringSimulator(memory.repository);

    await expect(simulator.runForUser("user-1")).rejects.toThrow(
      "没有可完成评分的已提交诊断",
    );
  });
});
