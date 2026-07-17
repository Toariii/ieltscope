import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AssessmentAnswerInput } from "@ielts/contracts";

import { AssessmentRunner, type AssessmentClientApi } from "./assessment-runner";
import type { AssessmentSnapshot } from "./assessment-service";

const baseSnapshot: AssessmentSnapshot = {
  id: "assessment-1",
  status: "draft",
  currentSection: "listening",
  sections: [
    { id: "listening", label: "听力", estimatedMinutes: 15, purpose: "听力定位", answered: 0, required: 1 },
    { id: "reading", label: "阅读", estimatedMinutes: 15, purpose: "阅读逻辑", answered: 0, required: 1 },
    { id: "writing", label: "写作", estimatedMinutes: 20, purpose: "写作基础", answered: 0, required: 1 },
    { id: "speaking", label: "口语", estimatedMinutes: 10, purpose: "口语思路", answered: 0, required: 1 },
  ],
  answers: {},
  progress: { answered: 0, required: 4 },
  canSubmit: false,
  submittedAt: null,
  completedAt: null,
};

function answerSnapshot(answer: AssessmentAnswerInput): AssessmentSnapshot {
  return {
    ...baseSnapshot,
    status: "in_progress",
    answers: { [answer.questionId]: answer },
    progress: { answered: 1, required: 4 },
    sections: baseSnapshot.sections.map((section) =>
      section.id === answer.section ? { ...section, answered: 1 } : section,
    ),
  };
}

describe("AssessmentRunner", () => {
  it("saves the active question answer and reflects progress", async () => {
    const input: AssessmentAnswerInput = {
      questionId: "listening-main-idea",
      section: "listening",
      value: "A",
      durationSeconds: 0,
    };
    const api: AssessmentClientApi = {
      saveAnswer: vi.fn(async () => answerSnapshot(input)),
      submit: vi.fn(),
    };

    render(<AssessmentRunner initialSnapshot={baseSnapshot} api={api} />);
    fireEvent.click(screen.getByLabelText("A"));
    fireEvent.click(screen.getByRole("button", { name: "保存本题" }));

    expect(await screen.findByText("已完成 1 / 4")).toBeVisible();
    expect(api.saveAnswer).toHaveBeenCalledWith(input);
  });

  it("submits only when all required questions are answered", async () => {
    const readySnapshot: AssessmentSnapshot = {
      ...baseSnapshot,
      status: "in_progress",
      progress: { answered: 4, required: 4 },
      canSubmit: true,
    };
    const submittedSnapshot: AssessmentSnapshot = {
      ...readySnapshot,
      status: "submitted",
      canSubmit: false,
      submittedAt: "2026-07-17T01:00:00.000Z",
    };
    const api: AssessmentClientApi = {
      saveAnswer: vi.fn(),
      submit: vi.fn(async () => submittedSnapshot),
    };

    render(<AssessmentRunner initialSnapshot={readySnapshot} api={api} />);
    fireEvent.click(screen.getByRole("button", { name: "提交诊断" }));

    expect(await screen.findByRole("heading", { name: "诊断已提交" })).toBeVisible();
    expect(api.submit).toHaveBeenCalledOnce();
  });
});
