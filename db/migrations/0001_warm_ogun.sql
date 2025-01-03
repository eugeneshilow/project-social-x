DROP TABLE "responses" CASCADE;--> statement-breakpoint
DROP TABLE "results" CASCADE;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "final_posts" jsonb;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "outputs" jsonb;