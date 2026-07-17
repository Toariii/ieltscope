import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Target,
} from "lucide-react";
import Link from "next/link";

import styles from "./assessment-report.module.css";

export type ReportSkill = {
  id: "listening" | "reading" | "writing" | "speaking";
  label: string;
  estimatedScore: number;
  lowScore: number;
  highScore: number;
  confidence: number;
  summary: string;
  priorities: string[];
};

export type ReportEvaluation = {
  status: "queued" | "processing" | "completed" | "failed";
  stage: "ai_initial_scoring" | "teacher_calibration" | "report_generation";
  rubricVersion: string;
  completedAt: string | null;
};

export type AssessmentReportState =
  | "not_started"
  | "scoring"
  | "empty_report"
  | "ready";

export type AssessmentReportView = {
  studentName: string;
  state: AssessmentReportState;
  completedAt: string | null;
  evaluation: ReportEvaluation | null;
  skills: ReportSkill[];
};

const stateCopy = {
  not_started: {
    icon: Clock3,
    title: "还没有可展示的诊断报告",
    description: "完成四科能力诊断后，这里会生成你的四科估分、分数区间和优先提升方向。",
    actionLabel: "开始能力诊断",
    actionHref: "/assessment",
  },
  scoring: {
    icon: BarChart3,
    title: "诊断报告生成中",
    description: "你的作答已经进入评分流程。结果生成前，系统不会展示模拟分数或计划。",
    actionLabel: "查看诊断状态",
    actionHref: "/assessment",
  },
  empty_report: {
    icon: FileText,
    title: "报告结构已建立，等待四科估分写入",
    description: "诊断已完成，但四科估分、区间和改进项还没有写入。后续 AI 评分和教师校准会填充这里。",
    actionLabel: "返回工作台",
    actionHref: "/dashboard",
  },
  ready: {
    icon: CheckCircle2,
    title: "四科诊断报告",
    description: "以下结果来自诊断评分结果，用于生成后续目标拆解和学习计划。",
    actionLabel: "进入学习计划",
    actionHref: "/dashboard",
  },
} as const;

const stageCopy = {
  ai_initial_scoring: "AI 初评",
  teacher_calibration: "教师校准",
  report_generation: "报告生成",
} as const;

const statusCopy = {
  queued: "排队中",
  processing: "处理中",
  completed: "已完成",
  failed: "需要处理",
} as const;

function score(value: number) {
  return value.toFixed(1);
}

export function AssessmentReport({ view }: { view: AssessmentReportView }) {
  const copy = stateCopy[view.state];
  const Icon = copy.icon;
  const overall =
    view.skills.length > 0
      ? view.skills.reduce((sum, skill) => sum + skill.estimatedScore, 0) / view.skills.length
      : null;

  return (
    <div className={styles.report} id="report-top">
      <header className={styles.hero}>
        <div className={styles.heroIcon}>
          <Icon aria-hidden="true" />
        </div>
        <p>学习报告</p>
        <h1>{copy.title}</h1>
        <span>{copy.description}</span>
        <div className={styles.heroActions}>
          <Link href={copy.actionHref}>
            {copy.actionLabel}
            <ArrowRight aria-hidden="true" />
          </Link>
          {view.evaluation ? (
            <small>
              当前阶段：{stageCopy[view.evaluation.stage]} · {statusCopy[view.evaluation.status]} ·{" "}
              {view.evaluation.rubricVersion}
            </small>
          ) : null}
        </div>
      </header>

      {view.state === "ready" ? (
        <main className={styles.reportGrid}>
          <section className={styles.overview} aria-labelledby="report-overview-title">
            <div>
              <p>诊断总览</p>
              <h2 id="report-overview-title">当前起点</h2>
              <span>
                报告会保留区间表达，优先呈现能直接指导训练的薄弱项，而不是把一次诊断说成绝对分数。
              </span>
            </div>
            <strong>{overall ? score(overall) : "--"}</strong>
            <small>四科均值估算</small>
          </section>

          <section className={styles.skillSection} aria-labelledby="report-skills-title">
            <div className={styles.sectionHeading}>
              <p>四科分析</p>
              <h2 id="report-skills-title">估分区间与优先动作</h2>
            </div>
            <div className={styles.skillGrid}>
              {view.skills.map((skill) => (
                <article key={skill.id}>
                  <div className={styles.skillHeader}>
                    <span>{skill.label}</span>
                    <strong>{score(skill.estimatedScore)}</strong>
                  </div>
                  <div className={styles.rangeLine}>
                    <span>区间 {score(skill.lowScore)}–{score(skill.highScore)}</span>
                    <span>置信度 {Math.round(skill.confidence * 100)}%</span>
                  </div>
                  <p>{skill.summary}</p>
                  <ul>
                    {skill.priorities.map((priority) => (
                      <li key={priority}>
                        <Target aria-hidden="true" />
                        {priority}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.nextStep} aria-labelledby="report-next-title">
            <AlertCircle aria-hidden="true" />
            <div>
              <h2 id="report-next-title">下一步会接学习计划生成</h2>
              <p>
                后续会根据目标分数、考试时间和四科估分生成任务优先级。当前页面已经预留真实评分结果入口。
              </p>
            </div>
          </section>
        </main>
      ) : (
        <main className={styles.pendingPanel} aria-label="报告生成状态">
          <div>
            <strong>{view.evaluation ? statusCopy[view.evaluation.status] : "等待诊断"}</strong>
            <span>{view.evaluation ? stageCopy[view.evaluation.stage] : "完成诊断后生成报告"}</span>
          </div>
          <div>
            <strong>{view.completedAt ? "诊断已完成" : "诊断未完成"}</strong>
            <span>{view.completedAt ?? "暂无完成时间"}</span>
          </div>
          <div>
            <strong>{view.skills.length} / 4</strong>
            <span>已写入四科估分</span>
          </div>
        </main>
      )}
    </div>
  );
}
