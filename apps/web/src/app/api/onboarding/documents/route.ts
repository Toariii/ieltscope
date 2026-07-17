import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { onboardingErrorResponse, OnboardingHttpError } from "@/features/onboarding/api-authorization";
import { parseExamPdf } from "@/features/onboarding/exam-document-parser";
import { inspectExamPdf } from "@/features/onboarding/exam-file";
import {
  countExamReferences,
  getOnboardingSnapshot,
} from "@/features/onboarding/onboarding-data";
import {
  getAuthenticatedStudentId,
  getOnboardingObjectStore,
  onboardingDb,
} from "@/features/onboarding/onboarding-server";
import { examDocuments } from "@/lib/db/schema";

export async function GET() {
  try {
    const userId = await getAuthenticatedStudentId();
    const snapshot = await getOnboardingSnapshot(userId);
    return Response.json({ ok: true, data: snapshot.documents });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedStudentId();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new OnboardingHttpError(400, "请选择 PDF 文件", "MISSING_FILE");
    }
    const inspected = await inspectExamPdf(file);
    const [duplicate] = await onboardingDb
      .select()
      .from(examDocuments)
      .where(and(eq(examDocuments.userId, userId), eq(examDocuments.sha256, inspected.sha256)))
      .limit(1);
    if (duplicate) {
      return Response.json({ ok: true, data: await getOnboardingSnapshot(userId), duplicate: true });
    }
    if ((await countExamReferences(userId)) >= 5) {
      throw new OnboardingHttpError(400, "最多添加 5 份考试记录", "RECORD_LIMIT");
    }

    const objectKey = `exam-records/${userId}/${randomUUID()}.pdf`;
    const store = getOnboardingObjectStore();
    await store.put(objectKey, inspected.bytes, "application/pdf");

    try {
      let parsed;
      try {
        parsed = await parseExamPdf(inspected.bytes);
      } catch (error) {
        parsed = {
          status: "failed" as const,
          fields: {},
          warnings: [error instanceof Error ? error.message : "PDF 解析失败"],
        };
      }
      await onboardingDb.insert(examDocuments).values({
        userId,
        objectKey,
        originalFilename: file.name,
        contentType: "application/pdf",
        byteSize: inspected.byteSize,
        sha256: inspected.sha256,
        documentKind: "reference",
        parseStatus: parsed.status,
        extractedFields: parsed.fields,
        parserVersion: "text-v1",
        reviewNote: parsed.warnings.join("；") || null,
      });
    } catch (error) {
      await store.remove(objectKey);
      throw error;
    }

    return Response.json({ ok: true, data: await getOnboardingSnapshot(userId) }, { status: 201 });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
