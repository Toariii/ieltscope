export class OnboardingHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "ONBOARDING_ERROR",
  ) {
    super(message);
    this.name = "OnboardingHttpError";
  }
}

type SessionLike = {
  user: { id: string };
} | null;

export function readStudentId(session: SessionLike) {
  if (!session?.user.id) {
    throw new OnboardingHttpError(401, "请先登录", "UNAUTHENTICATED");
  }
  return session.user.id;
}

export function assertOwnership(userId: string, resource: { userId: string }) {
  if (resource.userId !== userId) {
    throw new OnboardingHttpError(403, "无权访问该资源", "FORBIDDEN");
  }
}

export function onboardingErrorResponse(error: unknown) {
  if (error instanceof OnboardingHttpError) {
    return Response.json(
      { ok: false, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  return Response.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "操作失败，请稍后重试" } },
    { status: 500 },
  );
}
