import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";

import {
  assessmentStatus,
  contentKinds,
  examDocuments,
  examRecords,
  evaluationStatus,
  assessmentEvaluationStages,
  assessmentEvaluationStatuses,
  assessmentEvaluations,
  goals,
  speakingSubmissions,
  studentProfiles,
  user,
  writingSubmissions,
} from "./schema";

describe("domain enums", () => {
  it("keeps persisted workflow values stable", () => {
    expect(assessmentStatus).toEqual([
      "draft",
      "in_progress",
      "submitted",
      "completed",
    ]);
    expect(evaluationStatus).toEqual([
      "queued",
      "processing",
      "completed",
      "failed",
    ]);
    expect(assessmentEvaluationStatuses).toEqual([
      "queued",
      "processing",
      "completed",
      "failed",
    ]);
    expect(assessmentEvaluationStages).toEqual([
      "ai_initial_scoring",
      "teacher_calibration",
      "report_generation",
    ]);
    expect(contentKinds).toContain("writing_prompt");
  });
});

describe("authentication records", () => {
  it("persists required terms acceptance without exposing it as profile data", () => {
    const columns = getTableConfig(user).columns.map((column) => column.name);
    expect(columns).toContain("terms_accepted_at");
  });
});

describe("submission version chains", () => {
  it("protects parent writing and speaking submissions with foreign keys", () => {
    expect(getTableConfig(writingSubmissions).foreignKeys).toHaveLength(3);
    expect(getTableConfig(speakingSubmissions).foreignKeys).toHaveLength(3);
  });
});

describe("onboarding records", () => {
  it("tracks progress, private documents and reference sources", () => {
    expect(getTableConfig(studentProfiles).columns.map((column) => column.name)).toContain(
      "onboarding_completed_at",
    );
    expect(getTableConfig(examDocuments).columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        "object_key",
        "sha256",
        "document_kind",
        "parse_status",
        "extracted_fields",
      ]),
    );
    expect(getTableConfig(examRecords).columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        "source_type",
        "parse_status",
        "source_document_id",
        "confirmed_by_user_at",
      ]),
    );
    expect(getTableConfig(goals).columns.map((column) => column.name)).toContain(
      "minimum_skills",
    );
  });
});

describe("assessment evaluation pipeline", () => {
  it("tracks one queued scoring job per submitted diagnostic", () => {
    const table = getTableConfig(assessmentEvaluations);
    expect(table.columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        "assessment_id",
        "user_id",
        "status",
        "stage",
        "rubric_version",
        "provider",
        "model",
        "queued_at",
        "teacher_calibration_requested_at",
        "report_summary",
      ]),
    );
    expect(table.foreignKeys).toHaveLength(2);
    expect(table.indexes.map((index) => index.config.name)).toContain(
      "assessment_evaluations_assessment_unique",
    );
  });
});
