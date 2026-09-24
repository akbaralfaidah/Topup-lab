import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  boolean,
  jsonb,
  index,
  check,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { orders } from "./orders";
import { providers } from "./providers";
import { products } from "./catalog";
import {
  actorOrigin,
  notificationChannel,
  notificationState,
  settingKey,
} from "./enums";
import {
  id,
  instant,
  createdAt,
  timestamps,
  restrict,
  schedule,
  objectJson,
} from "./shared";
import type { AuditMetadata, SettingValue } from "./validation";

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, restrict),
    orderId: uuid("order_id").references(() => orders.id, restrict),
    channel: notificationChannel("channel").notNull(),
    templateCode: text("template_code").notNull(),
    state: notificationState("state").default("QUEUED").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    sentAt: instant("sent_at"),
    readAt: instant("read_at"),
    failureCode: text("failure_code"),
    ...timestamps(),
  },
  (t) => [
    index("notifications_recipient_created_idx").on(t.recipientId, t.createdAt),
    index("notifications_state_created_idx").on(t.state, t.createdAt),
    index("notifications_order_idx").on(t.orderId),
    check(
      "notification_sent_timestamp",
      sql`${t.state} <> 'SENT' OR ${t.sentAt} IS NOT NULL`,
    ),
  ],
);
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorId: uuid("actor_id").references(() => users.id, restrict),
    origin: actorOrigin("origin").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    metadata: jsonb("metadata").$type<AuditMetadata>().default({}).notNull(),
    requestId: uuid("request_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_entity_created_idx").on(t.entityType, t.entityId, t.createdAt),
    index("audit_actor_created_idx").on(t.actorId, t.createdAt),
    index("audit_request_idx").on(t.requestId),
    objectJson("audit_metadata_object", t.metadata),
  ],
);
export const adminNotes = pgTable(
  "admin_notes",
  {
    id: id(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, restrict),
    orderId: uuid("order_id").references(() => orders.id, restrict),
    userId: uuid("user_id").references(() => users.id, restrict),
    providerId: uuid("provider_id").references(() => providers.id, restrict),
    productId: uuid("product_id").references(() => products.id, restrict),
    note: text("note").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "admin_note_one_target",
      sql`num_nonnulls(${t.orderId}, ${t.userId}, ${t.providerId}, ${t.productId}) = 1`,
    ),
    check("admin_note_length", sql`length(${t.note}) BETWEEN 1 AND 2000`),
    index("admin_notes_order_date_idx").on(t.orderId, t.createdAt),
    index("admin_notes_user_idx").on(t.userId),
    index("admin_notes_provider_idx").on(t.providerId),
    index("admin_notes_product_idx").on(t.productId),
  ],
);
export const cmsBanners = pgTable(
  "cms_banners",
  {
    id: id(),
    name: text("name").notNull(),
    slot: text("slot").notNull(),
    title: text("title").notNull(),
    copy: text("copy"),
    mediaRef: text("media_ref"),
    ctaLabel: text("cta_label"),
    ctaPath: text("cta_path"),
    startsAt: instant("starts_at"),
    endsAt: instant("ends_at"),
    enabled: boolean("enabled").default(false).notNull(),
    ...timestamps(),
  },
  (t) => [
    schedule("cms_banner_schedule", t.startsAt, t.endsAt),
    index("cms_banner_slot_enabled_idx").on(t.slot, t.enabled),
    check(
      "cms_cta_pair",
      sql`(${t.ctaLabel} IS NULL) = (${t.ctaPath} IS NULL)`,
    ),
    check("cms_cta_local_path", sql`${t.ctaPath} ~ '^/[^/]'`),
  ],
);
export const systemSettings = pgTable(
  "system_settings",
  {
    id: id(),
    key: settingKey("key").notNull().unique(),
    value: jsonb("value").$type<SettingValue>().notNull(),
    updatedBy: uuid("updated_by").references(() => users.id, restrict),
    ...timestamps(),
  },
  (t) => [
    objectJson("system_setting_value_object", t.value),
    check(
      "system_setting_value_shape",
      sql`
  (${t.key} = 'PUBLIC_CONTACT' AND ${t.value} ? 'email' AND jsonb_typeof(${t.value}->'email') = 'string' AND (${t.value} - 'email' - 'phone') = '{}'::jsonb)
  OR (${t.key} = 'RECEIPT_COPY' AND ${t.value} ? 'footer' AND jsonb_typeof(${t.value}->'footer') = 'string' AND (${t.value} - 'footer') = '{}'::jsonb)
  OR (${t.key} = 'CATALOG_PAGE_SIZE' AND ${t.value} ? 'count' AND jsonb_typeof(${t.value}->'count') = 'number' AND (${t.value}->>'count') ~ '^[0-9]+$' AND (${t.value}->>'count')::numeric BETWEEN 12 AND 48 AND (${t.value} - 'count') = '{}'::jsonb)`,
    ),
  ],
);
