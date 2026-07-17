export type SkillId = "overall" | "listening" | "reading" | "writing" | "speaking";

export type WorkbenchSkill = {
  id: Exclude<SkillId, "overall">;
  label: string;
  estimate: number;
  target: number;
  confidence: number;
  priority?: boolean;
};

export type WorkbenchTask = {
  id: string;
  skill: string;
  title: string;
  detail: string;
  minutes: number;
  status: "complete" | "current" | "upcoming";
};

export type TrendPoint = {
  date: string;
  overall: number;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
};

export type StudentWorkbenchView = {
  studentName: string;
  dateLabel: string;
  targetExamDate: string;
  daysToExam: number;
  targetOverall: number;
  skills: WorkbenchSkill[];
  todayTasks: WorkbenchTask[];
  trend: TrendPoint[];
  recentReview: {
    kind: "写作" | "口语";
    taskLabel: string;
    score: number;
    range: string;
    confidence: number;
    priority: string;
  } | null;
  credits: number;
  streakDays: number;
  weeklyMinutes: number;
  weeklyTargetMinutes: number;
};

export const demoStudentWorkbench: StudentWorkbenchView = {
  studentName: "林同学",
  dateLabel: "2026 年 7 月 16 日 · 星期四",
  targetExamDate: "2026 年 9 月 12 日",
  daysToExam: 58,
  targetOverall: 7,
  skills: [
    { id: "listening", label: "听力", estimate: 6.5, target: 7.5, confidence: 0.86 },
    { id: "reading", label: "阅读", estimate: 6, target: 7, confidence: 0.84 },
    { id: "writing", label: "写作", estimate: 5.5, target: 6.5, confidence: 0.82, priority: true },
    { id: "speaking", label: "口语", estimate: 5.5, target: 6.5, confidence: 0.78 },
  ],
  todayTasks: [
    {
      id: "task-reading-tfng",
      skill: "阅读",
      title: "判断题专项",
      detail: "12 题 · 正确率目标 75%",
      minutes: 35,
      status: "complete",
    },
    {
      id: "task-writing-task2",
      skill: "写作",
      title: "Task 2 论证展开",
      detail: "完成一稿并提交精批",
      minutes: 40,
      status: "current",
    },
    {
      id: "task-speaking-place",
      skill: "口语",
      title: "Part 2 地点话题重录",
      detail: "覆盖 4 个意群",
      minutes: 20,
      status: "upcoming",
    },
  ],
  trend: [
    { date: "4/18", overall: 5.5, listening: 6, reading: 5.5, writing: 5, speaking: 5 },
    { date: "5/22", overall: 5.5, listening: 6.5, reading: 6, writing: 5.5, speaking: 5.5 },
    { date: "6/19", overall: 6, listening: 6.5, reading: 6.5, writing: 5.5, speaking: 5.5 },
    { date: "7/11", overall: 6, listening: 7, reading: 6.5, writing: 6, speaking: 6 },
  ],
  recentReview: {
    kind: "写作",
    taskLabel: "Task 2 · 城市交通",
    score: 6,
    range: "5.5–6.0",
    confidence: 0.82,
    priority: "优先补全论证中的因果链",
  },
  credits: 12,
  streakDays: 5,
  weeklyMinutes: 145,
  weeklyTargetMinutes: 240,
};
