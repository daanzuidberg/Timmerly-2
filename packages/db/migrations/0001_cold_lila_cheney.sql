ALTER TABLE "applications" ADD COLUMN "requested_rate" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "required_pbm" text[] DEFAULT '{}' NOT NULL;