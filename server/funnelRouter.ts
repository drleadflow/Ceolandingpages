import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { getWhop } from "./whop";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import {
  products,
  funnelOrders,
  funnelOrderItems,
  videoEvents,
  siteSettings,
} from "../drizzle/schema";
import { pushPurchaseToGHL, pushToZapier } from "./ghlWebhook";
import { fireFacebookCapi, getCapiPixelsForPage, fireHyrosSale, getHyrosPixelsForPage } from "./trackingService";
import { logger } from "./_core/logger";

/** Read checkout_test_mode from DB and return a properly configured Whop client */
async function getWhopWithTestMode() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, "checkout_test_mode")).limit(1);
  const isTestMode = setting?.value === "true" ? true : setting?.value === "false" ? false : undefined;
  return { whop: getWhop(isTestMode), isTestMode: isTestMode ?? ENV.whopSandbox };
}

export const funnelRouter = router({
  checkout: router({
    /**
     * Create a Whop checkout configuration for the $197 course.
     * Uses embedded checkout with setupFutureUsage for one-click upsells.
     */
    createCheckout: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          firstName: z.string().min(1),
          phone: z.string().optional(),
          productSlug: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const { whop, isTestMode } = await getWhopWithTestMode();

        // Get the requested product (defaults to fb-ads-course for backward compat)
        const slug = input.productSlug ?? "fb-ads-course";
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.slug, slug))
          .limit(1);

        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }

        // Create order in our DB
        const orderResult = await db.insert(funnelOrders).values({
          email: input.email,
          firstName: input.firstName,
          phone: input.phone ?? null,
          status: "pending",
          totalInCents: 0,
        });
        const orderId = Number(orderResult[0].insertId);

        // Create order item
        await db.insert(funnelOrderItems).values({
          orderId,
          productId: product.id,
          amountInCents: product.priceInCents,
          status: "pending",
        });

        // Create Whop checkout configuration
        // Use pre-created plan ID when available, fall back to inline plan creation
        // In sandbox/test mode, always use inline plan (production plan IDs don't exist in sandbox)
        const checkoutConfig = product.whopPlanId && !isTestMode
          ? await whop.checkoutConfigurations.create({
              plan_id: product.whopPlanId,
              metadata: {
                orderId: String(orderId),
                email: input.email,
                firstName: input.firstName,
                productSlug: slug,
              },
            })
          : await whop.checkoutConfigurations.create({
              plan: {
                company_id: isTestMode ? (ENV.whopSandboxCompanyId || ENV.whopCompanyId) : ENV.whopCompanyId,
                initial_price: product.priceInCents / 100,
                plan_type: "one_time",
                currency: "usd",
              },
              metadata: {
                orderId: String(orderId),
                email: input.email,
                firstName: input.firstName,
                productSlug: slug,
              },
            });

        return {
          checkoutConfigId: checkoutConfig.id,
          orderId,
          amount: product.priceInCents,
          sandbox: isTestMode,
        };
      }),

    /**
     * Called after Whop embedded checkout completes.
     * Confirms the purchase and stores member/payment info for upsells.
     */
    confirmPurchase: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          whopPaymentId: z.string().optional(),
          whopMemberId: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Look up member ID from the payment if not provided directly
        let memberId = input.whopMemberId ?? null;
        if (!memberId) {
          try {
            const { whop } = await getWhopWithTestMode();
            if (input.whopPaymentId) {
              // Try direct payment lookup
              const payment = await whop.payments.retrieve(input.whopPaymentId);
              memberId = payment.member?.id ?? null;
              logger.info({ paymentId: input.whopPaymentId, memberId }, "Resolved member ID from payment");
            }
            if (!memberId) {
              // Fallback: search recent payments by orderId metadata
              const payments = await whop.payments.list({
                company_id: ENV.whopCompanyId,
              });
              const match = payments?.data?.find(
                (p: any) => p.metadata?.orderId === String(input.orderId),
              );
              if (match) {
                memberId = match.member?.id ?? null;
                logger.info({ orderId: input.orderId, memberId }, "Resolved member ID from payment list search");
              }
            }
          } catch (err) {
            logger.error({ err, orderId: input.orderId }, "Failed to resolve member ID from Whop");
          }
        }

        // Update order with Whop member ID (used for upsell charges)
        await db
          .update(funnelOrders)
          .set({
            stripeCustomerId: memberId, // reusing column for whop member ID
            status: "completed",
          })
          .where(eq(funnelOrders.id, input.orderId));

        // Update order item
        await db
          .update(funnelOrderItems)
          .set({
            stripePaymentIntentId: input.whopPaymentId ?? null, // reusing column for whop payment ID
            status: "paid",
          })
          .where(eq(funnelOrderItems.orderId, input.orderId));

        // Calculate total
        const items = await db
          .select()
          .from(funnelOrderItems)
          .where(eq(funnelOrderItems.orderId, input.orderId));

        const total = items
          .filter((i) => i.status === "paid")
          .reduce((sum, i) => sum + i.amountInCents, 0);

        await db
          .update(funnelOrders)
          .set({ totalInCents: total })
          .where(eq(funnelOrders.id, input.orderId));

        // Push to GHL async
        const [order] = await db
          .select()
          .from(funnelOrders)
          .where(eq(funnelOrders.id, input.orderId))
          .limit(1);

        if (order) {
          pushPurchaseToGHL({
            firstName: order.firstName,
            email: order.email,
            phone: order.phone ?? undefined,
            tag: "fb-ads-course-buyer",
            product: "FB Ads Mastery Course",
            amount: 197,
          }).catch((err) => logger.error({ err }, "GHL push failed for course purchase"));

          pushToZapier({
            firstName: order.firstName,
            email: order.email,
            phone: order.phone ?? undefined,
            product: "FB Ads Mastery Course",
            amount: 197,
          }).catch((err) => logger.error({ err }, "Zapier push failed for course purchase"));

          // Fire Facebook CAPI for purchase
          getCapiPixelsForPage("sales").then((capiPixels) => {
            for (const px of capiPixels) {
              fireFacebookCapi(px.pixelId, px.accessToken, {
                eventName: "Purchase",
                email: order.email,
                phone: order.phone ?? undefined,
                firstName: order.firstName,
                value: 197,
                currency: "USD",
              }).catch((err) => logger.error({ err }, "CAPI fire failed for course purchase"));
            }
          }).catch((err) => logger.error({ err }, "Failed to get CAPI pixels for course"));

          // Fire Hyros sale for purchase
          getHyrosPixelsForPage("sales").then((hyrosPixels) => {
            for (const px of hyrosPixels) {
              fireHyrosSale(px.apiKey, {
                email: order.email,
                amount: 197,
                product: "FB Ads Mastery Course",
              }).catch((err) => logger.error({ err }, "Hyros sale failed for course purchase"));
            }
          }).catch((err) => logger.error({ err }, "Failed to get Hyros pixels for course"));
        }

        return { success: true };
      }),
  }),

  upsell: router({
    /**
     * One-click charge $997 using Whop stored payment method.
     */
    charge: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const { whop } = await getWhopWithTestMode();

        // Get order with stored member ID
        const [order] = await db
          .select()
          .from(funnelOrders)
          .where(eq(funnelOrders.id, input.orderId))
          .limit(1);

        const memberId = order?.stripeCustomerId; // reused column for whop member ID
        if (!memberId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No member ID on file" });
        }

        // Get vault product
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.slug, "ceo-vault"))
          .limit(1);

        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

        // Get stored payment methods for this member
        const paymentMethods = await whop.paymentMethods.list({
          member_id: memberId as any,
        });

        const pmList = paymentMethods?.data ?? [];
        if (pmList.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No payment method on file" });
        }

        // One-click charge using first stored payment method
        const payment = await whop.payments.create({
          company_id: ENV.whopCompanyId as any,
          member_id: memberId as any,
          payment_method_id: pmList[0].id as any,
          plan: {
            initial_price: product.priceInCents / 100,
            currency: "usd",
            plan_type: "one_time",
          },
          metadata: {
            orderId: String(input.orderId),
            productSlug: "ceo-vault",
          },
        });

        // Create order item
        await db.insert(funnelOrderItems).values({
          orderId: input.orderId,
          productId: product.id,
          stripePaymentIntentId: payment.id, // reused column
          amountInCents: product.priceInCents,
          status: "paid",
        });

        // Update order total
        await db
          .update(funnelOrders)
          .set({ totalInCents: order.totalInCents + product.priceInCents })
          .where(eq(funnelOrders.id, input.orderId));

        pushPurchaseToGHL({
          firstName: order.firstName,
          email: order.email,
          phone: order.phone ?? undefined,
          tag: "vault-member",
          product: "Health Pro CEO Vault",
          amount: 997,
        }).catch((err) => logger.error({ err }, "GHL push failed for vault purchase"));

        pushToZapier({
          firstName: order.firstName,
          email: order.email,
          phone: order.phone ?? undefined,
          product: "Health Pro CEO Vault",
          amount: 997,
        }).catch((err) => logger.error({ err }, "Zapier push failed for vault purchase"));

        // Fire Facebook CAPI for upsell
        getCapiPixelsForPage("upsell").then((capiPixels) => {
          for (const px of capiPixels) {
            fireFacebookCapi(px.pixelId, px.accessToken, {
              eventName: "Purchase",
              email: order.email,
              phone: order.phone ?? undefined,
              firstName: order.firstName,
              value: 997,
              currency: "USD",
            }).catch((err) => logger.error({ err }, "CAPI fire failed for vault purchase"));
          }
        }).catch((err) => logger.error({ err }, "Failed to get CAPI pixels for upsell"));

        // Fire Hyros sale for upsell
        getHyrosPixelsForPage("upsell").then((hyrosPixels) => {
          for (const px of hyrosPixels) {
            fireHyrosSale(px.apiKey, {
              email: order.email,
              amount: 997,
              product: "Health Pro CEO Vault",
            }).catch((err) => logger.error({ err }, "Hyros sale failed for vault purchase"));
          }
        }).catch((err) => logger.error({ err }, "Failed to get Hyros pixels for upsell"));

        return {
          success: true,
          paymentId: payment.id,
        };
      }),
  }),

  downsell: router({
    /**
     * One-click charge $297 using Whop stored payment method.
     */
    charge: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const { whop } = await getWhopWithTestMode();

        const [order] = await db
          .select()
          .from(funnelOrders)
          .where(eq(funnelOrders.id, input.orderId))
          .limit(1);

        const memberId = order?.stripeCustomerId;
        if (!memberId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No member ID on file" });
        }

        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.slug, "strategy-session"))
          .limit(1);

        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

        const paymentMethods = await whop.paymentMethods.list({
          member_id: memberId as any,
        });

        const pmList = paymentMethods?.data ?? [];
        if (pmList.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No payment method on file" });
        }

        const payment = await whop.payments.create({
          company_id: ENV.whopCompanyId as any,
          member_id: memberId as any,
          payment_method_id: pmList[0].id as any,
          plan: {
            initial_price: product.priceInCents / 100,
            currency: "usd",
            plan_type: "one_time",
          },
          metadata: {
            orderId: String(input.orderId),
            productSlug: "strategy-session",
          },
        });

        await db.insert(funnelOrderItems).values({
          orderId: input.orderId,
          productId: product.id,
          stripePaymentIntentId: payment.id,
          amountInCents: product.priceInCents,
          status: "paid",
        });

        await db
          .update(funnelOrders)
          .set({ totalInCents: order.totalInCents + product.priceInCents })
          .where(eq(funnelOrders.id, input.orderId));

        pushPurchaseToGHL({
          firstName: order.firstName,
          email: order.email,
          phone: order.phone ?? undefined,
          tag: "strategy-session-buyer",
          product: "Strategy Session",
          amount: 297,
        }).catch((err) => logger.error({ err }, "GHL push failed for session purchase"));

        // Fire Facebook CAPI for downsell
        getCapiPixelsForPage("downsell").then((capiPixels) => {
          for (const px of capiPixels) {
            fireFacebookCapi(px.pixelId, px.accessToken, {
              eventName: "Purchase",
              email: order.email,
              phone: order.phone ?? undefined,
              firstName: order.firstName,
              value: product.priceInCents / 100,
              currency: "USD",
            }).catch((err) => logger.error({ err }, "CAPI fire failed for session purchase"));
          }
        }).catch((err) => logger.error({ err }, "Failed to get CAPI pixels for downsell"));

        // Fire Hyros sale for downsell
        getHyrosPixelsForPage("downsell").then((hyrosPixels) => {
          for (const px of hyrosPixels) {
            fireHyrosSale(px.apiKey, {
              email: order.email,
              amount: product.priceInCents / 100,
              product: "Strategy Session",
            }).catch((err) => logger.error({ err }, "Hyros sale failed for session purchase"));
          }
        }).catch((err) => logger.error({ err }, "Failed to get Hyros pixels for downsell"));

        return {
          success: true,
          paymentId: payment.id,
        };
      }),
  }),

  order: router({
    get: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const [order] = await db
          .select()
          .from(funnelOrders)
          .where(eq(funnelOrders.id, input.orderId))
          .limit(1);

        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

        const items = await db
          .select({
            id: funnelOrderItems.id,
            productId: funnelOrderItems.productId,
            amountInCents: funnelOrderItems.amountInCents,
            status: funnelOrderItems.status,
            productName: products.name,
            productSlug: products.slug,
            productType: products.type,
          })
          .from(funnelOrderItems)
          .innerJoin(products, eq(funnelOrderItems.productId, products.id))
          .where(eq(funnelOrderItems.orderId, input.orderId));

        return {
          ...order,
          items,
        };
      }),
  }),

  video: router({
    trackEvent: publicProcedure
      .input(
        z.object({
          sessionId: z.string().min(1),
          pageSlug: z.string().min(1),
          videoUrl: z.string().optional(),
          eventType: z.enum([
            "video_play",
            "video_pause",
            "video_milestone_25",
            "video_milestone_50",
            "video_milestone_75",
            "video_milestone_100",
          ]),
          splitTestVariant: z.string().optional(),
          watchTimeSeconds: z.number().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        await db.insert(videoEvents).values({
          sessionId: input.sessionId,
          pageSlug: input.pageSlug,
          videoUrl: input.videoUrl ?? null,
          eventType: input.eventType,
          splitTestVariant: input.splitTestVariant ?? null,
          watchTimeSeconds: input.watchTimeSeconds ?? 0,
        });

        return { success: true };
      }),
  }),
});
