# IELTScope 首次建档、考试记录与目标设置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建可保存和恢复的四步免费建档流程，支持手填成绩、私有 PDF 上传、文本型 PDF 解析、参考记录展示、目标设置与诊断入口。

**Architecture:** Next.js App Router 提供受保护页面和 Route Handlers；领域契约与校验放在 `@ielts/contracts`；Drizzle/PostgreSQL 保存建档状态、文件元数据、成绩和目标；S3 兼容私有存储对接本地 MinIO 与未来 Cloudflare R2。PDF 文本提取和 OCR 通过适配器隔离，页面只消费类型化状态。

**Tech Stack:** Next.js 16、React 19、TypeScript、Drizzle ORM、PostgreSQL、Better Auth、AWS S3 SDK、pdfjs-dist、Vitest、Testing Library、Playwright、系统 Chrome。

---

## File Map

### Contracts

- Create `packages/contracts/src/onboarding.ts`: Band Score、来源、状态、表单和 API 类型及纯校验函数。
- Create `packages/contracts/src/onboarding.test.ts`: 分数、目标、状态转换测试。
- Modify `packages/contracts/src/index.ts`: 导出建档契约。
- Modify `apps/web/package.json`: 添加 workspace contracts、S3 SDK 和 PDF 解析依赖。

### Persistence And Services

- Modify `apps/web/src/lib/db/schema.ts`: 建档字段、文件表、记录来源与处理状态。
- Create `apps/web/drizzle/0001_onboarding.sql`: 对应数据库迁移。
- Create `apps/web/src/features/onboarding/onboarding-repository.ts`: 仅负责 Drizzle 查询和事务。
- Create `apps/web/src/features/onboarding/onboarding-service.ts`: 步骤流转和最终提交。
- Create `apps/web/src/features/onboarding/onboarding-service.test.ts`: 使用内存仓储测试业务规则。

### Files And Parsing

- Create `apps/web/src/lib/storage/private-object-store.ts`: 私有对象存储接口。
- Create `apps/web/src/lib/storage/s3-private-object-store.ts`: MinIO/R2 实现。
- Create `apps/web/src/features/onboarding/exam-file.ts`: PDF 校验、哈希与安全检查。
- Create `apps/web/src/features/onboarding/exam-file.test.ts`: 文件限制测试。
- Create `apps/web/src/features/onboarding/exam-document-parser.ts`: 文本提取、分类和字段抽取。
- Create `apps/web/src/features/onboarding/exam-document-parser.test.ts`: 常见成绩单、扫描件和字段冲突测试。

### API

- Create `apps/web/src/app/api/onboarding/route.ts`: 读取和保存草稿。
- Create `apps/web/src/app/api/onboarding/documents/route.ts`: 上传和列出 PDF。
- Create `apps/web/src/app/api/onboarding/documents/[id]/route.ts`: 确认、修改和删除文件。
- Create `apps/web/src/app/api/onboarding/records/route.ts`: 手填记录。
- Create `apps/web/src/app/api/onboarding/complete/route.ts`: 事务提交。
- Create `apps/web/src/features/onboarding/api-authorization.ts`: 会话与资源归属检查。
- Create `apps/web/src/features/onboarding/api-authorization.test.ts`: 未登录和越权测试。

### UI And Routes

- Create `apps/web/src/app/(student)/onboarding/page.tsx`: 恢复当前步骤。
- Create `apps/web/src/app/(student)/onboarding/[step]/page.tsx`: 四步路由。
- Create `apps/web/src/features/onboarding/onboarding-wizard.tsx`: 客户端步骤控制和自动保存。
- Create `apps/web/src/features/onboarding/onboarding-wizard.module.css`: 桌面/移动布局。
- Create `apps/web/src/features/onboarding/onboarding-wizard.test.tsx`: 四步交互测试。
- Create `apps/web/src/features/onboarding/record-editor.tsx`: PDF 与手填成绩列表。
- Create `apps/web/src/features/onboarding/record-editor.test.tsx`: 文件状态和自报标签测试。
- Create `apps/web/src/app/(student)/assessment/page.tsx`: 免费诊断说明与后续入口。
- Modify `apps/web/src/app/(student)/dashboard/page.tsx`: 新用户显示档案/诊断状态而非模拟精确计划。
- Modify `apps/web/src/features/auth/auth-form.tsx`: 注册成功跳转建档。

