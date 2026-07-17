import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const assessmentStatus = [
  "draft",
  "in_progress",
  "submitted",
  "completed",
] as const;
export const evaluationStatus = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;
export const assessmentEvaluationStatuses = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;
export const assessmentEvaluationStages = [
  "ai_initial_scoring",
  "teacher_calibration",
  "report_generation",
] as const;
export const contentKinds = [
  "vocabulary",
  "listening_question",
  "reading_question",
  "writing_prompt",
  "speaking_prompt",
] as const;

export const userRoles = ["student", "teacher", "academic_lead", "admin"] as const;
export const skills = ["listening", "reading", "writing", "speaking"] as const;
export const publicationStatuses = ["draft", "published", "archived"] as const;
export const sourceTypes = ["original", "licensed", "user_provided"] as const;
export const submissionKinds = ["writing", "speaking"] as const;
export const membershipStatuses = ["active", "expired", "revoked"] as const;
export const redemptionStatuses = ["available", "redeemed", "expired", "revoked"] as const;
export const annotationStatuses = ["draft", "submitted", "adjudicated"] as const;
export const consentTypes = ["evaluation", "model_improvement", "public_display"] as const;
export const examRecordSources = ["pdf", "manual"] as const;
export const examDocumentParseStatuses = [
  "processing",
  "awaiting_confirmation",
  "ready",
  "needs_review",
  "failed",
] as const;

export const assessmentStatusEnum = pgEnum("assessment_status", assessmentStatus);
export const evaluationStatusEnum = pgEnum("evaluation_status", evaluationStatus);
export const assessmentEvaluationStatusEnum = pgEnum(
  "assessment_evaluation_status",
  assessmentEvaluationStatuses,
);
export const assessmentEvaluationStageEnum = pgEnum(
  "assessment_evaluation_stage",
  assessmentEvaluationStages,
);
export const contentKindEnum = pgEnum("content_kind", contentKinds);
export const userRoleEnum = pgEnum("user_role", userRoles);
export const skillEnum = pgEnum("skill", skills);
export const publicationStatusEnum = pgEnum("publication_status", publicationStatuses);
export const sourceTypeEnum = pgEnum("source_type", sourceTypes);
export const submissionKindEnum = pgEnum("submission_kind", submissionKinds);
export const membershipStatusEnum = pgEnum("membership_status", membershipStatuses);
export const redemptionStatusEnum = pgEnum("redemption_status", redemptionStatuses);
export const annotationStatusEnum = pgEnum("annotation_status", annotationStatuses);
export const consentTypeEnum = pgEnum("consent_type", consentTypes);
export const examRecordSourceEnum = pgEnum("exam_record_source", examRecordSources);
export const examDocumentParseStatusEnum = pgEnum(
  "exam_document_parse_status",
  examDocumentParseStatuses,
);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const user = pgTable(
  "user",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: userRoleEnum("role").default("student").notNull(),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_idx").on(table.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("account_provider_unique").on(table.providerId, table.accountId),
    index("account_user_idx").on(table.userId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const studentProfiles = pgTable(
  "student_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    timezone: text("timezone").default("Asia/Shanghai").notNull(),
    nativeLanguage: text("native_language").default("zh-CN").notNull(),
    weeklyMinutes: integer("weekly_minutes"),
    hasRecentScores: boolean("has_recent_scores"),
    onboardingStep: text("onboarding_step").default("status").notNull(),
    onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("student_profiles_user_unique").on(table.userId)],
);

export const examDocuments = pgTable(
  "exam_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    sha256: text("sha256").notNull(),
    documentKind: text("document_kind").default("unknown").notNull(),
    parseStatus: examDocumentParseStatusEnum("parse_status").default("processing").notNull(),
    extractedFields: jsonb("extracted_fields")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    parserVersion: text("parser_version"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("exam_documents_user_hash_unique").on(table.userId, table.sha256),
    index("exam_documents_user_status_idx").on(table.userId, table.parseStatus),
  ],
);

export const examRecords = pgTable(
  "exam_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    examDate: timestamp("exam_date", { withTimezone: true }).notNull(),
    overallScore: integer("overall_score"),
    listeningScore: integer("listening_score"),
    readingScore: integer("reading_score"),
    writingScore: integer("writing_score"),
    speakingScore: integer("speaking_score"),
    sourceDocumentKey: text("source_document_key"),
    sourceType: examRecordSourceEnum("source_type").default("manual").notNull(),
    parseStatus: examDocumentParseStatusEnum("parse_status").default("ready").notNull(),
    sourceDocumentId: uuid("source_document_id").references(() => examDocuments.id, {
      onDelete: "set null",
    }),
    confirmedByUserAt: timestamp("confirmed_by_user_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("exam_records_user_date_idx").on(table.userId, table.examDate)],
);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetExamDate: timestamp("target_exam_date", { withTimezone: true }),
    targetOverall: integer("target_overall").notNull(),
    targetListening: integer("target_listening"),
    targetReading: integer("target_reading"),
    targetWriting: integer("target_writing"),
    targetSpeaking: integer("target_speaking"),
    minimumSkills: jsonb("minimum_skills")
      .$type<Partial<Record<(typeof skills)[number], number>>>()
      .default({})
      .notNull(),
    weeklyMinutes: integer("weekly_minutes").notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [index("goals_user_active_idx").on(table.userId, table.active)],
);

export const contentItems = pgTable(
  "content_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: contentKindEnum("kind").notNull(),
    title: text("title").notNull(),
    body: jsonb("body").$type<Record<string, unknown>>().notNull(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    rightsNote: text("rights_note").notNull(),
    skillTags: text("skill_tags").array().notNull(),
    questionType: text("question_type"),
    publicationStatus: publicationStatusEnum("publication_status").default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("content_items_discovery_idx").on(
      table.publicationStatus,
      table.kind,
      table.questionType,
    ),
  ],
);

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: assessmentStatusEnum("status").default("draft").notNull(),
    currentSection: text("current_section"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("assessments_user_status_idx").on(table.userId, table.status)],
);

