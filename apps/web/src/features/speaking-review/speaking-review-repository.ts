import { desc, eq } from "drizzle-orm";

import type { createDatabase } from "@/lib/db/client";
import { contentItems, evaluations, evidence, speakingSubmissions } from "@/lib/db/schema";

import type { SpeakingCriterionResult, SpeakingEvidenceItem, SpeakingPart } from "./speaking-review-evaluator";
import type {
  SpeakingReviewRepository,
  StoredSpeakingEvaluation,
  StoredSpeakingSubmission,
} from "./speaking-review-service";

type Database = ReturnType<typeof createDatabase>["db"];

const alphaPromptId = "00000000-0000-0000-0000-000000000002";
const alphaPromptTitle = "Part 2 · A quiet study place";
const alphaPromptText = "Describe a quiet place where you like to study.";

function readPart(value: string | null | undefined): SpeakingPart {
  return value === "part1" || value === "part3" ? value : "part2";
}

function toSubmission(
  row: typeof speakingSubmissions.$inferSelect,
  prompt: typeof contentItems.$inferSelect | null,
): StoredSpeakingSubmission {
  const body = prompt?.body ?? {};
  const transcript = row.objectKey.startsWith("alpha-transcript:")
    ? row.objectKey.replace("alpha-transcript:", "")
    : "";
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
    part: readPart(typeof body.part === "string" ? body.part : undefined),
    transcript,
    wordCount: transcript.trim().split(/\s+/u).filter(Boolean).length,
    durationSeconds: row.durationSeconds,
    createdAt: row.createdAt,
  };
}

function toEvaluation(
  row: typeof evaluations.$inferSelect,
  evidenceRows: Array<typeof evidence.$inferSelect> = [],
): StoredSpeakingEvaluation {
  return {
    id: row.id,
    submissionId: row.speakingSubmissionId ?? "",
    userId: "",
    overallScore: (row.overallScore ?? row.overallLow ?? 0) / 2,
    overallLow: (row.overallLow ?? row.overallScore ?? 0) / 2,
    overallHigh: (row.overallHigh ?? row.overallScore ?? 0) / 2,
    confidence: Number(row.confidence ?? 0),
    criteria: (row.criteria ?? []) as SpeakingCriterionResult[],
    topPriorities: (row.topPriorities ?? []) as string[],
    evidence: evidenceRows.map((item) => ({
      criterion: item.criterion as SpeakingEvidenceItem["criterion"],
      original: item.message.split(" → ")[0] ?? item.message,
      suggestion: item.message.split(" → ")[1] ?? item.message,
      explanation: item.message,
      characterStart: item.characterStart,
      characterEnd: item.characterEnd,
    })),
    rubricVersion: "speaking-alpha-v1",
    analysisMode: "transcript_only",
    completedAt: row.completedAt ?? row.updatedAt,
  };
}

export async function ensureAlphaSpeakingPrompt(db: Database) {
  await db
    .insert(contentItems)
    .values({
      id: alphaPromptId,
      kind: "speaking_prompt",
      title: alphaPromptTitle,
      body: {
        title: alphaPromptTitle,
        prompt: alphaPromptText,
        part: "part2",
      },
      sourceType: "original",
      rightsNote: "IELTScope alpha demo prompt",
      skillTags: ["speaking", "part2", "place"],
      questionType: "part2",
      publicationStatus: "published",
      publishedAt: new Date(),
    })
    .onConflictDoNothing();
  return { id: alphaPromptId, title: alphaPromptTitle, prompt: alphaPromptText, part: "part2" as const };
}

export function createSpeakingReviewRepository(db: Database): SpeakingReviewRepository {
  return {
    async createSubmission(input) {
      const prompt = await ensureAlphaSpeakingPrompt(db);
      const [submission] = await db
        .insert(speakingSubmissions)
        .values({
          userId: input.userId,
          promptId: prompt.id,
          objectKey: `alpha-transcript:${input.transcript}`,
          mimeType: "text/plain",
          durationSeconds: input.durationSeconds,
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
        part: input.part,
        transcript: input.transcript,
        wordCount: input.wordCount,
        durationSeconds: submission.durationSeconds,
        createdAt: submission.createdAt,
      };
    },

    async createEvaluation(input) {
      const [evaluation] = await db
        .insert(evaluations)
        .values({
          kind: "speaking",
          speakingSubmissionId: input.submissionId,
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
        analysisMode: input.analysisMode,
        completedAt: evaluation.completedAt ?? new Date(),
      };
    },

    async listReviews(userId) {
      const rows = await db
        .select({
          submission: speakingSubmissions,
          prompt: contentItems,
          evaluation: evaluations,
        })
        .from(speakingSubmissions)
        .innerJoin(evaluations, eq(evaluations.speakingSubmissionId, speakingSubmissions.id))
        .leftJoin(contentItems, eq(contentItems.id, speakingSubmissions.promptId))
        .where(eq(speakingSubmissions.userId, userId))
        .orderBy(desc(speakingSubmissions.createdAt))
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
