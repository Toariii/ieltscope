export type SpeakingPart = "part1" | "part2" | "part3";

export type SpeakingCriterionId =
  | "fluency_coherence"
  | "lexical_resource"
  | "grammar_accuracy"
  | "pronunciation";

export type SpeakingResponseInput = {
  part: SpeakingPart;
  prompt: string;
  transcript: string;
};

export type SpeakingCriterionResult = {
  id: SpeakingCriterionId;
  label: string;
  score: number;
  summary: string;
};

export type SpeakingEvidenceItem = {
  criterion: SpeakingCriterionId;
  original: string;
  suggestion: string;
  explanation: string;
  characterStart: number | null;
  characterEnd: number | null;
};

export type SpeakingEvaluationResult = {
  rubricVersion: "speaking-alpha-v1";
  analysisMode: "transcript_only";
  part: SpeakingPart;
  prompt: string;
  wordCount: number;
  overallScore: number;
  overallLow: number;
  overallHigh: number;
  overallRange: string;
  confidence: number;
  criteria: SpeakingCriterionResult[];
  topPriorities: string[];
  evidence: SpeakingEvidenceItem[];
};

const criterionLabels: Record<SpeakingCriterionId, string> = {
  fluency_coherence: "流利度与连贯性",
  lexical_resource: "词汇资源",
  grammar_accuracy: "语法范围与准确性",
  pronunciation: "发音（待录音分析）",
};

const alphaPatterns: Array<
  Pick<SpeakingEvidenceItem, "criterion" | "original" | "suggestion" | "explanation">
> = [
  {
    criterion: "grammar_accuracy",
    original: "it help me",
    suggestion: "it helps me",
    explanation: "主语 it 是第三人称单数，动词需要使用 helps。",
  },
  {
    criterion: "fluency_coherence",
    original: "I stop for a long time",
    suggestion: "I pause for a long time / I hesitate for several seconds",
    explanation: "口语反馈里更适合描述停顿和犹豫，后续录音分析会定位具体时间段。",
  },
  {
    criterion: "lexical_resource",
    original: "my feeling",
    suggestion: "how I feel / my thoughts",
    explanation: "feeling 作泛指时表达不自然，可改成更地道的口语搭配。",
  },
];

function countWords(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

function clampBand(score: number) {
  return Math.min(9, Math.max(0, score));
}

function roundHalf(score: number) {
  return Math.round(score * 2) / 2;
}

function findEvidence(transcript: string): SpeakingEvidenceItem[] {
  const lower = transcript.toLowerCase();
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

function lengthScore(part: SpeakingPart, wordCount: number) {
  const target = part === "part2" ? 75 : part === "part3" ? 55 : 30;
  if (wordCount >= target) return 6.5;
  if (wordCount >= Math.round(target * 0.72)) return 6;
  if (wordCount >= Math.round(target * 0.48)) return 5.5;
  return 5;
}

function buildCriteria({
  part,
  wordCount,
  evidence,
}: {
  part: SpeakingPart;
  wordCount: number;
  evidence: SpeakingEvidenceItem[];
}): SpeakingCriterionResult[] {
  const grammarIssues = evidence.filter((item) => item.criterion === "grammar_accuracy").length;
  const fluencyIssues = evidence.filter((item) => item.criterion === "fluency_coherence").length;
  const lexicalIssues = evidence.filter((item) => item.criterion === "lexical_resource").length;

  const scores: Record<SpeakingCriterionId, number> = {
    fluency_coherence: clampBand(lengthScore(part, wordCount) - fluencyIssues * 0.5),
    lexical_resource: clampBand(6.5 - lexicalIssues * 0.5),
    grammar_accuracy: clampBand(6.5 - grammarIssues * 0.5),
    pronunciation: 6,
  };

  const summaries: Record<SpeakingCriterionId, string> = {
    fluency_coherence:
      part === "part2"
        ? "回答有基本结构，但时间线和细节还可以更完整。"
        : "回答能回应问题，但需要更自然的连接和延展。",
    lexical_resource:
      lexicalIssues > 0 ? "个别搭配偏中式，建议替换为更自然的口语意群。" : "词汇能支撑基本表达。",
    grammar_accuracy:
      grammarIssues > 0 ? "基础主谓一致错误会影响稳定性，需要优先修正。" : "基础句法较稳定。",
    pronunciation: "Alpha 阶段仅标记为待录音分析，不根据文本判断发音分。",
  };

  return (Object.keys(criterionLabels) as SpeakingCriterionId[]).map((id) => ({
    id,
    label: criterionLabels[id],
    score: roundHalf(scores[id]),
    summary: summaries[id],
  }));
}

export function evaluateSpeakingResponse(input: SpeakingResponseInput): SpeakingEvaluationResult {
  const transcript = input.transcript.trim();
  const wordCount = countWords(transcript);
  const evidence = findEvidence(transcript);
  const criteria = buildCriteria({ part: input.part, wordCount, evidence });
  const average = criteria.reduce((total, criterion) => total + criterion.score, 0) / criteria.length;
  const overallScore = roundHalf(average);
  const overallLow = clampBand(overallScore - 0.5);
  const overallHigh = clampBand(overallScore + 0.5);

  return {
    rubricVersion: "speaking-alpha-v1",
    analysisMode: "transcript_only",
    part: input.part,
    prompt: input.prompt,
    wordCount,
    overallScore,
    overallLow,
    overallHigh,
    overallRange: `${overallLow.toFixed(1)}–${overallHigh.toFixed(1)}`,
    confidence: evidence.length > 0 ? 0.64 : 0.58,
    criteria,
    topPriorities: [
      "先补充 Part 2 的时间线和具体细节，减少泛泛描述。",
      "把停顿前常卡住的表达整理成可复用意群。",
      "录音入口接入后再补充发音、重音和语调分析。",
    ],
    evidence,
  };
}
