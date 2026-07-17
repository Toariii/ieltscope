"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useSyncExternalStore } from "react";

import { authClient } from "@/lib/auth/client";

import styles from "./auth-form.module.css";

type AuthMode = "login" | "register";

const fallbackError = "暂时无法完成操作，请稍后再试。";
const subscribeToHydration = () => () => undefined;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const ready = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    if (password.length < 10) {
      setError("密码至少需要 10 位字符。");
      return;
    }

    if (isRegister && form.get("acceptTerms") !== "on") {
      setError("注册前需要同意用户协议与隐私政策。");
      return;
    }

    setPending(true);

    try {
      const result = isRegister
        ? await authClient.signUp.email({
            name: String(form.get("name") ?? "").trim(),
            email,
            password,
            termsAcceptedAt: new Date(),
          })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? fallbackError);
        return;
      }

      setSuccess(isRegister ? "注册成功，正在进入学习系统..." : "登录成功，正在进入学习系统...");
      window.setTimeout(() => {
        router.push(isRegister ? "/onboarding/status" : "/dashboard");
        router.refresh();
      }, 450);
    } catch {
      setError(fallbackError);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.product} aria-label="产品信息">
        <Image
          src="/images/marketing/generated/auth-student-writing-modern.webp"
          alt="专注复盘英语写作的学生"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 56vw"
        />
        <div className={styles.photoShade} />
        <div className={styles.productBrand}>
          <span className={styles.mark}>S</span>
          <div>
            <strong>IELT<span>Scope</span></strong>
            <p>AI 雅思提分系统</p>
          </div>
        </div>
        <div className={styles.sceneNote}>
          <span>学习，不止是完成一道题</span>
          <strong>看见问题，也看见下一步。</strong>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="auth-title">
        <div className={styles.heading}>
          <p>{isRegister ? "创建学生账号" : "欢迎回来"}</p>
          <h1 id="auth-title">{isRegister ? "开始建立备考档案" : "登录学习工作台"}</h1>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {isRegister ? (
            <label>
              <span>姓名或称呼</span>
              <input name="name" autoComplete="name" required maxLength={80} />
            </label>
          ) : null}

          <label>
            <span>邮箱</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>

          <label>
            <span>密码</span>
            <input
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={10}
              maxLength={128}
              required
            />
            {isRegister ? <small>至少 10 位字符</small> : null}
          </label>

          {isRegister ? (
            <label className={styles.checkbox}>
              <input name="acceptTerms" type="checkbox" required />
              <span>我已阅读并同意用户协议与隐私政策</span>
            </label>
          ) : null}

          <div className={styles.message} aria-live="polite">
            {error ? <p className={styles.error}>{error}</p> : null}
            {success ? <p className={styles.success}>{success}</p> : null}
          </div>

          <button type="submit" disabled={!ready || pending || Boolean(success)}>
            {pending ? "处理中..." : isRegister ? "创建账号" : "登录"}
          </button>
        </form>

        <p className={styles.switcher}>
          {isRegister ? "已有账号？" : "还没有账号？"}
          <Link href={isRegister ? "/login" : "/register"}>
            {isRegister ? "直接登录" : "创建账号"}
          </Link>
        </p>
      </section>
    </main>
  );
}
