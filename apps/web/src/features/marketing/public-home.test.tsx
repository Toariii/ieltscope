import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicHome } from "./public-home";

describe("PublicHome", () => {
  it("presents the IELTScope brand and real authentication routes", () => {
    render(<PublicHome />);

    expect(screen.getByRole("heading", { level: 1, name: "IELTScope" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "登录" })[0]).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "免费注册" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.queryByText(/兑换码/)).not.toBeInTheDocument();
  });

  it("switches the live tool demonstration between writing and speaking", () => {
    render(<PublicHome />);

    expect(screen.getByRole("heading", { name: "写作批改详情" })).toBeInTheDocument();
    expect(screen.getByText("Topic: Can online courses replace traditional classrooms?")).toBeInTheDocument();
    expect(screen.getByText("they can study more flexible")).toBeInTheDocument();
    expect(screen.getByText("study more flexibly")).toBeInTheDocument();
    expect(screen.getByText("副词与主谓一致错误")).toBeInTheDocument();

    const demoTabs = screen.getByRole("tablist", { name: "精批类型" });
    fireEvent.click(within(demoTabs).getByRole("tab", { name: "口语精批" }));

    expect(screen.getByRole("heading", { name: "口语批改详情" })).toBeInTheDocument();
    expect(screen.getByText("停顿与节奏分析")).toBeInTheDocument();
  });

  it("presents core tools in a photographic horizontal carousel", () => {
    render(<PublicHome />);

    expect(screen.getByRole("heading", { name: "核心工具，围绕真实提分闭环" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "首次诊断" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "动态计划" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "学生与教师在现代教研空间复盘写作反馈" })).toBeInTheDocument();
    expect(screen.queryByText("AI 辅助分析")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一个功能" }));

    expect(screen.getByRole("heading", { name: "语言内容与语音表现双通道分析" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "学生在专业学习空间进行英语口语练习" })).toBeInTheDocument();
  });

  it("uses the learning-loop ribbon as real shortcuts into the tool carousel", () => {
    render(<PublicHome />);

    const workflow = screen.getByLabelText("学习闭环");

    fireEvent.click(within(workflow).getByRole("button", { name: /诊断/ }));
    expect(screen.getByRole("heading", { name: "先判断真实起点，再拆解目标分数" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "首次诊断" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(within(workflow).getByRole("button", { name: /复练/ }));
    expect(screen.getByRole("heading", { name: "把卡分问题转成可以完成的训练" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "专项训练" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(within(workflow).getByRole("button", { name: /更新计划/ }));
    expect(screen.getByRole("heading", { name: "每一次练习都会更新下一步安排" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "动态计划" })).toHaveAttribute("aria-selected", "true");
  });

  it("explains scoring criteria, ranges and confidence in student language", () => {
    render(<PublicHome />);

    expect(screen.getByText("写作与口语各按四项标准分别判断")).toBeInTheDocument();
    expect(screen.getByText("写作：任务回应、连贯、词汇、语法")).toBeInTheDocument();
    expect(screen.getByText("口语：流利度、词汇、语法、发音")).toBeInTheDocument();
    expect(screen.getByText("区间呈现评分边界，尽可能贴近真实水平")).toBeInTheDocument();
    expect(screen.queryByText(/不准|不把估分说得过准/)).not.toBeInTheDocument();
    expect(screen.getByText("规则、教师样本与模型结果越一致，可信度越高")).toBeInTheDocument();
    expect(screen.queryByText("0.5 分档")).not.toBeInTheDocument();
    expect(screen.queryByText(/四项.*独立分析/)).not.toBeInTheDocument();
    expect(screen.getByText("按四项评分标准，逐句定位问题")).toBeInTheDocument();
  });
});
