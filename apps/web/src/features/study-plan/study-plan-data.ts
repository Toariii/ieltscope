import { and, desc, eq, inArray } from "drizzle-orm";

import { fromBandUnits, skills, type Skill } from "@ielts/contracts";

import type { createDatabase } from "@/lib/db/client";
import { assessments, goals, skillEstimates } from "@/lib/db/schema";

export type StudyPlanState = "not_ready" | "ready";

export type PlanSkill = {
  id: Skill;
  label: string;
  current: number;
  target: number;
  gap: number;
  priority: "highest" | "high" | "steady";
  weeklyMinutes: number;
  focus: string;
  taskTypes: string[];
};

export type PlanTask = {
  id: string;
  day: string;
  skill: string;
  title: string;
  detail: string;
  minutes: number;
};

export type StudyPlanView = {
  state: StudyPlanState;
  studentName: string;
  targetOverall: number | null;
  targetExamDate: string | null;
  daysToExam: number | null;
  weeklyMinutes: number | null;
  overallCurrent: number | null;
  overallGap: number | null;
  sourceLabel: string;
  skills: PlanSkill[];
  weekTasks: PlanTask[];
};

type Database = ReturnType<typeof createDatabase>["db"];

const skillLabels: Record<Skill, string> = {
  listening: "听力",
  reading: "阅读",
  writing: "写作",
  speaking: "口语",
};

const skillFocus: Record<Skill, string> = {
  listening: "先提升定位词、同义替换和转折信息捕捉，避免只听到单个词就选答案。",
  reading: "先补语境词汇、长难句主干和判断题定位，让正确率稳定起来。",
  writing: "先把观点展开成可评分的因果链，同时控制句子边界和基础语法错误。",
  speaking: "先建立 Part 2 叙事结构和 Part 3 抽象解释链，减少临场卡顿。",
};

const skillTaskTypes: Record<Skill, string[]> = {
  listening: ["关键词预判", "选择题精听复述", "表格/地图题定位"],
  reading: ["长难句主干", "判断题定位", "段落功能匹配"],
  writing: ["Task 2 因果链", "句法纠错", "观点素材复用"],
  speaking: ["Part 2 串题", "Part 3 逻辑链", "高频意群积累"],
};

const dayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function daysBetween(now: Date, target: Date | null) {
  if (!target) return null;
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function targetForSkill({
  skill,
  targetOverall,
  explicitTarget,
  minimumSkills,
  current,
}: {
  skill: Skill;
  targetOverall: number;
  explicitTarget: number | null;
  minimumSkills: Partial<Record<Skill, number>>;
  current: number;
}) {
  const minimum = minimumSkills[skill] !== undefined ? fromBandUnits(minimumSkills[skill]) : null;
  const inferred =
    skill === "writing" || skill === "speaking"
      ? Math.max(targetOverall - 0.5, current + 0.5)
      : Math.max(targetOverall, current + 0.5);
  return Math.min(9, Math.max(explicitTarget ?? 0, minimum ?? 0, inferred));
}

function priorityForGap(skill: Skill, gap: number): PlanSkill["priority"] {
  if (gap >= 1 || skill === "writing" || skill === "speaking") return "highest";
  if (gap >= 0.5) return "high";
  return "steady";
}

function allocateMinutes(skillsForPlan: Array<Omit<PlanSkill, "weeklyMinutes">>, weeklyMinutes: number) {
  const weights = skillsForPlan.map((skill) => {
    const gapWeight = Math.max(0.5, skill.gap + 0.5);
    const outputWeight = skill.id === "writing" || skill.id === "speaking" ? 0.4 : 0;
    return gapWeight + outputWeight;
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  return skillsForPlan.map((skill, index) => ({
    ...skill,
    weeklyMinutes: Math.max(45, Math.round((weeklyMinutes * weights[index]) / total / 5) * 5),
  }));
}

function buildWeekTasks(planSkills: PlanSkill[]) {
  const ordered = [...planSkills].sort((a, b) => b.gap - a.gap);
  const tasks: PlanTask[] = [];

  ordered.forEach((skill, index) => {
    const primaryType = skill.taskTypes[0];
    tasks.push({
      id: `${skill.id}-core`,
      day: dayLabels[index],
      skill: skill.label,
      title: `${skill.label} · ${primaryType}`,
      detail: skill.focus,
      minutes: Math.min(90, Math.max(35, Math.round(skill.weeklyMinutes * 0.45 / 5) * 5)),
    });
  });

  const highest = ordered[0];
  if (highest) {
    tasks.push({
      id: `${highest.id}-review`,
      day: "周五",
      skill: highest.label,
      title: `${highest.label} · 错因复盘`,
      detail: `把本周 ${highest.label} 训练中的错因整理成 3 条可复用规则。`,
      minutes: 35,
    });
  }

  tasks.push({
    id: "weekly-review",
    day: "周日",
    skill: "综合",
    title: "周复盘 · 目标校准",
    detail: "检查本周完成度、四科薄弱项变化，并决定下周是否调整任务比例。",
    minutes: 45,
  });

  return tasks.slice(0, 6);
}

function readMinimumSkills(value: Partial<Record<Skill, number>> | null) {
  return value ?? {};
}

export async function getStudyPlanView({
  db,
  userId,
  studentName,
  now = new Date(),
}: {
  db: Database;
  userId: string;
  studentName: string;
  now?: Date;
}): Promise<StudyPlanView> {
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.active, true)))
    .orderBy(desc(goals.createdAt))
    .limit(1);

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.userId, userId),
        inArray(assessments.status, ["submitted", "completed"]),
      ),
    )
    .orderBy(desc(assessments.completedAt), desc(assessments.updatedAt), desc(assessments.createdAt))
    .limit(1);

  const rows = assessment
    ? await db
        .select()
        .from(skillEstimates)
        .where(eq(skillEstimates.assessmentId, assessment.id))
    : [];

  if (!goal || !assessment || assessment.status !== "completed" || rows.length < 4) {
    return {
      state: "not_ready",
      studentName,
      targetOverall: goal ? fromBandUnits(goal.targetOverall) : null,
      targetExamDate: goal?.targetExamDate?.toISOString().slice(0, 10) ?? null,
      daysToExam: daysBetween(now, goal?.targetExamDate ?? null),
      weeklyMinutes: goal?.weeklyMinutes ?? null,
      overallCurrent: null,
      overallGap: null,
      sourceLabel: "等待完成诊断报告",
      skills: [],
      weekTasks: [],
    };
  }

  const estimatesBySkill = new Map(rows.map((row) => [row.skill, row]));
  const targetOverall = fromBandUnits(goal.targetOverall);
  const minimumSkills = readMinimumSkills(goal.minimumSkills);
  const baseSkills = skills.map((skill) => {
    const estimate = estimatesBySkill.get(skill);
    const current = estimate ? fromBandUnits(estimate.estimatedScore) : 0;
    const explicitTarget = {
      listening: goal.targetListening,
      reading: goal.targetReading,
      writing: goal.targetWriting,
      speaking: goal.targetSpeaking,
    }[skill];
    const target = targetForSkill({
      skill,
      targetOverall,
      explicitTarget: explicitTarget === null ? null : fromBandUnits(explicitTarget),
      minimumSkills,
      current,
    });
    const gap = Math.max(0, target - current);
    return {
      id: skill,
      label: skillLabels[skill],
      current,
      target,
      gap,
      priority: priorityForGap(skill, gap),
      focus: skillFocus[skill],
      taskTypes: skillTaskTypes[skill],
    };
  });
  const planSkills = allocateMinutes(baseSkills, goal.weeklyMinutes);
  const overallCurrent =
    planSkills.reduce((sum, skill) => sum + skill.current, 0) / planSkills.length;

  return {
    state: "ready",
    studentName,
    targetOverall,
    targetExamDate: goal.targetExamDate?.toISOString().slice(0, 10) ?? null,
    daysToExam: daysBetween(now, goal.targetExamDate),
    weeklyMinutes: goal.weeklyMinutes,
    overallCurrent,
    overallGap: Math.max(0, targetOverall - overallCurrent),
    sourceLabel: "基于诊断估分与目标档案生成",
    skills: planSkills,
    weekTasks: buildWeekTasks(planSkills),
  };
}
