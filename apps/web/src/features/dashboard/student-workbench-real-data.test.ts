import { describe, expect, it } from "vitest";

import { studyPlanToWorkbenchView } from "./student-workbench-real-data";
import type { StudyPlanView } from "@/features/study-plan/study-plan-data";

const planView: StudyPlanView = {
  state: "ready",
  studentName: "林同学",
  targetOverall: 7,
  targetExamDate: "2026-09-13",
  daysToExam: 58,
  weeklyMinutes: 600,
  overallCurrent: 6,
  overallGap: 1,
  sourceLabel: "基于诊断估分与目标档案生成",
  skills: [
    {
      id: "listening",
      label: "听力",
      current: 6.5,
      target: 7,
      gap: 0.5,
      priority: "high",
      weeklyMinutes: 130,
      focus: "补同义替换和转折信息。",
      taskTypes: ["关键词预判"],
    },
    {
      id: "reading",
      label: "阅读",
      current: 6,
      target: 7,
      gap: 1,
      priority: "highest",
      weeklyMinutes: 165,
      focus: "补长难句和判断题定位。",
      taskTypes: ["判断题定位"],
    },
    {
      id: "writing",
      label: "写作",
      current: 5.5,
      target: 6.5,
      gap: 1,
      priority: "highest",
      weeklyMinutes: 170,
      focus: "补因果链和句法控制。",
      taskTypes: ["Task 2 因果链"],
    },
    {
      id: "speaking",
      label: "口语",
      current: 6,
      target: 6.5,
      gap: 0.5,
      priority: "highest",
      weeklyMinutes: 135,
      focus: "补 Part 2 结构和 Part 3 抽象表达。",
      taskTypes: ["Part 2 串题"],
    },
  ],
  weekTasks: [
    {
      id: "writing-core",
      day: "周一",
      skill: "写作",
      title: "写作 · Task 2 因果链",
      detail: "把观点展开成可评分的因果链。",
      minutes: 75,
    },
    {
      id: "reading-core",
      day: "周二",
      skill: "阅读",
      title: "阅读 · 判断题定位",
      detail: "训练题干定位和原文同义替换。",
      minutes: 70,
    },
  ],
};

describe("studyPlanToWorkbenchView", () => {
  it("maps real plan data into the existing dashboard view model", () => {
    const view = studyPlanToWorkbenchView(planView, {
      now: new Date("2026-07-17T00:00:00Z"),
      credits: 3,
      streakDays: 2,
      completedMinutes: 45,
    });

    expect(view.studentName).toBe("林同学");
    expect(view.targetOverall).toBe(7);
    expect(view.daysToExam).toBe(58);
    expect(view.skills.find((skill) => skill.id === "writing")).toMatchObject({
      estimate: 5.5,
      target: 6.5,
      priority: true,
    });
    expect(view.todayTasks[0]).toMatchObject({
      skill: "写作",
      title: "Task 2 因果链",
      status: "current",
    });
    expect(view.trend.at(-1)).toMatchObject({
      date: "诊断",
      overall: 6,
      writing: 5.5,
    });
    expect(view.credits).toBe(3);
    expect(view.streakDays).toBe(2);
    expect(view.weeklyMinutes).toBe(45);
    expect(view.weeklyTargetMinutes).toBe(600);
  });
});
