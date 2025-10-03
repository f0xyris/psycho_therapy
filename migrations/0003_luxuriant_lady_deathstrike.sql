ALTER TABLE "appointments" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "client_name" varchar;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "client_phone" varchar;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "client_email" varchar;