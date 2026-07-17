import { and, desc, eq, inArray } from "drizzle-orm";

import { fromBandUnits, type Skill } from "@ielts/contracts";

import type { createDatabase } from "@/lib/db/client";
import { assessmentEvaluations, assessments, skillEstimates } from "@/lib/db/schema";

import type { AssessmentReportState, AssessmentReportView, ReportSkill } from "./assessment-report";

type Database = ReturnType<typeof createDatabase>["db"];

const skillLabels: Record<Skill, string> = {
  listening: "听力",
  reading: "阅读",
  writing: "写作",
  speaking: "口语",
};

function readPriorities(rationale: Record<string, unknown>) {
  const raw = rationale.priorities;
  if (!Array.isArray(raw)) return ["等待评分引擎写入优先改进项"];
  const priorities = raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return priorities.length > 0 ? priorities.slice(0, 3) : ["等待评分引擎写入优先改进项"];
}

function readSummary(rationale: Record<string, unknown>) {
  return typeof rationale.summary === "string" && rationale.summary.trim().length > 0
    ? rationale.summary
    : "该科目的详细分析会在 AI 评分和教师校准完成后写入。";
}

function mapSkill(row: typeof skillEstimates.$inferSelect): ReportSkill {
  return {
    id: row.skill,
    label: skillLabels[row.skill],
    estimatedScore: fromBandUnits(row.estimatedScore),
    lowScore: fromBandUnits(row.lowScore),
    highScore: fromBandUnits(row.highScore),
    confidence: Number(row.confidence),
    summary: readSummary(row.rationale),
    priorities: readPriorities(row.rationale),
  };
}

function reportState(
  assessment: typeof assessments.$inferSelect | undefined,
  evaluation: typeof assessmentEvaluations.$inferSelect | undefined,
  skills: ReportSkill[],
): AssessmentReportState {
  if (!assessment) return "not_started";
  if (assessment.status !== "completed") return "scoring";
  if (evaluation && evaluation.status !== "completed") return "scoring";
  return skills.length === 4 ? "ready" : "empty_report";
}

export async function getAssessmentReportView({
  db,
  userId,
  studentName,
}: {
  db: Database;
  userId: string;
  studentName: string;
}): Promise<AssessmentReportView> {
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.userId, userId),
        inArray(assessments.status, ["draft", "in_progress", "submitted", "completed"]),
      ),
    )
    .orderBy(desc(assessments.updatedAt), desc(assessments.createdAt))
    .limit(1);

  const [evaluation] = assessment
    ? await db
        .select()
        .from(assessmentEvaluations)
        .where(eq(assessmentEvaluations.assessmentId, assessment.id))
        .limit(1)
    : [];

  const skillRows = assessment
    ? await db
        .select()
        .from(skillEstimates)
        .where(eq(skillEstimates.assessmentId, assessment.id))
        .orderBy(skillEstimates.skill)
    : [];
  const skills = skillRows.map(mapSkill);

  return {
    studentName,
    state: reportState(assessment, evaluation, skills),
    completedAt: assessment?.completedAt?.toISOString() ?? null,
    evaluation: evaluation
      ? {
          status: evaluation.status,
          stage: evaluation.stage,
          rubricVersion: evaluation.rubricVersion,
          completedAt: evaluation.completedAt?.toISOString() ?? null,
        }
      : null,
    skills,
  };
}
