ALTER TABLE "professional_profiles" DROP COLUMN "work_arrangement";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "contract_type";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "housing_available";--> statement-breakpoint
DROP TYPE "public"."contract_type";--> statement-breakpoint
DROP TYPE "public"."work_arrangement";