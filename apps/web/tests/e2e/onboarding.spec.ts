import { expect, test } from "@playwright/test";
import postgres from "postgres";

const connection = "postgresql://ielts:ielts@localhost:5432/ielts";

function futureDate(days = 90) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function register(page: import("@playwright/test").Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("姓名或称呼").fill("建档测试学生");
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill("onboarding-pass-123");
  await page.getByLabel("我已阅读并同意用户协议与隐私政策").check();
  await page.getByRole("button", { name: "创建账号" }).click();
  await expect(page).toHaveURL("/onboarding/status");
}

test("completes free onboarding without exam history", async ({ page }) => {
  const email = `onboarding-${Date.now()}@example.test`;
  const sql = postgres(connection, { max: 1 });

  try {
    await register(page, email);
    await page.getByLabel("首次备考或暂无可参考成绩").check();
    await page.getByRole("button", { name: "保存并继续" }).click();
    await expect(page).toHaveURL("/onboarding/records");
    await page.getByRole("button", { name: "保存并继续" }).click();
    await expect(page).toHaveURL("/onboarding/goal");
    await page.getByLabel("目标总分").selectOption("7");
    await page.getByLabel("预计考试日期").fill(futureDate());
    await page.getByLabel("每周学习小时").fill("10");
    await page.getByRole("button", { name: "保存并继续" }).click();
    await expect(page).toHaveURL("/onboarding/review");
    await expect(page.getByText("0 份参考记录")).toBeVisible();
    await expect(page.getByText(/兑换码/)).toHaveCount(0);
    await page.getByRole("button", { name: "确认档案，进入能力诊断" }).click();
    await expect(page).toHaveURL("/assessment");
    await expect(page.getByRole("heading", { name: "完成四科基础题，建立真实起点" })).toBeVisible();
    await expect(page.getByText(/兑换码/)).toHaveCount(0);
  } finally {
    await sql`delete from "user" where email = ${email}`;
    await sql.end();
  }
});

test("answers and submits the free diagnostic after onboarding", async ({ page }) => {
  const email = `diagnostic-${Date.now()}@example.test`;
  const sql = postgres(connection, { max: 1 });

  try {
    await register(page, email);
    await page.getByLabel("首次备考或暂无可参考成绩").check();
    await page.getByRole("button", { name: "保存并继续" }).click();
    await page.getByRole("button", { name: "保存并继续" }).click();
    await page.getByLabel("目标总分").selectOption("7");
    await page.getByLabel("预计考试日期").fill(futureDate());
    await page.getByLabel("每周学习小时").fill("10");
    await page.getByRole("button", { name: "保存并继续" }).click();
    await page.getByRole("button", { name: "确认档案，进入能力诊断" }).click();
    await expect(page).toHaveURL("/assessment");

    await page.getByRole("radio", { name: "A" }).check();
    await page.getByRole("button", { name: "保存本题" }).click();
    await expect(page.getByText("已完成 1 / 4")).toBeVisible();

    await page.getByRole("tab", { name: /阅读/ }).click();
    await page.getByRole("radio", { name: "B" }).check();
    await page.getByRole("button", { name: "保存本题" }).click();
    await expect(page.getByText("已完成 2 / 4")).toBeVisible();

    await page.getByRole("tab", { name: /写作/ }).click();
    await page.getByLabel("写作基础诊断答案").fill("Public transport should be improved because it can reduce congestion, improve reliability and make city life fairer for commuters.");
    await page.getByRole("button", { name: "保存本题" }).click();
    await expect(page.getByText("已完成 3 / 4")).toBeVisible();

    await page.getByRole("tab", { name: /口语/ }).click();
    await page.getByLabel("口语 Part 2 思路诊断答案").fill("I usually study in a quiet library near my office because it helps me focus and review feedback after class.");
    await page.getByRole("button", { name: "保存本题" }).click();
    await expect(page.getByText("已完成 4 / 4")).toBeVisible();

    await page.getByRole("button", { name: "提交诊断" }).click();
    await expect(page.getByRole("heading", { name: "诊断已提交" })).toBeVisible();
  } finally {
    await sql`delete from "user" where email = ${email}`;
    await sql.end();
  }
});

test("restores saved progress and keeps the mobile wizard within the viewport", async ({ page }) => {
  const email = `resume-${Date.now()}@example.test`;
  const sql = postgres(connection, { max: 1 });

  try {
    await register(page, email);
    await page.getByLabel("有近三个月考试或模考成绩").check();
    await page.getByRole("button", { name: "保存并继续" }).click();
    await expect(page).toHaveURL("/onboarding/records");

    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("邮箱").fill(email);
    await page.getByLabel("密码").fill("onboarding-pass-123");
    await page.getByRole("button", { name: "登录" }).click();
    await expect(page).toHaveURL("/dashboard");
    await page.goto("/onboarding");
    await expect(page).toHaveURL("/onboarding/records");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await expect(page.getByRole("heading", { name: "添加近期考试记录" })).toBeVisible();
  } finally {
    await sql`delete from "user" where email = ${email}`;
    await sql.end();
  }
});
