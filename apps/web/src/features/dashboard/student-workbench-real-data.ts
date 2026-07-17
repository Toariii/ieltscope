import type { Skill } from "@ielts/contracts";

import type { StudyPlanView } from "@/features/study-plan/study-plan-data";

import type { StudentWorkbenchView, TrendPoint, WorkbenchTask } from "./student-workbench-data";

const skillLabels: Record<Skill, string> = {
  listening: "听力",
  reading: "阅读",
  writing: "写作",
  speaking: "口语",
};

function formatDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function formatExamDate(value: string | null) {
  if (!value) return "考试日期待确认";
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function trendFromPlan(view: StudyPlanView): TrendPoint[] {
  const current = Object.fromEntries(view.skills.map((skill) => [skill.id, skill.current])) as Record<
    Skill,
    number
  >;
  const overall = view.overallCurrent ?? 0;

  return [
    {
      date: "诊断",
      overall,
      listening: current.listening,
      reading: current.reading,
      writing: current.writing,
      speaking: current.speaking,
    },
  ];
}

function tasksFromPlan(view: StudyPlanView): WorkbenchTask[] {
  return view.weekTasks.slice(0, 3).map((task, index) => ({
    id: task.id,
    skill: task.skill,
    title: task.title.replace(`${task.skill} · `, ""),
    detail: task.detail,
    minutes: task.minutes,
    status: index === 0 ? "current" : "upcoming",
  }));
}

function recentReviewFromPlan(view: StudyPlanView): StudentWorkbenchView["recentReview"] {
  const outputSkill = view.skills
    .filter((skill) => skill.id === "writing" || skill.id === "speaking")
    .sort((a, b) => b.gap - a.gap)[0];
  if (!outputSkill) return null;

  return {
    kind: outputSkill.id === "writing" ? "写作" : "口语",
    taskLabel:
      outputSkill.id === "writing" ? "Task 2 · 论证展开诊断" : "Part 2 · 结构与意群诊断",
    score: outputSkill.current,
    range: `${Math.max(0, outputSkill.current - 0.5).toFixed(1)}–${Math.min(9, outputSkill.current + 0.5).toFixed(1)}`,
    confidence: 0.68,
    priority: outputSkill.focus,
  };
}

export function studyPlanToWorkbenchView(
  view: StudyPlanView,
  options: {
    now?: Date;
    credits?: number;
    streakDays?: number;
    completedMinutes?: number;
  } = {},
): StudentWorkbenchView {
  const weeklyTargetMinutes = view.weeklyMinutes ?? 0;
  const completedMinutes = options.completedMinutes ?? 0;
  const skillWithHighestGap = [...view.skills].sort((a, b) => b.gap - a.gap)[0];

  return {
    studentName: view.studentName,
    dateLabel: formatDateLabel(options.now),
    targetExamDate: formatExamDate(view.targetExamDate),
    daysToExam: view.daysToExam ?? 0,
    targetOverall: view.targetOverall ?? 0,
    skills: view.skills.map((skill) => ({
      id: skill.id,
      label: skillLabels[skill.id],
      estimate: skill.current,
      target: skill.target,
      confidence: 0.68,
      priority: skill.id === skillWithHighestGap?.id || skill.priority === "highest",
    })),
    todayTasks: tasksFromPlan(view),
    trend: trendFromPlan(view),
    recentReview: recentReviewFromPlan(view),
    credits: options.credits ?? 0,
    streakDays: options.streakDays ?? 0,
    weeklyMinutes: completedMinutes,
    weeklyTargetMinutes,
  };
}