export const assessmentAnswers = pgTable(
  "assessment_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    contentItemId: uuid("content_item_id").references(() => contentItems.id),
    section: skillEnum("section").notNull(),
    answer: jsonb("answer").$type<Record<string, unknown>>().notNull(),
    durationSeconds: integer("duration_seconds"),
    isCorrect: boolean("is_correct"),
    ...timestamps,
  },
  (table) => [index("assessment_answers_assessment_idx").on(table.assessmentId)],
);

export const assessmentEvaluations = pgTable(
  "assessment_evaluations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: assessmentEvaluationStatusEnum("status").default("queued").notNull(),
    stage: assessmentEvaluationStageEnum("stage").default("ai_initial_scoring").notNull(),
    rubricVersion: text("rubric_version").default("diagnostic-alpha-v1").notNull(),
    provider: text("provider"),
    model: text("model"),
    queuedAt: timestamp("queued_at", { withTimezone: true }).defaultNow().notNull(),
    processingStartedAt: timestamp("processing_started_at", { withTimezone: true }),
    teacherCalibrationRequestedAt: timestamp("teacher_calibration_requested_at", {
      withTimezone: true,
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    failureCode: text("failure_code"),
    reportSummary: jsonb("report_summary").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("assessment_evaluations_assessment_unique").on(table.assessmentId),
    index("assessment_evaluations_user_status_idx").on(table.userId, table.status),
    index("assessment_evaluations_stage_idx").on(table.stage, table.status),
  ],
);

export const skillEstimates = pgTable(
  "skill_estimates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    assessmentId: uuid("assessment_id").references(() => assessments.id),
    skill: skillEnum("skill").notNull(),
    estimatedScore: integer("estimated_score").notNull(),
    lowScore: integer("low_score").notNull(),
    highScore: integer("high_score").notNull(),
    confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
    rationale: jsonb("rationale").$type<Record<string, unknown>>().notNull(),
    ...timestamps,
  },
  (table) => [index("skill_estimates_user_skill_idx").on(table.userId, table.skill)],
);

export const studyPlans = pgTable(
  "study_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id").references(() => goals.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: text("status").default("active").notNull(),
    generationInput: jsonb("generation_input").$type<Record<string, unknown>>().notNull(),
    ...timestamps,
  },
  (table) => [index("study_plans_user_status_idx").on(table.userId, table.status)],
);

export const planTasks = pgTable(
  "plan_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => studyPlans.id, { onDelete: "cascade" }),
    contentItemId: uuid("content_item_id").references(() => contentItems.id),
    skill: skillEnum("skill").notNull(),
    title: text("title").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    status: text("status").default("pending").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("plan_tasks_plan_schedule_idx").on(table.planId, table.scheduledAt)],
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id),
    status: text("status").default("in_progress").notNull(),
    response: jsonb("response").$type<Record<string, unknown>>(),
    outcome: jsonb("outcome").$type<Record<string, unknown>>(),
    durationSeconds: integer("duration_seconds").default(0).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("attempts_user_content_idx").on(table.userId, table.contentItemId)],
);

export const writingSubmissions = pgTable(
  "writing_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => contentItems.id),
    parentSubmissionId: uuid("parent_submission_id").references(
      (): AnyPgColumn => writingSubmissions.id,
      { onDelete: "set null" },
    ),
    taskType: text("task_type").notNull(),
    text: text("text").notNull(),
    wordCount: integer("word_count").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    evaluationConsent: boolean("evaluation_consent").notNull(),
    modelImprovementConsent: boolean("model_improvement_consent").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("writing_submissions_user_idempotency_unique").on(
      table.userId,
      table.idempotencyKey,
    ),
    index("writing_submissions_user_idx").on(table.userId),
  ],
);

export const speakingSubmissions = pgTable(
  "speaking_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => contentItems.id),
    parentSubmissionId: uuid("parent_submission_id").references(
      (): AnyPgColumn => speakingSubmissions.id,
      { onDelete: "set null" },
    ),
    objectKey: text("object_key").notNull(),
    mimeType: text("mime_type").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    evaluationConsent: boolean("evaluation_consent").notNull(),
    modelImprovementConsent: boolean("model_improvement_consent").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("speaking_submissions_user_idempotency_unique").on(
      table.userId,
      table.idempotencyKey,
    ),
    index("speaking_submissions_user_idx").on(table.userId),
  ],
);