### E2E And Documentation

- Create `apps/web/tests/e2e/onboarding.spec.ts`: 有成绩、无成绩、恢复和移动端流程。
- Modify `.env.example`: 对象存储与 OCR 可选配置说明。
- Modify `docs/security/public-launch-hardening.md`: 私有文件、来源说明和诊断优先边界。
- Modify `design-qa.md`: 系统 Chrome 截图与验收结果。

---

### Task 1: Add Onboarding Domain Contracts

**Files:**
- Create: `packages/contracts/src/onboarding.ts`
- Create: `packages/contracts/src/onboarding.test.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Write failing Band Score and goal tests**

```ts
import { describe, expect, it } from "vitest";
import { fromBandUnits, toBandUnits, validateGoalInput } from "./onboarding.js";

describe("IELTS band scores", () => {
  it("stores half-band values as integer units", () => {
    expect(toBandUnits(6.5)).toBe(13);
    expect(fromBandUnits(13)).toBe(6.5);
  });

  it("rejects values outside 0-9 or outside half bands", () => {
    expect(() => toBandUnits(6.25)).toThrow("0.5");
    expect(() => toBandUnits(9.5)).toThrow("0-9");
  });
});

it("validates the confirmed goal fields", () => {
  expect(validateGoalInput({
    targetOverall: 7,
    targetExamDate: "2026-10-10",
    weeklyMinutes: 600,
    minimumSkills: { writing: 6.5 },
  }, new Date("2026-07-16T00:00:00Z"))).toEqual({ ok: true, errors: {} });
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm --filter @ielts/contracts test -- onboarding.test.ts`  
Expected: FAIL because `onboarding.ts` does not exist.

- [ ] **Step 3: Implement the domain types and validators**

```ts
export type Skill = "listening" | "reading" | "writing" | "speaking";
export type ExamSource = "pdf" | "manual";
export type ParseStatus = "processing" | "awaiting_confirmation" | "ready" | "needs_review" | "failed";

export type GoalInput = {
  targetOverall: number;
  targetExamDate: string;
  weeklyMinutes: number;
  minimumSkills: Partial<Record<Skill, number>>;
};

export function toBandUnits(score: number) {
  if (score < 0 || score > 9) throw new Error("IELTS score must be within 0-9");
  if (!Number.isInteger(score * 2)) throw new Error("IELTS score must use 0.5 steps");
  return score * 2;
}

export const fromBandUnits = (units: number) => units / 2;

export function validateGoalInput(input: GoalInput, now = new Date()) {
  const errors: Record<string, string> = {};
  if (input.targetOverall < 5.5 || input.targetOverall > 9 || !Number.isInteger(input.targetOverall * 2)) {
    errors.targetOverall = "目标总分须为 5.5–9.0，并以 0.5 递增";
  }
  const examDate = new Date(`${input.targetExamDate}T00:00:00Z`);
  if (!Number.isFinite(examDate.getTime()) || examDate <= now) errors.targetExamDate = "考试日期必须晚于今天";
  if (input.weeklyMinutes < 60 || input.weeklyMinutes > 3600) errors.weeklyMinutes = "每周学习时间须为 1–60 小时";
  for (const [skill, score] of Object.entries(input.minimumSkills)) {
    try { toBandUnits(score); } catch { errors[`minimumSkills.${skill}`] = "单科要求必须是合法雅思分数"; }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
```

- [ ] **Step 4: Export contracts and add workspace dependency**

```ts
// packages/contracts/src/index.ts
export * from "./onboarding.js";
export const contractsVersion = "0.2.0";
```

Add to `apps/web/package.json` dependencies:

```json
"@aws-sdk/client-s3": "^3.848.0",
"@aws-sdk/s3-request-presigner": "^3.848.0",
"@ielts/contracts": "workspace:*",
"pdfjs-dist": "^5.4.54"
```

- [ ] **Step 5: Run tests and verify GREEN**

Run: `pnpm install && pnpm --filter @ielts/contracts test && pnpm --filter @ielts/contracts typecheck`  
Expected: all contract tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/contracts apps/web/package.json pnpm-lock.yaml
git commit -m "feat: add onboarding domain contracts"
```

### Task 2: Add Persistence Schema And Migration

**Files:**
- Modify: `apps/web/src/lib/db/schema.ts`
- Modify: `apps/web/src/lib/db/schema.test.ts`
- Create: `apps/web/drizzle/0001_onboarding.sql`

- [ ] **Step 1: Write failing schema tests**

```ts
import { examDocuments, examRecords, goals, studentProfiles } from "./schema";

it("tracks onboarding progress and document source", () => {
  expect(getTableConfig(studentProfiles).columns.map((c) => c.name)).toContain("onboarding_completed_at");
  expect(getTableConfig(examDocuments).columns.map((c) => c.name)).toEqual(expect.arrayContaining([
    "object_key", "sha256", "document_kind", "parse_status", "extracted_fields",
  ]));
  expect(getTableConfig(examRecords).columns.map((c) => c.name)).toEqual(expect.arrayContaining([
    "source_type", "parse_status", "source_document_id",
  ]));
  expect(getTableConfig(goals).columns.map((c) => c.name)).toContain("minimum_skills");
});
```

- [ ] **Step 2: Run schema test and verify RED**

Run: `pnpm --filter ./apps/web test -- src/lib/db/schema.test.ts`  
Expected: FAIL because `examDocuments` and new columns do not exist.

- [ ] **Step 3: Add enums, table and columns**

```ts
export const examSourceEnum = pgEnum("exam_source", ["pdf", "manual"]);
export const documentParseStatusEnum = pgEnum("document_parse_status", [
  "processing", "awaiting_confirmation", "ready", "needs_review", "failed",
]);

export const examDocuments = pgTable("exam_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull(),
  originalFilename: text("original_filename").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  sha256: text("sha256").notNull(),
  documentKind: text("document_kind").default("unknown").notNull(),
  parseStatus: documentParseStatusEnum("parse_status").default("processing").notNull(),
  extractedFields: jsonb("extracted_fields").$type<Record<string, unknown>>().default({}).notNull(),
  parserVersion: text("parser_version"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  ...timestamps,
}, (table) => [
  uniqueIndex("exam_documents_user_hash_unique").on(table.userId, table.sha256),
  index("exam_documents_user_status_idx").on(table.userId, table.parseStatus),
]);
```

Add `onboardingCompletedAt`, `sourceType`, `parseStatus`, `sourceDocumentId`, `confirmedByUserAt`, and `minimumSkills` to the existing tables. Keep score columns as half-band integer units.

- [ ] **Step 4: Generate and inspect migration**

Run: `pnpm --filter ./apps/web exec drizzle-kit generate --name onboarding`  
Expected: migration creates enums/table/columns, unique `(user_id, sha256)`, and no destructive drops.

- [ ] **Step 5: Run schema tests**

Run: `pnpm --filter ./apps/web test -- src/lib/db/schema.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/db apps/web/drizzle
git commit -m "feat: persist onboarding and exam references"
```

### Task 3: Build The Onboarding Service With An Injectable Repository

**Files:**
- Create: `apps/web/src/features/onboarding/onboarding-repository.ts`
- Create: `apps/web/src/features/onboarding/onboarding-service.ts`
- Create: `apps/web/src/features/onboarding/onboarding-service.test.ts`

- [ ] **Step 1: Write failing service tests**

```ts
it("saves each step and completes onboarding atomically", async () => {
  const repo = createMemoryOnboardingRepository();
  const service = createOnboardingService(repo);
  await service.saveStatus("user-1", { hasRecentScores: false });
  await service.saveGoal("user-1", validGoal);
  await service.complete("user-1");
  expect(repo.snapshot("user-1")).toMatchObject({ step: "complete", completed: true });
});

it("does not create a precise plan before assessment", async () => {
  const repo = createMemoryOnboardingRepository();
  const service = createOnboardingService(repo);
  await service.saveStatus("user-1", { hasRecentScores: false });
  await service.saveGoal("user-1", validGoal);
  await service.complete("user-1");
  expect(repo.createdPlans).toHaveLength(0);
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/onboarding-service.test.ts`  
Expected: FAIL because service files do not exist.

- [ ] **Step 3: Implement repository contract and service**

```ts
export type OnboardingRepository = {
  getDraft(userId: string): Promise<OnboardingDraft>;
  saveStatus(userId: string, value: StatusInput): Promise<void>;
  saveGoal(userId: string, value: GoalInput): Promise<void>;
  completeInTransaction(userId: string): Promise<void>;
};

export function createOnboardingService(repo: OnboardingRepository) {
  return {
    getDraft: (userId: string) => repo.getDraft(userId),
    saveStatus: (userId: string, value: StatusInput) => repo.saveStatus(userId, value),
    async saveGoal(userId: string, value: GoalInput) {
      const result = validateGoalInput(value);
      if (!result.ok) return { ok: false as const, errors: result.errors };
      await repo.saveGoal(userId, value);
      return { ok: true as const };
    },
    complete: (userId: string) => repo.completeInTransaction(userId),
  };
}
```

Implement the Drizzle repository in the same file behind the interface; the service test uses a local memory implementation declared in the test file.

- [ ] **Step 4: Run service tests**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/onboarding-service.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/onboarding
git commit -m "feat: add resumable onboarding service"
```

### Task 4: Implement Private PDF Intake

**Files:**
- Create: `apps/web/src/lib/storage/private-object-store.ts`
- Create: `apps/web/src/lib/storage/s3-private-object-store.ts`
- Create: `apps/web/src/features/onboarding/exam-file.ts`
- Create: `apps/web/src/features/onboarding/exam-file.test.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Write failing validation tests**

```ts
it("accepts a real PDF under 10 MB and returns its hash", async () => {
  const file = new File([new TextEncoder().encode("%PDF-1.7\n%%EOF")], "score.pdf", { type: "application/pdf" });
  await expect(inspectExamPdf(file)).resolves.toMatchObject({ sha256: expect.stringMatching(/^[a-f0-9]{64}$/) });
});

it.each([
  ["wrong MIME", new File(["%PDF-1.7"], "score.pdf", { type: "text/plain" })],
  ["fake header", new File(["not a pdf"], "score.pdf", { type: "application/pdf" })],
])("rejects %s", async (_label, file) => {
  await expect(inspectExamPdf(file)).rejects.toThrow();
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/exam-file.test.ts`  
Expected: FAIL because `inspectExamPdf` does not exist.

- [ ] **Step 3: Implement validation and storage interfaces**

```ts
export type PrivateObjectStore = {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  remove(key: string): Promise<void>;
  createPreviewUrl(key: string, expiresInSeconds: number): Promise<string>;
};

export async function inspectExamPdf(file: File) {
  if (file.type !== "application/pdf") throw new Error("只支持 PDF 文件");
  if (file.size > 10 * 1024 * 1024) throw new Error("PDF 不得超过 10 MB");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("文件不是有效 PDF");
  return { bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
}
```

The S3 adapter must set `Bucket`, private `Key`, `ContentType`, and use a signed `GetObjectCommand` limited to 300 seconds. Do not set public ACLs.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/exam-file.test.ts`  
Expected: PASS.

- [ ] **Step 5: Add local private data ignores and commit**

```gitignore
.data/
```

```bash
git add .gitignore apps/web/src/lib/storage apps/web/src/features/onboarding/exam-file*
git commit -m "feat: validate and privately store exam PDFs"
```

### Task 5: Parse Text PDFs Without Guessing Missing Scores

**Files:**
- Create: `apps/web/src/features/onboarding/exam-document-parser.ts`
- Create: `apps/web/src/features/onboarding/exam-document-parser.test.ts`
- Create: `apps/web/src/features/onboarding/__fixtures__/official-trf.txt`
- Create: `apps/web/src/features/onboarding/__fixtures__/institution-report.txt`

- [ ] **Step 1: Write failing parser tests**

```ts
it("extracts a common score report as reference data", () => {
  expect(parseExamText(officialFixture)).toEqual({
    status: "awaiting_confirmation",
    fields: { examDate: "2026-06-20", overall: 13, listening: 14, reading: 13, writing: 12, speaking: 12 },
    warnings: [],
  });
});

it("sends incomplete or conflicting fields to review", () => {
  expect(parseExamText("Overall 7.0 Listening 9.7").status).toBe("needs_review");
});

it("marks image-only PDFs for OCR review", async () => {
  expect(await parseExamPdf(imageOnlyPdfBytes, unavailableOcr)).toMatchObject({ status: "needs_review" });
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/exam-document-parser.test.ts`  
Expected: FAIL because parser does not exist.

- [ ] **Step 3: Implement deterministic extraction**

```ts
const scorePatterns = {
  overall: /overall(?:\s+band\s+score)?\s*[:：]?\s*(\d(?:\.5|\.0)?)/i,
  listening: /listening\s*[:：]?\s*(\d(?:\.5|\.0)?)/i,
  reading: /reading\s*[:：]?\s*(\d(?:\.5|\.0)?)/i,
  writing: /writing\s*[:：]?\s*(\d(?:\.5|\.0)?)/i,
  speaking: /speaking\s*[:：]?\s*(\d(?:\.5|\.0)?)/i,
};

function extractExamDate(text: string) {
  const iso = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const dayFirst = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
  if (!dayFirst) return undefined;
  return `${dayFirst[3]}-${dayFirst[2].padStart(2, "0")}-${dayFirst[1].padStart(2, "0")}`;
}

export function parseExamText(text: string): ParsedExamDocument {
  const warnings: string[] = [];
  const values = Object.fromEntries(Object.entries(scorePatterns).map(([key, pattern]) => {
    const match = text.match(pattern);
    if (!match) return [key, undefined];
    try { return [key, toBandUnits(Number(match[1]))]; }
    catch { warnings.push(`${key} 分数格式无效`); return [key, undefined]; }
  }));
  const examDate = extractExamDate(text);
  const missing = Object.entries(values).filter(([, value]) => value === undefined).map(([key]) => key);
  if (!examDate) warnings.push("缺少考试日期");
  if (missing.length) warnings.push(`缺少字段：${missing.join("、")}`);
  const fields = { examDate, ...values };
  return warnings.length
    ? { status: "needs_review", fields, warnings }
    : { status: "awaiting_confirmation", fields: fields as ParsedScores, warnings: [] };
}
```

Use `pdfjs-dist/legacy/build/pdf.mjs` to extract text and page count. Reject PDFs with JavaScript actions, attachments, zero pages, or more than 20 pages before parsing. Define `OcrAdapter` with `extract(bytes)`; the default unavailable adapter returns `needs_review` and never fabricates text.

- [ ] **Step 4: Run parser tests**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/exam-document-parser.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/onboarding/exam-document-parser* apps/web/src/features/onboarding/__fixtures__
git commit -m "feat: parse text IELTS score PDFs"
```

### Task 6: Add Authenticated Onboarding APIs

**Files:**
- Create: `apps/web/src/features/onboarding/api-authorization.ts`
- Create: `apps/web/src/features/onboarding/api-authorization.test.ts`
- Create: `apps/web/src/app/api/onboarding/route.ts`
- Create: `apps/web/src/app/api/onboarding/documents/route.ts`
- Create: `apps/web/src/app/api/onboarding/documents/[id]/route.ts`
- Create: `apps/web/src/app/api/onboarding/records/route.ts`
- Create: `apps/web/src/app/api/onboarding/complete/route.ts`

- [ ] **Step 1: Write failing ownership tests**

```ts
it("rejects anonymous requests", async () => {
  await expect(requireStudentId(null)).rejects.toMatchObject({ status: 401 });
});

it("rejects a document owned by another student", async () => {
  expect(() => assertOwnership("user-a", { userId: "user-b" })).toThrow("无权访问");
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/api-authorization.test.ts`  
Expected: FAIL because authorization helpers do not exist.

- [ ] **Step 3: Implement authorization and route behavior**

```ts
export function assertOwnership(userId: string, resource: { userId: string }) {
  if (resource.userId !== userId) throw new OnboardingHttpError(403, "无权访问该文件");
}

export async function requireStudentId(requestHeaders: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) throw new OnboardingHttpError(401, "请先登录");
  return session.user.id;
}
```

Routes return a consistent shape:

```ts
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };
```

The upload route enforces the five-document limit, calls `inspectExamPdf`, returns the existing document on duplicate hash, writes to the private store, parses, and persists status. Confirmation permits student field corrections, records `confirmedAt`, and changes the neutral processing state to `ready`.

- [ ] **Step 4: Run API unit tests**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/api-authorization.test.ts src/features/onboarding/onboarding-service.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/onboarding apps/web/src/features/onboarding/api-authorization*
git commit -m "feat: expose protected onboarding APIs"
```

### Task 7: Build The Wizard Shell And Status Step

**Files:**
- Create: `apps/web/src/app/(student)/onboarding/page.tsx`
- Create: `apps/web/src/app/(student)/onboarding/[step]/page.tsx`
- Create: `apps/web/src/features/onboarding/onboarding-wizard.tsx`
- Create: `apps/web/src/features/onboarding/onboarding-wizard.module.css`
- Create: `apps/web/src/features/onboarding/onboarding-wizard.test.tsx`

- [ ] **Step 1: Write failing shell and status tests**

```tsx
it("shows four steps and saves the preparation status", async () => {
  const user = userEvent.setup();
  render(<OnboardingWizard initialDraft={emptyDraft} initialStep="status" api={fakeApi} />);
  expect(screen.getByText("1 / 4")).toBeInTheDocument();
  await user.click(screen.getByRole("radio", { name: "首次备考或暂无可参考成绩" }));
  await user.click(screen.getByRole("button", { name: "保存并继续" }));
  expect(fakeApi.savedStatus).toEqual({ hasRecentScores: false });
  expect(fakeApi.navigatedTo).toBe("records");
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/onboarding-wizard.test.tsx`  
Expected: FAIL because wizard does not exist.

- [ ] **Step 3: Implement focused wizard layout**

```tsx
const steps = [
  { id: "status", label: "备考情况" },
  { id: "records", label: "考试记录" },
  { id: "goal", label: "目标与时间" },
  { id: "review", label: "确认档案" },
] as const;

export function OnboardingWizard({ initialDraft, initialStep, api }: Props) {
  const [draft, setDraft] = useState(initialDraft);
  const [syncState, setSyncState] = useState<"saved" | "saving" | "local">("saved");
  return (
    <main className={styles.page}>
      <header><Link href="/dashboard">IELTScope</Link><span>{syncCopy[syncState]}</span></header>
      <div className={styles.layout}>
        <nav aria-label="建档步骤">{steps.map(renderStep)}</nav>
        <section aria-labelledby="step-title">{renderCurrentStep()}</section>
      </div>
    </main>
  );
}
```

Use CSS grid with a 220px step rail and a `minmax(0, 720px)` content track. At `max-width: 760px`, turn the rail into a horizontal progress strip and keep all controls in one column. Save failed drafts to `localStorage` under `ieltscope:onboarding:<userId>` and display “尚未同步”.

- [ ] **Step 4: Run component tests**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/onboarding-wizard.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(student\)/onboarding apps/web/src/features/onboarding/onboarding-wizard*
git commit -m "feat: add resumable onboarding wizard"
```

### Task 8: Add Exam Records UI

**Files:**
- Create: `apps/web/src/features/onboarding/record-editor.tsx`
- Create: `apps/web/src/features/onboarding/record-editor.test.tsx`
- Modify: `apps/web/src/features/onboarding/onboarding-wizard.tsx`
- Modify: `apps/web/src/features/onboarding/onboarding-wizard.module.css`

- [ ] **Step 1: Write failing records tests**

```tsx
it("labels manually entered scores without implying verification", async () => {
  render(<RecordEditor records={manualRecord} documents={[]} api={fakeApi} />);
  expect(screen.getByText("手动记录")).toBeVisible();
  expect(screen.queryByText(/已核验|可信度/)).not.toBeInTheDocument();
});

it.each([
  ["processing", "解析中"],
  ["awaiting_confirmation", "等待确认"],
  ["needs_review", "需要人工复核"],
  ["failed", "解析失败"],
])("renders %s as %s", (status, label) => {
  render(<RecordEditor documents={[documentWithStatus(status)]} records={[]} api={fakeApi} />);
  expect(screen.getByText(label)).toBeVisible();
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/record-editor.test.tsx`  
Expected: FAIL because `RecordEditor` does not exist.

- [ ] **Step 3: Implement upload, manual entry and confirmation**

```tsx
export function RecordEditor({ records, documents, api }: Props) {
  return (
    <div>
      <FileDropzone accept="application/pdf" maxSize={10 * 1024 * 1024} disabled={records.length + documents.length >= 5} onFile={api.upload} />
      <p>支持 IELTS 成绩单、机构模考和教师报告 PDF，最多 5 份。所有历史成绩只作参考。</p>
      <ol className={styles.recordList}>{documents.map((document) => <DocumentRow key={document.id} document={document} />)}</ol>
      <button type="button" onClick={() => setManualOpen(true)}>手动添加成绩</button>
      {manualOpen ? <ManualRecordForm onSubmit={api.saveManualRecord} sourceLabel="手动记录" /> : null}
    </div>
  );
}
```

The field confirmation dialog must show the PDF preview on desktop, extracted fields beside it, and a stacked preview/fields sequence on mobile. Confirmed files use the neutral label “PDF 记录已录入”; no source receives authenticity or credibility copy.

- [ ] **Step 4: Run records tests**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/record-editor.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/onboarding/record-editor* apps/web/src/features/onboarding/onboarding-wizard*
git commit -m "feat: add exam record upload and confirmation UI"
```

### Task 9: Add Goal, Review, Assessment Handoff And New-User Routing

**Files:**
- Modify: `apps/web/src/features/onboarding/onboarding-wizard.tsx`
- Modify: `apps/web/src/features/onboarding/onboarding-wizard.test.tsx`
- Create: `apps/web/src/app/(student)/assessment/page.tsx`
- Modify: `apps/web/src/app/(student)/dashboard/page.tsx`
- Modify: `apps/web/src/features/auth/auth-form.tsx`
- Modify: `apps/web/src/features/auth/auth-form.test.tsx`

- [ ] **Step 1: Write failing goal and completion tests**

```tsx
it("shows remaining weeks and submits a valid goal", async () => {
  const user = userEvent.setup();
  render(<OnboardingWizard initialDraft={recordsDraft} initialStep="goal" api={fakeApi} now={new Date("2026-07-16")} />);
  await user.selectOptions(screen.getByLabelText("目标总分"), "7");
  await user.type(screen.getByLabelText("预计考试日期"), "2026-09-10");
  await user.clear(screen.getByLabelText("每周学习小时"));
  await user.type(screen.getByLabelText("每周学习小时"), "10");
  expect(screen.getByText(/约 8 周/)).toBeVisible();
});

it("completes onboarding without requesting a redemption code", async () => {
  render(<OnboardingWizard initialDraft={completeDraft} initialStep="review" api={fakeApi} />);
  expect(screen.queryByText(/兑换码/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "确认档案，进入能力诊断" }));
  expect(fakeApi.navigatedTo).toBe("/assessment");
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/onboarding-wizard.test.tsx src/features/auth/auth-form.test.tsx`  
Expected: FAIL because goal/review and new registration redirect are absent.

- [ ] **Step 3: Implement goal, review and routing**

```tsx
<label>目标总分<select aria-label="目标总分">{[5.5,6,6.5,7,7.5,8,8.5,9].map(scoreOption)}</select></label>
<label>预计考试日期<input type="date" min={tomorrowIso} /></label>
<label>每周学习小时<input type="number" min="1" max="60" step="1" /></label>
<fieldset><legend>单科最低要求（选填）</legend>{skills.map(renderMinimumSkillToggle)}</fieldset>
```

The review step renders status, records, goal and time as four unframed sections with “修改” links. The complete API redirects to `/assessment`. Registration redirects to `/onboarding`; login continues to `/dashboard`, where the server reads profile state and shows “建立备考档案” or “继续能力诊断” instead of demo tasks for incomplete users.

- [ ] **Step 4: Add assessment intro**

The page must state the approximate 60-minute duration, four sections, autosave behavior, microphone/headphone requirement, and “开始诊断” as a disabled/future task control only if the actual assessment runner is outside this milestone. It must not display redemption or VIP gating.

- [ ] **Step 5: Run tests**

Run: `pnpm --filter ./apps/web test -- src/features/onboarding/onboarding-wizard.test.tsx src/features/auth/auth-form.test.tsx src/features/dashboard/student-dashboard.test.tsx`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(student\)/assessment apps/web/src/app/\(student\)/dashboard apps/web/src/features/onboarding apps/web/src/features/auth
git commit -m "feat: complete onboarding and assessment handoff"
```

### Task 10: Add End-To-End Coverage And Production QA

**Files:**
- Create: `apps/web/tests/e2e/onboarding.spec.ts`
- Modify: `apps/web/playwright.config.ts`
- Modify: `.env.example`
- Modify: `docs/security/public-launch-hardening.md`
- Modify: `design-qa.md`

- [ ] **Step 1: Write the failing E2E flow**

```ts
test("completes free onboarding without exam history", async ({ page }) => {
  await registerStudent(page, `onboarding-${Date.now()}@example.test`);
  await expect(page).toHaveURL(/\/onboarding\/status$/);
  await page.getByLabel("首次备考或暂无可参考成绩").check();
  await page.getByRole("button", { name: "保存并继续" }).click();
  await page.getByRole("button", { name: "暂时跳过" }).click();
  await page.getByLabel("目标总分").selectOption("7");
  await page.getByLabel("预计考试日期").fill("2026-10-10");
  await page.getByLabel("每周学习小时").fill("10");
  await page.getByRole("button", { name: "保存并继续" }).click();
  await page.getByRole("button", { name: "确认档案，进入能力诊断" }).click();
  await expect(page).toHaveURL(/\/assessment$/);
  await expect(page.getByText(/兑换码/)).toHaveCount(0);
});
```

Add separate tests for manual self-report, text PDF confirmation, resume after sign-out/sign-in, duplicate upload, 390px layout, and another user's document ID returning 403.

- [ ] **Step 2: Run E2E and verify RED**

Run: `pnpm --filter ./apps/web exec playwright test tests/e2e/onboarding.spec.ts`  
Expected: FAIL until database migration, APIs, and routes are wired together.

- [ ] **Step 3: Apply migration and run complete quality gate**

Run:

```bash
docker compose up -d postgres minio minio-init
pnpm --filter ./apps/web exec drizzle-kit migrate
pnpm test
pnpm typecheck
pnpm lint
pnpm --filter ./apps/web exec playwright test
```

Expected: all unit and E2E tests pass with one Playwright worker and system Chrome.

- [ ] **Step 4: Capture and inspect visual evidence**

Capture desktop 1440x900 and mobile 390x844 screenshots for all four steps. Check no horizontal overflow, clipped filenames, overlapping fixed footer, inaccessible status colors, or desktop-only upload instructions. Record screenshots under `output/playwright/onboarding-*` and findings in `design-qa.md`.

- [ ] **Step 5: Update security and environment docs**

Document `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, private signed previews, duplicate hashes, parser limitations and optional OCR adapter configuration. Do not place real credentials in documentation.

- [ ] **Step 6: Build and restart production preview**

Run:

```bash
pnpm build
pnpm --filter ./apps/web exec next start -p 3001
```

Expected: `/api/health`, `/onboarding/status`, `/onboarding/records`, `/onboarding/goal`, `/onboarding/review`, and `/assessment` respond correctly; unauthorized onboarding routes redirect to login.

- [ ] **Step 7: Commit**

```bash
git add apps/web/tests apps/web/playwright.config.ts .env.example docs/security design-qa.md
git commit -m "test: verify onboarding and private exam uploads"
```

---

## Plan Self-Review Checklist

- [x] Every confirmed spec section maps to at least one task.
- [x] Manual, PDF and skip paths are covered.
- [x] Historical records use neutral PDF/manual labels and no credibility weighting.
- [x] Scanned PDFs without a configured OCR provider enter `needs_review`.
- [x] No redemption or VIP gate appears before the free assessment result.
- [x] New students do not receive simulated precise plans before assessment.
- [x] Ownership, duplicate upload, signed preview and malicious PDF checks are included.
- [x] Desktop and mobile system Chrome QA are included.
- [x] Code and type names remain consistent across tasks.
