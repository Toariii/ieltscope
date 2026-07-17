import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

test("renders and operates the student workbench across breakpoints", async ({ page }) => {
  const email = `workbench-${Date.now()}@example.test`;
  const password = `alpha-${Date.now()}-pass`;
  const sql = postgres("postgresql://ielts:ielts@localhost:5432/ielts", { max: 1 });
  const outputDir = path.resolve(process.cwd(), "../../output/playwright");
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  try {
    await mkdir(outputDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/register");
    await page.getByLabel("姓名或称呼").fill("林同学");
    await page.getByLabel("邮箱").fill(email);
    await page.getByLabel("密码").fill(password);
    await page.getByLabel("我已阅读并同意用户协议与隐私政策").check();
    await page.getByRole("button", { name: "创建账号" }).click();

    await expect(page).toHaveURL("/onboarding/status");
    const [createdUser] = await sql<{ id: string }[]>`select id from "user" where email = ${email}`;
    await sql`insert into student_profiles (user_id, onboarding_step, onboarding_completed_at)
      values (${createdUser.id}, 'complete', now())
      on conflict (user_id) do update set onboarding_step = 'complete', onboarding_completed_at = now()`;
    await sql`insert into assessments (user_id, status, completed_at) values (${createdUser.id}, 'completed', now())`;
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "你好，林同学" })).toBeVisible();
    await expect(page.getByText("写作最新阶段估分 6.0，目标 6.5")).toBeHidden();

    await page.getByRole("tab", { name: "写作" }).click();
    await expect(page.getByText("写作最新阶段估分 6.0，目标 6.5")).toBeAttached();

    await page.getByRole("button", { name: "查看通知" }).click();
    await expect(page.getByText("今天还有 2 项计划待完成。")).toBeVisible();
    await page.getByRole("button", { name: "查看通知" }).click();

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
    await page.screenshot({
      path: path.join(outputDir, "student-workbench-desktop.png"),
      fullPage: false,
    });

    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.screenshot({
      path: path.join(outputDir, "student-workbench-desktop-qa.png"),
      fullPage: false,
    });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(768);
    await page.screenshot({
      path: path.join(outputDir, "student-workbench-tablet.png"),
      fullPage: false,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

    const menu = page.getByRole("button", { name: "打开学习导航" });
    await menu.click();
    await expect(page.getByRole("navigation", { name: "学习导航" })).toBeVisible();
    await page.getByRole("link", { name: "今日计划" }).click();
    await expect(page.getByRole("button", { name: "打开学习导航" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await page.waitForTimeout(250);
    await page.evaluate(() => window.scrollTo({ top: 0 }));

    await page.screenshot({
      path: path.join(outputDir, "student-workbench-mobile.png"),
      fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
  } finally {
    await sql`delete from "user" where email = ${email}`;
    await sql.end();
  }
});

test("renders a completed diagnostic report from stored skill estimates", async ({ page }) => {
  const email = `report-${Date.now()}@example.test`;
  const password = `alpha-${Date.now()}-pass`;
  const sql = postgres("postgresql://ielts:ielts@localhost:5432/ielts", { max: 1 });

  try {
    await page.goto("/register");
    await page.getByLabel("姓名或称呼").fill("报告测试学生");
    await page.getByLabel("邮箱").fill(email);
    await page.getByLabel("密码").fill(password);
    await page.getByLabel("我已阅读并同意用户协议与隐私政策").check();
    await page.getByRole("button", { name: "创建账号" }).click();
    await expect(page).toHaveURL("/onboarding/status");

    const [createdUser] = await sql<{ id: string }[]>`select id from "user" where email = ${email}`;
    await sql`insert into student_profiles (user_id, onboarding_step, onboarding_completed_at)
      values (${createdUser.id}, 'complete', now())
      on conflict (user_id) do update set onboarding_step = 'complete', onboarding_completed_at = now()`;
    const [assessment] = await sql<{ id: string }[]>`
      insert into assessments (user_id, status, submitted_at, completed_at)
      values (${createdUser.id}, 'completed', now(), now())
      returning id`;
    await sql`
      insert into assessment_evaluations (assessment_id, user_id, status, stage, completed_at)
      values (${assessment.id}, ${createdUser.id}, 'completed', 'report_generation', now())`;

    const estimates = [
      ["listening", 13, 12, 14, 0.82, "关键词定位较稳，但多轮转折信息仍需训练。", ["提升同义替换识别", "精听表格题"]],
      ["reading", 12, 11, 13, 0.78, "长难句和段落功能判断是主要瓶颈。", ["补长难句主干分析", "训练判断题定位"]],
      ["writing", 11, 10, 12, 0.76, "观点明确，但论证链条和语法控制仍不稳定。", ["补因果链展开", "减少句法错误"]],
      ["speaking", 12, 11, 13, 0.74, "回答结构可理解，但例子和 Part 3 抽象表达需要积累。", ["积累意群", "强化抽象观点解释"]],
    ] as const;
    for (const [skill, estimated, low, high, confidence, summary, priorities] of estimates) {
      await sql`
        insert into skill_estimates
          (user_id, assessment_id, skill, estimated_score, low_score, high_score, confidence, rationale)
        values
          (${createdUser.id}, ${assessment.id}, ${skill}, ${estimated}, ${low}, ${high}, ${confidence}, ${sql.json({
            summary,
            priorities: [...priorities],
          })})`;
    }

    await page.goto("/report");
    await expect(page.getByRole("heading", { name: "四科诊断报告" })).toBeVisible();
    await expect(page.getByRole("region", { name: "当前起点" }).getByText("6.0")).toBeVisible();
    await expect(page.getByText("区间 5.0–6.0")).toBeVisible();
    await expect(page.getByText("补因果链展开")).toBeVisible();
    await expect(page.getByText("当前阶段：报告生成 · 已完成 · diagnostic-alpha-v1")).toBeVisible();
  } finally {
    await sql`delete from "user" where email = ${email}`;
    await sql.end();
  }
});
