import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OnboardingWizard, type OnboardingClientApi } from "./onboarding-wizard";
import type { OnboardingSnapshot } from "./onboarding-types";

const emptySnapshot: OnboardingSnapshot = {
  draft: {
    step: "status",
    status: null,
    goal: null,
    completedAt: null,
    recordsCount: 0,
  },
  documents: [],
  records: [],
};

function fakeApi(): OnboardingClientApi {
  return {
    saveStatus: vi.fn(async () => emptySnapshot),
    saveGoal: vi.fn(async () => emptySnapshot),
    addManualRecord: vi.fn(async () => emptySnapshot),
    deleteManualRecord: vi.fn(async () => emptySnapshot),
    uploadDocument: vi.fn(async () => emptySnapshot),
    confirmDocument: vi.fn(async () => emptySnapshot),
    deleteDocument: vi.fn(async () => emptySnapshot),
    complete: vi.fn(async () => undefined),
  };
}

describe("OnboardingWizard", () => {
  it("saves preparation status and moves to exam records", async () => {
    const api = fakeApi();
    render(<OnboardingWizard initialData={emptySnapshot} initialStep="status" api={api} />);

    expect(screen.getByText("1 / 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /首次备考或暂无可参考成绩/ }));
    fireEvent.click(screen.getByRole("button", { name: "保存并继续" }));

    expect(await screen.findByRole("heading", { name: "添加近期考试记录" })).toBeVisible();
    expect(api.saveStatus).toHaveBeenCalledWith({ hasRecentScores: false });
    expect(screen.getByRole("heading", { name: "添加近期考试记录" })).toBeVisible();
  });

  it("submits a complete profile to the free assessment without redemption", async () => {
    const api = fakeApi();
    const completed: OnboardingSnapshot = {
      ...emptySnapshot,
      draft: {
        ...emptySnapshot.draft,
        step: "review",
        status: { hasRecentScores: false },
        goal: {
          targetOverall: 7,
          targetExamDate: "2026-10-10",
          weeklyMinutes: 600,
          minimumSkills: { writing: 6.5 },
        },
      },
    };
    render(<OnboardingWizard initialData={completed} initialStep="review" api={api} />);

    expect(screen.queryByText(/兑换码/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "确认档案，进入能力诊断" }));
    await vi.waitFor(() => expect(api.complete).toHaveBeenCalledOnce());
  });
});
