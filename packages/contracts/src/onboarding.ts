export const contractsVersion = "0.1.0";

export const skills = ["listening", "reading", "writing", "speaking"] as const;

export type Skill = (typeof skills)[number];
export type ExamSource = "pdf" | "manual";
export type ParseStatus =
  | "processing"
  | "awaiting_confirmation"
  | "ready"
  | "needs_review"
  | "failed";
export type OnboardingStep = "status" | "records" | "goal" | "review" | "complete";

export type StatusInput = {
  hasRecentScores: boolean;
};

export type GoalInput = {
  targetOverall: number;
  targetExamDate: string;
  weeklyMinutes: number;
  minimumSkills: Partial<Record<Skill, number>>;
};

export type ExamScoreInput = {
  examDate: string;
  overall: number | null;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
};

export type ValidationResult = {
  ok: boolean;
  errors: Record<string, string>;
};

export type AssessmentStatus = "draft" | "in_progress" | "submitted" | "completed";
export type AssessmentQuestionKind = "single_choice" | "short_text" | "long_text";

export type AssessmentSection = {
  id: Skill;
  label: string;
  estimatedMinutes: number;
  purpose: string;
};

export type AssessmentQuestion = {
  id: string;
  section: Skill;
  kind: AssessmentQuestionKind;
  title: string;
  prompt: string;
  options?: string[];
  required: boolean;
  estimatedMinutes: number;
};

export type AssessmentAnswerInput = {
  questionId: string;
  section: Skill;
  value: string | string[];
  durationSeconds: number;
};

export const assessmentSections: AssessmentSection[] = [
  {
    id: "listening",
    label: "听力",
    estimatedMinutes: 15,
    purpose: "检查关键词定位、主旨理解与基础听辨",
  },
  {
    id: "reading",
    label: "阅读",
    estimatedMinutes: 15,
    purpose: "检查词汇、长难句和段落逻辑",
  },
  {
    id: "writing",
    label: "写作",
    estimatedMinutes: 20,
    purpose: "检查语法、展开、衔接和任务回应",
  },
  {
    id: "speaking",
    label: "口语",
    estimatedMinutes: 10,
    purpose: "检查流利度、发音意识和英语表达逻辑",
  },
];

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: "listening-main-idea",
    section: "listening",
    kind: "single_choice",
    title: "听力主旨判断",
    prompt: "听一段学习场景对话后，选择说话人最主要想解决的问题。",
    options: ["A", "B", "C", "D"],
    required: true,
    estimatedMinutes: 15,
  },
  {
    id: "vocab-context-1",
    section: "reading",
    kind: "single_choice",
    title: "语境词汇与阅读逻辑",
    prompt: "阅读一段短文后，选择最符合上下文的替换词，并说明一句理由。",
    options: ["A", "B", "C", "D"],
    required: true,
    estimatedMinutes: 15,
  },
  {
    id: "writing-diagnostic-task",
    section: "writing",
    kind: "long_text",
    title: "写作基础诊断",
    prompt: "用 180–260 词回应一个 Task 2 观点题，重点观察语法、展开和逻辑衔接。",
    required: true,
    estimatedMinutes: 20,
  },
  {
    id: "speaking-part2-sample",
    section: "speaking",
    kind: "short_text",
    title: "口语 Part 2 思路诊断",
    prompt: "先用文字记录你的 1 分钟回答提纲；录音入口将在后续版本接入。",
    required: true,
    estimatedMinutes: 10,
  },
];

export const assessmentQuestionIds = assessmentQuestions.map((question) => question.id);
export const requiredAssessmentQuestionIds = assessmentQuestions
  .filter((question) => question.required)
  .map((question) => question.id);

export function findAssessmentQuestion(questionId: string) {
  return assessmentQuestions.find((question) => question.id === questionId) ?? null;
}

export function toBandUnits(score: number) {
  if (!Number.isFinite(score) || score < 0 || score > 9) {
    throw new Error("IELTS score must be within 0-9");
  }
  if (!Number.isInteger(score * 2)) {
    throw new Error("IELTS score must use 0.5 steps");
  }
  return score * 2;
}

export function fromBandUnits(units: number) {
  if (!Number.isInteger(units) || units < 0 || units > 18) {
    throw new Error("IELTS band units must be an integer within 0-18");
  }
  return units / 2;
}

export function validateGoalInput(input: GoalInput, now = new Date()): ValidationResult {
  const errors: Record<string, string> = {};

  if (
    !Number.isFinite(input.targetOverall) ||
    input.targetOverall < 5.5 ||
    input.targetOverall > 9 ||
    !Number.isInteger(input.targetOverall * 2)
  ) {
    errors.targetOverall = "目标总分须为 5.5–9.0，并以 0.5 递增";
  }

  const examDate = new Date(`${input.targetExamDate}T00:00:00Z`);
  if (!Number.isFinite(examDate.getTime()) || examDate <= now) {
    errors.targetExamDate = "考试日期必须晚于今天";
  }

  if (
    !Number.isInteger(input.weeklyMinutes) ||
    input.weeklyMinutes < 60 ||
    input.weeklyMinutes > 3600
  ) {
    errors.weeklyMinutes = "每周学习时间须为 1–60 小时";
  }

  for (const [skill, score] of Object.entries(input.minimumSkills)) {
    try {
      toBandUnits(score);
    } catch {
      errors[`minimumSkills.${skill}`] = "单科要求必须是合法雅思分数";
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateExamScoreInput(input: ExamScoreInput): ValidationResult {
  const errors: Record<string, string> = {};
  const examDate = input.examDate ? new Date(`${input.examDate}T00:00:00Z`) : null;
  if (!examDate || !Number.isFinite(examDate.getTime())) {
    errors.examDate = "请填写考试日期";
  }

  const scoreKeys = ["overall", "listening", "reading", "writing", "speaking"] as const;
  const scoreEntries = scoreKeys.map((key) => [key, input[key]] as const);
  if (scoreEntries.every(([, score]) => score === null)) {
    errors.scores = "请至少填写一个分数";
  }

  for (const [key, score] of scoreEntries) {
    if (score === null) continue;
    try {
      toBandUnits(score);
    } catch {
      errors[key] = "分数必须为 0–9，并以 0.5 递增";
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateAssessmentAnswerInput(input: AssessmentAnswerInput): ValidationResult {
  const errors: Record<string, string> = {};
  const question = findAssessmentQuestion(input.questionId);

  if (!question) {
    errors.questionId = "无法识别的诊断题目";
  } else if (question.section !== input.section) {
    errors.section = "题目与科目不匹配";
  }

  const values = Array.isArray(input.value) ? input.value : [input.value];
  if (values.length === 0 || values.every((value) => value.trim().length === 0)) {
    errors.value = "请填写或选择你的答案";
  }

  if (
    !Number.isInteger(input.durationSeconds) ||
    input.durationSeconds < 0 ||
    input.durationSeconds > 7200
  ) {
    errors.durationSeconds = "答题时长必须在合理范围内";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
