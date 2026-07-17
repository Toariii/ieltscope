import { describe, expect, it } from "vitest";

import {
  fromBandUnits,
  toBandUnits,
  validateExamScoreInput,
  validateGoalInput,
  type GoalInput,
} from "./onboarding.js";

const validGoal: GoalInput = {
  targetOverall: 7,
  targetExamDate: "2026-10-10",
  weeklyMinutes: 600,
  minimumSkills: { writing: 6.5 },
};

describe("IELTS band scores", () => {
  it("stores half-band values as integer units", () => {
    expect(toBandUnits(6.5)).toBe(13);
    expect(fromBandUnits(13)).toBe(6.5);
  });

  it("rejects scores outside the IELTS range or half-band steps", () => {
    expect(() => toBandUnits(6.25)).toThrow("0.5");
    expect(() => toBandUnits(9.5)).toThrow("0-9");
  });
});

describe("onboarding goal validation", () => {
  it("accepts a valid future goal", () => {
    expect(validateGoalInput(validGoal, new Date("2026-07-16T00:00:00Z"))).toEqual({
      ok: true,
      errors: {},
    });
  });

  it("rejects invalid targets, dates, time and skill requirements", () => {
    const result = validateGoalInput(
      {
        targetOverall: 5.25,
        targetExamDate: "2026-07-15",
        weeklyMinutes: 30,
        minimumSkills: { speaking: 6.25 },
      },
      new Date("2026-07-16T00:00:00Z"),
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual({
      targetOverall: "目标总分须为 5.5–9.0，并以 0.5 递增",
      targetExamDate: "考试日期必须晚于今天",
      weeklyMinutes: "每周学习时间须为 1–60 小时",
      "minimumSkills.speaking": "单科要求必须是合法雅思分数",
    });
  });
});

describe("exam reference validation", () => {
  it("requires a date and at least one valid score", () => {
    expect(
      validateExamScoreInput({
        examDate: "",
        overall: null,
        listening: null,
        reading: null,
        writing: null,
        speaking: null,
      }),
    ).toEqual({
      ok: false,
      errors: {
        examDate: "请填写考试日期",
        scores: "请至少填写一个分数",
      },
    });
  });

  it("rejects non-half-band scores", () => {
    const result = validateExamScoreInput({
      examDate: "2026-06-20",
      overall: 6.25,
      listening: null,
      reading: null,
      writing: null,
      speaking: null,
    });

    expect(result.errors.overall).toBe("分数必须为 0–9，并以 0.5 递增");
  });
});
