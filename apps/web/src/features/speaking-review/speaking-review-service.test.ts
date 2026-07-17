import { describe, expect, it } from "vitest";

import { createSpeakingReviewService, type SpeakingReviewRepository } from "./speaking-review-service";

function createMemoryRepository(): SpeakingReviewRepository {
  const submissions = new Map<string, Awaited<ReturnType<SpeakingReviewRepository["createSubmission"]>>>();
  const evaluations = new Map<string, Awaited<ReturnType<SpeakingReviewRepository["createEvaluation"]>>>();
  let sequence = 0;

  return {
    async createSubmission(input) {
      sequence += 1;
      const submission = {
        id: `speaking-${sequence}`,
        userId: input.userId,
        promptTitle: input.promptTitle,
        promptText: input.promptText,
        part: input.part,
        transcript: input.transcript,
        wordCount: input.wordCount,
        durationSeconds: input.durationSeconds,
        createdAt: new Date("2026-07-17T06:00:00Z"),
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
        analysisMode: input.analysisMode,
        completedAt: new Date("2026-07-17T06:01:00Z"),
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

describe("createSpeakingReviewService", () => {
  it("submits a transcript and returns a completed alpha review", async () => {
    const service = createSpeakingReviewService(createMemoryRepository());

    const result = await service.submitTranscript("student-1", {
      part: "part2",
      promptTitle: "A quiet study place",
      promptText: "Describe a quiet place where you like to study.",
      durationSeconds: 92,
      transcript: [
        "I want to describe a small study room near my office.",
        "I usually go there after work because it is quiet and I can focus on my English.",
        "There are many books and some comfortable chairs, so I feel relaxed.",
        "But sometimes I stop for a long time because I cannot find exact words to explain my feeling.",
        "Overall, this place is useful for me because it help me build a regular study habit.",
      ].join(" "),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.submission.wordCount).toBeGreaterThan(60);
    expect(result.data.submission.durationSeconds).toBe(92);
    expect(result.data.evaluation.overallRange).toBe("5.5–6.5");
    expect(result.data.evaluation.analysisMode).toBe("transcript_only");
    expect(result.data.evaluation.evidence[0]).toMatchObject({
      original: "it help me",
      suggestion: "it helps me",
    });
  });

  it("rejects very short transcripts", async () => {
    const service = createSpeakingReviewService(createMemoryRepository());

    const result = await service.submitTranscript("student-1", {
      part: "part2",
      promptTitle: "Short answer",
      promptText: "Describe a place.",
      durationSeconds: 8,
      transcript: "A library.",
    });

    expect(result).toEqual({
      ok: false,
      errors: { transcript: "请至少输入 20 个英文词，系统才能生成有参考价值的口语反馈。" },
    });
  });
});
