"use client";

import { Check, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { assessmentQuestions, type AssessmentAnswerInput, type Skill } from "@ielts/contracts";

import styles from "@/app/(student)/assessment/assessment.module.css";

import { browserAssessmentApi } from "./assessment-client";
import type { AssessmentSnapshot } from "./assessment-service";

export type AssessmentClientApi = {
  saveAnswer(value: AssessmentAnswerInput): Promise<AssessmentSnapshot>;
  submit(): Promise<AssessmentSnapshot>;
};

const sectionLabels: Record<Skill, string> = {
  listening: "听力",
  reading: "阅读",
  writing: "写作",
  speaking: "口语",
};

export function AssessmentRunner({
  initialSnapshot,
  api = browserAssessmentApi,
}: {
  initialSnapshot: AssessmentSnapshot;
  api?: AssessmentClientApi;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeSection, setActiveSection] = useState<Skill>(initialSnapshot.currentSection);
  const activeQuestion = useMemo(
    () => assessmentQuestions.find((question) => question.section === activeSection) ?? assessmentQuestions[0],
    [activeSection],
  );
  const savedAnswer = snapshot.answers[activeQuestion.id];
  const [draftValue, setDraftValue] = useState("");
  const [pending, setPending] = useState<"save" | "submit" | null>(null);
  const [error, setError] = useState("");

  const currentValue = draftValue || (Array.isArray(savedAnswer?.value) ? savedAnswer.value[0] : savedAnswer?.value) || "";

  async function saveActiveAnswer() {
    setPending("save");
    setError("");
    try {
      const next = await api.saveAnswer({
        questionId: activeQuestion.id,
        section: activeQuestion.section,
        value: currentValue,
        durationSeconds: 0,
      });
      setSnapshot(next);
      setDraftValue("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setPending(null);
    }
  }

  async function submitAssessment() {
    setPending("submit");
    setError("");
    try {
      setSnapshot(await api.submit());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败");
    } finally {
      setPending(null);
    }
  }

  if (snapshot.status === "submitted" || snapshot.status === "completed") {
    return (
      <section className={styles.submittedPanel}>
        <p>基础诊断</p>
        <h1>诊断已提交</h1>
        <span>你的作答已经保存，并会进入 AI 初评与教师校准预留流程。结果生成前，工作台会保持等待评分状态，不提前展示模拟计划。</span>
        <div className={styles.submittedSteps} aria-label="评分生成进度">
          <strong>作答已保存</strong>
          <strong>AI 初评排队</strong>
          <strong>教师校准接口预留</strong>
          <strong>生成四科报告与计划</strong>
        </div>
        <Link href="/dashboard">返回工作台</Link>
      </section>
    );
  }

  return (
    <section className={styles.runner} aria-label="能力诊断答题区">
      <div className={styles.runnerHeader}>
        <div>
          <p>首次能力诊断</p>
          <h1>完成四科基础题，建立真实起点</h1>
          <span>已完成 {snapshot.progress.answered} / {snapshot.progress.required}</span>
        </div>
        <button type="button" disabled={!snapshot.canSubmit || pending === "submit"} onClick={() => void submitAssessment()}>
          {pending === "submit" ? <Loader2 aria-hidden="true" /> : <Check aria-hidden="true" />}
          提交诊断
        </button>
      </div>

      <div className={styles.sectionTabs} role="tablist" aria-label="诊断科目">
        {snapshot.sections.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={section.id === activeSection}
            className={section.id === activeSection ? styles.activeTab : ""}
            onClick={() => {
              setActiveSection(section.id);
              setDraftValue("");
            }}
          >
            <strong>{section.label}</strong>
            <small>{section.answered}/{section.required} · {section.estimatedMinutes} 分钟</small>
          </button>
        ))}
      </div>

      <article className={styles.questionPanel}>
        <p>{sectionLabels[activeQuestion.section]} · {activeQuestion.estimatedMinutes} 分钟</p>
        <h2>{activeQuestion.title}</h2>
        <span>{activeQuestion.prompt}</span>

        {activeQuestion.options ? (
          <div className={styles.optionGrid}>
            {activeQuestion.options.map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name={activeQuestion.id}
                  aria-label={option}
                  checked={currentValue === option}
                  onChange={() => setDraftValue(option)}
                />
                {option}
              </label>
            ))}
          </div>
        ) : (
          <textarea
            aria-label={`${activeQuestion.title}答案`}
            value={currentValue}
            onChange={(event) => setDraftValue(event.target.value)}
            rows={activeQuestion.section === "writing" ? 10 : 6}
            placeholder={activeQuestion.section === "speaking" ? "先写下你的口语回答提纲，录音入口后续接入。" : "在这里输入你的作答。"}
          />
        )}

        {error ? <p className={styles.errorText} role="alert">{error}</p> : null}
        <footer>
          <button type="button" disabled={pending === "save"} onClick={() => void saveActiveAnswer()}>
            {pending === "save" ? <Loader2 aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
            保存本题
          </button>
        </footer>
      </article>
    </section>
  );
}
