CREATE TYPE "public"."exam_document_parse_status" AS ENUM('processing', 'awaiting_confirmation', 'ready', 'needs_review', 'failed');--> statement-breakpoint
CREATE TYPE "public"."exam_record_source" AS ENUM('pdf', 'manual');--> statement-breakpoint
CREATE TABLE "exam_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"sha256" text NOT NULL,
	"document_kind" text DEFAULT 'unknown' NOT NULL,
	"parse_status" "exam_document_parse_status" DEFAULT 'processing' NOT NULL,
	"extracted_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"parser_version" text,
	"confirmed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_profiles" ALTER COLUMN "onboarding_step" SET DEFAULT 'status';--> statement-breakpoint
ALTER TABLE "exam_records" ADD COLUMN "source_type" "exam_record_source" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_records" ADD COLUMN "parse_status" "exam_document_parse_status" DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_records" ADD COLUMN "source_document_id" uuid;--> statement-breakpoint
ALTER TABLE "exam_records" ADD COLUMN "confirmed_by_user_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "minimum_skills" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "has_recent_scores" boolean;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exam_documents" ADD CONSTRAINT "exam_documents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exam_documents_user_hash_unique" ON "exam_documents" USING btree ("user_id","sha256");--> statement-breakpoint
CREATE INDEX "exam_documents_user_status_idx" ON "exam_documents" USING btree ("user_id","parse_status");--> statement-breakpoint
ALTER TABLE "exam_records" ADD CONSTRAINT "exam_records_source_document_id_exam_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."exam_documents"("id") ON DELETE set null ON UPDATE no action;
