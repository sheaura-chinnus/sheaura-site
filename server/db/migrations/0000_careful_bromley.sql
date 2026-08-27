DO $$ BEGIN
 CREATE TYPE "enquiry_status" AS ENUM('new', 'contacted', 'reserved', 'fulfilled', 'cancelled', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "product_availability" AS ENUM('available', 'low_stock', 'out_of_stock', 'discontinued');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "product_category" AS ENUM('jewellery', 'cosmetics', 'ornaments');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "product_mode" AS ENUM('sale', 'rental', 'both');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('user', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"preferred_contact" varchar(50),
	"event_date" timestamp with time zone,
	"return_date" timestamp with time zone,
	"delivery_pickup" varchar(50),
	"message" text,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enquiry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"mode" "product_mode" NOT NULL,
	"unit_price" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"alt_text" varchar(255),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"category_id" uuid NOT NULL,
	"description" text,
	"short_description" varchar(500),
	"tags" text[] DEFAULT '{}' NOT NULL,
	"mode" "product_mode" DEFAULT 'sale' NOT NULL,
	"sale_price" numeric(10, 2),
	"rental_price" numeric(10, 2),
	"rental_duration_days" integer,
	"deposit_amount" numeric(10, 2),
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"availability" "product_availability" DEFAULT 'available' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"care_instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"avatar_url" varchar(500),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_display_order_idx" ON "categories" ("display_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enquiries_email_idx" ON "enquiries" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enquiries_status_idx" ON "enquiries" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enquiries_created_at_idx" ON "enquiries" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enquiry_items_enquiry_idx" ON "enquiry_items" ("enquiry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enquiry_items_product_idx" ON "enquiry_items" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_images_product_idx" ON "product_images" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_images_display_order_idx" ON "product_images" ("product_id","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "products" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_published_idx" ON "products" ("is_published");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_featured_idx" ON "products" ("is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_availability_idx" ON "products" ("availability");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_key_idx" ON "site_settings" ("key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enquiry_items" ADD CONSTRAINT "enquiry_items_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enquiry_items" ADD CONSTRAINT "enquiry_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
