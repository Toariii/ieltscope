import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WritingReviewWorkbench } from "./writing-review-workbench";
import type { WritingReviewView } from "./writing-review-service";

const review: WritingReviewView = {
  submission: {
    id: "submission-1",
    promptTitle: "Task 2 · Online learning",
    promptText: "Can online courses replace traditional classrooms?",
    taskType: "task2",
    text: "Nowadays, many students choose online courses because they can study more flexible.",
    wordCount: 64,
    createdAt: "2026-07-17T05:00:00.000Z",
  },
  evaluation: {
    id: "evaluation-1",
    overallScore: 6,
    overallLow: 5.5,
    overallHigh: 6.5,
    overallRange: "5.5–6.5",
    confidence: 0.68,
    criteria: [
      { id: "task_response", label: "任务回应", score: 6, summary: "观点基本明确。" },
      { id: "coherence_cohesion", label: "连贯衔接", score: 6, summary: "段落关系清楚。" },
      { id: "lexical_resource", label: "词汇资源", score: 6, summary: "表达可更具体。" },
      { id: "grammar_accuracy", label: "语法准确性", score: 6, summary: "基础语法需要修正。" },
    ],
    topPriorities: ["先修正会直接影响语法准确性的基础错误。"],
    evidence: [
      {
        criterion: "grammar_accuracy",
        original: "study more flexible",
        suggestion: "study more flexibly",
        explanation: "副词形式错误。",
        characterStart: 54,
        characterEnd: 73,
      },
    ],
    rubricVersion: "writing-alpha-v1",
    completedAt: "2026-07-17T05:01:00.000Z",
  },
};

describe("WritingReviewWorkbench", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a draft and renders the returned correction details", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: review }),
    } as Response);

    render(
      <WritingReviewWorkbench
        initialReviews={[]}
        prompt={{
          title: "Task 2 · Online learning",
          prompt: "Can online courses replace traditional classrooms?",
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("作文正文"), {
      target: {
        value:
          "Nowadays, many students choose online courses because they can study more flexible. It also bring some problems for young learners who need direct support.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交并生成批改" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "批改详情" })).toBeInTheDocument();
    });

    expect(screen.getByText("阶段估分 6.0")).toBeInTheDocument();
    expect(screen.getByText("区间 5.5–6.5")).toBeInTheDocument();
    expect(screen.getByText("study more flexible")).toBeInTheDocument();
    expect(screen.getByText("study more flexibly")).toBeInTheDocument();
    expect(within(screen.getByLabelText("四项评分")).getByText("语法准确性")).toBeInTheDocument();
  });
});
