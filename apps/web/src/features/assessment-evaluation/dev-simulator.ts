import { type AssessmentAnswerInput, skills, toBandUnits, type Skill } from "@ielts/contracts";

import type { StoredAssessment, StoredAssessmentEvaluation } from "@/features/assessment/assessment-service";

export const devAssessmentScoringProvider = "internal-dev-simulator";
export const devAssessmentScoringModel = "heuristic-alpha";
export const devAssessmentScoringRubricVersion = "diagnostic-alpha-v1";

export type DevSkillEstimate = {
  userId: string;
  assessmentId: string;
  skill: Skill;
  estimatedScore: number;
  lowScore: number;
  highScore: number;
  confidence: string;
  rationale: {
    summary: string;
    priorities: string[];
    source: "dev_simulator";
    basis: string;
  };
};

export type AssessmentEvaluationSimulatorRepository = {
  findLatestScorableAssessment(userId: string): Promise<StoredAssessment | null>;
  listAnswers(assessmentId: string): Promise<Array<{ id: string; answer: AssessmentAnswerInput }>>;
  findEvaluationByAssessment(assessmentId: string): Promise<StoredAssessmentEvaluation | null>;
  markEvaluationProcessing(evaluationId: string, processingStartedAt: Date): Promise<void>;
  upsertSkillEstimate(estimate: DevSkillEstimate): Promise<void>;
  completeEvaluation(
    evaluationId: string,
    value: {
      completedAt: Date;
      reportSummary: Record<string, unknown>;
    },
  ): Promise<void>;
  completeAssessment(assessmentId: string, completedAt: Date): Promise<void>;
};

export type DevAssessmentScoringResult = {
  assessmentId: string;
  evaluationId: string;
  estimates: DevSkillEstimate[];
  completedAt: string;
};

type DevAssessmentScoringOptions = {
  now?: () => Date;
};

const skillSummary: Record<Skill, string> = {
  listening:
    "开发期评分模拟器已读取听力作答，先给出关键词定位与转折信息识别的起点评估。正式版本会接入听力材料、题型表现和错因拆解。",
  reading:
    "开发期评分模拟器已读取阅读作答，先给出词汇语境、长难句和段落逻辑的起点评估。正式版本会接入题型级表现和原文定位证据。",
  writing:
    "开发期评分模拟器已读取写作文本，先根据文本长度与表达完整度生成起点评估。正式版本会按任务回应、连贯衔接、词汇和语法四项拆分。",
  speaking:
    "开发期评分模拟器已读取口语提纲，先根据回答完整度和表达组织生成起点评估。正式版本会接入录音、转写、发音和流利度分析。",
};

const skillPriorities: Record<Skill, string[]> = {
  listening: ["补同义替换和转折词听辨", "做表格题与选择题精听复述", "记录易漏定位词"],
  reading: ["补语境词汇和长难句主干", "训练判断题与匹配题定位", "复盘段落功能"],
  writing: ["把观点展开成因果链", "控制句子边界和基础语法", "积累 Task 2 常用论证意群"],
  speaking: ["补 Part 2 叙事结构", "积累 Part 3 抽象观点表达", "减少停顿前的中文组织"],
};

function answerText(answer: AssessmentAnswerInput | undefined) {
  if (!answer) return "";
  return Array.isArray(answer.value) ? answer.value.join(" ") : answer.value;
}

function lexicalSignal(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z]+/u)
    .filter((token) => token.length >= 4).length;
}

function estimateBandForSkill(skill: Skill, answer: AssessmentAnswerInput | undefined) {
  const text = answerText(answer);
  const trimmed = text.trim();
  if (!trimmed) return 5;

  if (skill === "listening" || skill === "reading") {
    const selected = trimmed.toUpperCase();
    return ["A", "B", "C", "D"].includes(selected) ? 6 : 5.5;
  }

  const words = trimmed.split(/\s+/u).filter(Boolean).length;
  const lexicalCount = lexicalSignal(trimmed);
  if (skill === "writing") {
    if (words >= 180 && lexicalCount >= 40) return 6.5;
    if (words >= 90 && lexicalCount >= 18) return 6;
    return 5.5;
  }

  if (words >= 70 && lexicalCount >= 20) return 6.5;
  if (words >= 25 && lexicalCount >= 8) return 6;
  return 5.5;
}

function confidenceForSkill(skill: Skill, answer: AssessmentAnswerInput | undefined) {
  const text = answerText(answer).trim();
  if (!text) return "0.520";
  if (skill === "writing") return text.split(/\s+/u).length >= 140 ? "0.680" : "0.610";
  if (skill === "speaking") return text.split(/\s+/u).length >= 45 ? "0.650" : "0.590";
  return "0.620";
}

function buildEstimate({
  assessment,
  answer,
  skill,
}: {
  assessment: StoredAssessment;
  answer: AssessmentAnswerInput | undefined;
  skill: Skill;
}): DevSkillEstimate {
  const estimatedScore = estimateBandForSkill(skill, answer);
  const lowScore = Math.max(0, estimatedScore - 0.5);
  const highScore = Math.min(9, estimatedScore + 0.5);
  const answerBasis = answer
    ? `dev heuristic from ${answer.questionId}, duration ${answer.durationSeconds}s`
    : "dev heuristic without required answer";

  return {
    userId: assessment.userId,
    assessmentId: assessment.id,
    skill,
    estimatedScore: toBandUnits(estimatedScore),
    lowScore: toBandUnits(lowScore),
    highScore: toBandUnits(highScore),
    confidence: confidenceForSkill(skill, answer),
    rationale: {
      summary: skillSummary[skill],
      priorities: skillPriorities[skill],
      source: "dev_simulator",
      basis: answerBasis,
    },
  };
}

export function createDevAssessmentScoringSimulator(
  repository: AssessmentEvaluationSimulatorRepository,
  options: DevAssessmentScoringOptions = {},
) {
  const now = options.now ?? (() => new Date());

  return {
    async runForUser(userId: string): Promise<DevAssessmentScoringResult> {
      const assessment = await repository.findLatestScorableAssessment(userId);
      if (!assessment) {
        throw new Error("没有可完成评分的已提交诊断");
      }

      const evaluation = await repository.findEvaluationByAssessment(assessment.id);
      if (!evaluation) {
        throw new Error("诊断评分任务不存在");
      }

      const processingStartedAt = now();
      await repository.markEvaluationProcessing(evaluation.id, processingStartedAt);

      const answers = await repository.listAnswers(assessment.id);
      const answersBySkill = new Map(answers.map((row) => [row.answer.section, row.answer]));
      const estimates = skills.map((skill) =>
        buildEstimate({ assessment, skill, answer: answersBySkill.get(skill) }),
      );

      for (const estimate of estimates) {
        await repository.upsertSkillEstimate(estimate);
      }

      const completedAt = now();
      await repository.completeEvaluation(evaluation.id, {
        completedAt,
        reportSummary: {
          source: "dev_simulator",
          provider: devAssessmentScoringProvider,
          model: devAssessmentScoringModel,
          completedAt: completedAt.toISOString(),
          note: "Development-only simulated scoring. Replace with provider and teacher-calibrated worker before production scoring.",
        },
      });
      await repository.completeAssessment(assessment.id, completedAt);

      return {
        assessmentId: assessment.id,
        evaluationId: evaluation.id,
        estimates,
        completedAt: completedAt.toISOString(),
      };
    },
  };
}
