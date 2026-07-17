import { and, count, desc, eq } from "drizzle-orm";

import {
  fromBandUnits,
  toBandUnits,
  type ExamScoreInput,
} from "@ielts/contracts";

import { examDocuments, examRecords } from "@/lib/db/schema";

import type { ParsedExamFields } from "./exam-document-parser";
import { onboardingDb, onboardingService } from "./onboarding-server";

function decodeScore(value: number | null | undefined) {
  return value === null || value === undefined ? null : fromBandUnits(value);
}

function encodeScore(value: number | null) {
  return value === null ? null : toBandUnits(value);
}

export function decodeParsedFields(fields: ParsedExamFields) {
  return {
    examDate: fields.examDate ?? "",
    overall: decodeScore(fields.overall),
    listening: decodeScore(fields.listening),
    reading: decodeScore(fields.reading),
    writing: decodeScore(fields.writing),
    speaking: decodeScore(fields.speaking),
  };
}

export async function getOnboardingSnapshot(userId: string) {
  const [draft, documents, records] = await Promise.all([
    onboardingService.getDraft(userId),
    onboardingDb
      .select()
      .from(examDocuments)
      .where(eq(examDocuments.userId, userId))
      .orderBy(desc(examDocuments.createdAt)),
    onboardingDb
      .select()
      .from(examRecords)
      .where(eq(examRecords.userId, userId))
      .orderBy(desc(examRecords.examDate)),
  ]);

  return {
    draft: {
      ...draft,
      completedAt: draft.completedAt?.toISOString() ?? null,
    },
    documents: documents.map((document) => ({
      id: document.id,
      originalFilename: document.originalFilename,
      byteSize: document.byteSize,
      status: document.parseStatus,
      fields: decodeParsedFields(document.extractedFields as ParsedExamFields),
      warnings: document.reviewNote ? [document.reviewNote] : [],
      createdAt: document.createdAt.toISOString(),
    })),
    records: records.map((record) => ({
      id: record.id,
      sourceType: record.sourceType,
      sourceDocumentId: record.sourceDocumentId,
      examDate: record.examDate.toISOString().slice(0, 10),
      overall: decodeScore(record.overallScore),
      listening: decodeScore(record.listeningScore),
      reading: decodeScore(record.readingScore),
      writing: decodeScore(record.writingScore),
      speaking: decodeScore(record.speakingScore),
    })),
  };
}

export async function countExamReferences(userId: string) {
  const [[documentCount], [manualCount]] = await Promise.all([
    onboardingDb
      .select({ value: count() })
      .from(examDocuments)
      .where(eq(examDocuments.userId, userId)),
    onboardingDb
      .select({ value: count() })
      .from(examRecords)
      .where(and(eq(examRecords.userId, userId), eq(examRecords.sourceType, "manual"))),
  ]);
  return Number(documentCount?.value ?? 0) + Number(manualCount?.value ?? 0);
}

export async function saveManualRecord(userId: string, input: ExamScoreInput) {
  const [record] = await onboardingDb
    .insert(examRecords)
    .values({
      userId,
      sourceType: "manual",
      parseStatus: "ready",
      examDate: new Date(`${input.examDate}T00:00:00Z`),
      overallScore: encodeScore(input.overall),
      listeningScore: encodeScore(input.listening),
      readingScore: encodeScore(input.reading),
      writingScore: encodeScore(input.writing),
      speakingScore: encodeScore(input.speaking),
      confirmedByUserAt: new Date(),
    })
    .returning();
  return record;
}

export async function confirmDocumentRecord(
  userId: string,
  documentId: string,
  input: ExamScoreInput,
) {
  return onboardingDb.transaction(async (tx) => {
    const [document] = await tx
      .select()
      .from(examDocuments)
      .where(and(eq(examDocuments.id, documentId), eq(examDocuments.userId, userId)))
      .limit(1);
    if (!document) return null;

    const values = {
      userId,
      sourceType: "pdf" as const,
      parseStatus: "ready" as const,
      sourceDocumentId: documentId,
      examDate: new Date(`${input.examDate}T00:00:00Z`),
      overallScore: encodeScore(input.overall),
      listeningScore: encodeScore(input.listening),
      readingScore: encodeScore(input.reading),
      writingScore: encodeScore(input.writing),
      speakingScore: encodeScore(input.speaking),
      confirmedByUserAt: new Date(),
    };
    const [existing] = await tx
      .select({ id: examRecords.id })
      .from(examRecords)
      .where(eq(examRecords.sourceDocumentId, documentId))
      .limit(1);
    if (existing) {
      await tx.update(examRecords).set(values).where(eq(examRecords.id, existing.id));
    } else {
      await tx.insert(examRecords).values(values);
    }
    await tx
      .update(examDocuments)
      .set({ parseStatus: "ready", confirmedAt: new Date(), updatedAt: new Date() })
      .where(eq(examDocuments.id, documentId));
    return document;
  });
}

export async function deleteManualRecord(userId: string, recordId: string) {
  const [deleted] = await onboardingDb
    .delete(examRecords)
    .where(
      and(
        eq(examRecords.id, recordId),
        eq(examRecords.userId, userId),
        eq(examRecords.sourceType, "manual"),
      ),
    )
    .returning({ id: examRecords.id });
  return deleted ?? null;
}

export async function findExamDocument(userId: string, documentId: string) {
  const [document] = await onboardingDb
    .select()
    .from(examDocuments)
    .where(and(eq(examDocuments.id, documentId), eq(examDocuments.userId, userId)))
    .limit(1);
  return document ?? null;
}
