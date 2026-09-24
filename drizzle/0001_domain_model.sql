CREATE TYPE "public"."account_status" AS ENUM('ACTIVE', 'SUSPENDED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."actor_origin" AS ENUM('USER', 'ADMIN', 'SYSTEM', 'PAYMENT', 'PROVIDER');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('IDR');--> statement-breakpoint
CREATE TYPE "public"."ledger_direction" AS ENUM('CREDIT', 'DEBIT');--> statement-breakpoint
CREATE TYPE "public"."ledger_reference_type" AS ENUM('ORDER', 'PAYMENT', 'REFUND', 'RESERVATION', 'REFERRAL', 'PROMO', 'ADJUSTMENT', 'CORRECTION');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'EMAIL', 'WHATSAPP');--> statement-breakpoint
CREATE TYPE "public"."notification_state" AS ENUM('QUEUED', 'SENT', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('DRAFT', 'WAITING_PAYMENT', 'PAYMENT_PENDING', 'PAID', 'QUEUED', 'PROCESSING', 'PROVIDER_PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUND_PENDING', 'REFUNDED', 'MANUAL_REVIEW', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_category" AS ENUM('QRIS', 'VIRTUAL_ACCOUNT', 'EWALLET', 'RETAIL', 'WALLET');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('CREATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."pricing_scope" AS ENUM('GLOBAL', 'CATEGORY', 'BRAND', 'PRODUCT', 'PROVIDER');--> statement-breakpoint
CREATE TYPE "public"."event_processing_state" AS ENUM('RECEIVED', 'PROCESSING', 'PROCESSED', 'IGNORED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."promo_type" AS ENUM('FIXED_DISCOUNT', 'PERCENTAGE_DISCOUNT', 'CASHBACK', 'FREE_ADMIN_FEE');--> statement-breakpoint
CREATE TYPE "public"."promo_usage_action" AS ENUM('RESERVED', 'REDEEMED', 'RELEASED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."provider_attempt_status" AS ENUM('CREATED', 'SUBMITTED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."provider_health_state" AS ENUM('HEALTHY', 'DEGRADED', 'PAUSED', 'OFFLINE', 'MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."referral_state" AS ENUM('CLICKED', 'REGISTERED', 'QUALIFIED', 'REWARDED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."reservation_state" AS ENUM('RESERVED', 'SOLD', 'RELEASED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."setting_key" AS ENUM('PUBLIC_CONTACT', 'RECEIPT_COPY', 'CATALOG_PAGE_SIZE');--> statement-breakpoint
CREATE TYPE "public"."stacking_behavior" AS ENUM('EXCLUSIVE', 'ALLOW_STACK');--> statement-breakpoint
CREATE TYPE "public"."stock_state" AS ENUM('UNKNOWN', 'AVAILABLE', 'LIMITED', 'OUT_OF_STOCK');--> statement-breakpoint
CREATE TYPE "public"."sync_state" AS ENUM('RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."sync_type" AS ENUM('CATALOG', 'BALANCE', 'HEALTH');--> statement-breakpoint
CREATE TYPE "public"."wallet_bucket" AS ENUM('AVAILABLE', 'RESERVED');--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text,
	"membership_tier_id" uuid,
	"membership_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "membership_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"previous_tier_id" uuid,
	"new_tier_id" uuid,
	"reason_code" text NOT NULL,
	"origin" "actor_origin" NOT NULL,
	"actor_id" uuid,
	"effective_at" timestamp with time zone NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_history_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "membership_history_id_user_unique" UNIQUE("id","user_id"),
	CONSTRAINT "membership_change_distinct" CHECK ("membership_history"."previous_tier_id" IS DISTINCT FROM "membership_history"."new_tier_id")
);
--> statement-breakpoint
CREATE TABLE "membership_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"level" integer NOT NULL,
	"benefits" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_tiers_code_unique" UNIQUE("code"),
	CONSTRAINT "tiers_level_nonnegative" CHECK ("membership_tiers"."level" >= 0),
	CONSTRAINT "tiers_benefits_object" CHECK (jsonb_typeof("membership_tiers"."benefits") = 'object')
);
--> statement-breakpoint
CREATE TABLE "password_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_credentials_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "credentials_hash_encoding" CHECK ("password_credentials"."password_hash" LIKE '$argon2id$%')
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_digest" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_digest_unique" UNIQUE("token_digest"),
	CONSTRAINT "sessions_digest_sha256" CHECK ("sessions"."token_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "sessions_expiry_after_creation" CHECK ("sessions"."expires_at" > "sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_normalized" text,
	"phone_normalized" text,
	"email_verified_at" timestamp with time zone,
	"phone_verified_at" timestamp with time zone,
	"status" "account_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_normalized_unique" UNIQUE("email_normalized"),
	CONSTRAINT "users_phone_normalized_unique" UNIQUE("phone_normalized"),
	CONSTRAINT "users_identity_required" CHECK ("users"."email_normalized" IS NOT NULL OR "users"."phone_normalized" IS NOT NULL),
	CONSTRAINT "users_email_normalized" CHECK ("users"."email_normalized" = lower(btrim("users"."email_normalized")) AND length("users"."email_normalized") BETWEEN 3 AND 254 AND position('@' in "users"."email_normalized") > 1),
	CONSTRAINT "users_phone_e164" CHECK ("users"."phone_normalized" ~ '^[+][1-9][0-9]{7,14}$'),
	CONSTRAINT "users_verification_identity" CHECK (("users"."email_verified_at" IS NULL OR "users"."email_normalized" IS NOT NULL) AND ("users"."phone_verified_at" IS NULL OR "users"."phone_normalized" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"icon_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_input_schemas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"version" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "input_schema_code_version_unique" UNIQUE("code","version"),
	CONSTRAINT "input_schema_version_positive" CHECK ("product_input_schemas"."version" > 0),
	CONSTRAINT "input_definition_object" CHECK (jsonb_typeof("product_input_schemas"."definition") = 'object')
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid NOT NULL,
	"brand_id" uuid,
	"input_schema_id" uuid NOT NULL,
	"description" text,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"icon_ref" text,
	"cover_ref" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_metadata_object" CHECK (jsonb_typeof("products"."metadata") = 'object')
);
--> statement-breakpoint
CREATE TABLE "provider_health" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"state" "provider_health_state" NOT NULL,
	"latency_ms" integer,
	"success_rate_bps" integer,
	"pending_rate_bps" integer,
	"timeout_rate_bps" integer,
	"balance_idr" bigint,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"checked_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "health_latency_nonnegative" CHECK ("provider_health"."latency_ms" >= 0),
	CONSTRAINT "health_balance_nonnegative" CHECK ("provider_health"."balance_idr" >= 0),
	CONSTRAINT "health_success_bps_range" CHECK ("provider_health"."success_rate_bps" BETWEEN 0 AND 10000),
	CONSTRAINT "health_pending_bps_range" CHECK ("provider_health"."pending_rate_bps" BETWEEN 0 AND 10000),
	CONSTRAINT "health_timeout_bps_range" CHECK ("provider_health"."timeout_rate_bps" BETWEEN 0 AND 10000)
);
--> statement-breakpoint
CREATE TABLE "provider_skus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"external_sku" text NOT NULL,
	"cost_idr" bigint NOT NULL,
	"available" boolean DEFAULT false NOT NULL,
	"stock_state" "stock_state" DEFAULT 'UNKNOWN' NOT NULL,
	"stock_quantity" integer,
	"priority" integer DEFAULT 100 NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_sku_external_unique" UNIQUE("provider_id","external_sku"),
	CONSTRAINT "provider_sku_identity_unique" UNIQUE("id","provider_id","product_id"),
	CONSTRAINT "provider_sku_cost_nonnegative" CHECK ("provider_skus"."cost_idr" >= 0),
	CONSTRAINT "provider_sku_stock_nonnegative" CHECK ("provider_skus"."stock_quantity" >= 0),
	CONSTRAINT "provider_sku_priority_nonnegative" CHECK ("provider_skus"."priority" >= 0),
	CONSTRAINT "provider_sku_metadata_object" CHECK (jsonb_typeof("provider_skus"."metadata") = 'object')
);
--> statement-breakpoint
CREATE TABLE "provider_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"type" "sync_type" NOT NULL,
	"state" "sync_state" DEFAULT 'RUNNING' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"rows_discovered" integer DEFAULT 0 NOT NULL,
	"rows_changed" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"correlation_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_discovered_nonnegative" CHECK ("provider_syncs"."rows_discovered" >= 0),
	CONSTRAINT "sync_changed_nonnegative" CHECK ("provider_syncs"."rows_changed" >= 0),
	CONSTRAINT "sync_time_order" CHECK ("provider_syncs"."finished_at" IS NULL OR "provider_syncs"."started_at" IS NULL OR "provider_syncs"."finished_at" > "provider_syncs"."started_at"),
	CONSTRAINT "sync_terminal_timestamp" CHECK (("provider_syncs"."state" = 'RUNNING' AND "provider_syncs"."finished_at" IS NULL) OR ("provider_syncs"."state" <> 'RUNNING' AND "provider_syncs"."finished_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"display_name" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"operational_state" "provider_health_state" DEFAULT 'PAUSED' NOT NULL,
	"config_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "providers_code_unique" UNIQUE("code"),
	CONSTRAINT "provider_config_reference_format" CHECK ("providers"."config_reference" ~ '^[A-Z][A-Z0-9_]{0,63}$')
);
--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"provider_sku_id" uuid NOT NULL,
	"pricing_rule_id" uuid,
	"tier_id" uuid,
	"rule_name_snapshot" text,
	"tier_name_snapshot" text,
	"provider_code_snapshot" text NOT NULL,
	"external_sku_snapshot" text NOT NULL,
	"currency" "currency" DEFAULT 'IDR' NOT NULL,
	"provider_cost_idr" bigint NOT NULL,
	"public_price_idr" bigint NOT NULL,
	"tier_price_idr" bigint NOT NULL,
	"markup_idr" bigint NOT NULL,
	"markup_bps" integer NOT NULL,
	"promo_discount_idr" bigint DEFAULT 0 NOT NULL,
	"payment_fee_idr" bigint DEFAULT 0 NOT NULL,
	"gateway_cost_idr" bigint DEFAULT 0 NOT NULL,
	"cashback_idr" bigint DEFAULT 0 NOT NULL,
	"final_amount_idr" bigint NOT NULL,
	"expected_gross_margin_idr" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "snapshot_item_terms_unique" UNIQUE("id","product_id","final_amount_idr"),
	CONSTRAINT "snapshot_cost_nonnegative" CHECK ("price_snapshots"."provider_cost_idr" >= 0),
	CONSTRAINT "snapshot_public_nonnegative" CHECK ("price_snapshots"."public_price_idr" >= 0),
	CONSTRAINT "snapshot_tier_nonnegative" CHECK ("price_snapshots"."tier_price_idr" >= 0),
	CONSTRAINT "snapshot_discount_nonnegative" CHECK ("price_snapshots"."promo_discount_idr" >= 0),
	CONSTRAINT "snapshot_fee_nonnegative" CHECK ("price_snapshots"."payment_fee_idr" >= 0),
	CONSTRAINT "snapshot_gateway_cost_nonnegative" CHECK ("price_snapshots"."gateway_cost_idr" >= 0),
	CONSTRAINT "snapshot_cashback_nonnegative" CHECK ("price_snapshots"."cashback_idr" >= 0),
	CONSTRAINT "snapshot_final_nonnegative" CHECK ("price_snapshots"."final_amount_idr" >= 0),
	CONSTRAINT "snapshot_markup_bps_range" CHECK ("price_snapshots"."markup_bps" BETWEEN 0 AND 100000),
	CONSTRAINT "snapshot_discount_limit" CHECK ("price_snapshots"."promo_discount_idr" <= "price_snapshots"."tier_price_idr"),
	CONSTRAINT "snapshot_final_equation" CHECK ("price_snapshots"."final_amount_idr"::numeric = "price_snapshots"."tier_price_idr"::numeric - "price_snapshots"."promo_discount_idr"::numeric + "price_snapshots"."payment_fee_idr"::numeric),
	CONSTRAINT "snapshot_markup_equation" CHECK ("price_snapshots"."markup_idr"::numeric = "price_snapshots"."tier_price_idr"::numeric - "price_snapshots"."provider_cost_idr"::numeric),
	CONSTRAINT "snapshot_margin_equation" CHECK ("price_snapshots"."expected_gross_margin_idr"::numeric = "price_snapshots"."final_amount_idr"::numeric - "price_snapshots"."provider_cost_idr"::numeric - "price_snapshots"."gateway_cost_idr"::numeric - "price_snapshots"."cashback_idr"::numeric)
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"scope" "pricing_scope" NOT NULL,
	"category_id" uuid,
	"brand_id" uuid,
	"product_id" uuid,
	"provider_id" uuid,
	"tier_id" uuid,
	"fixed_markup_idr" bigint DEFAULT 0 NOT NULL,
	"markup_bps" integer DEFAULT 0 NOT NULL,
	"minimum_margin_idr" bigint DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_scope_target" CHECK ((("pricing_rules"."scope" = 'GLOBAL' AND num_nonnulls("pricing_rules"."category_id", "pricing_rules"."brand_id", "pricing_rules"."product_id", "pricing_rules"."provider_id") = 0) OR (num_nonnulls("pricing_rules"."category_id", "pricing_rules"."brand_id", "pricing_rules"."product_id", "pricing_rules"."provider_id") = 1 AND (("pricing_rules"."scope" = 'CATEGORY' AND "pricing_rules"."category_id" IS NOT NULL) OR ("pricing_rules"."scope" = 'BRAND' AND "pricing_rules"."brand_id" IS NOT NULL) OR ("pricing_rules"."scope" = 'PRODUCT' AND "pricing_rules"."product_id" IS NOT NULL) OR ("pricing_rules"."scope" = 'PROVIDER' AND "pricing_rules"."provider_id" IS NOT NULL))))),
	CONSTRAINT "pricing_fixed_nonnegative" CHECK ("pricing_rules"."fixed_markup_idr" >= 0),
	CONSTRAINT "pricing_margin_nonnegative" CHECK ("pricing_rules"."minimum_margin_idr" >= 0),
	CONSTRAINT "pricing_markup_bps_range" CHECK ("pricing_rules"."markup_bps" BETWEEN 0 AND 100000),
	CONSTRAINT "pricing_schedule" CHECK ("pricing_rules"."ends_at" IS NULL OR "pricing_rules"."starts_at" IS NULL OR "pricing_rules"."ends_at" > "pricing_rules"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"product_slug_snapshot" text NOT NULL,
	"input_schema_id" uuid NOT NULL,
	"target_ciphertext" text NOT NULL,
	"target_key_reference" text NOT NULL,
	"price_snapshot_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_final_amount_idr" bigint NOT NULL,
	"line_total_idr" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_price_snapshot_id_unique" UNIQUE("price_snapshot_id"),
	CONSTRAINT "order_item_line_unique" UNIQUE("order_id","line_number"),
	CONSTRAINT "order_item_attempt_identity_unique" UNIQUE("id","order_id","product_id"),
	CONSTRAINT "order_item_positive_counts" CHECK ("order_items"."quantity" > 0 AND "order_items"."line_number" > 0),
	CONSTRAINT "order_item_total_equation" CHECK ("order_items"."line_total_idr"::numeric = "order_items"."unit_final_amount_idr"::numeric * "order_items"."quantity"::numeric),
	CONSTRAINT "order_item_total_nonnegative" CHECK ("order_items"."line_total_idr" >= 0)
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"source" "actor_origin" NOT NULL,
	"reason_code" text NOT NULL,
	"actor_id" uuid,
	"correlation_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_status_history_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "order_history_state_changed" CHECK ("order_status_history"."from_status" IS DISTINCT FROM "order_status_history"."to_status")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_reference" uuid DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" text NOT NULL,
	"customer_id" uuid,
	"contact_email" text,
	"contact_phone" text,
	"currency" "currency" DEFAULT 'IDR' NOT NULL,
	"total_idr" bigint NOT NULL,
	"status" "order_status" DEFAULT 'DRAFT' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_public_reference_unique" UNIQUE("public_reference"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "orders_payment_terms_unique" UNIQUE("id","currency","total_idr"),
	CONSTRAINT "order_total_nonnegative" CHECK ("orders"."total_idr" >= 0),
	CONSTRAINT "order_contact_required" CHECK ("orders"."contact_email" IS NOT NULL OR "orders"."contact_phone" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "payment_event_processing" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"state" "event_processing_state" DEFAULT 'RECEIVED' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"processed_at" timestamp with time zone,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_processing_attempts_nonnegative" CHECK ("payment_event_processing"."attempt_count" >= 0),
	CONSTRAINT "payment_processing_completed_timestamp" CHECK ("payment_event_processing"."state" NOT IN ('PROCESSED', 'IGNORED') OR "payment_event_processing"."processed_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"gateway_code" text NOT NULL,
	"event_key" text NOT NULL,
	"event_type" text NOT NULL,
	"normalized_status" "payment_status" NOT NULL,
	"safe_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"correlation_id" uuid NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_event_dedup_unique" UNIQUE("gateway_code","event_key"),
	CONSTRAINT "payment_safe_payload_object" CHECK (jsonb_typeof("payment_events"."safe_payload") = 'object')
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"gateway_code" text NOT NULL,
	"gateway_reference" text,
	"idempotency_key" text NOT NULL,
	"method_code" text NOT NULL,
	"category" "payment_category" NOT NULL,
	"currency" "currency" DEFAULT 'IDR' NOT NULL,
	"amount_idr" bigint NOT NULL,
	"status" "payment_status" DEFAULT 'CREATED' NOT NULL,
	"expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "payment_gateway_reference_unique" UNIQUE("gateway_code","gateway_reference"),
	CONSTRAINT "payment_event_identity_unique" UNIQUE("id","order_id","gateway_code"),
	CONSTRAINT "payment_amount_nonnegative" CHECK ("payments"."amount_idr" >= 0)
);
--> statement-breakpoint
CREATE TABLE "provider_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"provider_sku_id" uuid NOT NULL,
	"attempt_reference" uuid DEFAULT gen_random_uuid() NOT NULL,
	"provider_transaction_reference" text,
	"status" "provider_attempt_status" DEFAULT 'CREATED' NOT NULL,
	"cost_idr" bigint NOT NULL,
	"submitted_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"terminal_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_attempts_attempt_reference_unique" UNIQUE("attempt_reference"),
	CONSTRAINT "attempt_provider_transaction_unique" UNIQUE("provider_id","provider_transaction_reference"),
	CONSTRAINT "attempt_event_identity_unique" UNIQUE("id","provider_id"),
	CONSTRAINT "attempt_cost_nonnegative" CHECK ("provider_attempts"."cost_idr" >= 0),
	CONSTRAINT "attempt_terminal_timestamp" CHECK (("provider_attempts"."status" IN ('SUCCESS', 'FAILED', 'CANCELLED') AND "provider_attempts"."terminal_at" IS NOT NULL) OR ("provider_attempts"."status" IN ('CREATED', 'SUBMITTED', 'PENDING') AND "provider_attempts"."terminal_at" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "provider_event_processing" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"state" "event_processing_state" DEFAULT 'RECEIVED' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"processed_at" timestamp with time zone,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_processing_attempts_nonnegative" CHECK ("provider_event_processing"."attempt_count" >= 0),
	CONSTRAINT "provider_processing_completed_timestamp" CHECK ("provider_event_processing"."state" NOT IN ('PROCESSED', 'IGNORED') OR "provider_event_processing"."processed_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "provider_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"event_key" text NOT NULL,
	"event_type" text NOT NULL,
	"normalized_status" "provider_attempt_status" NOT NULL,
	"safe_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"correlation_id" uuid NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_event_dedup_unique" UNIQUE("provider_id","event_key"),
	CONSTRAINT "provider_safe_payload_object" CHECK (jsonb_typeof("provider_events"."safe_payload") = 'object')
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_account_id" uuid NOT NULL,
	"currency" "currency" DEFAULT 'IDR' NOT NULL,
	"idempotency_key" text NOT NULL,
	"journal_reference" uuid NOT NULL,
	"reference_type" "ledger_reference_type" NOT NULL,
	"reference_id" uuid NOT NULL,
	"order_id" uuid,
	"direction" "ledger_direction" NOT NULL,
	"bucket" "wallet_bucket" DEFAULT 'AVAILABLE' NOT NULL,
	"amount_idr" bigint NOT NULL,
	"reason_code" text NOT NULL,
	"origin" "actor_origin" NOT NULL,
	"actor_id" uuid,
	"corrects_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "ledger_correction_identity_unique" UNIQUE("id","wallet_account_id","currency"),
	CONSTRAINT "ledger_amount_positive" CHECK ("ledger_entries"."amount_idr" > 0),
	CONSTRAINT "ledger_correction_not_self" CHECK ("ledger_entries"."corrects_entry_id" IS NULL OR "ledger_entries"."corrects_entry_id" <> "ledger_entries"."id"),
	CONSTRAINT "ledger_order_reference" CHECK ("ledger_entries"."reference_type" <> 'ORDER' OR ("ledger_entries"."order_id" IS NOT NULL AND "ledger_entries"."reference_id" = "ledger_entries"."order_id"))
);
--> statement-breakpoint
CREATE TABLE "wallet_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"currency" "currency" DEFAULT 'IDR' NOT NULL,
	"status" "account_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_user_currency_unique" UNIQUE("user_id","currency"),
	CONSTRAINT "wallet_currency_identity_unique" UNIQUE("id","currency")
);
--> statement-breakpoint
CREATE TABLE "flash_sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flash_sale_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"price_idr" bigint NOT NULL,
	"quota" integer NOT NULL,
	"per_user_limit" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flash_sale_product_unique" UNIQUE("flash_sale_id","product_id"),
	CONSTRAINT "flash_item_limits" CHECK ("flash_sale_items"."quota" > 0 AND "flash_sale_items"."per_user_limit" > 0 AND "flash_sale_items"."per_user_limit" <= "flash_sale_items"."quota"),
	CONSTRAINT "flash_price_nonnegative" CHECK ("flash_sale_items"."price_idr" >= 0)
);
--> statement-breakpoint
CREATE TABLE "flash_sale_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flash_sale_item_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"state" "reservation_state" DEFAULT 'RESERVED' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flash_sale_reservations_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "flash_reservation_order_unique" UNIQUE("flash_sale_item_id","order_id"),
	CONSTRAINT "flash_reservation_quantity_positive" CHECK ("flash_sale_reservations"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "flash_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flash_sale_schedule" CHECK ("flash_sales"."ends_at" IS NULL OR "flash_sales"."starts_at" IS NULL OR "flash_sales"."ends_at" > "flash_sales"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "promo_categories" (
	"promo_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "promo_categories_promo_id_category_id_pk" PRIMARY KEY("promo_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "promo_products" (
	"promo_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	CONSTRAINT "promo_products_promo_id_product_id_pk" PRIMARY KEY("promo_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "promo_tiers" (
	"promo_id" uuid NOT NULL,
	"tier_id" uuid NOT NULL,
	CONSTRAINT "promo_tiers_promo_id_tier_id_pk" PRIMARY KEY("promo_id","tier_id")
);
--> statement-breakpoint
CREATE TABLE "promo_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promo_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid,
	"action" "promo_usage_action" NOT NULL,
	"amount_idr" bigint NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_usages_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "promo_usage_order_action_unique" UNIQUE("promo_id","order_id","action"),
	CONSTRAINT "promo_usage_amount_nonnegative" CHECK ("promo_usages"."amount_idr" >= 0)
);
--> statement-breakpoint
CREATE TABLE "promos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "promo_type" NOT NULL,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"quota" integer,
	"per_user_limit" integer,
	"budget_idr" bigint,
	"minimum_purchase_idr" bigint DEFAULT 0 NOT NULL,
	"fixed_amount_idr" bigint,
	"discount_bps" integer,
	"maximum_discount_idr" bigint,
	"first_order_only" boolean DEFAULT false NOT NULL,
	"stacking" "stacking_behavior" DEFAULT 'EXCLUSIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promos_code_unique" UNIQUE("code"),
	CONSTRAINT "promo_code_normalized" CHECK ("promos"."code" ~ '^[A-Z0-9_-]{1,64}$'),
	CONSTRAINT "promo_schedule" CHECK ("promos"."ends_at" IS NULL OR "promos"."starts_at" IS NULL OR "promos"."ends_at" > "promos"."starts_at"),
	CONSTRAINT "promo_positive_limits" CHECK (("promos"."quota" IS NULL OR "promos"."quota" > 0) AND ("promos"."per_user_limit" IS NULL OR "promos"."per_user_limit" > 0)),
	CONSTRAINT "promo_value_for_type" CHECK (("promos"."type" IN ('FIXED_DISCOUNT', 'CASHBACK') AND "promos"."fixed_amount_idr" IS NOT NULL AND "promos"."fixed_amount_idr" > 0 AND "promos"."discount_bps" IS NULL) OR ("promos"."type" = 'PERCENTAGE_DISCOUNT' AND "promos"."fixed_amount_idr" IS NULL AND "promos"."discount_bps" IS NOT NULL AND "promos"."discount_bps" > 0) OR ("promos"."type" = 'FREE_ADMIN_FEE' AND "promos"."fixed_amount_idr" IS NULL AND "promos"."discount_bps" IS NULL)),
	CONSTRAINT "promo_budget_nonnegative" CHECK ("promos"."budget_idr" >= 0),
	CONSTRAINT "promo_minimum_nonnegative" CHECK ("promos"."minimum_purchase_idr" >= 0),
	CONSTRAINT "promo_maximum_nonnegative" CHECK ("promos"."maximum_discount_idr" >= 0),
	CONSTRAINT "promo_discount_bps_range" CHECK ("promos"."discount_bps" BETWEEN 0 AND 10000)
);
--> statement-breakpoint
CREATE TABLE "snapshot_promos" (
	"snapshot_id" uuid NOT NULL,
	"promo_id" uuid NOT NULL,
	"promo_code_snapshot" text NOT NULL,
	"discount_idr" bigint NOT NULL,
	"cashback_idr" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "snapshot_promos_snapshot_id_promo_id_pk" PRIMARY KEY("snapshot_id","promo_id"),
	CONSTRAINT "snapshot_promo_discount_nonnegative" CHECK ("snapshot_promos"."discount_idr" >= 0),
	CONSTRAINT "snapshot_promo_cashback_nonnegative" CHECK ("snapshot_promos"."cashback_idr" >= 0)
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"code" text NOT NULL,
	"status" "account_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_owner_id_unique" UNIQUE("owner_id"),
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code"),
	CONSTRAINT "referral_code_owner_identity_unique" UNIQUE("id","owner_id"),
	CONSTRAINT "referral_code_normalized" CHECK ("referral_codes"."code" ~ '^[A-Z0-9_-]{4,32}$')
);
--> statement-breakpoint
CREATE TABLE "referral_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_code_id" uuid NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referred_user_id" uuid,
	"order_id" uuid,
	"state" "referral_state" NOT NULL,
	"reward_idr" bigint,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_events_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "referral_order_state_unique" UNIQUE("referred_user_id","order_id","state"),
	CONSTRAINT "referral_not_self" CHECK ("referral_events"."referred_user_id" IS NULL OR "referral_events"."referred_user_id" <> "referral_events"."referrer_id"),
	CONSTRAINT "referral_user_after_click" CHECK ("referral_events"."state" = 'CLICKED' OR "referral_events"."referred_user_id" IS NOT NULL),
	CONSTRAINT "referral_qualification_order" CHECK ("referral_events"."state" IN ('CLICKED', 'REGISTERED') OR "referral_events"."order_id" IS NOT NULL),
	CONSTRAINT "referral_reward_state" CHECK (("referral_events"."state" IN ('REWARDED', 'REVERSED') AND "referral_events"."reward_idr" IS NOT NULL AND "referral_events"."reward_idr" > 0) OR ("referral_events"."state" NOT IN ('REWARDED', 'REVERSED') AND "referral_events"."reward_idr" IS NULL)),
	CONSTRAINT "referral_reward_nonnegative" CHECK ("referral_events"."reward_idr" >= 0)
);
--> statement-breakpoint
CREATE TABLE "admin_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"order_id" uuid,
	"user_id" uuid,
	"provider_id" uuid,
	"product_id" uuid,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_note_one_target" CHECK (num_nonnulls("admin_notes"."order_id", "admin_notes"."user_id", "admin_notes"."provider_id", "admin_notes"."product_id") = 1),
	CONSTRAINT "admin_note_length" CHECK (length("admin_notes"."note") BETWEEN 1 AND 2000)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"origin" "actor_origin" NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"request_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_metadata_object" CHECK (jsonb_typeof("audit_logs"."metadata") = 'object')
);
--> statement-breakpoint
CREATE TABLE "cms_banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slot" text NOT NULL,
	"title" text NOT NULL,
	"copy" text,
	"media_ref" text,
	"cta_label" text,
	"cta_path" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_banner_schedule" CHECK ("cms_banners"."ends_at" IS NULL OR "cms_banners"."starts_at" IS NULL OR "cms_banners"."ends_at" > "cms_banners"."starts_at"),
	CONSTRAINT "cms_cta_pair" CHECK (("cms_banners"."cta_label" IS NULL) = ("cms_banners"."cta_path" IS NULL)),
	CONSTRAINT "cms_cta_local_path" CHECK ("cms_banners"."cta_path" ~ '^/[^/]')
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"order_id" uuid,
	"channel" "notification_channel" NOT NULL,
	"template_code" text NOT NULL,
	"state" "notification_state" DEFAULT 'QUEUED' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "notification_sent_timestamp" CHECK ("notifications"."state" <> 'SENT' OR "notifications"."sent_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" "setting_key" NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key"),
	CONSTRAINT "system_setting_value_object" CHECK (jsonb_typeof("system_settings"."value") = 'object'),
	CONSTRAINT "system_setting_value_shape" CHECK (
  ("system_settings"."key" = 'PUBLIC_CONTACT' AND "system_settings"."value" ? 'email' AND jsonb_typeof("system_settings"."value"->'email') = 'string' AND ("system_settings"."value" - 'email' - 'phone') = '{}'::jsonb)
  OR ("system_settings"."key" = 'RECEIPT_COPY' AND "system_settings"."value" ? 'footer' AND jsonb_typeof("system_settings"."value"->'footer') = 'string' AND ("system_settings"."value" - 'footer') = '{}'::jsonb)
  OR ("system_settings"."key" = 'CATALOG_PAGE_SIZE' AND "system_settings"."value" ? 'count' AND jsonb_typeof("system_settings"."value"->'count') = 'number' AND ("system_settings"."value"->>'count') ~ '^[0-9]+$' AND ("system_settings"."value"->>'count')::numeric BETWEEN 12 AND 48 AND ("system_settings"."value" - 'count') = '{}'::jsonb))
);
--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_membership_tier_id_membership_tiers_id_fk" FOREIGN KEY ("membership_tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "membership_history" ADD CONSTRAINT "membership_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "membership_history" ADD CONSTRAINT "membership_history_previous_tier_id_membership_tiers_id_fk" FOREIGN KEY ("previous_tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "membership_history" ADD CONSTRAINT "membership_history_new_tier_id_membership_tiers_id_fk" FOREIGN KEY ("new_tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "membership_history" ADD CONSTRAINT "membership_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "password_credentials" ADD CONSTRAINT "password_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_input_schema_id_product_input_schemas_id_fk" FOREIGN KEY ("input_schema_id") REFERENCES "public"."product_input_schemas"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "provider_health" ADD CONSTRAINT "provider_health_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "provider_skus" ADD CONSTRAINT "provider_skus_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "provider_skus" ADD CONSTRAINT "provider_skus_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "provider_syncs" ADD CONSTRAINT "provider_syncs_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_pricing_rule_id_pricing_rules_id_fk" FOREIGN KEY ("pricing_rule_id") REFERENCES "public"."pricing_rules"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "snapshot_sku_product_provider_fk" FOREIGN KEY ("provider_sku_id","provider_id","product_id") REFERENCES "public"."provider_skus"("id","provider_id","product_id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_input_schema_id_product_input_schemas_id_fk" FOREIGN KEY ("input_schema_id") REFERENCES "public"."product_input_schemas"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_item_snapshot_terms_fk" FOREIGN KEY ("price_snapshot_id","product_id","unit_final_amount_idr") REFERENCES "public"."price_snapshots"("id","product_id","final_amount_idr") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_event_processing" ADD CONSTRAINT "payment_event_processing_event_id_payment_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."payment_events"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_event_payment_order_gateway_fk" FOREIGN KEY ("payment_id","order_id","gateway_code") REFERENCES "public"."payments"("id","order_id","gateway_code") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payment_order_terms_fk" FOREIGN KEY ("order_id","currency","amount_idr") REFERENCES "public"."orders"("id","currency","total_idr") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "provider_attempts" ADD CONSTRAINT "provider_attempts_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "provider_attempts" ADD CONSTRAINT "attempt_item_order_product_fk" FOREIGN KEY ("order_item_id","order_id","product_id") REFERENCES "public"."order_items"("id","order_id","product_id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "provider_attempts" ADD CONSTRAINT "attempt_sku_provider_product_fk" FOREIGN KEY ("provider_sku_id","provider_id","product_id") REFERENCES "public"."provider_skus"("id","provider_id","product_id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "provider_event_processing" ADD CONSTRAINT "provider_event_processing_event_id_provider_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."provider_events"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "provider_events" ADD CONSTRAINT "provider_event_attempt_provider_fk" FOREIGN KEY ("attempt_id","provider_id") REFERENCES "public"."provider_attempts"("id","provider_id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_wallet_currency_fk" FOREIGN KEY ("wallet_account_id","currency") REFERENCES "public"."wallet_accounts"("id","currency") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_correction_same_wallet_fk" FOREIGN KEY ("corrects_entry_id","wallet_account_id","currency") REFERENCES "public"."ledger_entries"("id","wallet_account_id","currency") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "flash_sale_items" ADD CONSTRAINT "flash_sale_items_flash_sale_id_flash_sales_id_fk" FOREIGN KEY ("flash_sale_id") REFERENCES "public"."flash_sales"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "flash_sale_items" ADD CONSTRAINT "flash_sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "flash_sale_reservations" ADD CONSTRAINT "flash_sale_reservations_flash_sale_item_id_flash_sale_items_id_fk" FOREIGN KEY ("flash_sale_item_id") REFERENCES "public"."flash_sale_items"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "flash_sale_reservations" ADD CONSTRAINT "flash_sale_reservations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "flash_sale_reservations" ADD CONSTRAINT "flash_sale_reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "promo_categories" ADD CONSTRAINT "promo_categories_promo_id_promos_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promos"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "promo_categories" ADD CONSTRAINT "promo_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "promo_products" ADD CONSTRAINT "promo_products_promo_id_promos_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promos"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "promo_products" ADD CONSTRAINT "promo_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "promo_tiers" ADD CONSTRAINT "promo_tiers_promo_id_promos_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promos"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "promo_tiers" ADD CONSTRAINT "promo_tiers_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "promo_usages" ADD CONSTRAINT "promo_usages_promo_id_promos_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promos"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "promo_usages" ADD CONSTRAINT "promo_usages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "promo_usages" ADD CONSTRAINT "promo_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "snapshot_promos" ADD CONSTRAINT "snapshot_promos_promo_id_promos_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promos"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "snapshot_promos" ADD CONSTRAINT "snapshot_promo_snapshot_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."price_snapshots"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_event_code_owner_fk" FOREIGN KEY ("referral_code_id","referrer_id") REFERENCES "public"."referral_codes"("id","owner_id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE INDEX "profiles_tier_idx" ON "customer_profiles" USING btree ("membership_tier_id");--> statement-breakpoint
CREATE INDEX "membership_history_user_date_idx" ON "membership_history" USING btree ("user_id","effective_at");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_roles_role_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "products_category_status_sort_idx" ON "products" USING btree ("category_id","status","sort_order");--> statement-breakpoint
CREATE INDEX "products_status_sort_idx" ON "products" USING btree ("status","sort_order");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "products_input_schema_idx" ON "products" USING btree ("input_schema_id");--> statement-breakpoint
CREATE INDEX "provider_health_provider_checked_idx" ON "provider_health" USING btree ("provider_id","checked_at");--> statement-breakpoint
CREATE INDEX "provider_skus_product_priority_idx" ON "provider_skus" USING btree ("product_id","priority");--> statement-breakpoint
CREATE INDEX "provider_syncs_provider_started_idx" ON "provider_syncs" USING btree ("provider_id","started_at");--> statement-breakpoint
CREATE INDEX "snapshot_product_idx" ON "price_snapshots" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "snapshot_provider_idx" ON "price_snapshots" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "snapshot_rule_idx" ON "price_snapshots" USING btree ("pricing_rule_id");--> statement-breakpoint
CREATE INDEX "snapshot_tier_idx" ON "price_snapshots" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "snapshot_sku_idx" ON "price_snapshots" USING btree ("provider_sku_id");--> statement-breakpoint
CREATE INDEX "pricing_scope_tier_priority_idx" ON "pricing_rules" USING btree ("scope","tier_id","priority");--> statement-breakpoint
CREATE INDEX "pricing_category_idx" ON "pricing_rules" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "pricing_brand_idx" ON "pricing_rules" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "pricing_product_idx" ON "pricing_rules" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "pricing_provider_idx" ON "pricing_rules" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_items_input_idx" ON "order_items" USING btree ("input_schema_id");--> statement-breakpoint
CREATE INDEX "order_history_order_occurred_idx" ON "order_status_history" USING btree ("order_id","occurred_at");--> statement-breakpoint
CREATE INDEX "orders_customer_created_idx" ON "orders" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "payment_processing_state_idx" ON "payment_event_processing" USING btree ("state","created_at");--> statement-breakpoint
CREATE INDEX "payment_events_payment_received_idx" ON "payment_events" USING btree ("payment_id","received_at");--> statement-breakpoint
CREATE INDEX "payment_events_order_idx" ON "payment_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_status_expiry_idx" ON "payments" USING btree ("status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_one_unresolved_or_success_per_item" ON "provider_attempts" USING btree ("order_item_id") WHERE "provider_attempts"."status" IN ('CREATED', 'SUBMITTED', 'PENDING', 'SUCCESS');--> statement-breakpoint
CREATE INDEX "attempts_order_idx" ON "provider_attempts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "attempts_sku_idx" ON "provider_attempts" USING btree ("provider_sku_id");--> statement-breakpoint
CREATE INDEX "attempts_pending_check_idx" ON "provider_attempts" USING btree ("status","last_checked_at");--> statement-breakpoint
CREATE INDEX "provider_processing_state_idx" ON "provider_event_processing" USING btree ("state","created_at");--> statement-breakpoint
CREATE INDEX "provider_events_attempt_received_idx" ON "provider_events" USING btree ("attempt_id","received_at");--> statement-breakpoint
CREATE INDEX "ledger_wallet_created_idx" ON "ledger_entries" USING btree ("wallet_account_id","created_at");--> statement-breakpoint
CREATE INDEX "ledger_order_idx" ON "ledger_entries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "ledger_journal_idx" ON "ledger_entries" USING btree ("journal_reference");--> statement-breakpoint
CREATE INDEX "ledger_reference_idx" ON "ledger_entries" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "ledger_correction_idx" ON "ledger_entries" USING btree ("corrects_entry_id");--> statement-breakpoint
CREATE INDEX "flash_items_product_idx" ON "flash_sale_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "flash_reservation_user_state_idx" ON "flash_sale_reservations" USING btree ("flash_sale_item_id","user_id","state");--> statement-breakpoint
CREATE INDEX "flash_reservation_expiry_idx" ON "flash_sale_reservations" USING btree ("state","expires_at");--> statement-breakpoint
CREATE INDEX "flash_reservation_order_idx" ON "flash_sale_reservations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "flash_sales_status_schedule_idx" ON "flash_sales" USING btree ("status","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "promo_categories_category_idx" ON "promo_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "promo_products_product_idx" ON "promo_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "promo_tiers_tier_idx" ON "promo_tiers" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "promo_usage_user_date_idx" ON "promo_usages" USING btree ("promo_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX "promo_usage_order_idx" ON "promo_usages" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "promos_status_schedule_idx" ON "promos" USING btree ("status","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "snapshot_promos_promo_idx" ON "snapshot_promos" USING btree ("promo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_registered_user_unique" ON "referral_events" USING btree ("referred_user_id") WHERE "referral_events"."state" = 'REGISTERED';--> statement-breakpoint
CREATE INDEX "referral_events_referrer_date_idx" ON "referral_events" USING btree ("referrer_id","created_at");--> statement-breakpoint
CREATE INDEX "referral_events_code_idx" ON "referral_events" USING btree ("referral_code_id");--> statement-breakpoint
CREATE INDEX "referral_events_order_idx" ON "referral_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "admin_notes_order_date_idx" ON "admin_notes" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "admin_notes_user_idx" ON "admin_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_notes_provider_idx" ON "admin_notes" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "admin_notes_product_idx" ON "admin_notes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "audit_entity_created_idx" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_actor_created_idx" ON "audit_logs" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_request_idx" ON "audit_logs" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "cms_banner_slot_enabled_idx" ON "cms_banners" USING btree ("slot","enabled");--> statement-breakpoint
CREATE INDEX "notifications_recipient_created_idx" ON "notifications" USING btree ("recipient_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_state_created_idx" ON "notifications" USING btree ("state","created_at");--> statement-breakpoint
CREATE INDEX "notifications_order_idx" ON "notifications" USING btree ("order_id");