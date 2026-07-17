import type { ExamScoreInput, GoalInput, StatusInput } from "@ielts/contracts";

import type { OnboardingClientApi } from "./onboarding-wizard";
import type { OnboardingSnapshot } from "./onboarding-types";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; fields?: Record<string, string> } };

async function requestData<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const result = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !result.ok) {
    if (!result.ok && result.error.fields) {
      throw Object.assign(new Error(result.error.message), { fields: result.error.fields });
    }
    throw new Error(result.ok ? "操作失败" : result.error.message);
  }
  return result.data;
}

export const browserOnboardingApi: OnboardingClientApi = {
  saveStatus(value: StatusInput) {
    return requestData<OnboardingSnapshot>("/api/onboarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "status", value }),
    });
  },
  saveGoal(value: GoalInput) {
    return requestData<OnboardingSnapshot>("/api/onboarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "goal", value }),
    });
  },
  addManualRecord(value: ExamScoreInput) {
    return requestData<OnboardingSnapshot>("/api/onboarding/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
  },
  deleteManualRecord(id: string) {
    return requestData<OnboardingSnapshot>(`/api/onboarding/records?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  uploadDocument(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    return requestData<OnboardingSnapshot>("/api/onboarding/documents", {
      method: "POST",
      body: formData,
    });
  },
  confirmDocument(id: string, value: ExamScoreInput) {
    return requestData<OnboardingSnapshot>(`/api/onboarding/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
  },
  deleteDocument(id: string) {
    return requestData<OnboardingSnapshot>(`/api/onboarding/documents/${id}`, {
      method: "DELETE",
    });
  },
  async complete() {
    const result = await requestData<{ redirectTo: string }>("/api/onboarding/complete", {
      method: "POST",
    });
    window.location.assign(result.redirectTo);
  },
};
