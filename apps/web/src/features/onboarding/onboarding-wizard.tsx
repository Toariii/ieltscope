"use client";

import { ArrowLeft, ArrowRight, Check, FileText, Flag, Target, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { skills, validateGoalInput, type ExamScoreInput, type GoalInput, type StatusInput } from "@ielts/contracts";

import { browserOnboardingApi } from "./onboarding-client";
import { RecordEditor } from "./record-editor";
import type { OnboardingSnapshot } from "./onboarding-types";
import styles from "./onboarding-wizard.module.css";

const stepItems = [
  { id: "status", label: "备考情况", icon: UserRound },
  { id: "records", label: "考试记录", icon: FileText },
  { id: "goal", label: "目标与时间", icon: Target },
  { id: "review", label: "确认档案", icon: Flag },
] as const;

type WizardStep = (typeof stepItems)[number]["id"];

export type OnboardingClientApi = {
  saveStatus(value: StatusInput): Promise<OnboardingSnapshot>;
  saveGoal(value: GoalInput): Promise<OnboardingSnapshot>;
  addManualRecord(value: ExamScoreInput): Promise<OnboardingSnapshot>;
  deleteManualRecord(id: string): Promise<OnboardingSnapshot>;
  uploadDocument(file: File): Promise<OnboardingSnapshot>;
  confirmDocument(id: string, value: ExamScoreInput): Promise<OnboardingSnapshot>;
  deleteDocument(id: string): Promise<OnboardingSnapshot>;
  complete(): Promise<void>;
};

function defaultGoal(): GoalInput {
  const date = new Date();
  date.setDate(date.getDate() + 90);
  return { targetOverall: 7, targetExamDate: date.toISOString().slice(0, 10), weeklyMinutes: 600, minimumSkills: {} };
}

export function OnboardingWizard({ initialData, initialStep, api = browserOnboardingApi }: { initialData: OnboardingSnapshot; initialStep: WizardStep; api?: OnboardingClientApi }) {
  const [data, setData] = useState(initialData);
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [syncState, setSyncState] = useState<"saved" | "saving" | "local">("saved");
  const [error, setError] = useState("");
  const [statusValue, setStatusValue] = useState<boolean | null>(data.draft.status?.hasRecentScores ?? null);
  const [todayTime] = useState(() => Date.now());
  const [goal, setGoal] = useState<GoalInput>(() => data.draft.goal ?? defaultGoal());
  const [goalErrors, setGoalErrors] = useState<Record<string, string>>({});
  const activeIndex = stepItems.findIndex((item) => item.id === step);

  const remainingWeeks = useMemo(() => {
    const distance = new Date(`${goal.targetExamDate}T00:00:00`).getTime() - todayTime;
    return Math.max(0, Math.ceil(distance / (7 * 24 * 60 * 60 * 1000)));
  }, [goal.targetExamDate, todayTime]);

  function move(next: WizardStep) {
    setStep(next);
    window.history.pushState({}, "", `/onboarding/${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function run(action: () => Promise<OnboardingSnapshot>, next?: WizardStep) {
    setSyncState("saving"); setError("");
    try { const snapshot = await action(); setData(snapshot); setSyncState("saved"); if (next) move(next); }
    catch (actionError) { setSyncState("local"); setError(actionError instanceof Error ? actionError.message : "保存失败"); }
  }

  async function saveStatus() {
    if (statusValue === null) { setError("请选择你的备考情况"); return; }
    await run(() => api.saveStatus({ hasRecentScores: statusValue }), "records");
  }

  async function saveGoal() {
    const validation = validateGoalInput(goal);
    setGoalErrors(validation.errors);
    if (!validation.ok) return;
    await run(() => api.saveGoal(goal), "review");
  }

  const stepContent = {
    status: (
      <section className={styles.stepContent} aria-labelledby="step-title"><p className={styles.eyebrow}>建立备考档案</p><h1 id="step-title">先了解你的备考起点</h1><p className={styles.lead}>近期成绩只用于提供背景，后续约 60 分钟的能力诊断才是主要判断依据。</p><div className={styles.choiceList}><label><input type="radio" name="status" checked={statusValue === true} onChange={() => setStatusValue(true)} /><span><strong>有近三个月考试或模考成绩</strong><small>下一步可以上传 PDF，也可以暂时手动填写</small></span></label><label><input type="radio" name="status" checked={statusValue === false} onChange={() => setStatusValue(false)} /><span><strong>首次备考或暂无可参考成绩</strong><small>可以跳过成绩记录，直接设置目标</small></span></label></div></section>
    ),
    records: (
      <section className={styles.stepContent} aria-labelledby="step-title"><p className={styles.eyebrow}>历史参考</p><h1 id="step-title">添加近期考试记录</h1><p className={styles.lead}>上传 PDF 可以减少填写；手动记录同样可用。这里不判断文件真实性，也不替代后续诊断。</p><RecordEditor documents={data.documents} records={data.records} onUpload={(file) => run(() => api.uploadDocument(file))} onAddManual={(value) => run(() => api.addManualRecord(value))} onDeleteManual={(id) => run(() => api.deleteManualRecord(id))} onConfirmDocument={(id, value) => run(() => api.confirmDocument(id, value))} onDeleteDocument={(id) => run(() => api.deleteDocument(id))} /></section>
    ),
    goal: (
      <section className={styles.stepContent} aria-labelledby="step-title"><p className={styles.eyebrow}>目标设置</p><h1 id="step-title">明确分数与可投入时间</h1><p className={styles.lead}>四科具体目标会在诊断完成后推算，这里只填写总分和硬性要求。</p><div className={styles.formGrid}><label>目标总分<select aria-label="目标总分" value={goal.targetOverall} onChange={(event) => setGoal({ ...goal, targetOverall: Number(event.target.value) })}>{[5.5,6,6.5,7,7.5,8,8.5,9].map((score) => <option key={score} value={score}>{score.toFixed(1)}</option>)}</select>{goalErrors.targetOverall ? <small className={styles.fieldError}>{goalErrors.targetOverall}</small> : null}</label><label>预计考试日期<input aria-label="预计考试日期" type="date" value={goal.targetExamDate} onChange={(event) => setGoal({ ...goal, targetExamDate: event.target.value })} />{goalErrors.targetExamDate ? <small className={styles.fieldError}>{goalErrors.targetExamDate}</small> : <small>距离考试约 {remainingWeeks} 周</small>}</label><label>每周学习小时<input aria-label="每周学习小时" type="number" min="1" max="60" value={goal.weeklyMinutes / 60} onChange={(event) => setGoal({ ...goal, weeklyMinutes: Math.round(Number(event.target.value) * 60) })} />{goalErrors.weeklyMinutes ? <small className={styles.fieldError}>{goalErrors.weeklyMinutes}</small> : <small>日均约 {Math.round(goal.weeklyMinutes / 7)} 分钟</small>}</label></div><fieldset className={styles.minimumSkills}><legend>单科最低要求（选填）</legend>{skills.map((skill) => { const labels = { listening: "听力", reading: "阅读", writing: "写作", speaking: "口语" }; const enabled = goal.minimumSkills[skill] !== undefined; return <div key={skill}><label><input type="checkbox" checked={enabled} onChange={(event) => { const minimumSkills = { ...goal.minimumSkills }; if (event.target.checked) minimumSkills[skill] = 6.5; else delete minimumSkills[skill]; setGoal({ ...goal, minimumSkills }); }} />{labels[skill]}</label><select aria-label={`${labels[skill]}最低分`} disabled={!enabled} value={goal.minimumSkills[skill] ?? 6.5} onChange={(event) => setGoal({ ...goal, minimumSkills: { ...goal.minimumSkills, [skill]: Number(event.target.value) } })}>{[5.5,6,6.5,7,7.5,8,8.5,9].map((score) => <option key={score} value={score}>{score.toFixed(1)}</option>)}</select></div>; })}</fieldset></section>
    ),
    review: (
      <section className={styles.stepContent} aria-labelledby="step-title"><p className={styles.eyebrow}>确认档案</p><h1 id="step-title">检查信息，然后开始诊断</h1><p className={styles.lead}>诊断完成前不会生成精确四科计划，所有历史成绩都只作为参考。</p><div className={styles.reviewList}><article><div><span>备考情况</span><strong>{data.draft.status?.hasRecentScores ? "有近期成绩" : "首次备考或暂无成绩"}</strong></div><button type="button" onClick={() => move("status")}>修改</button></article><article><div><span>考试记录</span><strong>{data.documents.length + data.records.length} 份参考记录</strong></div><button type="button" onClick={() => move("records")}>修改</button></article><article><div><span>目标总分</span><strong>{goal.targetOverall.toFixed(1)} · {goal.targetExamDate}</strong></div><button type="button" onClick={() => move("goal")}>修改</button></article><article><div><span>可投入时间</span><strong>每周 {goal.weeklyMinutes / 60} 小时</strong></div><button type="button" onClick={() => move("goal")}>修改</button></article></div></section>
    ),
  }[step];

  return (
    <main className={styles.page}><header className={styles.header}><a href="/dashboard" className={styles.brand}>IELT<span>Scope</span><small>AI 雅思提分系统</small></a><span className={styles.syncStatus}>{syncState === "saved" ? "已自动保存" : syncState === "saving" ? "正在保存..." : "尚未同步"}</span></header><div className={styles.layout}><aside className={styles.steps}><span>{activeIndex + 1} / 4</span><nav aria-label="建档步骤">{stepItems.map((item, index) => { const Icon = item.icon; const active = item.id === step; const complete = index < activeIndex; return <button key={item.id} type="button" className={active ? styles.activeStep : ""} aria-current={active ? "step" : undefined} onClick={() => move(item.id)}><i>{complete ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}</i><span><small>步骤 {index + 1}</small><strong>{item.label}</strong></span></button>; })}</nav></aside><div className={styles.mainColumn}>{stepContent}{error ? <p className={styles.formError} role="alert">{error}</p> : null}<footer className={styles.footerActions}>{step !== "status" ? <button type="button" className={styles.secondaryButton} onClick={() => move(stepItems[Math.max(0, activeIndex - 1)].id)}><ArrowLeft aria-hidden="true" /> 上一步</button> : <span />}{step === "status" ? <button type="button" className={styles.primaryButton} onClick={() => void saveStatus()}>保存并继续 <ArrowRight aria-hidden="true" /></button> : null}{step === "records" ? <button type="button" className={styles.primaryButton} onClick={() => move("goal")}>保存并继续 <ArrowRight aria-hidden="true" /></button> : null}{step === "goal" ? <button type="button" className={styles.primaryButton} onClick={() => void saveGoal()}>保存并继续 <ArrowRight aria-hidden="true" /></button> : null}{step === "review" ? <button type="button" className={styles.primaryButton} onClick={() => void api.complete()}>确认档案，进入能力诊断 <ArrowRight aria-hidden="true" /></button> : null}</footer></div></div></main>
  );
}
