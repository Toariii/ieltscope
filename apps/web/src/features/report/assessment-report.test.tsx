import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AssessmentReport, type AssessmentReportView } from "./assessment-report";

const readyView: AssessmentReportView = {
  studentName: "林同学",
  state: "ready",
  completedAt: "2026-07-17T02:00:00.000Z",
  evaluation: {
    status: "completed",
    stage: "report_generation",
    rubricVersion: "diagnostic-alpha-v1",
    completedAt: "2026-07-17T02:00:00.000Z",
  },
  skills: [
    {
      id: "listening",
      label: "听力",
      estimatedScore: 6.5,
      lowScore: 6,
      highScore: 7,
      confidence: 0.82,
      summary: "关键词定位较稳，但多轮转折信息仍需训练。",
      priorities: ["提升同义替换识别", "精听地图题和表格题"],
    },
    {
      id: "reading",
      label: "阅读",
      estimatedScore: 6,
      lowScore: 5.5,
      highScore: 6.5,
      confidence: 0.78,
      summary: "长难句和段落功能判断是主要瓶颈。",
      priorities: ["补长难句主干分析", "训练判断题定位"],
    },
    {
      id: "writing",
      label: "写作",
      estimatedScore: 5.5,
      lowScore: 5,
      highScore: 6,
      confidence: 0.76,
      summary: "观点明确，但论证链条和语法控制仍不稳定。",
      priorities: ["补因果链展开", "减少句法错误"],
    },
    {
      id: "speaking",
      label: "口语",
      estimatedScore: 6,
      lowScore: 5.5,
      highScore: 6.5,
      confidence: 0.74,
      summary: "回答结构可理解，但例子和 Part 3 抽象表达需要积累。",
      priorities: ["积累意群", "强化抽象观点解释"],
    },
  ],
};

describe("AssessmentReport", () => {
  it("shows a pending report without fake scores", () => {
    render(
      <AssessmentReport
        view={{
          studentName: "林同学",
          state: "scoring",
          completedAt: null,
          evaluation: {
            status: "queued",
            stage: "ai_initial_scoring",
            rubricVersion: "diagnostic-alpha-v1",
            completedAt: null,
          },
          skills: [],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "诊断报告生成中" })).toBeVisible();
    expect(screen.getByText("排队中")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "估分区间与优先动作" })).not.toBeInTheDocument();
  });

  it("renders completed skill estimates and priorities", () => {
    render(<AssessmentReport view={readyView} />);

    expect(screen.getByRole("heading", { name: "四科诊断报告" })).toBeVisible();
    const overview = screen.getByRole("region", { name: "当前起点" });
    expect(within(overview).getByText("6.0")).toBeVisible();
    expect(screen.getByText("区间 5.0–6.0")).toBeVisible();
    expect(screen.getByText("补因果链展开")).toBeVisible();
    expect(screen.getByText("当前阶段：报告生成 · 已完成 · diagnostic-alpha-v1")).toBeVisible();
  });
});
