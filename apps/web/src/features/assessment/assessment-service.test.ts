import { describe, expect, it } from "vitest";

import type { AssessmentAnswerInput, AssessmentStatus } from "@ielts/contracts";

import {
  createAssessmentService,
  type AssessmentRepository,
  type StoredAssessment,
  type StoredAssessmentAnswer,
} from "./assessment-service";

const answers: AssessmentAnswerInput[] = [
  { questionId: "listening-main-idea", section: "listening", value: "A", durationSeconds: 90 },
  { questionId: "vocab-context-1", section: "reading", value: "B", durationSeconds: 60 },
  {
    questionId: "writing-diagnostic-task",
    section: "writing",
    value: "Public transport should be improved because it affects commute time and air quality.",
    durationSeconds: 600,
  },
  {
    questionId: "speaking-part2-sample",
    section: "speaking",
    value: "A place I often study is a quiet library near my office.",
    durationSeconds: 120,
  },
];

function createMemoryRepository() {
  const assessments = new Map<string, StoredAssessment>();
  const answerRows = new Map<string, StoredAssessmentAnswer[]>();
  let counter = 0;

  const repository: AssessmentRepository = {
    async findActiveByUser(userId) {
      return [...assessments.values()].find(
        (assessment) =>
          assessment.userId === userId &&
          (assessment.status === "draft" || assessment.status === "in_progress"),
      ) ?? null;
    },
    async create(userId) {
      counter += 1;
      const assessment: StoredAssessment = {
        id: `assessment-${counter}`,
        userId,
        status: "draft",
        currentSection: "listening",
        startedAt: null,
        submittedAt: null,
        completedAt: null,
      };
      assessments.set(assessment.id, assessment);
      answerRows.set(assessment.id, []);
      return assessment;
    },
    async listAnswers(assessmentId) {
      return answerRows.get(assessmentId) ?? [];
    },
    async saveAnswer(assessmentId, input) {
      const rows = answerRows.get(assessmentId) ?? [];
      const current = rows.filter((row) => row.answer.questionId !== input.questionId);
      current.push({ id: `answer-${input.questionId}`, answer: input });
      answerRows.set(assessmentId, current);
    },
    async updateProgress(assessmentId, value) {
      const assessment = assessments.get(assessmentId);
      if (!assessment) throw new Error("missing assessment");
      assessments.set(assessmentId, { ...assessment, ...value });
    },
  };

  return { repository, assessments, answerRows };
}

describe("assessment service", () => {
  it("creates a draft assessment and reports required progress", async () => {
    const memory = createMemoryRepository();
    const service = createAssessmentService(memory.repository, {
      now: () => new Date("2026-07-17T00:00:00Z"),
    });

    const snapshot = await service.getSnapshot("user-1");

    expect(snapshot.status).toBe<AssessmentStatus>("draft");
    expect(snapshot.sections).toHaveLength(4);
    expect(snapshot.progress.answered).toBe(0);
    expect(snapshot.progress.required).toBe(4);
    expect(snapshot.canSubmit).toBe(false);
  });

  it("saves answers by question and only submits after all required sections are answered", async () => {
    const memory = createMemoryRepository();
    const service = createAssessmentService(memory.repository, {
      now: () => new Date("2026-07-17T00:00:00Z"),
    });

    await expect(service.submit("user-1")).rejects.toThrow("请先完成四科诊断题目");
    for (const answer of answers) {
      await service.saveAnswer("user-1", answer);
    }

    const submitted = await service.submit("user-1");

    expect(submitted.status).toBe<AssessmentStatus>("submitted");
    expect(submitted.progress.answered).toBe(4);
    expect(submitted.canSubmit).toBe(false);
    expect([...memory.assessments.values()][0]).toMatchObject({
      status: "submitted",
      currentSection: "speaking",
      submittedAt: new Date("2026-07-17T00:00:00Z"),
    });
  });
});
