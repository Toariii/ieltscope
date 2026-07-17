export type ResourceTab = "vocabulary" | "practice" | "speaking" | "writing";

export type VocabularyBand = "6" | "6.5" | "7+";

export type VocabularyEntry = {
  id: string;
  band: VocabularyBand;
  word: string;
  meaning: string;
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  examExample: string;
  usageNote: string;
};

export type PracticeItem = {
  id: string;
  skill: "listening" | "reading";
  questionType: string;
  title: string;
  difficulty: VocabularyBand;
  durationMinutes: number;
  objective: string;
  scoringTip: string;
  sampleTask: string;
  rightsNote: string;
};

export type SpeakingTopic = {
  id: string;
  category: "Place" | "People" | "Media" | "Abstract & Object" | "Event";
  title: string;
  part2Prompt: string;
  linkedTopics: string[];
  keyWords: string[];
  ideaChunks: string[];
  sampleOpening: string;
};

export type WritingPrompt = {
  id: string;
  year: number;
  taskType: "Task 1" | "Task 2";
  title: string;
  prompt: string;
  logicChain: string[];
  commonPitfall: string;
  targetBand: "6.5" | "7";
  rightsNote: string;
};

export type ResourceCatalog = {
  vocabulary: VocabularyEntry[];
  practice: PracticeItem[];
  speaking: SpeakingTopic[];
  writing: WritingPrompt[];
};

export const resourceTabs: Array<{ id: ResourceTab; label: string; description: string }> = [
  {
    id: "vocabulary",
    label: "雅思真词汇",
    description: "按 6 / 6.5 / 7+ 分层，强调同反义、搭配和真题语境里的使用方式。",
  },
  {
    id: "practice",
    label: "听力阅读题型",
    description: "先按题型与拿分策略组织训练入口，后续接入剑雅与授权材料。",
  },
  {
    id: "speaking",
    label: "当季口语题库",
    description: "按 Place、People、Media、Abstract & Object、Event 分类串联 Part 2 / Part 3。",
  },
  {
    id: "writing",
    label: "写作题库",
    description: "覆盖 Task 1 / Task 2 的题型、万能逻辑链和常见失分点。",
  },
];

