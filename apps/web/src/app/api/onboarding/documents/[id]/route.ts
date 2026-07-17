import { and, eq } from "drizzle-orm";

import { validateExamScoreInput, type ExamScoreInput } from "@ielts/contracts";

import { onboardingErrorResponse, OnboardingHttpError } from "@/features/onboarding/api-authorization";
import {
  confirmDocumentRecord,
  findExamDocument,
  getOnboardingSnapshot,
} from "@/features/onboarding/onboarding-data";
import {
  getAuthenticatedStudentId,
  getOnboardingObjectStore,
  onboardingDb,
} from "@/features/onboarding/onboarding-server";
import { examDocuments, examRecords } from "@/lib/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await getAuthenticatedStudentId();
    const { id } = await context.params;
    const document = await findExamDocument(userId, id);
    if (!document) throw new OnboardingHttpError(404, "文件不存在", "NOT_FOUND");
    const bytes = await getOnboardingObjectStore().get(document.objectKey);
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.originalFilename)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await getAuthenticatedStudentId();
    const { id } = await context.params;
    const input = (await request.json()) as ExamScoreInput;
    const validation = validateExamScoreInput(input);
    if (!validation.ok) {
      return Response.json(
        { ok: false, error: { code: "INVALID_RECORD", message: "请检查成绩记录", fields: validation.errors } },
        { status: 400 },
      );
    }
    const document = await confirmDocumentRecord(userId, id, input);
    if (!document) throw new OnboardingHttpError(404, "文件不存在", "NOT_FOUND");
    return Response.json({ ok: true, data: await getOnboardingSnapshot(userId) });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await getAuthenticatedStudentId();
    const { id } = await context.params;
    const document = await findExamDocument(userId, id);
    if (!document) throw new OnboardingHttpError(404, "文件不存在", "NOT_FOUND");
    await getOnboardingObjectStore().remove(document.objectKey);
    await onboardingDb.transaction(async (tx) => {
      await tx
        .delete(examRecords)
        .where(and(eq(examRecords.userId, userId), eq(examRecords.sourceDocumentId, id)));
      await tx
        .delete(examDocuments)
        .where(and(eq(examDocuments.userId, userId), eq(examDocuments.id, id)));
    });
    return Response.json({ ok: true, data: await getOnboardingSnapshot(userId) });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
