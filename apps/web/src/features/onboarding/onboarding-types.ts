import type {
  ExamScoreInput,
  ExamSource,
  GoalInput,
  OnboardingStep,
  ParseStatus,
  StatusInput,
} from "@ielts/contracts";

export type ExamDocumentView = {
  id: string;
  originalFilename: string;
  byteSize: number;
  status: ParseStatus;
  fields: ExamScoreInput;
  warnings: string[];
  createdAt: string;
};

export type ExamRecordView = ExamScoreInput & {
  id: string;
  sourceType: ExamSource;
  sourceDocumentId: string | null;
};

export type OnboardingSnapshot = {
  draft: {
    step: OnboardingStep;
    status: StatusInput | null;
    goal: GoalInput | null;
    completedAt: Date | string | null;
    recordsCount: number;
  };
  documents: ExamDocumentView[];
  records: ExamRecordView[];
};
