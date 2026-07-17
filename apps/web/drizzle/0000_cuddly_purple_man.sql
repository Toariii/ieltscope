CREATE TYPE "public"."annotation_status" AS ENUM('draft', 'submitted', 'adjudicated');--> statement-breakpoint
CREATE TYPE "public"."assessment_status" AS ENUM('draft', 'in_progress', 'submitted', 'completed');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('evaluation', 'model_improvement', 'public_display');--> statement-breakpoint
CREATE TYPE "public"."content_kind" AS ENUM('vocabulary', 'listening_question', 'reading_question', 'writing_prompt', 'speaking_prompt');--> statement-breakpoint
CREATE TYPE "public"."evaluation_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."redemption_status" AS ENUM('available', 'redeemed', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."skill" AS ENUM('listening', 'reading', 'writing', 'speaking');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('original', 'licensed', 'user_provided');--> statement-breakpoint
CREATE TYPE "public"."submission_kind" AS ENUM('writing', 'speaking');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'teacher', 'academic_lead', 'admin');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "annotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "submission_kind" NOT NULL,
	"writing_submission_id" uuid,
	"speaking_submission_id" uuid,
	"teacher_id" uuid NOT NULL,
	"status" "annotation_status" DEFAULT 'draft' NOT NULL,
	"criterion_scores" jsonb NOT NULL,
	"evidence" jsonb NOT NULL,
	"next_band_gaps" jsonb NOT NULL,
	"submitted_at" timestamp with time zone,
	"adjudicated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"content_item_id" uuid,
	"section" "skill" NOT NULL,
	"answer" jsonb NOT NULL,
	"duration_seconds" integer,
	"is_correct" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "assessment_status" DEFAULT 'draft' NOT NULL,
	"current_section" text,
	"started_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_item_id" uuid NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"response" jsonb,
	"outcome" jsonb,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "consent_type" NOT NULL,
	"granted" boolean NOT NULL,
	"policy_version" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "content_kind" NOT NULL,
	"title" text NOT NULL,
	"body" jsonb NOT NULL,
	"source_type" "source_type" NOT NULL,
	"rights_note" text NOT NULL,
	"skill_tags" text[] NOT NULL,
	"question_type" text,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "submission_kind" NOT NULL,
	"writing_submission_id" uuid,
	"speaking_submission_id" uuid,
	"status" "evaluation_status" DEFAULT 'queued' NOT NULL,
	"overall_low" integer,
	"overall_high" integer,
	"overall_score" integer,
	"confidence" numeric(4, 3),
	"criteria" jsonb,
	"top_priorities" jsonb,
	"failure_code" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"criterion" text NOT NULL,
	"message" text NOT NULL,
	"character_start" integer,
	"character_end" integer,
	"audio_start_ms" integer,
	"audio_end_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exam_date" timestamp with time zone NOT NULL,
	"overall_score" integer,
	"listening_score" integer,
	"reading_score" integer,
	"writing_score" integer,
	"speaking_score" integer,
	"source_document_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_exam_date" timestamp with time zone,
	"target_overall" integer NOT NULL,
	"target_listening" integer,
	"target_reading" integer,
	"target_writing" integer,
	"target_speaking" integer,
	"weekly_minutes" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"content_item_id" uuid,
	"event_type" text NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"outcome" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"rubric_version" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_microunits" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer,
	"response_digest" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"content_item_id" uuid,
	"skill" "skill" NOT NULL,
	"title" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"estimated_minutes" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redemption_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_digest" text NOT NULL,
	"display_suffix" text NOT NULL,
	"sku" text NOT NULL,
	"status" "redemption_status" DEFAULT 'available' NOT NULL,
	"activation_deadline" timestamp with time zone,
	"redeemed_by" uuid,
	"redeemed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"assessment_id" uuid,
	"skill" "skill" NOT NULL,
	"estimated_score" integer NOT NULL,
	"low_score" integer NOT NULL,
	"high_score" integer NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"rationale" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speaking_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"parent_submission_id" uuid,
	"object_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"duration_seconds" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"evaluation_consent" boolean NOT NULL,
	"model_improvement_consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"active_days" integer DEFAULT 0 NOT NULL,
	"longest_days" integer DEFAULT 0 NOT NULL,
	"last_active_date" text,
	"reward_cycle" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"timezone" text DEFAULT 'Asia/Shanghai' NOT NULL,
	"native_language" text DEFAULT 'zh-CN' NOT NULL,
	"weekly_minutes" integer,
	"onboarding_step" text DEFAULT 'profile' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"generation_input" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"parent_submission_id" uuid,
	"task_type" text NOT NULL,
	"text" text NOT NULL,
	"word_count" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"evaluation_consent" boolean NOT NULL,
	"model_improvement_consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_writing_submission_id_writing_submissions_id_fk" FOREIGN KEY ("writing_submission_id") REFERENCES "public"."writing_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_speaking_submission_id_speaking_submissions_id_fk" FOREIGN KEY ("speaking_submission_id") REFERENCES "public"."speaking_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_adjudicated_by_user_id_fk" FOREIGN KEY ("adjudicated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_writing_submission_id_writing_submissions_id_fk" FOREIGN KEY ("writing_submission_id") REFERENCES "public"."writing_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_speaking_submission_id_speaking_submissions_id_fk" FOREIGN KEY ("speaking_submission_id") REFERENCES "public"."speaking_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_records" ADD CONSTRAINT "exam_records_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_runs" ADD CONSTRAINT "model_runs_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_tasks" ADD CONSTRAINT "plan_tasks_plan_id_study_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."study_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_tasks" ADD CONSTRAINT "plan_tasks_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption_codes" ADD CONSTRAINT "redemption_codes_redeemed_by_user_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_estimates" ADD CONSTRAINT "skill_estimates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_estimates" ADD CONSTRAINT "skill_estimates_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_prompt_id_content_items_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_submissions" ADD CONSTRAINT "writing_submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_submissions" ADD CONSTRAINT "writing_submissions_prompt_id_content_items_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_unique" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "annotations_teacher_writing_unique" ON "annotations" USING btree ("teacher_id","writing_submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "annotations_teacher_speaking_unique" ON "annotations" USING btree ("teacher_id","speaking_submission_id");--> statement-breakpoint
CREATE INDEX "assessment_answers_assessment_idx" ON "assessment_answers" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessments_user_status_idx" ON "assessments" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "attempts_user_content_idx" ON "attempts" USING btree ("user_id","content_item_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "consent_records_user_type_idx" ON "consent_records" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "content_items_discovery_idx" ON "content_items" USING btree ("publication_status","kind","question_type");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_ledger_user_idempotency_unique" ON "credit_ledger" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "credit_ledger_user_created_idx" ON "credit_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "evaluations_writing_submission_idx" ON "evaluations" USING btree ("writing_submission_id");--> statement-breakpoint
CREATE INDEX "evaluations_speaking_submission_idx" ON "evaluations" USING btree ("speaking_submission_id");--> statement-breakpoint
CREATE INDEX "evidence_evaluation_idx" ON "evidence" USING btree ("evaluation_id");--> statement-breakpoint
CREATE INDEX "exam_records_user_date_idx" ON "exam_records" USING btree ("user_id","exam_date");--> statement-breakpoint
CREATE INDEX "goals_user_active_idx" ON "goals" USING btree ("user_id","active");--> statement-breakpoint
CREATE INDEX "learning_events_user_time_idx" ON "learning_events" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "memberships_user_status_idx" ON "memberships" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "model_runs_evaluation_idx" ON "model_runs" USING btree ("evaluation_id");--> statement-breakpoint
CREATE INDEX "plan_tasks_plan_schedule_idx" ON "plan_tasks" USING btree ("plan_id","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "redemption_codes_digest_unique" ON "redemption_codes" USING btree ("code_digest");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "skill_estimates_user_skill_idx" ON "skill_estimates" USING btree ("user_id","skill");--> statement-breakpoint
CREATE UNIQUE INDEX "speaking_submissions_user_idempotency_unique" ON "speaking_submissions" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "speaking_submissions_user_idx" ON "speaking_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "streaks_user_unique" ON "streaks" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_profiles_user_unique" ON "student_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_plans_user_status_idx" ON "study_plans" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "writing_submissions_user_idempotency_unique" ON "writing_submissions" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "writing_submissions_user_idx" ON "writing_submissions" USING btree ("user_id");