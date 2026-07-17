import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

test("renders photographic auth screens and the horizontal feature carousel", async ({ page }) => {
  const outputDir = path.resolve(process.cwd(), "../../output/playwright");
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await mkdir(outputDir, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "IELTScope" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({
    path: path.join(outputDir, "public-home-photo-desktop.png"),
    fullPage: false,
  });

  const carousel = page.getByRole("region", {
    name: "核心工具，围绕真实提分闭环",
  });
  await carousel.scrollIntoViewIfNeeded();
  await expect(page.getByRole("img", { name: "学生与教师在现代教研空间复盘写作反馈" })).toBeVisible();
  await expect(page.getByText("AI 辅助分析", { exact: true })).toHaveCount(0);
  await page.waitForTimeout(400);
  await carousel.screenshot({ path: path.join(outputDir, "public-home-carousel-writing-desktop.png") });
  await page.getByRole("button", { name: "下一个功能" }).click();
  await expect(page.getByRole("img", { name: "学生在专业学习空间进行英语口语练习" })).toBeVisible();
  await page.waitForTimeout(400);
  await carousel.screenshot({ path: path.join(outputDir, "public-home-carousel-desktop.png") });

  await page.goto("/login");
  await expect(page.getByRole("img", { name: "专注复盘英语写作的学生" })).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "auth-login-photo-desktop.png"),
    fullPage: false,
  });

  await page.goto("/register");
  await expect(page.getByRole("img", { name: "专注复盘英语写作的学生" })).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "auth-register-photo-desktop.png"),
    fullPage: false,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const mobileCarousel = page.getByRole("region", {
    name: "核心工具，围绕真实提分闭环",
  });
  await mobileCarousel.scrollIntoViewIfNeeded();
  await mobileCarousel.screenshot({ path: path.join(outputDir, "public-home-carousel-mobile.png") });

  await page.goto("/login");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({
    path: path.join(outputDir, "auth-login-photo-mobile.png"),
    fullPage: false,
  });

  await page.setViewportSize({ width: 1627, height: 925 });
  await page.goto("/");
  await page.getByRole("region", { name: "核心工具，围绕真实提分闭环" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(outputDir, "public-home-carousel-feedback-viewport.png"),
    fullPage: false,
  });

  await page.setViewportSize({ width: 920, height: 922 });
  await page.goto("/login");
  await page.screenshot({
    path: path.join(outputDir, "auth-login-feedback-viewport.png"),
    fullPage: false,
  });

  expect(consoleErrors).toEqual([]);
});
