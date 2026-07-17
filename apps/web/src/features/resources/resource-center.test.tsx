import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResourceCenter } from "./resource-center";

describe("ResourceCenter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders vocabulary resources and filters by target band", () => {
    render(<ResourceCenter initialTab="vocabulary" />);

    expect(screen.getByRole("heading", { name: "分级词汇" })).toBeInTheDocument();
    expect(screen.getByText("flexible")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "7+" }));

    expect(screen.getByText("nuanced")).toBeInTheDocument();
    expect(screen.queryByText("flexible")).not.toBeInTheDocument();
  });

  it("switches to practice resources and filters reading question types", () => {
    render(<ResourceCenter initialTab="vocabulary" />);

    fireEvent.click(screen.getByRole("button", { name: /听力阅读题型/ }));
    expect(screen.getByRole("heading", { name: "题型训练" })).toBeInTheDocument();

    const filters = screen.getByLabelText("题型科目");
    fireEvent.click(within(filters).getByRole("button", { name: "阅读" }));

    expect(screen.getByText("判断题：原文定位与范围控制")).toBeInTheDocument();
    expect(screen.queryByText("信息表填空：数字、拼写与限定词")).not.toBeInTheDocument();
  });

  it("searches speaking and writing content", () => {
    render(<ResourceCenter initialTab="speaking" />);

    expect(screen.getByRole("heading", { name: "当季口语话题" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("搜索资源"), { target: { value: "documentary" } });
    expect(screen.getByText("A documentary you watched")).toBeInTheDocument();
    expect(screen.queryByText("A quiet place where you like to study")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /写作题库/ }));
    fireEvent.change(screen.getByLabelText("搜索资源"), { target: { value: "AI" } });
    expect(screen.getByText("AI tools in education")).toBeInTheDocument();
  });

  it("records vocabulary mastery and updates the progress summary", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          masteredIds: ["vocab-6-flexible"],
          reviewIds: [],
          streakDays: 1,
          weeklyMinutes: 2,
        },
      }),
    } as Response);

    render(<ResourceCenter initialTab="vocabulary" />);

    const card = screen.getByText("flexible").closest("article");
    if (!card) throw new Error("missing vocabulary card");
    fireEvent.click(within(card).getByRole("button", { name: "已掌握" }));

    expect(await screen.findByText("已记录掌握状态。")).toBeInTheDocument();
    expect(screen.getByLabelText("今日词汇打卡")).toHaveTextContent("连续学习1 天");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/resources/vocabulary/progress",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ resourceId: "vocab-6-flexible", status: "mastered" }),
      }),
    );
  });
});
