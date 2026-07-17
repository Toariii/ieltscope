import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Target,
} from "lucide-react";
import Link from "next/link";

import styles from "./study-plan.module.css";
import type { PlanSkill, StudyPlanView } from "./study-plan-data";

const priorityCopy: Record<PlanSkill["priority"], string> = {
  highest: "优先突破",
  high: "重点训练",
  steady: "稳定保持",
};

function score(value: number | null) {
  return value === null ? "--" : value.toFixed(1);
}

function hours(minutes: number | null) {
  return minutes === null ? "--" : `${Math.round((minutes / 60) * 10) / 10}h`;
}

export function StudyPlan({ view }: { view: StudyPlanView }) {
  if (view.state !== "ready") {
    return (
      <div className={styles.plan}>
        <section className={styles.emptyHero}>
          <div className={styles.heroIcon}>
            <Clock3 aria-hidden="true" />
          </div>
          <p>学习计划</p>
          <h1>等待诊断报告生成后再安排计划</h1>
          <span>
            IELTScope 会先读取你的目标档案和四科诊断估分，再生成每科目标、训练优先级和本周任务。这样计划不会只依赖手动填写的历史成绩。
          </span>
          <div className={styles.heroActions}>
            <Link href="/assessment">
              查看诊断状态
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/report" className={styles.secondaryAction}>
              查看报告
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const topPriority = [...view.skills].sort((a, b) => b.gap - a.gap)[0];

  return (
    <div className={styles.plan} id="plan-top">
      <header className={styles.hero}>
        <div>
          <div className={styles.heroIcon}>
            <Target aria-hidden="true" />
          </div>
          <p>学习计划</p>
          <h1>{view.studentName}的第一阶段备考路径</h1>
          <span>
            这是基于当前诊断报告生成的规则版计划壳。正式版本会接入 AI 计划生成、教师校准和题库完成度，动态调整每天任务。
          </span>
          <div className={styles.heroActions}>
            <a href="#week-plan">
              查看本周任务
              <ArrowRight aria-hidden="true" />
            </a>
            <Link href="/report" className={styles.secondaryAction}>
              回到诊断报告
            </Link>
          </div>
        </div>
        <aside className={styles.heroStats} aria-label="计划核心指标">
          <div>
            <span>目标总分</span>
            <strong>{score(view.targetOverall)}</strong>
          </div>
          <div>
            <span>当前均值</span>
            <strong>{score(view.overallCurrent)}</strong>
          </div>
          <div>
            <span>每周投入</span>
            <strong>{hours(view.weeklyMinutes)}</strong>
          </div>
          <div>
            <span>距离考试</span>
            <strong>{view.daysToExam ?? "--"} 天</strong>
          </div>
        </aside>
      </header>

      <main className={styles.grid}>
        <section className={styles.summary} aria-labelledby="plan-summary-title">
          <div className={styles.sectionHeading}>
            <p>目标拆解</p>
            <h2 id="plan-summary-title">先把分数差距变成训练比例</h2>
          </div>
          <div className={styles.summaryCards}>
            <article>
              <BarChart3 aria-hidden="true" />
              <span>总分差距</span>
              <strong>{score(view.overallGap)}</strong>
              <small>{view.sourceLabel}</small>
            </article>
            <article>
              <CalendarDays aria-hidden="true" />
              <span>考试日期</span>
              <strong>{view.targetExamDate ?? "待确认"}</strong>
              <small>计划会按剩余天数压缩或放缓</small>
            </article>
            <article>
              <CheckCircle2 aria-hidden="true" />
              <span>最高优先级</span>
              <strong>{topPriority?.label ?? "--"}</strong>
              <small>{topPriority ? `差距 ${topPriority.gap.toFixed(1)} 分` : "等待估分"}</small>
            </article>
          </div>
        </section>

        <section className={styles.skillSection} aria-labelledby="plan-skill-title">
          <div className={styles.sectionHeading}>
            <p>四科计划</p>
            <h2 id="plan-skill-title">每科目标与本周投入</h2>
          </div>
          <div className={styles.skillGrid}>
            {view.skills.map((skill) => (
              <article key={skill.id} className={styles[skill.priority]}>
                <div className={styles.skillHeader}>
                  <span>{skill.label}</span>
                  <em>{priorityCopy[skill.priority]}</em>
                </div>
                <strong>
                  {skill.current.toFixed(1)}
                  <ArrowRight aria-hidden="true" />
                  {skill.target.toFixed(1)}
                </strong>
                <small>本周建议 {skill.weeklyMinutes} 分钟 · 差距 {skill.gap.toFixed(1)} 分</small>
                <p>{skill.focus}</p>
                <ul>
                  {skill.taskTypes.map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.weekSection} id="week-plan" aria-labelledby="week-plan-title">
          <div className={styles.sectionHeading}>
            <p>第一周</p>
            <h2 id="week-plan-title">本周任务安排</h2>
          </div>
          <ol className={styles.taskList}>
            {view.weekTasks.map((task) => (
              <li key={task.id}>
                <span>{task.day}</span>
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.skill} · {task.detail}</p>
                </div>
                <small>{task.minutes} 分钟</small>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.dataNote} aria-labelledby="plan-data-title">
          <FileText aria-hidden="true" />
          <div>
            <h2 id="plan-data-title">当前计划如何生成</h2>
            <p>
              这一版先用诊断估分、目标总分、单科最低要求和每周可投入时间生成。历史成绩仍只作为背景，不直接决定任务比例；后续会加入题型表现、写作口语批改记录和老师校准。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
