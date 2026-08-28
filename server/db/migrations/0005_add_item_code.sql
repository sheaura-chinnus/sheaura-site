ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "item_code" varchar(50);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_item_code_idx" ON "products" ("item_code");--> statement-breakpoint
-- Backfill existing rows without an item code
UPDATE "products"
SET "item_code" = 'SH-' || UPPER(SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 6))
WHERE "item_code" IS NULL;