export const resourceCatalog: ResourceCatalog = {
  vocabulary: [
    {
      id: "vocab-6-flexible",
      band: "6",
      word: "flexible",
      meaning: "灵活的；可调整的",
      synonyms: ["adaptable", "adjustable"],
      antonyms: ["rigid", "inflexible"],
      collocations: ["flexible working hours", "a flexible approach"],
      examExample:
        "Online courses give students a more flexible schedule, but they may reduce face-to-face interaction.",
      usageNote: "写作中不要写成 study more flexible，应使用副词 flexibly。",
    },
    {
      id: "vocab-6-impact",
      band: "6",
      word: "impact",
      meaning: "影响；冲击",
      synonyms: ["effect", "influence"],
      antonyms: ["irrelevance"],
      collocations: ["a positive impact on", "minimise the impact of"],
      examExample:
        "The rising cost of housing has a direct impact on young people's career choices.",
      usageNote: "impact 可作名词和动词；写作里更稳妥的搭配是 have an impact on。",
    },
    {
      id: "vocab-65-sustainable",
      band: "6.5",
      word: "sustainable",
      meaning: "可持续的；能够长期维持的",
      synonyms: ["long-term", "eco-friendly"],
      antonyms: ["unsustainable", "short-lived"],
      collocations: ["sustainable development", "a sustainable solution"],
      examExample:
        "A sustainable transport system should be affordable, reliable and environmentally friendly.",
      usageNote: "不要只理解成环保；也可以表示某方案能否长期维持。",
    },
    {
      id: "vocab-65-allocate",
      band: "6.5",
      word: "allocate",
      meaning: "分配；拨出",
      synonyms: ["assign", "distribute"],
      antonyms: ["withhold", "misallocate"],
      collocations: ["allocate funding to", "allocate time for revision"],
      examExample:
        "Governments should allocate more funding to preventive healthcare.",
      usageNote: "比 give money to 更正式，适合教育、医疗、政府支出类题目。",
    },
    {
      id: "vocab-7-nuanced",
      band: "7+",
      word: "nuanced",
      meaning: "有细微差别的；考虑周全的",
      synonyms: ["subtle", "balanced"],
      antonyms: ["simplistic", "one-sided"],
      collocations: ["a nuanced view", "a nuanced understanding"],
      examExample:
        "A nuanced view is needed because technology can both widen access and create new inequalities.",
      usageNote: "适合用在让观点显得不绝对的让步段或结尾段。",
    },
    {
      id: "vocab-7-prevalent",
      band: "7+",
      word: "prevalent",
      meaning: "普遍存在的；盛行的",
      synonyms: ["widespread", "common"],
      antonyms: ["rare", "uncommon"],
      collocations: ["a prevalent belief", "be prevalent among young adults"],
      examExample:
        "Remote working has become increasingly prevalent among office workers.",
      usageNote: "比 very common 更正式，适合趋势类和社会现象类作文。",
    },
  ],
  practice: [
    {
      id: "practice-listening-form-completion",
      skill: "listening",
      questionType: "Form Completion",
      title: "信息表填空：数字、拼写与限定词",
      difficulty: "6",
      durationMinutes: 18,
      objective: "训练听前预测词性、识别转折修正和检查单复数。",
      scoringTip: "先锁定姓名、日期、金额、地点等高频空；听到改口时以后出现的信息为准。",
      sampleTask: "听一段课程咨询对话，填写报名表中的课程时间、费用和联系人。",
      rightsNote: "原创 Alpha 训练结构；正式题目需接入原创或授权音频。",
    },
    {
      id: "practice-listening-map",
      skill: "listening",
      questionType: "Map Labelling",
      title: "地图题：方向词与参照物定位",
      difficulty: "6.5",
      durationMinutes: 20,
      objective: "训练 entrance / opposite / next to / at the far end 等空间关系。",
      scoringTip: "先标出入口、道路、固定建筑；听到 now / then / after that 时跟随移动路线。",
      sampleTask: "根据校园导览音频，标注 library、student centre 和 sports hall。",
      rightsNote: "原创 Alpha 训练结构；正式题目需接入原创或授权音频。",
    },
    {
      id: "practice-reading-tfng",
      skill: "reading",
      questionType: "True / False / Not Given",
      title: "判断题：原文定位与范围控制",
      difficulty: "6",
      durationMinutes: 22,
      objective: "区分 contradict、support 和 not mentioned，减少靠常识做题。",
      scoringTip: "题干出现绝对词、比较级、因果关系时，必须回原文找同等强度表达。",
      sampleTask: "阅读一段关于城市交通政策的文章，判断 8 个陈述是否与原文一致。",
      rightsNote: "原创 Alpha 训练结构；正式文章需接入原创或授权文本。",
    },
    {
      id: "practice-reading-heading",
      skill: "reading",
      questionType: "Matching Headings",
      title: "段落标题匹配：功能句与干扰项",
      difficulty: "7+",
      durationMinutes: 25,
      objective: "训练段首转折、研究目的、例子功能和概括范围。",
      scoringTip: "不要被段落里的某个名词牵走；标题要概括整段功能，而不是某一句细节。",
      sampleTask: "阅读一篇关于儿童语言习得的文章，为 6 个段落选择标题。",
      rightsNote: "原创 Alpha 训练结构；正式文章需接入原创或授权文本。",
    },
  ],
  speaking: [
    {
      id: "speaking-place-study-room",
      category: "Place",
      title: "A quiet place where you like to study",
      part2Prompt: "Describe a quiet place where you like to study.",
      linkedTopics: ["A place you often visit", "A place where you feel relaxed", "A useful public place"],
      keyWords: ["quiet", "focus", "routine", "accessible"],
      ideaChunks: ["location + when you go", "what the place looks like", "why it helps concentration"],
      sampleOpening:
        "I would like to talk about a small study room near my office, which has gradually become part of my weekday routine.",
    },
    {
      id: "speaking-people-organised",
      category: "People",
      title: "A person who is good at organising things",
      part2Prompt: "Describe a person you know who is good at organising things.",
      linkedTopics: ["A helpful person", "A colleague/classmate", "Someone you admire"],
      keyWords: ["reliable", "prioritise", "coordinate", "deadline"],
      ideaChunks: ["who the person is", "what they organised", "what you learned from them"],
      sampleOpening:
        "The person that comes to mind is my former classmate, because she could turn a messy group project into a clear checklist.",
    },
    {
      id: "speaking-media-documentary",
      category: "Media",
      title: "A documentary you watched",
      part2Prompt: "Describe a documentary you watched that taught you something.",
      linkedTopics: ["A film you enjoyed", "Something you learned online", "A topic you became interested in"],
      keyWords: ["informative", "memorable", "visual evidence", "raise awareness"],
      ideaChunks: ["where you watched it", "what it was about", "why it changed your opinion"],
      sampleOpening:
        "I recently watched a short documentary about food waste, and it was memorable because it used ordinary families as examples.",
    },
    {
      id: "speaking-object-app",
      category: "Abstract & Object",
      title: "An app that is useful to you",
      part2Prompt: "Describe an app or tool that is useful in your daily life.",
      linkedTopics: ["A technology you use", "A habit you developed", "Something that saves time"],
      keyWords: ["efficient", "track progress", "reminder", "personalised"],
      ideaChunks: ["what the app does", "how often you use it", "why it improves your routine"],
      sampleOpening:
        "I want to describe a planning app that I use almost every day, mainly because it helps me break big tasks into smaller steps.",
    },
    {
      id: "speaking-event-late",
      category: "Event",
      title: "A time when you were late",
      part2Prompt: "Describe a time when you were late for something important.",
      linkedTopics: ["A difficult experience", "A mistake you made", "An event that changed your habit"],
      keyWords: ["unexpected", "traffic", "apologise", "lesson"],
      ideaChunks: ["what happened", "why you were late", "how you solved it"],
      sampleOpening:
        "I remember being late for an interview once, and although it was stressful, it taught me to leave a proper buffer.",
    },
  ],
  writing: [
    {
      id: "writing-2016-task2-online-shopping",
      year: 2016,
      taskType: "Task 2",
      title: "Online shopping and local stores",
      prompt:
        "Some people think online shopping has more advantages than disadvantages for consumers and local communities. To what extent do you agree or disagree?",
      logicChain: ["便利性与价格透明", "本地商店客流下降", "就业和社区关系的长期影响", "用监管与本地差异化服务平衡"],
      commonPitfall: "只写消费者省钱，忽略 local communities，任务回应会变窄。",
      targetBand: "6.5",
      rightsNote: "原创改写题，用于 Alpha 展示；正式库需做去重和来源标注。",
    },
    {
      id: "writing-2019-task1-line-remote-work",
      year: 2019,
      taskType: "Task 1",
      title: "Line graph: remote work trend",
      prompt:
        "The line graph shows the percentage of employees working remotely in three industries from 2010 to 2020. Summarise the information by selecting and reporting the main features.",
      logicChain: ["开头改写图表对象", "总览最高/最低与共同趋势", "第一组比较上升明显行业", "第二组补充平稳或波动行业"],
      commonPitfall: "逐年流水账会显得概括不足；先写 overview 再分组比较。",
      targetBand: "6.5",
      rightsNote: "原创图表题结构；正式版本需生成或授权图表图片。",
    },
    {
      id: "writing-2023-task2-ai-education",
      year: 2023,
      taskType: "Task 2",
      title: "AI tools in education",
      prompt:
        "Some people believe that AI tools will improve education, while others worry that students may become too dependent on them. Discuss both views and give your own opinion.",
      logicChain: ["AI 个性化反馈提升效率", "过度依赖削弱独立思考", "教师角色从讲解转向监督与设计", "观点：辅助可以，但不能替代学习过程"],
      commonPitfall: "把 AI 写成万能工具，缺少 dependence 的回应。",
      targetBand: "7",
      rightsNote: "原创改写题，用于 Alpha 展示；正式库需做去重和来源标注。",
    },
    {
      id: "writing-2026-task1-process-recycling",
      year: 2026,
      taskType: "Task 1",
      title: "Process diagram: plastic recycling",
      prompt:
        "The diagram illustrates the process of recycling plastic bottles into new products. Summarise the information by selecting and reporting the main features.",
      logicChain: ["开头改写 process", "总览线性流程和最终产物", "前半段：收集、分类、清洗", "后半段：粉碎、熔化、再制成产品"],
      commonPitfall: "Process 不要编数据；重点是步骤顺序、被动语态和连接词。",
      targetBand: "7",
      rightsNote: "原创流程题结构；正式版本需生成或授权图表图片。",
    },
  ],
};

export function isResourceTab(value: string | undefined): value is ResourceTab {
  return value === "vocabulary" || value === "practice" || value === "speaking" || value === "writing";
}