export const evaluations = pgTable(
  "evaluations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: submissionKindEnum("kind").notNull(),
    writingSubmissionId: uuid("writing_submission_id").references(() => writingSubmissions.id),
    speakingSubmissionId: uuid("speaking_submission_id").references(() => speakingSubmissions.id),
    status: evaluationStatusEnum("status").default("queued").notNull(),
    overallLow: integer("overall_low"),
    overallHigh: integer("overall_high"),
    overallScore: integer("overall_score"),
    confidence: numeric("confidence", { precision: 4, scale: 3 }),
    criteria: jsonb("criteria").$type<Record<string, unknown>[]>(),
    topPriorities: jsonb("top_priorities").$type<string[]>(),
    failureCode: text("failure_code"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("evaluations_writing_submission_idx").on(table.writingSubmissionId),
    index("evaluations_speaking_submission_idx").on(table.speakingSubmissionId),
  ],
);

export const evidence = pgTable(
  "evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    evaluationId: uuid("evaluation_id")
      .notNull()
      .references(() => evaluations.id, { onDelete: "cascade" }),
    criterion: text("criterion").notNull(),
    message: text("message").notNull(),
    characterStart: integer("character_start"),
    characterEnd: integer("character_end"),
    audioStartMs: integer("audio_start_ms"),
    audioEndMs: integer("audio_end_ms"),
    ...timestamps,
  },
  (table) => [index("evidence_evaluation_idx").on(table.evaluationId)],
);

export const modelRuns = pgTable(
  "model_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    evaluationId: uuid("evaluation_id")
      .notNull()
      .references(() => evaluations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    rubricVersion: text("rubric_version").notNull(),
    inputTokens: integer("input_tokens").default(0).notNull(),
    outputTokens: integer("output_tokens").default(0).notNull(),
    costMicrounits: integer("cost_microunits").default(0).notNull(),
    latencyMs: integer("latency_ms"),
    responseDigest: text("response_digest"),
    ...timestamps,
  },
  (table) => [index("model_runs_evaluation_idx").on(table.evaluationId)],
);

export const annotations = pgTable(
  "annotations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: submissionKindEnum("kind").notNull(),
    writingSubmissionId: uuid("writing_submission_id").references(() => writingSubmissions.id),
    speakingSubmissionId: uuid("speaking_submission_id").references(() => speakingSubmissions.id),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => user.id),
    status: annotationStatusEnum("status").default("draft").notNull(),
    criterionScores: jsonb("criterion_scores").$type<Record<string, number>>().notNull(),
    evidence: jsonb("evidence").$type<Record<string, unknown>[]>().notNull(),
    nextBandGaps: jsonb("next_band_gaps").$type<Record<string, string>>().notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    adjudicatedBy: uuid("adjudicated_by").references(() => user.id),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("annotations_teacher_writing_unique").on(
      table.teacherId,
      table.writingSubmissionId,
    ),
    uniqueIndex("annotations_teacher_speaking_unique").on(
      table.teacherId,
      table.speakingSubmissionId,
    ),
  ],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    status: membershipStatusEnum("status").default("active").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("memberships_user_status_idx").on(table.userId, table.status)],
);

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("credit_ledger_user_idempotency_unique").on(
      table.userId,
      table.idempotencyKey,
    ),
    index("credit_ledger_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const redemptionCodes = pgTable(
  "redemption_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    codeDigest: text("code_digest").notNull(),
    displaySuffix: text("display_suffix").notNull(),
    sku: text("sku").notNull(),
    status: redemptionStatusEnum("status").default("available").notNull(),
    activationDeadline: timestamp("activation_deadline", { withTimezone: true }),
    redeemedBy: uuid("redeemed_by").references(() => user.id),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("redemption_codes_digest_unique").on(table.codeDigest)],
);

export const streaks = pgTable(
  "streaks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeDays: integer("active_days").default(0).notNull(),
    longestDays: integer("longest_days").default(0).notNull(),
    lastActiveDate: text("last_active_date"),
    rewardCycle: integer("reward_cycle").default(0).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("streaks_user_unique").on(table.userId)],
);

export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: consentTypeEnum("type").notNull(),
    granted: boolean("granted").notNull(),
    policyVersion: text("policy_version").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [index("consent_records_user_type_idx").on(table.userId, table.type)],
);

export const learningEvents = pgTable(
  "learning_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    skill: skillEnum("skill").notNull(),
    contentItemId: uuid("content_item_id").references(() => contentItems.id),
    eventType: text("event_type").notNull(),
    durationSeconds: integer("duration_seconds").default(0).notNull(),
    outcome: jsonb("outcome").$type<Record<string, unknown>>(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("learning_events_user_time_idx").on(table.userId, table.occurredAt)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("audit_logs_entity_idx").on(table.entityType, table.entityId)],
);
