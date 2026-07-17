import { describe, expect, it } from "vitest";

import { evaluateWritingDraft } from "./writing-review-evaluator";

describe("evaluateWritingDraft", () => {
  it("scores a Task 2 draft and returns concrete correction evidence", () => {
    const result = evaluateWritingDraft({
      taskType: "task2",
      prompt: "Can online courses replace traditional classrooms?",
      text: [
        "Nowadays, many students choose online courses because they can study more flexible and save time on travelling.",
        "I partly agree that this method is useful, but it also bring some problems.",
        "If students learn at home for a long time, they may lose motivation because there are no teachers or classmates around them.",
        "Therefore, online learning is helpful, but schools still play an important role for young learners.",
      ].join("\n\n"),
    });

    expect(result.wordCount).toBeGreaterThan(60);
    expect(result.overallScore).toBe(6);
    expect(result.overallRange).toBe("5.5–6.5");
    expect(result.rubricVersion).toBe("writing-alpha-v1");
    expect(result.criteria).toHaveLength(4);
    expect(result.criteria.map((criterion) => criterion.id)).toEqual([
      "task_response",
      "coherence_cohesion",
      "lexical_resource",
      "grammar_accuracy",
    ]);
    expect(result.topPriorities).toContain("先修正会直接影响语法准确性的基础错误。");
    expect(result.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          criterion: "grammar_accuracy",
          original: "study more flexible",
          suggestion: "study more flexibly",
        }),
        expect.objectContaining({
          criterion: "grammar_accuracy",
          original: "also bring",
          suggestion: "also brings",
        }),
      ]),
    );
  });
});
