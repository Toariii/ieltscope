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
