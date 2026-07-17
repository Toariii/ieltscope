import {
  evaluateSpeakingResponse,
  type SpeakingCriterionResult,
  type SpeakingEvaluationResult,
  type SpeakingEvidenceItem,
  type SpeakingPart,
} from "./speaking-review-evaluator";

export type StoredSpeakingSubmission = {
  id: string;
  userId: string;
  promptTitle: string;
  promptText: string;
  part: SpeakingPart;
  transcript: string;
  wordCount: number;
  durationSeconds: number;
  createdAt: Date;
};

export type StoredSpeakingEvaluation = {
  id: string;
  submissionId: string;
  userId: string;
  overallScore: number;
  overallLow: number;
  overallHigh: number;
  confidence: number;
  criteria: SpeakingCriterionResult[];
  topPriorities: string[];
  evidence: SpeakingEvidenceItem[];
  rubricVersion: SpeakingEvaluationResult["rubricVersion"];
  analysisMode: SpeakingEvaluationResult["analysisMode"];
  completedAt: Date;
};

export type SpeakingReviewRepository = {
  createSubmission(input: {
    userId: string;
    promptTitle: string;
    promptText: string;
    part: SpeakingPart;
    transcript: string;
    wordCount: number;
    durationSeconds: number;
  }): Promise<StoredSpeakingSubmission>;
  createEvaluation(input: {
    submissionId: string;
    userId: string;
    overallScore: number;
    overallLow: number;
    overallHigh: number;
    confidence: number;
    criteria: SpeakingCriterionResult[];
    topPriorities: string[];
    evidence: SpeakingEvidenceItem[];
    rubricVersion: SpeakingEvaluationResult["rubricVersion"];
    analysisMode: SpeakingEvaluationResult["analysisMode"];
  }): Promise<StoredSpeakingEvaluation>;
  listReviews(userId: string): Promise<
    Array<{
      submission: StoredSpeakingSubmission;
      evaluation: StoredSpeakingEvaluation;
    }>
  >;
};

export type SpeakingTranscriptSubmitInput = {
  part: SpeakingPart;
  promptTitle: string;
  promptText: string;
  transcript: string;
  durationSeconds: number;
};

export type SpeakingReviewView = {
  submission: {
    id: string;
    promptTitle: string;
    promptText: string;
    part: SpeakingPart;
    transcript: string;
    wordCount: number;
    durationSeconds: number;
    createdAt: string;
  };
  evaluation: {
    id: string;
    overallScore: number;
    overallLow: number;
    overallHigh: number;
    overallRange: string;
    confidence: number;
    criteria: SpeakingCriterionResult[];
    topPriorities: string[];
    evidence: SpeakingEvidenceItem[];
    rubricVersion: SpeakingEvaluationResult["rubricVersion"];
    analysisMode: SpeakingEvaluationResult["analysisMode"];
    completedAt: string;
  };
};

function countWords(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

export function validateSpeakingTranscriptInput(input: SpeakingTranscriptSubmitInput) {
  const transcript = input.transcript.trim();
  const wordCount = countWords(transcript);
  if (wordCount < 20) {
    return {
      ok: false as const,
      errors: { transcript: "请至少输入 20 个英文词，系统才能生成有参考价值的口语反馈。" },
    };
  }

  return {
    ok: true as const,
    data: {
      part: input.part,
      promptTitle: input.promptTitle.trim(),
      promptText: input.promptText.trim(),
      transcript,
      wordCount,
      durationSeconds: Math.max(0, Math.round(input.durationSeconds)),
    },
  };
}

function toView({
  submission,
  evaluation,
}: {
  submission: StoredSpeakingSubmission;
  evaluation: StoredSpeakingEvaluation;
}): SpeakingReviewView {
  return {
    submission: {
      id: submission.id,
      promptTitle: submission.promptTitle,
      promptText: submission.promptText,
      part: submission.part,
      transcript: submission.transcript,
      wordCount: submission.wordCount,
      durationSeconds: submission.durationSeconds,
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
      analysisMode: evaluation.analysisMode,
      completedAt: evaluation.completedAt.toISOString(),
    },
  };
}

export function createSpeakingReviewService(repository: SpeakingReviewRepository) {
  return {
    async submitTranscript(userId: string, input: SpeakingTranscriptSubmitInput) {
      const validation = validateSpeakingTranscriptInput(input);
      if (!validation.ok) return validation;
      const { part, promptTitle, promptText, transcript, wordCount, durationSeconds } = validation.data;

      const alphaEvaluation = evaluateSpeakingResponse({
        part,
        prompt: promptText,
        transcript,
      });
      const submission = await repository.createSubmission({
        userId,
        promptTitle,
        promptText,
        part,
        transcript,
        wordCount,
        durationSeconds,
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
        analysisMode: alphaEvaluation.analysisMode,
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
