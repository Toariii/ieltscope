import {
  validateGoalInput,
  type GoalInput,
  type OnboardingStep,
  type StatusInput,
} from "@ielts/contracts";

export type OnboardingDraft = {
  step: OnboardingStep;
  status: StatusInput | null;
  goal: GoalInput | null;
  completedAt: Date | null;
  recordsCount: number;
};

export type OnboardingRepository = {
  getDraft(userId: string): Promise<OnboardingDraft>;
  saveStatus(userId: string, value: StatusInput): Promise<void>;
  saveGoal(userId: string, value: GoalInput): Promise<void>;
  completeInTransaction(userId: string): Promise<void>;
};

type OnboardingServiceOptions = {
  now?: () => Date;
};

export function createOnboardingService(
  repository: OnboardingRepository,
  options: OnboardingServiceOptions = {},
) {
  const now = options.now ?? (() => new Date());

  return {
    getDraft(userId: string) {
      return repository.getDraft(userId);
    },

    async saveStatus(userId: string, value: StatusInput) {
      await repository.saveStatus(userId, value);
      return { ok: true as const };
    },

    async saveGoal(userId: string, value: GoalInput) {
      const validation = validateGoalInput(value, now());
      if (!validation.ok) {
        return { ok: false as const, errors: validation.errors };
      }

      await repository.saveGoal(userId, value);
      return { ok: true as const };
    },

    async complete(userId: string) {
      const draft = await repository.getDraft(userId);
      if (!draft.status || !draft.goal) {
        throw new Error("档案信息尚未完成");
      }

      await repository.completeInTransaction(userId);
      return { ok: true as const };
    },
  };
}
