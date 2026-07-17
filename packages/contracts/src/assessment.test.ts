import { describe, expect, it } from "vitest";

import {
  assessmentQuestionIds,
  assessmentSections,
  validateAssessmentAnswerInput,
  type AssessmentAnswerInput,
} from "./onboarding.js";

describe("assessment contract", () => {
  const validAnswer: AssessmentAnswerInput = {
    questionId: "vocab-context-1",
    section: "reading",
    value: "B",
    durationSeconds: 45,
  };

  it("defines a four-section diagnostic blueprint", () => {
    expect(assessmentSections.map((section) => section.id)).toEqual([
      "listening",
      "reading",
      "writing",
      "speaking",
    ]);
    expect(assessmentSections.reduce((sum, section) => sum + section.estimatedMinutes, 0)).toBe(60);
    expect(assessmentQuestionIds).toContain("speaking-part2-sample");
  });

  it("accepts a valid answer for a known question", () => {
    expect(validateAssessmentAnswerInput(validAnswer)).toEqual({ ok: true, errors: {} });
  });

  it("rejects section mismatches and empty responses", () => {
    const invalid = validateAssessmentAnswerInput({
      ...validAnswer,
      section: "listening",
      value: "",
    });

    expect(invalid.ok).toBe(false);
    expect(invalid.errors.section).toBeDefined();
    expect(invalid.errors.value).toBeDefined();
  });
});
