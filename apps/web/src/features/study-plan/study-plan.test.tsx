import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudyPlan } from "./study-plan";
import type { StudyPlanView } from "./study-plan-data";

const readyView: StudyPlanView = {
  state: "ready",
  studentName: "林同学",
  targetOverall: 7,
  targetExamDate: "2026-10-15",
  daysToExam: 90,
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
      taskTypes: ["关键词预判", "选择题精听复述"],
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
      taskTypes: ["长难句主干", "判断题定位"],
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
      taskTypes: ["Task 2 因果链", "句法纠错"],
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
      taskTypes: ["Part 2 串题", "Part 3 逻辑链"],
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
  ],
};

describe("StudyPlan", () => {
  it("shows a not-ready state without invented tasks", () => {
    render(
      <StudyPlan
        view={{
          state: "not_ready",
          studentName: "林同学",
          targetOverall: 7,
          targetExamDate: "2026-10-15",
          daysToExam: 90,
          weeklyMinutes: 600,
          overallCurrent: null,
          overallGap: null,
          sourceLabel: "等待完成诊断报告",
          skills: [],
          weekTasks: [],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "等待诊断报告生成后再安排计划" })).toBeVisible();
    expect(screen.getByRole("link", { name: "查看诊断状态" })).toHaveAttribute("href", "/assessment");
    expect(screen.queryByRole("heading", { name: "本周任务安排" })).not.toBeInTheDocument();
  });

  it("renders target breakdown, priorities and weekly tasks", () => {
    render(<StudyPlan view={readyView} />);

    expect(screen.getByRole("heading", { name: "林同学的第一阶段备考路径" })).toBeVisible();
    expect(screen.getByText("目标总分")).toBeVisible();
    expect(screen.getByRole("heading", { name: "每科目标与本周投入" })).toBeVisible();
    expect(screen.getByText("写作 · Task 2 因果链")).toBeVisible();
    expect(screen.getByText("基于诊断估分与目标档案生成")).toBeVisible();
    expect(screen.getByText("规则版计划壳", { exact: false })).toBeVisible();
  });
});
