"use client";

import {
  ArrowRight,
  BookOpenText,
  FilePenLine,
  Headphones,
  Mic2,
  NotebookTabs,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  resourceCatalog,
  resourceTabs,
  type PracticeItem,
  type ResourceTab,
  type SpeakingTopic,
  type VocabularyBand,
  type VocabularyEntry,
  type WritingPrompt,
} from "./resource-catalog";
import styles from "./resource-center.module.css";

const tabIcons = {
  vocabulary: BookOpenText,
  practice: Headphones,
  speaking: Mic2,
  writing: FilePenLine,
} as const;

const bandOptions: Array<"all" | VocabularyBand> = ["all", "6", "6.5", "7+"];
const practiceSkillOptions = ["all", "listening", "reading"] as const;
const speakingCategories = ["all", "Place", "People", "Media", "Abstract & Object", "Event"] as const;
const writingTaskTypes = ["all", "Task 1", "Task 2"] as const;

function includesQuery(values: string[], query: string) {
  if (!query) return true;
  return values.join(" ").toLowerCase().includes(query.toLowerCase());
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? styles.activeFilter : ""} onClick={onClick}>
      {children}
    </button>
  );
}

function VocabularyCard({ item }: { item: VocabularyEntry }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span>Band {item.band}</span>
        <strong>{item.word}</strong>
      </div>
      <p>{item.meaning}</p>
      <dl className={styles.detailList}>
        <div>
          <dt>近义词</dt>
          <dd>{item.synonyms.join(" / ")}</dd>
        </div>
        <div>
          <dt>反义词</dt>
          <dd>{item.antonyms.join(" / ")}</dd>
        </div>
        <div>
          <dt>搭配</dt>
          <dd>{item.collocations.join("；")}</dd>
        </div>
      </dl>
      <blockquote>{item.examExample}</blockquote>
      <small>{item.usageNote}</small>
    </article>
  );
}

function PracticeCard({ item }: { item: PracticeItem }) {
  const skillLabel = item.skill === "listening" ? "听力" : "阅读";
  const Icon = item.skill === "listening" ? Headphones : NotebookTabs;
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span>{skillLabel} · Band {item.difficulty}</span>
        <strong>{item.title}</strong>
      </div>
      <p>{item.objective}</p>
      <div className={styles.metaLine}>
        <Icon aria-hidden="true" />
        <span>{item.questionType}</span>
        <span>{item.durationMinutes} 分钟</span>
      </div>
      <dl className={styles.detailList}>
        <div>
          <dt>拿分策略</dt>
          <dd>{item.scoringTip}</dd>
        </div>
        <div>
          <dt>训练样例</dt>
          <dd>{item.sampleTask}</dd>
        </div>
      </dl>
      <small>{item.rightsNote}</small>
    </article>
  );
}

function SpeakingCard({ item }: { item: SpeakingTopic }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span>{item.category}</span>
        <strong>{item.title}</strong>
      </div>
      <p>{item.part2Prompt}</p>
      <dl className={styles.detailList}>
        <div>
          <dt>可串联话题</dt>
          <dd>{item.linkedTopics.join("；")}</dd>
        </div>
        <div>
          <dt>关键词</dt>
          <dd>{item.keyWords.join(" / ")}</dd>
        </div>
        <div>
          <dt>意群</dt>
          <dd>{item.ideaChunks.join(" → ")}</dd>
        </div>
      </dl>
      <blockquote>{item.sampleOpening}</blockquote>
    </article>
  );
}

function WritingCard({ item }: { item: WritingPrompt }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span>{item.year} · {item.taskType} · 目标 {item.targetBand}</span>
        <strong>{item.title}</strong>
      </div>
      <p>{item.prompt}</p>
      <ol className={styles.logicChain}>
        {item.logicChain.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className={styles.warningBox}>
        <strong>常见失分点</strong>
        <span>{item.commonPitfall}</span>
      </div>
      <small>{item.rightsNote}</small>
    </article>
  );
}

