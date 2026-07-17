import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("renders the complete student navigation and content", () => {
    render(
      <AppShell studentName="林同学">
        <div>工作台内容</div>
      </AppShell>,
    );

    const navigation = screen.getByRole("navigation", { name: "学习导航" });
    expect(navigation).toHaveTextContent("首页");
    expect(navigation).toHaveTextContent("今日计划");
    expect(navigation).toHaveTextContent("学习计划");
    expect(navigation).toHaveTextContent("练习题库");
    expect(navigation).toHaveTextContent("词汇");
    expect(navigation).toHaveTextContent("听力");
    expect(navigation).toHaveTextContent("阅读");
    expect(navigation).toHaveTextContent("写作精批");
    expect(navigation).toHaveTextContent("口语精批");
    expect(navigation).toHaveTextContent("学习报告");
    expect(screen.getByText("工作台内容")).toBeInTheDocument();
  });

  it("opens and closes the mobile navigation with an accessible control", () => {
    render(
      <AppShell studentName="林同学">
        <div>工作台内容</div>
      </AppShell>,
    );

    const menuButton = screen.getByRole("button", { name: "打开学习导航" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);
    expect(screen.getByRole("button", { name: "关闭学习导航" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
