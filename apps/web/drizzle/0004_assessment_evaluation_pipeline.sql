CREATE TYPE "public"."assessment_evaluation_stage" AS ENUM('ai_initial_scoring', 'teacher_calibration', 'report_generation');--> statement-breakpoint
CREATE TYPE "public"."assessment_evaluation_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "assessment_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "assessment_evaluation_status" DEFAULT 'queued' NOT NULL,
	"stage" "assessment_evaluation_stage" DEFAULT 'ai_initial_scoring' NOT NULL,
	"rubric_version" text DEFAULT 'diagnostic-alpha-v1' NOT NULL,
	"provider" text,
	"model" text,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processing_started_at" timestamp with time zone,
	"teacher_calibration_requested_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_code" text,
	"report_summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_evaluations" ADD CONSTRAINT "assessment_evaluations_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_evaluations" ADD CONSTRAINT "assessment_evaluations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_evaluations_assessment_unique" ON "assessment_evaluations" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_evaluations_user_status_idx" ON "assessment_evaluations" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "assessment_evaluations_stage_idx" ON "assessment_evaluations" USING btree ("stage","status");