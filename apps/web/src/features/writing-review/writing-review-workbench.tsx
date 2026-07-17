"use client";

import { ArrowRight, FilePenLine, Loader2, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";

import type { WritingReviewView } from "./writing-review-service";
import styles from "./writing-review.module.css";

type ApiResponse =
  | { ok: true; data: WritingReviewView }
  | { ok: false; error: { message: string; fields?: Record<string, string> } };

const sampleDraft = [
  "Nowadays, many students choose online courses because they can study more flexible and save time on travelling.",
  "I partly agree that this method is useful, but it also bring some problems.",
  "If students learn at home for a long time, they may lose motivation because there are no teachers or classmates around them.",
  "Therefore, online learning is helpful, but schools still play an important role for young learners.",
].join("\n\n");

function wordCount(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

export function WritingReviewWorkbench({
  prompt,
  initialReviews,
}: {
  prompt: {
    title: string;
    prompt: string;
  };
  initialReviews: WritingReviewView[];
}) {
  const [draft, setDraft] = useState("");
  const [reviews, setReviews] = useState(initialReviews);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const activeReview = reviews[0] ?? null;
  const currentWordCount = useMemo(() => wordCount(draft), [draft]);

  async function submitDraft() {
    setStatus("submitting");
    setError(null);
    try {
      const response = await fetch("/api/writing-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType: "task2",
          promptTitle: prompt.title,
          promptText: prompt.prompt,
          text: draft,
        }),
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.ok) {
        setError(payload.ok ? "提交失败，请稍后重试。" : payload.error.fields?.text ?? payload.error.message);
        return;
      }
      setReviews([payload.data, ...reviews]);
      setDraft("");
    } catch {
      setError("提交失败，请检查网络后重试。");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.editorCard} aria-labelledby="writing-title">
        <div className={styles.cardIntro}>
          <p>写作精批 Alpha</p>
          <h1 id="writing-title">提交一篇作文，查看批改详情</h1>
          <span>当前版本使用规则评分器模拟批改链路，后续替换为独立评分引擎与 AI Provider。</span>
        </div>

        <div className={styles.promptBox}>
          <FilePenLine aria-hidden="true" />
          <div>
            <strong>{prompt.title}</strong>
            <p>{prompt.prompt}</p>
          </div>
        </div>

        <label className={styles.editorLabel}>
          <span>作文正文</span>
          <textarea
            aria-label="作文正文"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="在这里输入 Task 2 作文。Alpha 阶段建议先提交 80–180 词用于测试批改链路。"
            rows={14}
          />
        </label>

        {error ? <p className={styles.errorMessage} role="alert">{error}</p> : null}

        <div className={styles.editorActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => setDraft(sampleDraft)}>
            填入测试作文
          </button>
          <span>{currentWordCount} words</span>
          <button type="button" className={styles.primaryButton} disabled={status === "submitting"} onClick={() => void submitDraft()}>
            {status === "submitting" ? <Loader2 aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
            提交并生成批改
          </button>
        </div>
      </section>

      <section className={styles.reviewCard} aria-labelledby="review-title">
        <div className={styles.cardIntro}>
          <p>最新反馈</p>
          <h2 id="review-title">批改详情</h2>
        </div>

        {activeReview ? (
          <div className={styles.reviewBody}>
            <div className={styles.scorePanel}>
              <span>阶段估分 {activeReview.evaluation.overallScore.toFixed(1)}</span>
              <strong>区间 {activeReview.evaluation.overallRange}</strong>
              <small>可信度 {Math.round(activeReview.evaluation.confidence * 100)}% · {activeReview.evaluation.rubricVersion}</small>
            </div>

            <div className={styles.criteriaGrid} aria-label="四项评分">
              {activeReview.evaluation.criteria.map((criterion) => (
                <article key={criterion.id}>
                  <span>{criterion.label}</span>
                  <strong>{criterion.score.toFixed(1)}</strong>
                  <p>{criterion.summary}</p>
                </article>
              ))}
            </div>

            <div className={styles.priorityBox}>
              <Target aria-hidden="true" />
              <div>
                <strong>优先改进</strong>
                <ul>
                  {activeReview.evaluation.topPriorities.map((priority) => (
                    <li key={priority}>{priority}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={styles.evidenceList}>
              <strong>句子级批改</strong>
              {activeReview.evaluation.evidence.length > 0 ? (
                activeReview.evaluation.evidence.map((item) => (
                  <div key={`${item.original}-${item.suggestion}`}>
                    <del>{item.original}</del>
                    <ArrowRight aria-hidden="true" />
                    <ins>{item.suggestion}</ins>
                    <p>{item.explanation}</p>
                  </div>
                ))
              ) : (
                <p>本次 Alpha 批改未命中句子级规则，后续 AI 批改会补充更细颗粒度的问题定位。</p>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.emptyReview}>
            <Sparkles aria-hidden="true" />
            <strong>还没有写作精批记录</strong>
            <span>提交后会显示分项评分、优先修改项和句子级批注。</span>
          </div>
        )}
      </section>
    </div>
  );
}
