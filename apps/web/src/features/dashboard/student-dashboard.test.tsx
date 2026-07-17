import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudentDashboard } from "./student-dashboard";
import { demoStudentWorkbench } from "./student-workbench-data";

describe("StudentDashboard", () => {
  it("shows onboarding instead of simulated plans for a new student", () => {
    render(<StudentDashboard data={demoStudentWorkbench} stage="onboarding" />);

    expect(screen.getByRole("heading", { name: "先建立你的备考档案" })).toBeVisible();
    expect(screen.getByRole("link", { name: "建立备考档案" })).toHaveAttribute(
      "href",
      "/onboarding",
    );
    expect(screen.queryByRole("region", { name: "今日计划" })).not.toBeInTheDocument();
    expect(screen.queryByText("当前阶段估分", { exact: false })).not.toBeInTheDocument();
  });

  it("hands an onboarded student to the assessment before showing a precise plan", () => {
    render(<StudentDashboard data={demoStudentWorkbench} stage="assessment" />);

    expect(screen.getByRole("heading", { name: "完成能力诊断，确定真实起点" })).toBeVisible();
    expect(screen.getByRole("link", { name: "继续能力诊断" })).toHaveAttribute(
      "href",
      "/assessment",
    );
    expect(screen.queryByRole("region", { name: "四科目标" })).not.toBeInTheDocument();
  });

  it("shows the student's goal, plan, skills and account resources", () => {
    render(<StudentDashboard data={demoStudentWorkbench} />);

    expect(screen.getByRole("heading", { name: "你好，林同学" })).toBeInTheDocument();
    expect(screen.getByText(/距离考试\s*58\s*天/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "今日计划" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "四科目标" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "成绩变化" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "最近精批" })).toBeInTheDocument();
    expect(screen.getByText("12 次")).toBeInTheDocument();
    expect(screen.getByText("连续 5 天")).toBeInTheDocument();
    expect(screen.queryByText(/查看证据|证据核验/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看批改详情" })).toBeInTheDocument();
  });

  it("switches the score trend summary by skill", () => {
    render(<StudentDashboard data={demoStudentWorkbench} />);

    const tabs = screen.getByRole("tablist", { name: "成绩变化科目" });
    fireEvent.click(within(tabs).getByRole("tab", { name: "写作" }));

    expect(screen.getByText("写作最新阶段估分 6.0，目标 6.5")).toBeInTheDocument();
  });
});
