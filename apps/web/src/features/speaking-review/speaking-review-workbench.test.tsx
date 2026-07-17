import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SpeakingReviewWorkbench } from "./speaking-review-workbench";
import type { SpeakingReviewView } from "./speaking-review-service";

const review: SpeakingReviewView = {
  submission: {
    id: "speaking-1",
    promptTitle: "Part 2 · A quiet study place",
    promptText: "Describe a quiet place where you like to study.",
    part: "part2",
    transcript: "Overall, this place is useful for me because it help me build a regular study habit.",
    wordCount: 72,
    durationSeconds: 92,
    createdAt: "2026-07-17T06:00:00.000Z",
  },
  evaluation: {
    id: "evaluation-1",
    overallScore: 6,
    overallLow: 5.5,
    overallHigh: 6.5,
    overallRange: "5.5–6.5",
    confidence: 0.64,
    analysisMode: "transcript_only",
    criteria: [
      { id: "fluency_coherence", label: "流利度与连贯性", score: 6, summary: "结构基本清楚。" },
      { id: "lexical_resource", label: "词汇资源", score: 6, summary: "表达能支撑基本回答。" },
      { id: "grammar_accuracy", label: "语法范围与准确性", score: 6, summary: "基础语法需要修正。" },
      { id: "pronunciation", label: "发音（待录音分析）", score: 6, summary: "Alpha 阶段不判断发音。" },
    ],
    topPriorities: ["先补充 Part 2 的时间线和具体细节，减少泛泛描述。"],
    evidence: [
      {
        criterion: "grammar_accuracy",
        original: "it help me",
        suggestion: "it helps me",
        explanation: "主谓一致错误。",
        characterStart: 54,
        characterEnd: 64,
      },
    ],
    rubricVersion: "speaking-alpha-v1",
    completedAt: "2026-07-17T06:01:00.000Z",
  },
};

describe("SpeakingReviewWorkbench", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a transcript and renders speaking feedback details", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: review }),
    } as Response);

    render(
      <SpeakingReviewWorkbench
        initialReviews={[]}
        prompt={{
          title: "Part 2 · A quiet study place",
          prompt: "Describe a quiet place where you like to study.",
          part: "part2",
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("口语回答文本"), {
      target: {
        value:
          "I want to describe a small study room near my office. I usually go there after work because it is quiet and I can focus on my English. Overall, this place is useful for me because it help me build a regular study habit.",
      },
    });
    fireEvent.change(screen.getByLabelText("回答时长（秒）"), { target: { value: "92" } });
    fireEvent.click(screen.getByRole("button", { name: "提交并生成口语反馈" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "口语批改详情" })).toBeInTheDocument();
    });

    expect(screen.getByText("阶段估分 6.0")).toBeInTheDocument();
    expect(screen.getByText("区间 5.5–6.5")).toBeInTheDocument();
    expect(screen.getByText("文本分析模式")).toBeInTheDocument();
    expect(screen.getByText("it help me")).toBeInTheDocument();
    expect(screen.getByText("it helps me")).toBeInTheDocument();
    expect(within(screen.getByLabelText("口语四项评分")).getByText("发音（待录音分析）")).toBeInTheDocument();
  });
});
