import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    signIn: { email: mocks.signIn },
    signUp: { email: mocks.signUp },
  },
}));

describe("AuthForm", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.signIn.mockReset();
    mocks.signUp.mockReset();
    mocks.signIn.mockResolvedValue({ data: {}, error: null });
    mocks.signUp.mockResolvedValue({ data: {}, error: null });
  });

  it("enters the student dashboard after a successful login", async () => {
    render(<AuthForm mode="login" />);

    expect(screen.getByRole("img", { name: "专注复盘英语写作的学生" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "a-secure-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"));
  });

  it("starts onboarding after a successful registration", async () => {
    render(<AuthForm mode="register" />);

    fireEvent.change(screen.getByLabelText("姓名或称呼"), { target: { value: "林同学" } });
    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: "a-secure-password" } });
    fireEvent.click(screen.getByLabelText("我已阅读并同意用户协议与隐私政策"));
    fireEvent.click(screen.getByRole("button", { name: "创建账号" }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/onboarding/status"));
  });
});
