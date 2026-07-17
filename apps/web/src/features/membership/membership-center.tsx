"use client";

import { CheckCircle2, Clock3, CreditCard, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import type { MembershipCenterView } from "./membership-service";
import styles from "./membership-center.module.css";

type ApiResponse =
  | { ok: true; data: MembershipCenterView }
  | { ok: false; error: { message: string } };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function skuLabel(sku: string) {
  if (sku === "vip_monthly_alpha") return "VIP 月度精批包";
  return sku;
}

export function MembershipCenter({
  initialData,
}: {
  initialData: MembershipCenterView;
}) {
  const [data, setData] = useState(initialData);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const activeMembership = data.memberships[0] ?? null;
  const normalizedCode = useMemo(() => code.trim().replace(/\s+/gu, "").toUpperCase(), [code]);

  async function redeem() {
    setStatus("submitting");
    setMessage(null);
    try {
      const response = await fetch("/api/membership/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.ok) {
        setMessage({
          tone: "error",
          text: payload.ok ? "兑换失败，请稍后重试。" : payload.error.message,
        });
        return;
      }
      setData(payload.data);
      setCode("");
      setMessage({ tone: "success", text: "兑换成功，精批额度已更新。" });
    } catch {
      setMessage({ tone: "error", text: "兑换失败，请检查网络后重试。" });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="membership-title">
        <div className={styles.heroCopy}>
          <p>会员中心</p>
          <h1 id="membership-title">管理 VIP 精批额度与兑换码</h1>
          <span>
            Alpha 阶段先支持书卡 / 激活码兑换。正式上线后可接入批量制码、风控校验和额度消费流水。
          </span>
        </div>

        <div className={styles.creditCard} aria-label="当前精批余额">
          <span>当前 VIP 精批余额</span>
          <strong>{data.credits}</strong>
          <small>次可用精批</small>
          <Sparkles aria-hidden="true" />
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="redeem-title">
          <div className={styles.panelHeading}>
            <CreditCard aria-hidden="true" />
            <div>
              <p>激活权益</p>
              <h2 id="redeem-title">输入兑换码</h2>
            </div>
          </div>

          <label className={styles.codeField}>
            <span>兑换码</span>
            <input
              aria-label="兑换码"
              autoComplete="off"
              value={code}
              placeholder="例如 IELTSCOPE-ALPHA-2026"
              onChange={(event) => setCode(event.target.value)}
            />
          </label>

          {message ? (
            <p
              className={message.tone === "success" ? styles.successMessage : styles.errorMessage}
              role={message.tone === "error" ? "alert" : "status"}
            >
              {message.text}
            </p>
          ) : null}

          <button
            type="button"
            className={styles.primaryButton}
            disabled={status === "submitting" || normalizedCode.length < 6}
            onClick={() => void redeem()}
          >
            {status === "submitting" ? <Loader2 aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
            兑换并激活
          </button>

          <p className={styles.devNote}>
            测试阶段可使用开发码 IELTSCOPE-ALPHA-2026。正式环境会改为后台批量生成，不在页面公开展示。
          </p>
        </section>

        <section className={styles.panel} aria-labelledby="active-title">
          <div className={styles.panelHeading}>
            <Clock3 aria-hidden="true" />
            <div>
              <p>当前权益</p>
              <h2 id="active-title">会员状态</h2>
            </div>
          </div>

          {activeMembership ? (
            <div className={styles.membershipCard}>
              <span>已激活</span>
              <strong>{skuLabel(activeMembership.sku)}</strong>
              <small>
                有效期：{formatDate(activeMembership.startsAt)} 至 {formatDate(activeMembership.expiresAt)}
              </small>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>暂无已激活会员</strong>
              <span>兑换成功后，会在这里显示会员包、有效期和对应精批权益。</span>
            </div>
          )}

          <div className={styles.ruleList}>
            <div>
              <ShieldCheck aria-hidden="true" />
              <span>兑换码只保存加密摘要，后台不保存明文码。</span>
            </div>
            <div>
              <Sparkles aria-hidden="true" />
              <span>额度会写入独立流水，后续写作 / 口语精批消耗时从这里扣减。</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
