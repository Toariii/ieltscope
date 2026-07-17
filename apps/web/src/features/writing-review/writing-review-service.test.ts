import { describe, expect, it } from "vitest";

import { createWritingReviewService, type WritingReviewRepository } from "./writing-review-service";

function createMemoryRepository(): WritingReviewRepository {
  const submissions = new Map<string, Awaited<ReturnType<WritingReviewRepository["createSubmission"]>>>();
  const evaluations = new Map<string, Awaited<ReturnType<WritingReviewRepository["createEvaluation"]>>>();
  let sequence = 0;

  return {
    async createSubmission(input) {
      sequence += 1;
      const submission = {
        id: `submission-${sequence}`,
        userId: input.userId,
        promptTitle: input.promptTitle,
        promptText: input.promptText,
        taskType: input.taskType,
        text: input.text,
        wordCount: input.wordCount,
        createdAt: new Date("2026-07-17T05:00:00Z"),
      };
      submissions.set(submission.id, submission);
      return submission;
    },
    async createEvaluation(input) {
      sequence += 1;
      const evaluation = {
        id: `evaluation-${sequence}`,
        submissionId: input.submissionId,
        userId: input.userId,
        overallScore: input.overallScore,
        overallLow: input.overallLow,
        overallHigh: input.overallHigh,
        confidence: input.confidence,
        criteria: input.criteria,
        topPriorities: input.topPriorities,
        evidence: input.evidence,
        rubricVersion: input.rubricVersion,
        completedAt: new Date("2026-07-17T05:01:00Z"),
      };
      evaluations.set(evaluation.id, evaluation);
      return evaluation;
    },
    async listReviews(userId) {
      return [...evaluations.values()]
        .filter((evaluation) => evaluation.userId === userId)
        .map((evaluation) => {
          const submission = submissions.get(evaluation.submissionId);
          if (!submission) throw new Error("missing submission");
          return { submission, evaluation };
        });
    },
  };
}

describe("createWritingReviewService", () => {
  it("submits a draft and returns a completed alpha review", async () => {
    const service = createWritingReviewService(createMemoryRepository());

    const result = await service.submitDraft("student-1", {
      taskType: "task2",
      promptTitle: "Online learning",
      promptText: "Can online courses replace traditional classrooms?",
      text: [
        "Nowadays, many students choose online courses because they can study more flexible and save time on travelling.",
        "I partly agree that this method is useful, but it also bring some problems.",
        "If students learn at home for a long time, they may lose motivation because there are no teachers or classmates around them.",
        "Therefore, online learning is helpful, but schools still play an important role for young learners.",
      ].join("\n\n"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.submission.wordCount).toBeGreaterThan(20);
    expect(result.data.evaluation.overallRange).toBe("5.5–6.5");
    expect(result.data.evaluation.criteria).toHaveLength(4);
    expect(result.data.evaluation.evidence[0]).toMatchObject({
      original: "study more flexible",
      suggestion: "study more flexibly",
    });
  });

  it("rejects drafts that are too short for a useful correction", async () => {
    const service = createWritingReviewService(createMemoryRepository());

    const result = await service.submitDraft("student-1", {
      taskType: "task2",
      promptTitle: "Too short",
      promptText: "Discuss both views.",
      text: "I agree.",
    });

    expect(result).toEqual({
      ok: false,
      errors: { text: "请至少输入 20 个英文词，系统才能生成有参考价值的批改。" },
    });
  });
});
