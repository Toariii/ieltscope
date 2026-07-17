"use client";

import {
  ArrowRight,
  ClipboardList,
  Check,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Headphones,
  Mic2,
  NotebookTabs,
  Play,
  Sparkles,
  Target,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";

import styles from "./student-dashboard.module.css";
import type { SkillId, StudentWorkbenchView, WorkbenchTask } from "./student-workbench-data";

export type DashboardStage = "onboarding" | "assessment" | "assessmentSubmitted" | "ready";

const stageContent = {
  onboarding: {
    eyebrow: "开始准备",
    title: "先建立你的备考档案",
    description: "填写备考情况、可参考的近期成绩和目标时间。历史成绩只作背景，稍后的能力诊断才是计划依据。",
    action: "建立备考档案",
    href: "/onboarding",
    steps: ["备考情况", "考试记录（可跳过）", "目标与时间", "确认档案"],
  },
  assessment: {
    eyebrow: "下一步",
    title: "完成能力诊断，确定真实起点",
    description: "用约 60 分钟分别完成听力、阅读、写作和口语诊断。完成后再生成四科目标与学习计划。",
    action: "继续能力诊断",
    href: "/assessment",
    steps: ["听力约 15 分钟", "阅读约 15 分钟", "写作约 20 分钟", "口语约 10 分钟"],
  },
  assessmentSubmitted: {
    eyebrow: "已提交",
    title: "诊断已提交，等待评分生成",
    description: "你的四科诊断已进入评分流程。系统会先进行 AI 初评，再预留教师校准接口；结果生成前不会展示模拟计划，避免误导后续训练。",
    action: "查看提交状态",
    href: "/assessment",
    steps: ["作答已保存", "AI 初评排队", "教师校准接口预留", "生成四科报告与计划"],
  },
} as const;

function SetupStage({ stage, studentName }: { stage: Exclude<DashboardStage, "ready">; studentName: string }) {
  const content = stageContent[stage];
  return (
    <div className={styles.dashboard}>
      <header className={styles.setupWelcome}>
        <p>你好，{studentName}</p>
        <span>IELTScope 会在获得足够信息后再生成你的个性化计划。</span>
      </header>
      <main className={styles.setupMain}>
        <section className={styles.setupIntro} aria-labelledby="setup-title">
          <div className={styles.setupIcon}>
            {stage === "assessmentSubmitted" ? (
              <WandSparkles aria-hidden="true" />
            ) : (
              <ClipboardList aria-hidden="true" />
            )}
          </div>
          <p>{content.eyebrow}</p>
          <h1 id="setup-title">{content.title}</h1>
          <span>{content.description}</span>
          <Link href={content.href}>{content.action}<ArrowRight aria-hidden="true" /></Link>
        </section>
        <ol className={styles.setupSteps} aria-label={stage === "onboarding" ? "建档步骤" : "诊断科目"}>
          {content.steps.map((step, index) => (
            <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></li>
          ))}
        </ol>
      </main>
    </div>
  );
}

const trendTabs: { id: SkillId; label: string }[] = [
  { id: "overall", label: "总分" },
  { id: "listening", label: "听力" },
  { id: "reading", label: "阅读" },
  { id: "writing", label: "写作" },
  { id: "speaking", label: "口语" },
];

const taskState = {
  complete: { label: "已完成", tone: "complete" as const, icon: CheckCircle2 },
  current: { label: "进行中", tone: "current" as const, icon: Play },
  upcoming: { label: "待开始", tone: "upcoming" as const, icon: Clock3 },
};

function TaskRow({ task }: { task: WorkbenchTask }) {
  const state = taskState[task.status];
  const Icon = state.icon;

  return (
    <li className={`${styles.taskRow} ${styles[task.status]}`}>
      <span className={styles.taskIcon}><Icon aria-hidden="true" /></span>
      <div className={styles.taskTitle}>
        <strong>{task.skill} · {task.title}</strong>
        <span>{task.detail}</span>
      </div>
      <span className={styles.taskTime}>{task.minutes} 分钟</span>
      <StatusPill tone={state.tone}>{state.label}</StatusPill>
      {task.status === "current" ? (
        <a className={styles.continueAction} href="#practice">
          继续学习 <ArrowRight aria-hidden="true" />
        </a>
      ) : null}
    </li>
  );
}

export function StudentDashboard({
  data,
  stage = "ready",
}: {
  data: StudentWorkbenchView;
  stage?: DashboardStage;
}) {
  const [activeTrend, setActiveTrend] = useState<SkillId>("overall");
  const activeTrendLabel = trendTabs.find((tab) => tab.id === activeTrend)?.label ?? "总分";
  const activeSkill = data.skills.find((skill) => skill.id === activeTrend);
  const target = activeTrend === "overall" ? data.targetOverall : (activeSkill?.target ?? 0);
  const latest = data.trend.at(-1)?.[activeTrend] ?? 0;
  const weeklyPercent = Math.min(
    100,
    Math.round((data.weeklyMinutes / data.weeklyTargetMinutes) * 100),
  );

  const chartData = useMemo(
    () => data.trend.map((point) => ({ date: point.date, score: point[activeTrend] })),
    [activeTrend, data.trend],
  );

  if (stage !== "ready") return <SetupStage stage={stage} studentName={data.studentName} />;

  return (
    <div className={styles.dashboard} id="dashboard-top">
      <header className={styles.welcome}>
        <div>
          <p>{data.dateLabel}</p>
          <h1>你好，{data.studentName}</h1>
          <span>距离考试 {data.daysToExam} 天 · {data.targetExamDate}</span>
        </div>
        <div className={styles.goalSummary}>
          <span>目标总分</span>
          <strong>{data.targetOverall.toFixed(1)}</strong>
          <small>当前阶段估分 {data.trend.at(-1)?.overall.toFixed(1)}</small>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.primary}>
          <section className={styles.planSection} id="today-plan" aria-labelledby="today-plan-title">
            <div className={styles.sectionHeading}>
              <div>
                <p>今日任务</p>
                <h2 id="today-plan-title">今日计划</h2>
              </div>
              <span>{data.todayTasks.filter((task) => task.status === "complete").length}/{data.todayTasks.length} 已完成</span>
            </div>
            {data.todayTasks.length > 0 ? (
              <ol className={styles.taskList}>
                {data.todayTasks.map((task) => <TaskRow key={task.id} task={task} />)}
              </ol>
            ) : (
              <EmptyState
                title="还没有今日计划"
                description="先完成备考档案与能力诊断，系统才能安排适合你的任务。"
                actionLabel="开始建立备考档案"
                actionHref="/onboarding"
              />
            )}
          </section>

          <div className={styles.analyticsGrid}>
            <section className={styles.skillsSection} id="skill-goals" aria-labelledby="skill-goals-title">
              <div className={styles.sectionHeading}>
                <div>
                  <p>目标拆解</p>
                  <h2 id="skill-goals-title">四科目标</h2>
                </div>
              </div>
              <div className={styles.skillGrid}>
                {data.skills.map((skill) => (
                  <article key={skill.id} className={skill.priority ? styles.prioritySkill : ""}>
                    <div>
                      <span>{skill.label}</span>
                      {skill.priority ? <StatusPill tone="warning">优先提升</StatusPill> : null}
                    </div>
                    <strong>{skill.estimate.toFixed(1)} <ArrowRight aria-hidden="true" /> {skill.target.toFixed(1)}</strong>
                    <small>当前估分 · 可信度 {Math.round(skill.confidence * 100)}%</small>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.trendSection} id="score-trend" aria-labelledby="score-trend-title">
              <div className={styles.sectionHeading}>
                <div>
                  <p>阶段评估</p>
                  <h2 id="score-trend-title">成绩变化</h2>
                </div>
              </div>
              <div className={styles.trendTabs} role="tablist" aria-label="成绩变化科目">
                {trendTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTrend === tab.id}
                    onClick={() => setActiveTrend(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <p className={styles.visuallyHidden} aria-live="polite">
                {activeTrendLabel}最新阶段估分 {latest.toFixed(1)}，目标 {target.toFixed(1)}
              </p>
              <div className={styles.chart} aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 24, right: 18, bottom: 4, left: -18 }}>
                    <CartesianGrid stroke="#d7dfdc" strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="date" axisLine={{ stroke: "#c5d0cc" }} tickLine={false} tick={{ fill: "#68756f", fontSize: 11 }} />
                    <YAxis domain={[4.5, 8]} ticks={[5, 6, 7, 8]} axisLine={false} tickLine={false} tick={{ fill: "#7b8782", fontSize: 10 }} />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} 分`, activeTrendLabel]} labelFormatter={(label) => `评估日期 ${label}`} />
                    <ReferenceLine y={target} stroke="#aebbb6" strokeDasharray="5 5" label={{ value: `目标 ${target.toFixed(1)}`, fill: "#6d7974", fontSize: 10, position: "insideTopRight" }} />
                    <Line type="monotone" dataKey="score" stroke="#0f7066" strokeWidth={3} dot={{ r: 4, fill: "#fff", stroke: "#0f7066", strokeWidth: 3 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className={styles.practiceSection} id="practice" aria-labelledby="practice-title">
            <div className={styles.sectionHeading}>
              <div>
                <p>快速开始</p>
                <h2 id="practice-title">继续今天的训练</h2>
              </div>
            </div>
            <div className={styles.practiceLinks}>
              <a href="#today-plan"><Headphones aria-hidden="true" /><span><strong>听力精听</strong><small>场景填空 · 20 分钟</small></span><ArrowRight aria-hidden="true" /></a>
              <a href="#today-plan"><NotebookTabs aria-hidden="true" /><span><strong>阅读专项</strong><small>判断题 · 12 题</small></span><ArrowRight aria-hidden="true" /></a>
              <a href="#today-plan"><FilePenLine aria-hidden="true" /><span><strong>写作任务</strong><small>Task 2 · 论证展开</small></span><ArrowRight aria-hidden="true" /></a>
              <a href="#today-plan"><Mic2 aria-hidden="true" /><span><strong>口语重录</strong><small>Part 2 · Place</small></span><ArrowRight aria-hidden="true" /></a>
            </div>
          </section>
        </div>

        <aside className={styles.rail} aria-label="学习概览">
          <section className={styles.reviewSection} id="recent-review" aria-labelledby="recent-review-title">
            <div className={styles.sectionHeading}>
              <div>
                <p>最新反馈</p>
                <h2 id="recent-review-title">最近精批</h2>
              </div>
            </div>
            {data.recentReview ? (
              <div className={styles.reviewBody}>
                <span className={styles.reviewKind}>{data.recentReview.kind}</span>
                <strong>{data.recentReview.taskLabel}</strong>
                <div className={styles.reviewScore}>
                  <span>阶段估分</span>
                  <strong>{data.recentReview.score.toFixed(1)}</strong>
                  <small>区间 {data.recentReview.range}</small>
                </div>
                <div className={styles.reviewPriority} id="review-detail">
                  <Target aria-hidden="true" />
                  <p><span>优先改进</span>{data.recentReview.priority}</p>
                </div>
                <Link href="#review-detail">查看批改详情 <ArrowRight aria-hidden="true" /></Link>
              </div>
            ) : (
              <EmptyState
                title="还没有精批记录"
                description="提交一篇作文或一段口语后，最新反馈会显示在这里。"
                actionLabel="选择练习"
                actionHref="#practice"
              />
            )}
          </section>

          <section className={styles.resourcesSection} id="membership" aria-labelledby="resources-title">
            <div className={styles.sectionHeading}>
              <div>
                <p>学习资源</p>
                <h2 id="resources-title">本周状态</h2>
              </div>
            </div>
            <dl className={styles.resourceList}>
              <div>
                <dt><Sparkles aria-hidden="true" /> VIP 精批余额</dt>
                <dd>{data.credits} 次</dd>
              </div>
              <div>
                <dt><Check aria-hidden="true" /> 连续学习</dt>
                <dd>连续 {data.streakDays} 天</dd>
              </div>
              <div>
                <dt><Clock3 aria-hidden="true" /> 本周学习时长</dt>
                <dd>{data.weeklyMinutes} / {data.weeklyTargetMinutes} 分钟</dd>
                <span className={styles.progressTrack}><span style={{ width: `${weeklyPercent}%` }} /></span>
              </div>
            </dl>
            <a className={styles.membershipLink} href="#membership">管理会员与兑换码 <ArrowRight aria-hidden="true" /></a>
          </section>
        </aside>
      </div>
    </div>
  );
}
