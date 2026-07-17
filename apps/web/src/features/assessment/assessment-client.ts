import type { AssessmentAnswerInput } from "@ielts/contracts";

import type { AssessmentSnapshot } from "./assessment-service";

async function parseAssessmentResponse(response: Response) {
  const payload = (await response.json()) as
    | { ok: true; data: AssessmentSnapshot }
    | { ok: false; error: { message: string; fields?: Record<string, string> } };

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

export const browserAssessmentApi = {
  async saveAnswer(value: AssessmentAnswerInput) {
    return parseAssessmentResponse(
      await fetch("/api/assessment/answers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(value),
      }),
    );
  },

  async submit() {
    return parseAssessmentResponse(await fetch("/api/assessment/submit", { method: "POST" }));
  },
};
