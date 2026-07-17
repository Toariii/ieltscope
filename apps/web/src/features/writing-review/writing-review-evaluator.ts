export type WritingTaskType = "task1" | "task2";

export type WritingCriterionId =
  | "task_response"
  | "coherence_cohesion"
  | "lexical_resource"
  | "grammar_accuracy";

export type WritingDraftInput = {
  taskType: WritingTaskType;
  prompt: string;
  text: string;
};

export type WritingCriterionResult = {
  id: WritingCriterionId;
  label: string;
  score: number;
  summary: string;
};

export type WritingEvidenceItem = {
  criterion: WritingCriterionId;
  original: string;
  suggestion: string;
  explanation: string;
  characterStart: number | null;
  characterEnd: number | null;
};

export type WritingEvaluationResult = {
  rubricVersion: "writing-alpha-v1";
  taskType: WritingTaskType;
  prompt: string;
  wordCount: number;
  overallScore: number;
  overallLow: number;
  overallHigh: number;
  overallRange: string;
  confidence: number;
  criteria: WritingCriterionResult[];
  topPriorities: string[];
  evidence: WritingEvidenceItem[];
};

const criterionLabels: Record<WritingCriterionId, string> = {
  task_response: "任务回应",
  coherence_cohesion: "连贯衔接",
  lexical_resource: "词汇资源",
  grammar_accuracy: "语法准确性",
};

const alphaPatterns: Array<
  Pick<WritingEvidenceItem, "criterion" | "original" | "suggestion" | "explanation">
> = [
  {
    criterion: "grammar_accuracy",
    original: "study more flexible",
    suggestion: "study more flexibly",
    explanation: "形容词 flexible 不能直接修饰动词 study，这里需要副词 flexibly。",
  },
  {
    criterion: "grammar_accuracy",
    original: "also bring",
    suggestion: "also brings",
    explanation: "主语 it 是第三人称单数，谓语动词需要使用 brings。",
  },
  {
    criterion: "lexical_resource",
    original: "some problems",
    suggestion: "several limitations, such as reduced interaction and weaker supervision",
    explanation: "表达过泛，可以用更具体的名词短语说明问题类型。",
  },
];

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;
}

function clampBand(score: number) {
  return Math.min(9, Math.max(0, score));
}

function roundHalf(score: number) {
  return Math.round(score * 2) / 2;
}

function findEvidence(text: string): WritingEvidenceItem[] {
  const lower = text.toLowerCase();
  return alphaPatterns
    .map((pattern) => {
      const start = lower.indexOf(pattern.original.toLowerCase());
      return {
        ...pattern,
        characterStart: start >= 0 ? start : null,
        characterEnd: start >= 0 ? start + pattern.original.length : null,
      };
    })
    .filter((item) => item.characterStart !== null);
}

function scoreByLength(taskType: WritingTaskType, wordCount: number) {
  const target = taskType === "task1" ? 150 : 250;
  if (wordCount >= target) return 6.5;
  if (wordCount >= 60) return 6;
  if (wordCount >= Math.round(target * 0.55)) return 6;
  if (wordCount >= Math.round(target * 0.35)) return 5.5;
  return 5;
}

function buildCriteria({
  taskType,
  wordCount,
  evidence,
}: {
  taskType: WritingTaskType;
  wordCount: number;
  evidence: WritingEvidenceItem[];
}): WritingCriterionResult[] {
  const grammarIssues = evidence.filter((item) => item.criterion === "grammar_accuracy").length;
  const lexicalIssues = evidence.filter((item) => item.criterion === "lexical_resource").length;
  const lengthScore = scoreByLength(taskType, wordCount);

  const scores: Record<WritingCriterionId, number> = {
    task_response: lengthScore,
    coherence_cohesion: wordCount >= 90 ? 6 : 5.5,
    lexical_resource: clampBand(6.5 - lexicalIssues * 0.5),
    grammar_accuracy: clampBand(6.5 - grammarIssues * 0.5),
  };

  const summaries: Record<WritingCriterionId, string> = {
    task_response:
      wordCount >= 140
        ? "观点基本明确，仍需要补足反方限制和例证。"
        : "已表达主要立场，但展开长度不足，论证链偏短。",
    coherence_cohesion: "段落关系清楚，建议增加因果连接和让步句。",
    lexical_resource:
      lexicalIssues > 0 ? "存在泛化表达，可替换为更具体的学术搭配。" : "词汇表达基本清楚。",
    grammar_accuracy:
      grammarIssues > 0 ? "基础语法错误会影响稳定性，需要优先修正。" : "基础句法较稳定。",
  };

  return (Object.keys(criterionLabels) as WritingCriterionId[]).map((id) => ({
    id,
    label: criterionLabels[id],
    score: roundHalf(scores[id]),
    summary: summaries[id],
  }));
}

export function evaluateWritingDraft(input: WritingDraftInput): WritingEvaluationResult {
  const normalizedText = input.text.trim();
  const wordCount = countWords(normalizedText);
  const evidence = findEvidence(normalizedText);
  const criteria = buildCriteria({ taskType: input.taskType, wordCount, evidence });
  const average =
    criteria.reduce((total, criterion) => total + criterion.score, 0) / criteria.length;
  const overallScore = roundHalf(average);
  const overallLow = clampBand(overallScore - 0.5);
  const overallHigh = clampBand(overallScore + 0.5);
  const topPriorities = [
    evidence.some((item) => item.criterion === "grammar_accuracy")
      ? "先修正会直接影响语法准确性的基础错误。"
      : "保持语法稳定性，下一步增加复杂句准确度。",
    wordCount < (input.taskType === "task1" ? 150 : 250)
      ? "补足主体段解释和例子，把观点推进成完整论证。"
      : "压缩重复表达，把篇幅留给关键论证。",
  ];

  return {
    rubricVersion: "writing-alpha-v1",
    taskType: input.taskType,
    prompt: input.prompt,
    wordCount,
    overallScore,
    overallLow,
    overallHigh,
    overallRange: `${overallLow.toFixed(1)}–${overallHigh.toFixed(1)}`,
    confidence: evidence.length > 0 ? 0.68 : 0.6,
    criteria,
    topPriorities,
    evidence,
  };
}
