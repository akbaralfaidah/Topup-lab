import { pgEnum } from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", [
  "DRAFT",
  "WAITING_PAYMENT",
  "PAYMENT_PENDING",
  "PAID",
  "QUEUED",
  "PROCESSING",
  "PROVIDER_PENDING",
  "SUCCESS",
  "FAILED",
  "EXPIRED",
  "REFUND_PENDING",
  "REFUNDED",
  "MANUAL_REVIEW",
  "CANCELLED",
]);
export const accountStatus = pgEnum("account_status", [
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
]);
export const publicationStatus = pgEnum("publication_status", [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
]);
export const providerHealthState = pgEnum("provider_health_state", [
  "HEALTHY",
  "DEGRADED",
  "PAUSED",
  "OFFLINE",
  "MAINTENANCE",
]);
export const stockState = pgEnum("stock_state", [
  "UNKNOWN",
  "AVAILABLE",
  "LIMITED",
  "OUT_OF_STOCK",
]);
export const syncType = pgEnum("sync_type", ["CATALOG", "BALANCE", "HEALTH"]);
export const syncState = pgEnum("sync_state", [
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]);
export const pricingScope = pgEnum("pricing_scope", [
  "GLOBAL",
  "CATEGORY",
  "BRAND",
  "PRODUCT",
  "PROVIDER",
]);
export const paymentStatus = pgEnum("payment_status", [
  "CREATED",
  "PENDING",
  "PAID",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "REFUND_PENDING",
  "REFUNDED",
]);
export const paymentCategory = pgEnum("payment_category", [
  "QRIS",
  "VIRTUAL_ACCOUNT",
  "EWALLET",
  "RETAIL",
  "WALLET",
]);
export const processingState = pgEnum("event_processing_state", [
  "RECEIVED",
  "PROCESSING",
  "PROCESSED",
  "IGNORED",
  "FAILED",
]);
export const providerAttemptStatus = pgEnum("provider_attempt_status", [
  "CREATED",
  "SUBMITTED",
  "PENDING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
]);
export const actorOrigin = pgEnum("actor_origin", [
  "USER",
  "ADMIN",
  "SYSTEM",
  "PAYMENT",
  "PROVIDER",
]);
export const currency = pgEnum("currency", ["IDR"]);
export const ledgerDirection = pgEnum("ledger_direction", ["CREDIT", "DEBIT"]);
export const walletBucket = pgEnum("wallet_bucket", ["AVAILABLE", "RESERVED"]);
export const ledgerReferenceType = pgEnum("ledger_reference_type", [
  "ORDER",
  "PAYMENT",
  "REFUND",
  "RESERVATION",
  "REFERRAL",
  "PROMO",
  "ADJUSTMENT",
  "CORRECTION",
]);
export const promoType = pgEnum("promo_type", [
  "FIXED_DISCOUNT",
  "PERCENTAGE_DISCOUNT",
  "CASHBACK",
  "FREE_ADMIN_FEE",
]);
export const stackingBehavior = pgEnum("stacking_behavior", [
  "EXCLUSIVE",
  "ALLOW_STACK",
]);
export const promoUsageAction = pgEnum("promo_usage_action", [
  "RESERVED",
  "REDEEMED",
  "RELEASED",
  "REVERSED",
]);
export const reservationState = pgEnum("reservation_state", [
  "RESERVED",
  "SOLD",
  "RELEASED",
  "EXPIRED",
]);
export const referralState = pgEnum("referral_state", [
  "CLICKED",
  "REGISTERED",
  "QUALIFIED",
  "REWARDED",
  "REVERSED",
]);
export const notificationChannel = pgEnum("notification_channel", [
  "IN_APP",
  "EMAIL",
  "WHATSAPP",
]);
export const notificationState = pgEnum("notification_state", [
  "QUEUED",
  "SENT",
  "FAILED",
  "CANCELLED",
]);
export const settingKey = pgEnum("setting_key", [
  "PUBLIC_CONTACT",
  "RECEIPT_COPY",
  "CATALOG_PAGE_SIZE",
]);

export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type ProviderAttemptStatus =
  (typeof providerAttemptStatus.enumValues)[number];
export type ActorOrigin = (typeof actorOrigin.enumValues)[number];
