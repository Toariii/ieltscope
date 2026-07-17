import {
  assessmentQuestions,
  assessmentSections,
  requiredAssessmentQuestionIds,
  validateAssessmentAnswerInput,
  type AssessmentAnswerInput,
  type AssessmentEvaluationStage,
  type AssessmentEvaluationStatus,
  type AssessmentStatus,
  type Skill,
} from "@ielts/contracts";

export type StoredAssessment = {
  id: string;
  userId: string;
  status: AssessmentStatus;
  currentSection: Skill | null;
  startedAt: Date | null;
  submittedAt: Date | null;
  completedAt: Date | null;
};

export type StoredAssessmentAnswer = {
  id: string;
  answer: AssessmentAnswerInput;
};

export type StoredAssessmentEvaluation = {
  id: string;
  assessmentId: string;
  status: AssessmentEvaluationStatus;
  stage: AssessmentEvaluationStage;
  rubricVersion: string;
  provider: string | null;
  model: string | null;
  queuedAt: Date;
  processingStartedAt: Date | null;
  teacherCalibrationRequestedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  failureCode: string | null;
};

export type AssessmentSnapshot = {
  id: string;
  status: AssessmentStatus;
  currentSection: Skill;
  sections: Array<{
    id: Skill;
    label: string;
    estimatedMinutes: number;
    purpose: string;
    answered: number;
    required: number;
  }>;
  answers: Record<string, AssessmentAnswerInput>;
  progress: {
    answered: number;
    required: number;
  };
  canSubmit: boolean;
  submittedAt: string | null;
  completedAt: string | null;
  evaluation: {
    id: string;
    status: AssessmentEvaluationStatus;
    stage: AssessmentEvaluationStage;
    rubricVersion: string;
    provider: string | null;
    model: string | null;
    queuedAt: string;
    processingStartedAt: string | null;
    teacherCalibrationRequestedAt: string | null;
    completedAt: string | null;
    failedAt: string | null;
    failureCode: string | null;
  } | null;
};

export type AssessmentRepository = {
  findActiveByUser(userId: string): Promise<StoredAssessment | null>;
  create(userId: string): Promise<StoredAssessment>;
  listAnswers(assessmentId: string): Promise<StoredAssessmentAnswer[]>;
  findEvaluationByAssessment(assessmentId: string): Promise<StoredAssessmentEvaluation | null>;
  enqueueEvaluation(assessment: StoredAssessment, queuedAt: Date): Promise<StoredAssessmentEvaluation>;
  saveAnswer(assessmentId: string, input: AssessmentAnswerInput): Promise<void>;
  updateProgress(
    assessmentId: string,
    value: Partial<
      Pick<
        StoredAssessment,
        "status" | "currentSection" | "startedAt" | "submittedAt" | "completedAt"
      >
    >,
  ): Promise<void>;
};

type AssessmentServiceOptions = {
  now?: () => Date;
};

function requiredSet() {
  return new Set(requiredAssessmentQuestionIds);
}

function answersByQuestion(rows: StoredAssessmentAnswer[]) {
  return Object.fromEntries(rows.map((row) => [row.answer.questionId, row.answer]));
}

function serializeEvaluation(evaluation: StoredAssessmentEvaluation | null) {
  if (!evaluation) return null;
  return {
    id: evaluation.id,
    status: evaluation.status,
    stage: evaluation.stage,
    rubricVersion: evaluation.rubricVersion,
    provider: evaluation.provider,
    model: evaluation.model,
    queuedAt: evaluation.queuedAt.toISOString(),
    processingStartedAt: evaluation.processingStartedAt?.toISOString() ?? null,
    teacherCalibrationRequestedAt: evaluation.teacherCalibrationRequestedAt?.toISOString() ?? null,
    completedAt: evaluation.completedAt?.toISOString() ?? null,
    failedAt: evaluation.failedAt?.toISOString() ?? null,
    failureCode: evaluation.failureCode,
  };
}

function buildSnapshot(
  assessment: StoredAssessment,
  rows: StoredAssessmentAnswer[],
  evaluation: StoredAssessmentEvaluation | null = null,
): AssessmentSnapshot {
  const answers = answersByQuestion(rows);
  const required = requiredSet();
  const answeredRequired = requiredAssessmentQuestionIds.filter(
    (questionId) => answers[questionId],
  ).length;

  return {
    id: assessment.id,
    status: assessment.status,
    currentSection: assessment.currentSection ?? "listening",
    sections: assessmentSections.map((section) => {
      const sectionQuestions = assessmentQuestions.filter((question) => question.section === section.id);
      const sectionRequired = sectionQuestions.filter((question) => required.has(question.id));
      return {
        ...section,
        required: sectionRequired.length,
        answered: sectionRequired.filter((question) => answers[question.id]).length,
      };
    }),
    answers,
    progress: {
      answered: answeredRequired,
      required: requiredAssessmentQuestionIds.length,
    },
    canSubmit:
      assessment.status === "in_progress" &&
      answeredRequired === requiredAssessmentQuestionIds.length,
    submittedAt: assessment.submittedAt?.toISOString() ?? null,
    completedAt: assessment.completedAt?.toISOString() ?? null,
    evaluation: serializeEvaluation(evaluation),
  };
}

export function createAssessmentService(
  repository: AssessmentRepository,
  options: AssessmentServiceOptions = {},
) {
  const now = options.now ?? (() => new Date());

  async function getOrCreateAssessment(userId: string) {
    return (await repository.findActiveByUser(userId)) ?? repository.create(userId);
  }

  return {
    async getSnapshot(userId: string) {
      const assessment = await getOrCreateAssessment(userId);
      return buildSnapshot(
        assessment,
        await repository.listAnswers(assessment.id),
        await repository.findEvaluationByAssessment(assessment.id),
      );
    },

    async saveAnswer(userId: string, input: AssessmentAnswerInput) {
      const validation = validateAssessmentAnswerInput(input);
      if (!validation.ok) {
        return { ok: false as const, errors: validation.errors };
      }

      const assessment = await getOrCreateAssessment(userId);
      await repository.saveAnswer(assessment.id, input);
      await repository.updateProgress(assessment.id, {
        status: assessment.status === "draft" ? "in_progress" : assessment.status,
        currentSection: input.section,
        startedAt: assessment.startedAt ?? now(),
      });

      const updated = {
        ...assessment,
        status: assessment.status === "draft" ? ("in_progress" as const) : assessment.status,
        currentSection: input.section,
        startedAt: assessment.startedAt ?? now(),
      };
      return {
        ok: true as const,
        data: buildSnapshot(
          updated,
          await repository.listAnswers(assessment.id),
          await repository.findEvaluationByAssessment(assessment.id),
        ),
      };
    },

    async submit(userId: string) {
      const assessment = await getOrCreateAssessment(userId);
      const rows = await repository.listAnswers(assessment.id);
      const snapshot = buildSnapshot(assessment, rows);
      if (snapshot.progress.answered < snapshot.progress.required) {
        throw new Error("请先完成四科诊断题目");
      }

      const submittedAt = now();
      await repository.updateProgress(assessment.id, {
        status: "submitted",
        currentSection: "speaking",
        submittedAt,
      });
      const submittedAssessment = {
        ...assessment,
        status: "submitted" as const,
        currentSection: "speaking" as const,
        submittedAt,
      };
      const evaluation =
        (await repository.findEvaluationByAssessment(assessment.id)) ??
        (await repository.enqueueEvaluation(submittedAssessment, submittedAt));

      return buildSnapshot(submittedAssessment, rows, evaluation);
    },
  };
}
