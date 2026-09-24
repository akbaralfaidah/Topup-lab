import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  unique,
  index,
  check,
} from "drizzle-orm/pg-core";
import { publicationStatus } from "./enums";
import { id, timestamps, createdAt, restrict, objectJson } from "./shared";
import type { InputDefinition, ProductMetadata } from "./validation";

export const categories = pgTable("categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  status: publicationStatus("status").default("DRAFT").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  iconRef: text("icon_ref"),
  ...timestamps(),
});
export const brands = pgTable("brands", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  status: publicationStatus("status").default("DRAFT").notNull(),
  ...timestamps(),
});
export const productInputSchemas = pgTable(
  "product_input_schemas",
  {
    id: id(),
    code: text("code").notNull(),
    version: integer("version").notNull(),
    definition: jsonb("definition").$type<InputDefinition>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("input_schema_code_version_unique").on(t.code, t.version),
    check("input_schema_version_positive", sql`${t.version} > 0`),
    objectJson("input_definition_object", t.definition),
  ],
);
export const products = pgTable(
  "products",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, restrict),
    brandId: uuid("brand_id").references(() => brands.id, restrict),
    inputSchemaId: uuid("input_schema_id")
      .notNull()
      .references(() => productInputSchemas.id, restrict),
    description: text("description"),
    status: publicationStatus("status").default("DRAFT").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    iconRef: text("icon_ref"),
    coverRef: text("cover_ref"),
    metadata: jsonb("metadata").$type<ProductMetadata>().default({}).notNull(),
    ...timestamps(),
  },
  (t) => [
    index("products_category_status_sort_idx").on(
      t.categoryId,
      t.status,
      t.sortOrder,
    ),
    index("products_status_sort_idx").on(t.status, t.sortOrder),
    index("products_brand_idx").on(t.brandId),
    index("products_input_schema_idx").on(t.inputSchemaId),
    objectJson("products_metadata_object", t.metadata),
  ],
);
