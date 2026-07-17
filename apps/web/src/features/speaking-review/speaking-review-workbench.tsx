"use client";

import { ArrowRight, Loader2, Mic2, Sparkles, Target, Waves } from "lucide-react";
import { useMemo, useState } from "react";

import styles from "@/features/writing-review/writing-review.module.css";

import type { SpeakingPart } from "./speaking-review-evaluator";
import type { SpeakingReviewView } from "./speaking-review-service";

type ApiResponse =
  | { ok: true; data: SpeakingReviewView }
  | { ok: false; error: { message: string; fields?: Record<string, string> } };

const sampleTranscript = [
  "I want to describe a small study room near my office.",
  "I usually go there after work because it is quiet and I can focus on my English.",
  "There are many books and some comfortable chairs, so I feel relaxed.",
  "But sometimes I stop for a long time because I cannot find exact words to explain my feeling.",
  "Overall, this place is useful for me because it help me build a regular study habit.",
].join(" ");

function wordCount(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

export function SpeakingReviewWorkbench({
  prompt,
  initialReviews,
}: {
  prompt: {
    title: string;
    prompt: string;
    part: SpeakingPart;
  };
  initialReviews: SpeakingReviewView[];
}) {
  const [transcript, setTranscript] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(90);
  const [reviews, setReviews] = useState(initialReviews);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const activeReview = reviews[0] ?? null;
  const currentWordCount = useMemo(() => wordCount(transcript), [transcript]);

  async function submitTranscript() {
    setStatus("submitting");
    setError(null);
    try {
      const response = await fetch("/api/speaking-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part: prompt.part,
          promptTitle: prompt.title,
          promptText: prompt.prompt,
          transcript,
          durationSeconds,
        }),
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.ok) {
        setError(
          payload.ok
            ? "提交失败，请稍后重试。"
            : payload.error.fields?.transcript ?? payload.error.message,
        );
        return;
      }
      setReviews([payload.data, ...reviews]);
      setTranscript("");
    } catch {
      setError("提交失败，请检查网络后重试。");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.editorCard} aria-labelledby="speaking-title">
        <div className={styles.cardIntro}>
          <p>口语精批 Alpha</p>
          <h1 id="speaking-title">提交一段口语回答，查看反馈</h1>
          <span>当前版本先基于回答文本分析内容组织、词汇和语法；录音、转写、发音和语调分析会在后续接入。</span>
        </div>

        <div className={styles.promptBox}>
          <Mic2 aria-hidden="true" />
          <div>
            <strong>{prompt.title}</strong>
            <p>{prompt.prompt}</p>
          </div>
        </div>

        <label className={styles.editorLabel}>
          <span>口语回答文本</span>
          <textarea
            aria-label="口语回答文本"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Alpha 阶段先输入你的回答文本或转写内容。后续会接录音上传与自动转写。"
            rows={12}
          />
        </label>

        <label className={styles.editorLabel}>
          <span>回答时长（秒）</span>
          <input
            aria-label="回答时长（秒）"
            min={0}
            type="number"
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(Number(event.target.value))}
          />
        </label>

        {error ? <p className={styles.errorMessage} role="alert">{error}</p> : null}

        <div className={styles.editorActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => setTranscript(sampleTranscript)}>
            填入口语样例
          </button>
          <span>{currentWordCount} words · {durationSeconds || 0}s</span>
          <button type="button" className={styles.primaryButton} disabled={status === "submitting"} onClick={() => void submitTranscript()}>
            {status === "submitting" ? <Loader2 aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
            提交并生成口语反馈
          </button>
        </div>
      </section>

      <section className={styles.reviewCard} aria-labelledby="speaking-review-title">
        <div className={styles.cardIntro}>
          <p>最新反馈</p>
          <h2 id="speaking-review-title">口语批改详情</h2>
        </div>

        {activeReview ? (
          <div className={styles.reviewBody}>
            <div className={styles.scorePanel}>
              <span>阶段估分 {activeReview.evaluation.overallScore.toFixed(1)}</span>
              <strong>区间 {activeReview.evaluation.overallRange}</strong>
              <small>可信度 {Math.round(activeReview.evaluation.confidence * 100)}% · {activeReview.evaluation.rubricVersion}</small>
              <small>文本分析模式</small>
            </div>

            <div className={styles.criteriaGrid} aria-label="口语四项评分">
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
              <strong>文本级反馈</strong>
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
                <p>本次 Alpha 反馈未命中文本级规则。录音分析接入后会补充停顿、重音和语调定位。</p>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.emptyReview}>
            <Waves aria-hidden="true" />
            <strong>还没有口语精批记录</strong>
            <span>提交回答文本后，会显示四项评分、优先改进项和文本级反馈。</span>
          </div>
        )}
      </section>
    </div>
  );
}
