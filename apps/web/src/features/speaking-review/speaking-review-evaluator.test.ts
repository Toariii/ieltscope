import { describe, expect, it } from "vitest";

import { evaluateSpeakingResponse } from "./speaking-review-evaluator";

describe("evaluateSpeakingResponse", () => {
  it("scores a Part 2 response transcript and returns text-based feedback", () => {
    const result = evaluateSpeakingResponse({
      part: "part2",
      prompt: "Describe a quiet place where you like to study.",
      transcript: [
        "I want to describe a small study room near my office.",
        "I usually go there after work because it is quiet and I can focus on my English.",
        "There are many books and some comfortable chairs, so I feel relaxed.",
        "But sometimes I stop for a long time because I cannot find exact words to explain my feeling.",
        "Overall, this place is useful for me because it help me build a regular study habit.",
      ].join(" "),
    });

    expect(result.wordCount).toBeGreaterThan(60);
    expect(result.overallScore).toBe(6);
    expect(result.overallRange).toBe("5.5–6.5");
    expect(result.rubricVersion).toBe("speaking-alpha-v1");
    expect(result.analysisMode).toBe("transcript_only");
    expect(result.criteria.map((criterion) => criterion.id)).toEqual([
      "fluency_coherence",
      "lexical_resource",
      "grammar_accuracy",
      "pronunciation",
    ]);
    expect(result.topPriorities).toContain("先补充 Part 2 的时间线和具体细节，减少泛泛描述。");
    expect(result.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          criterion: "grammar_accuracy",
          original: "it help me",
          suggestion: "it helps me",
        }),
        expect.objectContaining({
          criterion: "fluency_coherence",
          original: "I stop for a long time",
          suggestion: "I pause for a long time / I hesitate for several seconds",
        }),
      ]),
    );
  });
});
