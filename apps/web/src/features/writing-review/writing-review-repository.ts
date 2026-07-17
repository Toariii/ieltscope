import { desc, eq } from "drizzle-orm";

import type { createDatabase } from "@/lib/db/client";
import { contentItems, evaluations, evidence, writingSubmissions } from "@/lib/db/schema";

import type {
  StoredWritingEvaluation,
  StoredWritingSubmission,
  WritingReviewRepository,
} from "./writing-review-service";
import type { WritingCriterionResult, WritingEvidenceItem, WritingTaskType } from "./writing-review-evaluator";

type Database = ReturnType<typeof createDatabase>["db"];

const alphaPromptId = "00000000-0000-0000-0000-000000000001";
const alphaPromptTitle = "Task 2 · Online learning";
const alphaPromptText = "Can online courses replace traditional classrooms?";

function readTaskType(value: string): WritingTaskType {
  return value === "task1" ? "task1" : "task2";
}

function toSubmission(
  row: typeof writingSubmissions.$inferSelect,
  prompt: typeof contentItems.$inferSelect | null,
): StoredWritingSubmission {
  const body = prompt?.body ?? {};
  return {
    id: row.id,
    userId: row.userId,
    promptTitle:
      typeof body.title === "string" && body.title.trim().length > 0
        ? body.title
        : prompt?.title ?? alphaPromptTitle,
    promptText:
      typeof body.prompt === "string" && body.prompt.trim().length > 0
        ? body.prompt
        : alphaPromptText,
    taskType: readTaskType(row.taskType),
    text: row.text,
    wordCount: row.wordCount,
    createdAt: row.createdAt,
  };
}

function toEvaluation(
  row: typeof evaluations.$inferSelect,
  evidenceRows: Array<typeof evidence.$inferSelect> = [],
): StoredWritingEvaluation {
  return {
    id: row.id,
    submissionId: row.writingSubmissionId ?? "",
    userId: "",
    overallScore: (row.overallScore ?? row.overallLow ?? 0) / 2,
    overallLow: (row.overallLow ?? row.overallScore ?? 0) / 2,
    overallHigh: (row.overallHigh ?? row.overallScore ?? 0) / 2,
    confidence: Number(row.confidence ?? 0),
    criteria: (row.criteria ?? []) as WritingCriterionResult[],
    topPriorities: (row.topPriorities ?? []) as string[],
    evidence: evidenceRows.map((item) => ({
      criterion: item.criterion as WritingEvidenceItem["criterion"],
      original: item.message.split(" → ")[0] ?? item.message,
      suggestion: item.message.split(" → ")[1] ?? item.message,
      explanation: item.message,
      characterStart: item.characterStart,
      characterEnd: item.characterEnd,
    })),
    rubricVersion: "writing-alpha-v1",
    completedAt: row.completedAt ?? row.updatedAt,
  };
}

export async function ensureAlphaWritingPrompt(db: Database) {
  await db
    .insert(contentItems)
    .values({
      id: alphaPromptId,
      kind: "writing_prompt",
      title: alphaPromptTitle,
      body: {
        title: alphaPromptTitle,
        prompt: alphaPromptText,
        taskType: "task2",
      },
      sourceType: "original",
      rightsNote: "IELTScope alpha demo prompt",
      skillTags: ["writing", "task2", "online-learning"],
      questionType: "task2",
      publicationStatus: "published",
      publishedAt: new Date(),
    })
    .onConflictDoNothing();
  return { id: alphaPromptId, title: alphaPromptTitle, prompt: alphaPromptText };
}

export function createWritingReviewRepository(db: Database): WritingReviewRepository {
  return {
    async createSubmission(input) {
      const prompt = await ensureAlphaWritingPrompt(db);
      const [submission] = await db
        .insert(writingSubmissions)
        .values({
          userId: input.userId,
          promptId: prompt.id,
          taskType: input.taskType,
          text: input.text,
          wordCount: input.wordCount,
          idempotencyKey: crypto.randomUUID(),
          evaluationConsent: true,
          modelImprovementConsent: false,
        })
        .returning();

      return {
        id: submission.id,
        userId: submission.userId,
        promptTitle: input.promptTitle || prompt.title,
        promptText: input.promptText || prompt.prompt,
        taskType: input.taskType,
        text: submission.text,
        wordCount: submission.wordCount,
        createdAt: submission.createdAt,
      };
    },

    async createEvaluation(input) {
      const [evaluation] = await db
        .insert(evaluations)
        .values({
          kind: "writing",
          writingSubmissionId: input.submissionId,
          status: "completed",
          overallScore: Math.round(input.overallScore * 2),
          overallLow: Math.round(input.overallLow * 2),
          overallHigh: Math.round(input.overallHigh * 2),
          confidence: input.confidence.toFixed(3),
          criteria: input.criteria,
          topPriorities: input.topPriorities,
          completedAt: new Date(),
        })
        .returning();

      if (input.evidence.length > 0) {
        await db.insert(evidence).values(
          input.evidence.map((item) => ({
            evaluationId: evaluation.id,
            criterion: item.criterion,
            message: `${item.original} → ${item.suggestion}`,
            characterStart: item.characterStart,
            characterEnd: item.characterEnd,
          })),
        );
      }

      return {
        id: evaluation.id,
        submissionId: input.submissionId,
        userId: input.userId,
        overallScore: input.overallScore,
        overallLow: input.overallLow,
        overallHigh: input.overallHigh,
        confidence: input.confidence,
        criteria: input.criteria,
        topPriorities: input.topPriorities,
        evidence: input.evidence,
        rubricVersion: input.rubricVersion,
        completedAt: evaluation.completedAt ?? new Date(),
      };
    },

    async listReviews(userId) {
      const rows = await db
        .select({
          submission: writingSubmissions,
          prompt: contentItems,
          evaluation: evaluations,
        })
        .from(writingSubmissions)
        .innerJoin(evaluations, eq(evaluations.writingSubmissionId, writingSubmissions.id))
        .leftJoin(contentItems, eq(contentItems.id, writingSubmissions.promptId))
        .where(eq(writingSubmissions.userId, userId))
        .orderBy(desc(writingSubmissions.createdAt))
        .limit(10);

      return Promise.all(
        rows.map(async (row) => {
          const evidenceRows = await db
            .select()
            .from(evidence)
            .where(eq(evidence.evaluationId, row.evaluation.id))
            .orderBy(evidence.createdAt);
          return {
            submission: toSubmission(row.submission, row.prompt),
            evaluation: {
              ...toEvaluation(row.evaluation, evidenceRows),
              userId,
            },
          };
        }),
      );
    },
  };
}
