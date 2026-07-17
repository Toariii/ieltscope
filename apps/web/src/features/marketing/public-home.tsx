"use client";

import {
  Activity,
  ArrowRight,
  AudioLines,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  FilePenLine,
  Menu,
  Mic2,
  RefreshCcw,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

import styles from "./public-home.module.css";

type DemoMode = "writing" | "speaking";
type ToolId = "diagnostic" | "writing" | "speaking" | "plan" | "practice";
type WorkflowStep = {
  label: string;
  tool: ToolId;
  icon: typeof Target;
};

const waveform = [
  18, 32, 22, 48, 30, 56, 38, 68, 42, 26, 52, 72, 46, 30, 20, 44, 62, 34, 54, 76, 42,
  28, 50, 64, 36, 22, 46, 58, 32, 44, 66, 38, 24,
];

const tools: Record<
  ToolId,
  {
    label: string;
    title: string;
    description: string;
    stat: string;
    icon: typeof Target;
    image: string;
    imageAlt: string;
  }
> = {
  diagnostic: {
    label: "首次诊断",
    title: "先判断真实起点，再拆解目标分数",
    description: "结合考试记录或首次能力筛查，形成四科估分区间、置信度和优先修复项。",
    stat: "约 60 分钟完成四科筛查",
    icon: CircleGauge,
    image: "/images/marketing/generated/feature-diagnostic-modern.webp",
    imageAlt: "学生在现代学习舱完成英语能力诊断",
  },
  writing: {
    label: "写作精批",
    title: "按四项评分标准，逐句定位问题",
    description: "区分必须改、建议改与可升级表达，并通过二次提交查看修改是否有效。",
    stat: "Task 1 与 Task 2 分开建模",
    icon: FilePenLine,
    image: "/images/marketing/generated/feature-writing-modern.webp",
    imageAlt: "学生与教师在现代教研空间复盘写作反馈",
  },
  speaking: {
    label: "口语精批",
    title: "语言内容与语音表现双通道分析",
    description: "同时检查流利度、词汇、语法、发音、停顿、重音和语调，不只依赖转写文本。",
    stat: "支持原音回听与分段重录",
    icon: Mic2,
    image: "/images/marketing/generated/feature-speaking-modern-v2.webp",
    imageAlt: "学生在专业学习空间进行英语口语练习",
  },
  plan: {
    label: "动态计划",
    title: "每一次练习都会更新下一步安排",
    description: "系统根据正确率、用时、批改结果、完成率和剩余备考时间重新计算任务。",
    stat: "按周调整，异常进度即时反馈",
    icon: CalendarRange,
    image: "/images/marketing/generated/feature-plan-modern.webp",
    imageAlt: "学生在现代书房查看进度并调整备考计划",
  },
  practice: {
    label: "专项训练",
    title: "把卡分问题转成可以完成的训练",
    description: "覆盖词汇、听力、阅读、写作和口语题型训练，每项任务都有预计用时和完成条件。",
    stat: "从能力标签直达对应练习",
    icon: BookOpenCheck,
    image: "/images/marketing/generated/feature-practice-modern.webp",
    imageAlt: "学生在现代学习中心进行雅思专项训练",
  },
};

const toolOrder = Object.keys(tools) as ToolId[];

const workflowSteps: WorkflowStep[] = [
  { label: "诊断", tool: "diagnostic", icon: BrainCircuit },
  { label: "精批", tool: "writing", icon: Sparkles },
  { label: "复练", tool: "practice", icon: RefreshCcw },
  { label: "更新计划", tool: "plan", icon: CalendarRange },
];

export function PublicHome() {
  const [demoMode, setDemoMode] = useState<DemoMode>("writing");
  const [activeTool, setActiveTool] = useState<ToolId>("writing");
  const [menuOpen, setMenuOpen] = useState(false);
  const ActiveToolIcon = tools[activeTool].icon;
  const activeToolIndex = toolOrder.indexOf(activeTool);

  function moveTool(direction: -1 | 1) {
    const nextIndex = (activeToolIndex + direction + toolOrder.length) % toolOrder.length;
    setActiveTool(toolOrder[nextIndex]);
  }

  function showWorkflowTool(tool: ToolId) {
    setActiveTool(tool);
    if (tool === "writing") {
      setDemoMode("writing");
    }
    const toolsSection = document.getElementById("tools");
    if (typeof toolsSection?.scrollIntoView === "function") {
      toolsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="IELTScope 首页">
          <span className={styles.brandName}>IELT<span>Scope</span></span>
          <small>AI 雅思提分系统</small>
        </a>

        <button
          className={styles.menuButton}
          type="button"
          aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`} aria-label="主导航">
          <a href="#tools" onClick={() => setMenuOpen(false)}>产品能力</a>
          <a href="#method" onClick={() => setMenuOpen(false)}>评分方法</a>
          <a href="#path" onClick={() => setMenuOpen(false)}>学习路径</a>
        </nav>

        <div className={styles.authActions}>
          <Link href="/login">登录</Link>
          <Link className={styles.primarySmall} href="/register">免费注册</Link>
        </div>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>教师校准 · 动态计划 · 精细批改</p>
          <h1>IELTScope</h1>
          <h2>一个工作台，完成诊断、训练与精批</h2>
          <p className={styles.lead}>为目标 6–8 分的学术类雅思学生设计。看清卡分原因，把每个问题变成下一步训练。</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/register">
              免费开始诊断 <ArrowRight aria-hidden="true" />
            </Link>
            <a className={styles.secondaryAction} href="#tools">进入功能预览</a>
          </div>
          <p className={styles.betaNote}>当前为封闭测试阶段，AI 估分仅作学习参考</p>
        </div>

        <div className={styles.productScene} aria-label="写作与口语精批功能演示">
          <div className={styles.modeTabs} role="tablist" aria-label="精批类型">
            <button
              role="tab"
              aria-selected={demoMode === "writing"}
              className={demoMode === "writing" ? styles.modeActive : ""}
              onClick={() => setDemoMode("writing")}
            >
              <FilePenLine aria-hidden="true" /> 写作精批
            </button>
            <button
              role="tab"
              aria-selected={demoMode === "speaking"}
              className={demoMode === "speaking" ? styles.modeActive : ""}
              onClick={() => setDemoMode("speaking")}
            >
              <Mic2 aria-hidden="true" /> 口语精批
            </button>
          </div>

          <div className={styles.demoViewport} aria-live="polite">
            {demoMode === "writing" ? <WritingDemo /> : <SpeakingDemo />}
          </div>
        </div>

        <div className={styles.workflowRibbon} id="path" aria-label="学习闭环">
          {workflowSteps.map(({ label, tool, icon: Icon }, index) => (
            <button
              className={activeTool === tool ? styles.workflowCurrent : ""}
              key={label}
              type="button"
              onClick={() => showWorkflowTool(tool)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {index < 3 ? <ChevronRight aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.toolsSection} id="tools" aria-labelledby="tools-heading">
        <div className={styles.carouselHeading}>
          <div className={styles.sectionIntro}>
            <p>产品能力</p>
            <h2 id="tools-heading">核心工具，围绕真实提分闭环</h2>
            <span>每个工具都连接真实学习记录、能力标签与下一步任务。</span>
          </div>
          <div className={styles.carouselControls}>
            <span>{String(activeToolIndex + 1).padStart(2, "0")} / {String(toolOrder.length).padStart(2, "0")}</span>
            <button type="button" aria-label="上一个功能" onClick={() => moveTool(-1)}>
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" aria-label="下一个功能" onClick={() => moveTool(1)}>
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className={styles.featureCarousel} aria-live="polite">
          <div className={styles.featureMedia} key={`${activeTool}-image`}>
            <Image
              src={tools[activeTool].image}
              alt={tools[activeTool].imageAlt}
              fill
              priority={activeTool === "writing"}
              sizes="(max-width: 820px) 100vw, 48vw"
            />
          </div>
          <div className={styles.featureContent} key={`${activeTool}-content`}>
            <div className={styles.toolCopy}>
              <ActiveToolIcon aria-hidden="true" />
              <p>{tools[activeTool].label}</p>
              <h3>{tools[activeTool].title}</h3>
              <span>{tools[activeTool].description}</span>
              <strong><Check aria-hidden="true" /> {tools[activeTool].stat}</strong>
            </div>
            <ToolPreview activeTool={activeTool} />
          </div>
        </div>

        <div className={styles.toolTabs} role="tablist" aria-label="核心工具">
          {toolOrder.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTool === id}
              className={activeTool === id ? styles.toolActive : ""}
              onClick={() => setActiveTool(id)}
            >
              {tools[id].label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.methodSection} id="method" aria-labelledby="method-heading">
        <div className={styles.methodCopy}>
          <p>评分方法</p>
          <h2 id="method-heading">写作与口语各按四项标准分别判断</h2>
          <div className={styles.criteriaSummary}>
            <p>写作：任务回应、连贯、词汇、语法</p>
            <p>口语：流利度、词汇、语法、发音</p>
          </div>
          <span>每一项先分别评分，再形成综合结果；遇到边界分数或判断分歧时进入复核。</span>
          <a href="#tools">了解精批流程 <ArrowRight aria-hidden="true" /></a>
        </div>
        <div className={styles.methodMetrics}>
          <div><Activity aria-hidden="true" /><span>分项标准</span><strong>四项标准分别评分</strong></div>
          <div><Target aria-hidden="true" /><span>结果范围</span><strong>区间呈现评分边界，尽可能贴近真实水平</strong></div>
          <div><BrainCircuit aria-hidden="true" /><span>可信度校验</span><strong>规则、教师样本与模型结果越一致，可信度越高</strong></div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p>准备开始？</p>
          <h2>先看清当前水平，再决定怎么练</h2>
        </div>
        <Link href="/register">免费创建备考档案 <ArrowRight aria-hidden="true" /></Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.brand}>
          <span className={styles.brandName}>IELT<span>Scope</span></span>
          <small>AI 雅思提分系统</small>
        </div>
        <p>面向学术类雅思备考。AI 估分不等同官方考试成绩。</p>
        <div><a href="#top">返回顶部</a><Link href="/login">登录</Link></div>
      </footer>
    </main>
  );
}

function WritingDemo() {
  return (
    <div className={styles.writingDemo}>
      <div className={styles.essayPane}>
        <div className={styles.demoHeader}><span>Task 2 · Student draft</span><strong>Band 6 → 6.5</strong></div>
        <p className={styles.topicLine}>
          Topic: Can online courses replace traditional classrooms?
        </p>
        <p>
          Nowadays, many students choose online courses because{" "}
          <span className={styles.errorPhrase}>they can study more flexible</span>
          {" "}and save time on travelling. I partly agree that this method is useful,
          but it{" "}
          <span className={styles.errorPhrase}>also bring some problems</span>.
        </p>
        <p className={styles.mutedParagraph}>
          If students learn at home for a long time, they may lose motivation because
          there are no teachers or classmates around them.
        </p>
        <div className={styles.annotationList} aria-label="写作句子批改示例">
          <div className={styles.annotationLine}>
            <span>语法</span>
            <del>study more flexible</del>
            <ins>study more flexibly</ins>
          </div>
          <div className={styles.annotationLine}>
            <span>主谓一致</span>
            <del>also bring</del>
            <ins>also brings</ins>
          </div>
        </div>
      </div>
      <aside className={styles.feedbackPane}>
        <p>初步估分 <strong>6.0</strong><small>修改后目标 6.5</small></p>
        <h3>写作批改详情</h3>
        <div className={styles.feedbackItem}><span>必须修改</span><strong>副词与主谓一致错误</strong><p>先修正会直接影响语法准确性的基础错误。</p></div>
        <div className={styles.feedbackItem}><span>建议展开</span><strong>第二句需要解释“问题”</strong><p>补一句原因或例子，把观点从判断推进到论证。</p></div>
        <button type="button">查看批改详情 <ArrowRight aria-hidden="true" /></button>
      </aside>
    </div>
  );
}

function SpeakingDemo() {
  return (
    <div className={styles.speakingDemo}>
      <div className={styles.speakingMain}>
        <div className={styles.demoHeader}><span>Part 2 · A useful place</span><strong>01:42</strong></div>
        <div className={styles.waveform} aria-label="口语录音波形">
          {waveform.map((height, index) => <i key={index} style={{ height }} />)}
        </div>
        <div className={styles.timeline}><span>开场</span><span>经历</span><span>细节</span><span>总结</span></div>
        <div className={styles.speechNote}>
          <AudioLines aria-hidden="true" />
          <div><strong>停顿与节奏分析</strong><p>中段连续两次长停顿，建议按意群重录 32–48 秒。</p></div>
        </div>
      </div>
      <aside className={styles.feedbackPane}>
        <p>初步估分 <strong>5.5–6.0</strong><small>置信度 78%</small></p>
        <h3>口语批改详情</h3>
        {["流利度与连贯性 5.5", "词汇资源 6.0", "语法范围与准确性 5.5", "发音 6.0"].map((item) => (
          <div className={styles.scoreRow} key={item}><span>{item}</span><BarChart3 aria-hidden="true" /></div>
        ))}
        <button type="button">查看批改详情 <ArrowRight aria-hidden="true" /></button>
      </aside>
    </div>
  );
}

function ToolPreview({ activeTool }: { activeTool: ToolId }) {
  const labels: Record<ToolId, string[]> = {
    diagnostic: ["听力 6.5", "阅读 6.0", "写作 5.5", "口语 5.5"],
    writing: ["任务回应 6.0", "连贯衔接 5.5", "词汇资源 6.0", "语法 5.5"],
    speaking: ["流利度 5.5", "词汇 6.0", "语法 5.5", "发音 6.0"],
    plan: ["判断题专项 · 35分钟", "Task 2 · 40分钟", "Part 2 重录 · 20分钟"],
    practice: ["词汇搭配", "听力填空", "阅读判断", "写作论证"],
  };

  return (
    <div className={styles.toolPreview}>
      <div className={styles.previewTop}><span>实时能力视图</span><small>模拟数据</small></div>
      {labels[activeTool].map((label, index) => (
        <div className={styles.previewRow} key={label}>
          <span>{label}</span>
          <i><b style={{ width: `${54 + index * 9}%` }} /></i>
          <small>{index === 0 ? "优先" : "进行中"}</small>
        </div>
      ))}
    </div>
  );
}
