ALTER TABLE "courses" ALTER COLUMN "name" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "description" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "name" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "description" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "image_url" text;