import {
  evaluateWritingDraft,
  type WritingCriterionResult,
  type WritingEvidenceItem,
  type WritingEvaluationResult,
  type WritingTaskType,
} from "./writing-review-evaluator";

export type StoredWritingSubmission = {
  id: string;
  userId: string;
  promptTitle: string;
  promptText: string;
  taskType: WritingTaskType;
  text: string;
  wordCount: number;
  createdAt: Date;
};

export type StoredWritingEvaluation = {
  id: string;
  submissionId: string;
  userId: string;
  overallScore: number;
  overallLow: number;
  overallHigh: number;
  confidence: number;
  criteria: WritingCriterionResult[];
  topPriorities: string[];
  evidence: WritingEvidenceItem[];
  rubricVersion: WritingEvaluationResult["rubricVersion"];
  completedAt: Date;
};

export type WritingReviewRepository = {
  createSubmission(input: {
    userId: string;
    promptTitle: string;
    promptText: string;
    taskType: WritingTaskType;
    text: string;
    wordCount: number;
  }): Promise<StoredWritingSubmission>;
  createEvaluation(input: {
    submissionId: string;
    userId: string;
    overallScore: number;
    overallLow: number;
    overallHigh: number;
    confidence: number;
    criteria: WritingCriterionResult[];
    topPriorities: string[];
    evidence: WritingEvidenceItem[];
    rubricVersion: WritingEvaluationResult["rubricVersion"];
  }): Promise<StoredWritingEvaluation>;
  listReviews(userId: string): Promise<
    Array<{
      submission: StoredWritingSubmission;
      evaluation: StoredWritingEvaluation;
    }>
  >;
};

export type WritingDraftSubmitInput = {
  taskType: WritingTaskType;
  promptTitle: string;
  promptText: string;
  text: string;
};

export type WritingReviewView = {
  submission: {
    id: string;
    promptTitle: string;
    promptText: string;
    taskType: WritingTaskType;
    text: string;
    wordCount: number;
    createdAt: string;
  };
  evaluation: {
    id: string;
    overallScore: number;
    overallLow: number;
    overallHigh: number;
    overallRange: string;
    confidence: number;
    criteria: WritingCriterionResult[];
    topPriorities: string[];
    evidence: WritingEvidenceItem[];
    rubricVersion: WritingEvaluationResult["rubricVersion"];
    completedAt: string;
  };
};

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;
}

function toView({
  submission,
  evaluation,
}: {
  submission: StoredWritingSubmission;
  evaluation: StoredWritingEvaluation;
}): WritingReviewView {
  return {
    submission: {
      id: submission.id,
      promptTitle: submission.promptTitle,
      promptText: submission.promptText,
      taskType: submission.taskType,
      text: submission.text,
      wordCount: submission.wordCount,
      createdAt: submission.createdAt.toISOString(),
    },
    evaluation: {
      id: evaluation.id,
      overallScore: evaluation.overallScore,
      overallLow: evaluation.overallLow,
      overallHigh: evaluation.overallHigh,
      overallRange: `${evaluation.overallLow.toFixed(1)}–${evaluation.overallHigh.toFixed(1)}`,
      confidence: evaluation.confidence,
      criteria: evaluation.criteria,
      topPriorities: evaluation.topPriorities,
      evidence: evaluation.evidence,
      rubricVersion: evaluation.rubricVersion,
      completedAt: evaluation.completedAt.toISOString(),
    },
  };
}

export function createWritingReviewService(repository: WritingReviewRepository) {
  return {
    async submitDraft(userId: string, input: WritingDraftSubmitInput) {
      const text = input.text.trim();
      const wordCount = countWords(text);
      if (wordCount < 20) {
        return {
          ok: false as const,
          errors: { text: "请至少输入 20 个英文词，系统才能生成有参考价值的批改。" },
        };
      }

      const alphaEvaluation = evaluateWritingDraft({
        taskType: input.taskType,
        prompt: input.promptText,
        text,
      });
      const submission = await repository.createSubmission({
        userId,
        promptTitle: input.promptTitle.trim(),
        promptText: input.promptText.trim(),
        taskType: input.taskType,
        text,
        wordCount,
      });
      const evaluation = await repository.createEvaluation({
        submissionId: submission.id,
        userId,
        overallScore: alphaEvaluation.overallScore,
        overallLow: alphaEvaluation.overallLow,
        overallHigh: alphaEvaluation.overallHigh,
        confidence: alphaEvaluation.confidence,
        criteria: alphaEvaluation.criteria,
        topPriorities: alphaEvaluation.topPriorities,
        evidence: alphaEvaluation.evidence,
        rubricVersion: alphaEvaluation.rubricVersion,
      });

      return {
        ok: true as const,
        data: toView({ submission, evaluation }),
      };
    },

    async listReviews(userId: string) {
      const rows = await repository.listReviews(userId);
      return rows.map(toView);
    },
  };
}
