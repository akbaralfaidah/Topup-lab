import { and, eq, inArray } from "drizzle-orm";
import { getDatabase } from "@/server/db";
import * as s from "@/server/db/schema";
import { verifyQuoteToken } from "@/server/checkout/quote-token";
import { encryptTarget, decryptTarget } from "@/server/crypto/target";
import { currentSession } from "@/server/auth/session";
import {
  calculatePricing,
  addPaymentFee,
  type PricingRule,
} from "@/server/pricing/quote-math";
import { inputDefinitionSchema } from "@/server/db/schema/validation";
import { validateTarget } from "@/lib/target-input";

export type CheckoutRequest = {
  productSlug: string;
  paymentMethod: string;
  target: Record<string, string>;
  quoteToken: string;
  idempotencyKey: string;
};

export type CheckoutResponse =
  | { state: "created"; publicReference: string }
  | { state: "unauthorized" }
  | { state: "invalid_request"; errors?: Record<string, string> }
  | { state: "product_unavailable" }
  | { state: "quote_expired" }
  | { state: "price_changed"; newTotalIdr: string }
  | { state: "order_conflict" };

const paymentFees: Record<string, bigint> = {
  QRIS: 0n,
  VA: 2500n,
  EWALLET: 1500n,
};

export async function createOrder(
  request: CheckoutRequest,
): Promise<CheckoutResponse> {
  const quote = verifyQuoteToken(request.quoteToken);
  if (!quote) return { state: "quote_expired" };

  if (
    quote.productSlug !== request.productSlug ||
    quote.payment !== request.paymentMethod
  ) {
    return { state: "invalid_request" };
  }

  const session = await currentSession();
  const userId = session?.userId ?? null;
  // If guest, map to PUBLIC tier. Otherwise, mapped to user's tier.
  let tierId: string | null = null;

  const db = getDatabase().db;

  // Resolve user tier if logged in
  if (session && session.membership) {
    const userTier = await db
      .select({ id: s.membershipTiers.id })
      .from(s.membershipTiers)
      .where(eq(s.membershipTiers.name, session.membership))
      .limit(1);
    tierId = userTier[0]?.id ?? null;
  }

  if (!tierId) {
    const publicTier = await db
      .select({ id: s.membershipTiers.id })
      .from(s.membershipTiers)
      .where(
        and(
          eq(s.membershipTiers.code, "PUBLIC"),
          eq(s.membershipTiers.active, true),
        ),
      )
      .limit(1);
    tierId = publicTier[0]?.id ?? null;
  }

  if (!tierId) return { state: "product_unavailable" };

  // Resolve product and definition
  const productRows = await db
    .select({
      id: s.products.id,
      name: s.products.name,
      slug: s.products.slug,
      categoryId: s.products.categoryId,
      brandId: s.products.brandId,
      definition: s.productInputSchemas.definition,
      schemaId: s.productInputSchemas.id,
    })
    .from(s.products)
    .innerJoin(
      s.productInputSchemas,
      eq(s.products.inputSchemaId, s.productInputSchemas.id),
    )
    .where(
      and(
        eq(s.products.slug, request.productSlug),
        eq(s.products.status, "ACTIVE"),
      ),
    )
    .limit(1);

  const product = productRows[0];
  if (!product) return { state: "product_unavailable" };

  const parsedDef = inputDefinitionSchema.safeParse(product.definition);
  if (!parsedDef.success) return { state: "product_unavailable" };

  const targetValidation = validateTarget(parsedDef.data, request.target);
  if (!targetValidation.ok) {
    return { state: "invalid_request", errors: targetValidation.errors };
  }

  // Resolve best provider sku
  const skuRows = await db
    .select({
      id: s.providerSkus.id,
      providerId: s.providerSkus.providerId,
      costIdr: s.providerSkus.costIdr,
      priority: s.providerSkus.priority,
      externalSku: s.providerSkus.externalSku,
      providerCode: s.providers.code,
    })
    .from(s.providerSkus)
    .innerJoin(s.providers, eq(s.providerSkus.providerId, s.providers.id))
    .where(
      and(
        eq(s.providerSkus.productId, product.id),
        eq(s.providerSkus.enabled, true),
        eq(s.providerSkus.available, true),
        eq(s.providers.enabled, true),
        inArray(s.providers.operationalState, ["HEALTHY", "DEGRADED"]),
        inArray(s.providerSkus.stockState, ["AVAILABLE", "LIMITED", "UNKNOWN"]),
      ),
    );

  if (skuRows.length === 0) return { state: "product_unavailable" };

  const sku = skuRows.sort(
    (a, b) =>
      a.priority - b.priority ||
      (a.costIdr < b.costIdr ? -1 : a.costIdr > b.costIdr ? 1 : 0) ||
      a.id.localeCompare(b.id),
  )[0];

  if (!sku) return { state: "product_unavailable" };

  // Fetch applicable pricing rules
  const ruleRows = await db
    .select({
      id: s.pricingRules.id,
      name: s.pricingRules.name,
      scope: s.pricingRules.scope,
      categoryId: s.pricingRules.categoryId,
      brandId: s.pricingRules.brandId,
      productId: s.pricingRules.productId,
      providerId: s.pricingRules.providerId,
      tierId: s.pricingRules.tierId,
      fixedMarkupIdr: s.pricingRules.fixedMarkupIdr,
      markupBps: s.pricingRules.markupBps,
      minimumMarginIdr: s.pricingRules.minimumMarginIdr,
      active: s.pricingRules.active,
      priority: s.pricingRules.priority,
      startsAt: s.pricingRules.startsAt,
      endsAt: s.pricingRules.endsAt,
    })
    .from(s.pricingRules)
    .where(eq(s.pricingRules.active, true));

  const pricing = calculatePricing(sku.costIdr, ruleRows as PricingRule[], {
    productId: product.id,
    brandId: product.brandId,
    categoryId: product.categoryId,
    providerId: sku.providerId,
    tierId,
    referenceTime: new Date(),
  });

  if (!pricing) return { state: "product_unavailable" };

  const fee = paymentFees[request.paymentMethod] ?? 0n;
  const totalIdr = addPaymentFee(pricing.sellingPriceIdr, fee);

  if (totalIdr.toString() !== quote.totalIdr) {
    return { state: "price_changed", newTotalIdr: totalIdr.toString() };
  }

  // Idempotency check before heavy operations
  const existingRows = await db
    .select({
      orderId: s.orders.id,
      publicReference: s.orders.publicReference,
      customerId: s.orders.customerId,
      totalIdr: s.orders.totalIdr,
    })
    .from(s.orders)
    .where(eq(s.orders.idempotencyKey, request.idempotencyKey))
    .limit(1);

  if (existingRows.length > 0) {
    const existingOrder = existingRows[0]!;

    // Idempotency ownership
    if (existingOrder.customerId !== userId) {
      return { state: "order_conflict" };
    }

    // Logical request equivalence
    if (existingOrder.totalIdr !== totalIdr) {
      return { state: "order_conflict" };
    }

    const items = await db
      .select({
        productSlugSnapshot: s.orderItems.productSlugSnapshot,
        targetCiphertext: s.orderItems.targetCiphertext,
        targetKeyReference: s.orderItems.targetKeyReference,
      })
      .from(s.orderItems)
      .where(eq(s.orderItems.orderId, existingOrder.orderId))
      .limit(1);

    if (items.length !== 1) return { state: "order_conflict" };
    if (items[0]!.productSlugSnapshot !== request.productSlug) {
      return { state: "order_conflict" };
    }

    try {
      const decryptedTarget = decryptTarget(
        items[0]!.targetCiphertext,
        items[0]!.targetKeyReference,
      );
      if (decryptedTarget !== JSON.stringify(request.target)) {
        return { state: "order_conflict" };
      }
    } catch {
      return { state: "order_conflict" };
    }

    return {
      state: "created",
      publicReference: existingOrder.publicReference,
    };
  }

  const { ciphertext, keyReference } = encryptTarget(
    JSON.stringify(request.target),
  );

  try {
    const publicReference = await db.transaction(async (tx) => {
      // Create price snapshot
      const snapshotId = crypto.randomUUID();
      await tx.insert(s.priceSnapshots).values({
        id: snapshotId,
        productId: product.id,
        providerId: sku.providerId,
        providerSkuId: sku.id,
        pricingRuleId: pricing.commercialRule.id,
        tierId,
        ruleNameSnapshot: pricing.commercialRule.name,
        tierNameSnapshot: tierId ? "Tier" : "Public",
        providerCodeSnapshot: sku.providerCode,
        externalSkuSnapshot: sku.externalSku,
        providerCostIdr: sku.costIdr,
        publicPriceIdr: pricing.sellingPriceIdr,
        tierPriceIdr: pricing.sellingPriceIdr,
        markupIdr: pricing.sellingPriceIdr - sku.costIdr,
        markupBps: pricing.commercialRule.markupBps,
        promoDiscountIdr: 0n,
        paymentFeeIdr: fee,
        gatewayCostIdr: 0n,
        cashbackIdr: 0n,
        finalAmountIdr: totalIdr,
        expectedGrossMarginIdr: totalIdr - sku.costIdr,
      });

      // Create order
      const orderId = crypto.randomUUID();
      const pubRef = crypto.randomUUID();
      await tx.insert(s.orders).values({
        id: orderId,
        publicReference: pubRef,
        idempotencyKey: request.idempotencyKey,
        customerId: userId,
        contactEmail: session?.email ?? null,
        contactPhone: null, // Depending on profile, can be added later
        totalIdr: totalIdr,
        status: "WAITING_PAYMENT",
      });

      // Create order item
      await tx.insert(s.orderItems).values({
        orderId,
        lineNumber: 1,
        productId: product.id,
        productNameSnapshot: product.name,
        productSlugSnapshot: product.slug,
        inputSchemaId: product.schemaId,
        targetCiphertext: ciphertext,
        targetKeyReference: keyReference,
        priceSnapshotId: snapshotId,
        quantity: 1,
        unitFinalAmountIdr: pricing.sellingPriceIdr,
        lineTotalIdr: pricing.sellingPriceIdr,
      });

      // Insert initial history
      await tx.insert(s.orderStatusHistory).values({
        orderId,
        fromStatus: null,
        toStatus: "WAITING_PAYMENT",
        source: userId ? "USER" : "SYSTEM", // Or "CUSTOMER" if in enum, but enum has USER
        reasonCode: "ORDER_CREATED",
        actorId: userId,
        correlationId: crypto.randomUUID(),
        idempotencyKey: crypto.randomUUID(),
        occurredAt: new Date(),
      });

      return pubRef;
    });

    return { state: "created", publicReference };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      // Unique violation
      return { state: "order_conflict" };
    }
    throw error;
  }
}