export function ResourceCenter({ initialTab = "vocabulary" }: { initialTab?: ResourceTab }) {
  const [activeTab, setActiveTab] = useState<ResourceTab>(initialTab);
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<"all" | VocabularyBand>("all");
  const [practiceSkill, setPracticeSkill] = useState<(typeof practiceSkillOptions)[number]>("all");
  const [speakingCategory, setSpeakingCategory] = useState<(typeof speakingCategories)[number]>("all");
  const [writingTaskType, setWritingTaskType] = useState<(typeof writingTaskTypes)[number]>("all");

  const filteredVocabulary = useMemo(
    () =>
      resourceCatalog.vocabulary.filter(
        (item) =>
          (band === "all" || item.band === band) &&
          includesQuery(
            [
              item.word,
              item.meaning,
              ...item.synonyms,
              ...item.antonyms,
              ...item.collocations,
              item.examExample,
              item.usageNote,
            ],
            query,
          ),
      ),
    [band, query],
  );

  const filteredPractice = useMemo(
    () =>
      resourceCatalog.practice.filter(
        (item) =>
          (practiceSkill === "all" || item.skill === practiceSkill) &&
          includesQuery(
            [item.title, item.questionType, item.objective, item.scoringTip, item.sampleTask],
            query,
          ),
      ),
    [practiceSkill, query],
  );

  const filteredSpeaking = useMemo(
    () =>
      resourceCatalog.speaking.filter(
        (item) =>
          (speakingCategory === "all" || item.category === speakingCategory) &&
          includesQuery(
            [
              item.title,
              item.part2Prompt,
              ...item.linkedTopics,
              ...item.keyWords,
              ...item.ideaChunks,
              item.sampleOpening,
            ],
            query,
          ),
      ),
    [speakingCategory, query],
  );

  const filteredWriting = useMemo(
    () =>
      resourceCatalog.writing.filter(
        (item) =>
          (writingTaskType === "all" || item.taskType === writingTaskType) &&
          includesQuery(
            [item.title, item.prompt, ...item.logicChain, item.commonPitfall, String(item.year)],
            query,
          ),
      ),
    [query, writingTaskType],
  );

  const counts = {
    vocabulary: filteredVocabulary.length,
    practice: filteredPractice.length,
    speaking: filteredSpeaking.length,
    writing: filteredWriting.length,
  } satisfies Record<ResourceTab, number>;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p>资源中心 Alpha</p>
          <h1>把备考资料拆成可搜索、可训练、可扩展的模块</h1>
          <span>
            当前先用原创示例搭建完整框架。正式资料库会继续接入分级词汇、题型训练、口语当季题库和写作去重题库。
          </span>
        </div>
        <div className={styles.heroStats} aria-label="资源概览">
          <strong>{resourceCatalog.vocabulary.length + resourceCatalog.practice.length + resourceCatalog.speaking.length + resourceCatalog.writing.length}</strong>
          <span>Alpha 条目</span>
          <small>后续支持批量导入与版权标注</small>
        </div>
      </header>

      <section className={styles.toolbar} aria-label="资源筛选">
        <div className={styles.searchBox}>
          <Search aria-hidden="true" />
          <input
            type="search"
            aria-label="搜索资源"
            value={query}
            placeholder="搜索单词、题型、话题或写作逻辑"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className={styles.filterSummary}>
          <SlidersHorizontal aria-hidden="true" />
          <span>当前显示 {counts[activeTab]} 条</span>
        </div>
      </section>

      <nav className={styles.tabs} aria-label="资源类型">
        {resourceTabs.map((tab) => {
          const Icon = tabIcons[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? styles.activeTab : ""}
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon aria-hidden="true" />
              <strong>{tab.label}</strong>
              <small>{tab.description}</small>
            </button>
          );
        })}
      </nav>

      {activeTab === "vocabulary" ? (
        <section className={styles.section} aria-labelledby="vocabulary-title">
          <div className={styles.sectionHeading}>
            <div>
              <p>Vocabulary</p>
              <h2 id="vocabulary-title">分级词汇</h2>
            </div>
            <div className={styles.filters} aria-label="词汇分数段">
              {bandOptions.map((option) => (
                <FilterButton key={option} active={band === option} onClick={() => setBand(option)}>
                  {option === "all" ? "全部" : option}
                </FilterButton>
              ))}
            </div>
          </div>
          <div className={styles.cardGrid}>
            {filteredVocabulary.map((item) => <VocabularyCard key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}

      {activeTab === "practice" ? (
        <section className={styles.section} aria-labelledby="practice-title">
          <div className={styles.sectionHeading}>
            <div>
              <p>Listening / Reading</p>
              <h2 id="practice-title">题型训练</h2>
            </div>
            <div className={styles.filters} aria-label="题型科目">
              {practiceSkillOptions.map((option) => (
                <FilterButton
                  key={option}
                  active={practiceSkill === option}
                  onClick={() => setPracticeSkill(option)}
                >
                  {option === "all" ? "全部" : option === "listening" ? "听力" : "阅读"}
                </FilterButton>
              ))}
            </div>
          </div>
          <div className={styles.cardGrid}>
            {filteredPractice.map((item) => <PracticeCard key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}

      {activeTab === "speaking" ? (
        <section className={styles.section} aria-labelledby="speaking-title">
          <div className={styles.sectionHeading}>
            <div>
              <p>Speaking</p>
              <h2 id="speaking-title">当季口语话题</h2>
            </div>
            <div className={styles.filters} aria-label="口语分类">
              {speakingCategories.map((option) => (
                <FilterButton
                  key={option}
                  active={speakingCategory === option}
                  onClick={() => setSpeakingCategory(option)}
                >
                  {option === "all" ? "全部" : option}
                </FilterButton>
              ))}
            </div>
          </div>
          <div className={styles.cardGrid}>
            {filteredSpeaking.map((item) => <SpeakingCard key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}

      {activeTab === "writing" ? (
        <section className={styles.section} aria-labelledby="writing-title">
          <div className={styles.sectionHeading}>
            <div>
              <p>Writing</p>
              <h2 id="writing-title">写作题库与逻辑链</h2>
            </div>
            <div className={styles.filters} aria-label="写作任务类型">
              {writingTaskTypes.map((option) => (
                <FilterButton
                  key={option}
                  active={writingTaskType === option}
                  onClick={() => setWritingTaskType(option)}
                >
                  {option === "all" ? "全部" : option}
                </FilterButton>
              ))}
            </div>
          </div>
          <div className={styles.cardGrid}>
            {filteredWriting.map((item) => <WritingCard key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}

      <footer className={styles.nextStep}>
        <div>
          <strong>下一步会接入训练动作</strong>
          <span>词汇打卡、题型作答记录、口语串题生成和写作模拟入口会继续从这里展开。</span>
        </div>
        <a href="/plan">
          回到学习计划
          <ArrowRight aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
