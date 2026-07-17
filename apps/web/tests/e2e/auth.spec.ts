import { expect, test } from "@playwright/test";
import postgres from "postgres";

test("registers, signs in again, and enforces student and teacher routes", async ({
  page,
}) => {
  const email = `auth-${Date.now()}@example.test`;
  const password = "alpha-pass-123";
  const sql = postgres("postgresql://ielts:ielts@localhost:5432/ielts", { max: 1 });

  try {
    const missingTermsResponse = await page.request.post("/api/auth/sign-up/email", {
      data: {
        name: "Missing Terms",
        email: `missing-terms-${Date.now()}@example.test`,
        password,
      },
    });
    expect(missingTermsResponse.ok()).toBe(false);

    await page.goto("/register");
    await page.getByLabel("姓名或称呼").fill("Alpha Student");
    await page.getByLabel("邮箱").fill(email);
    await page.getByLabel("密码").fill(password);
    await page.getByLabel("我已阅读并同意用户协议与隐私政策").check();
    await page.getByRole("button", { name: "创建账号" }).click();

    await expect(page.getByText("注册成功，正在进入学习系统...")).toBeVisible();
    await expect(page).toHaveURL("/onboarding/status");
    await expect(page.getByRole("heading", { name: "先了解你的备考起点" })).toBeVisible();

    const [createdUser] = await sql<
      { role: string; termsAcceptedAt: Date | null }[]
    >`select role, terms_accepted_at as "termsAcceptedAt" from "user" where email = ${email}`;
    expect(createdUser.role).toBe("student");
    expect(createdUser.termsAcceptedAt).toBeInstanceOf(Date);

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "先建立你的备考档案" })).toBeVisible();
    await page.getByRole("button", { name: "打开账号菜单" }).click();
    await page.getByRole("button", { name: "退出登录" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("邮箱").fill(email);
    await page.getByLabel("密码").fill(password);
    await page.getByRole("button", { name: "登录" }).click();
    await expect(page).toHaveURL("/dashboard");

    await page.goto("/admin/annotations");
    await expect(page).toHaveURL(/\/forbidden$/);

    await sql`update "user" set role = 'teacher' where email = ${email}`;
    await page.goto("/admin/annotations");
    await expect(page.getByRole("heading", { name: "批改队列" })).toBeVisible();
  } finally {
    await sql`delete from "user" where email = ${email}`;
    await sql.end();
  }
});
