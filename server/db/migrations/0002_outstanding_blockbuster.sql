ALTER TABLE "enquiries" ADD COLUMN "assigned_to" uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enquiries_assigned_to_idx" ON "enquiries" ("assigned_to");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
