import { z } from "zod";
import { eq, desc, sql, count, sum, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { router, adminProcedure, publicProcedure } from "./_core/trpc";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { checkRateLimit, getRateLimitIdentifier } from "./rateLimit";
import { buildAiSystemPrompt, validateAiSuggestions } from "./funnelAiPrompts";
import {
  products,
  funnelPageContent,
  funnelEvents,
  splitTests,
  funnelOrderItems,
  trackingPixels,
  muxAssets,
  videoEvents,
  siteSettings,
} from "../drizzle/schema";
import { createDirectUpload, getAssetStatus, listAssets, deleteAsset } from "./muxService";

// ── Variant assignment helpers ────────────────────────────────────────────────

function hashToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function assignVariant(
  sessionId: string,
  testId: number,
  variants: Array<{ id: string; weight: number }>,
): string {
  const hash = hashToNumber(`${sessionId}-${testId}`);
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let target = hash % totalWeight;
  for (const variant of variants) {
    target -= variant.weight;
    if (target < 0) return variant.id;
  }
  return variants[0].id;
}

// ── Date filter helper ────────────────────────────────────────────────────────

function buildDateFilters(
  input: { startDate?: string; endDate?: string },
  column: typeof funnelEvents.createdAt,
) {
  const filters = [];
  if (input.startDate) filters.push(sql`${column} >= ${input.startDate}`);
  if (input.endDate) filters.push(sql`${column} <= ${input.endDate}`);
  return filters;
}

// ── Router ────────────────────────────────────────────────────────────────────

export const funnelAdminRouter = router({

  // ── Products ──────────────────────────────────────────────────────────────

  products: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      return db.select().from(products).orderBy(desc(products.createdAt));
    }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const rows = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
        if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        return rows[0];
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          slug: z.string(),
          description: z.string().optional(),
          priceInCents: z.number(),
          type: z.enum(["course", "vault", "session"]),
          installmentCount: z.number().optional(),
          installmentAmountInCents: z.number().optional(),
          installmentIntervalDays: z.number().optional(),
          whopPlanId: z.string().optional(),
          metadata: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const result = await db.insert(products).values({
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          priceInCents: input.priceInCents,
          type: input.type,
          active: 1,
          installmentCount: input.installmentCount ?? null,
          installmentAmountInCents: input.installmentAmountInCents ?? null,
          installmentIntervalDays: input.installmentIntervalDays ?? null,
          whopPlanId: input.whopPlanId ?? null,
          metadata: input.metadata ?? null,
        });
        return { id: Number(result[0].insertId) };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          priceInCents: z.number().optional(),
          type: z.enum(["course", "vault", "session"]).optional(),
          active: z.number().optional(),
          installmentCount: z.number().optional(),
          installmentAmountInCents: z.number().optional(),
          installmentIntervalDays: z.number().optional(),
          whopPlanId: z.string().optional(),
          metadata: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { id, ...fields } = input;
        const updateSet: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) updateSet[key] = value;
        }
        if (Object.keys(updateSet).length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
        }
        await db.update(products).set(updateSet).where(eq(products.id, id));
        return { success: true };
      }),

    toggleActive: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const rows = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
        if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        const newActive = rows[0].active === 1 ? 0 : 1;
        await db.update(products).set({ active: newActive }).where(eq(products.id, input.id));
        return { active: newActive };
      }),
  }),

  // ── Pages ─────────────────────────────────────────────────────────────────

  pages: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      return db.select().from(funnelPageContent);
    }),

    get: adminProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const rows = await db.select().from(funnelPageContent).where(eq(funnelPageContent.pageSlug, input.slug)).limit(1);
        if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });
        return rows[0];
      }),

    getPublic: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const rows = await db.select().from(funnelPageContent).where(eq(funnelPageContent.pageSlug, input.slug)).limit(1);
        if (rows.length === 0) return null;
        return rows[0];
      }),

    update: adminProcedure
      .input(
        z.object({
          slug: z.string(),
          headline: z.string().optional(),
          subheadline: z.string().optional(),
          bodyText: z.string().optional(),
          ctaText: z.string().optional(),
          declineText: z.string().optional(),
          originalPrice: z.number().optional(),
          salePrice: z.number().optional(),
          valueStackItems: z.string().optional(),
          faqItems: z.string().optional(),
          heroImageUrl: z.string().optional(),
          videoUrl: z.string().optional(),
          videoOverlayStyle: z.string().optional(),
          senjaWidgetId: z.string().optional(),
          headerTrackingCode: z.string().optional(),
          bodyTrackingCode: z.string().optional(),
          isActive: z.number().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { slug, ...fields } = input;
        const draftBlob: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) draftBlob[key] = value;
        }

        const existing = await db.select({ id: funnelPageContent.id })
          .from(funnelPageContent)
          .where(eq(funnelPageContent.pageSlug, slug))
          .limit(1);

        if (existing.length > 0) {
          await db.update(funnelPageContent)
            .set({ draftContent: JSON.stringify(draftBlob) })
            .where(eq(funnelPageContent.pageSlug, slug));
        } else {
          await db.insert(funnelPageContent).values({
            pageSlug: slug,
            headline: null,
            subheadline: null,
            bodyText: null,
            ctaText: null,
            declineText: null,
            originalPrice: null,
            salePrice: null,
            valueStackItems: null,
            faqItems: null,
            heroImageUrl: null,
            videoUrl: null,
            videoOverlayStyle: null,
            senjaWidgetId: null,
            isActive: 1,
            draftContent: JSON.stringify(draftBlob),
          });
        }

        return { success: true };
      }),

    publish: adminProcedure
      .input(z.object({ slug: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const rows = await db.select().from(funnelPageContent)
          .where(eq(funnelPageContent.pageSlug, input.slug)).limit(1);
        if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });

        const page = rows[0];
        if (!page.draftContent) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No draft to publish" });
        }

        const draft = JSON.parse(page.draftContent) as Record<string, unknown>;
        const publishSet: Record<string, unknown> = { draftContent: null };
        const allowedFields = [
          "headline", "subheadline", "bodyText", "ctaText", "declineText",
          "originalPrice", "salePrice", "valueStackItems", "faqItems",
          "heroImageUrl", "videoUrl", "videoOverlayStyle", "senjaWidgetId",
          "headerTrackingCode", "bodyTrackingCode", "isActive",
        ];
        for (const field of allowedFields) {
          if (draft[field] !== undefined) publishSet[field] = draft[field];
        }

        await db.update(funnelPageContent).set(publishSet)
          .where(eq(funnelPageContent.pageSlug, input.slug));

        return { success: true };
      }),

    discardDraft: adminProcedure
      .input(z.object({ slug: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        await db.update(funnelPageContent)
          .set({ draftContent: null })
          .where(eq(funnelPageContent.pageSlug, input.slug));

        return { success: true };
      }),

    getPreview: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const rows = await db.select().from(funnelPageContent)
          .where(eq(funnelPageContent.pageSlug, input.slug)).limit(1);
        if (rows.length === 0) return null;

        const page = rows[0];
        if (page.draftContent) {
          const draft = JSON.parse(page.draftContent) as Record<string, unknown>;
          return { ...page, ...draft, draftContent: page.draftContent };
        }
        return page;
      }),
  }),

  // ── Analytics ─────────────────────────────────────────────────────────────

  analytics: router({
    overview: adminProcedure
      .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const dateFilters = buildDateFilters(input, funnelEvents.createdAt);

        const viewsConditions = [eq(funnelEvents.eventType, "page_view"), ...dateFilters];
        const purchasesConditions = [eq(funnelEvents.eventType, "purchase"), ...dateFilters];

        const [viewsResult] = await db
          .select({ total: count() })
          .from(funnelEvents)
          .where(and(...viewsConditions));

        const [purchasesResult] = await db
          .select({ total: count() })
          .from(funnelEvents)
          .where(and(...purchasesConditions));

        const orderDateFilters: ReturnType<typeof sql>[] = [];
        if (input.startDate) orderDateFilters.push(sql`${funnelOrderItems.createdAt} >= ${input.startDate}`);
        if (input.endDate) orderDateFilters.push(sql`${funnelOrderItems.createdAt} <= ${input.endDate}`);

        const revenueConditions = [
          eq(funnelOrderItems.status, "paid"),
          ...orderDateFilters,
        ];

        const [revenueResult] = await db
          .select({ total: sum(funnelOrderItems.amountInCents) })
          .from(funnelOrderItems)
          .where(and(...revenueConditions));

        const totalViews = viewsResult?.total ?? 0;
        const totalPurchases = purchasesResult?.total ?? 0;
        const totalRevenue = Number(revenueResult?.total ?? 0);
        const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

        return { totalViews, totalPurchases, totalRevenue, conversionRate };
      }),

    funnel: adminProcedure
      .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const steps = [
          "page_view",
          "checkout_start",
          "purchase",
          "upsell_view",
          "upsell_accept",
          "downsell_view",
          "downsell_accept",
        ] as const;

        const dateFilters = buildDateFilters(input, funnelEvents.createdAt);

        const results = await Promise.all(
          steps.map(async (step) => {
            const conditions = [eq(funnelEvents.eventType, step), ...dateFilters];
            const [row] = await db
              .select({ total: count() })
              .from(funnelEvents)
              .where(and(...conditions));
            return { step, count: row?.total ?? 0 };
          }),
        );

        return results;
      }),

    revenue: adminProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          groupBy: z.enum(["day", "week", "month"]),
        }),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const formatMap = { day: "%Y-%m-%d", week: "%Y-%u", month: "%Y-%m" } as const;
        const fmt = formatMap[input.groupBy];

        const dateFilters: ReturnType<typeof sql>[] = [];
        if (input.startDate) dateFilters.push(sql`${funnelOrderItems.createdAt} >= ${input.startDate}`);
        if (input.endDate) dateFilters.push(sql`${funnelOrderItems.createdAt} <= ${input.endDate}`);

        const conditions = [eq(funnelOrderItems.status, "paid"), ...dateFilters];

        const rows = await db
          .select({
            date: sql<string>`DATE_FORMAT(${funnelOrderItems.createdAt}, ${fmt})`,
            revenue: sum(funnelOrderItems.amountInCents),
          })
          .from(funnelOrderItems)
          .where(and(...conditions))
          .groupBy(sql`DATE_FORMAT(${funnelOrderItems.createdAt}, ${fmt})`)
          .orderBy(sql`DATE_FORMAT(${funnelOrderItems.createdAt}, ${fmt})`);

        return rows.map((r) => ({ date: r.date, revenue: Number(r.revenue ?? 0) }));
      }),

    splitTests: adminProcedure
      .input(z.object({ testId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const testRows = await db.select().from(splitTests).where(eq(splitTests.id, input.testId)).limit(1);
        if (testRows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Split test not found" });

        const test = testRows[0];
        const variants = JSON.parse(test.variants) as Array<{ id: string; name: string; weight: number }>;

        const stats = await Promise.all(
          variants.map(async (variant) => {
            const [viewsRow] = await db
              .select({ total: count() })
              .from(funnelEvents)
              .where(
                and(
                  eq(funnelEvents.eventType, "page_view"),
                  eq(funnelEvents.splitTestVariant, variant.id),
                ),
              );

            const [conversionsRow] = await db
              .select({ total: count() })
              .from(funnelEvents)
              .where(
                and(
                  eq(funnelEvents.eventType, "purchase"),
                  eq(funnelEvents.splitTestVariant, variant.id),
                ),
              );

            const views = viewsRow?.total ?? 0;
            const conversions = conversionsRow?.total ?? 0;
            const conversionRate = views > 0 ? (conversions / views) * 100 : 0;

            return { variantId: variant.id, views, conversions, conversionRate };
          }),
        );

        return stats;
      }),

    videoEngagement: adminProcedure
      .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const dateFilters: ReturnType<typeof sql>[] = [];
        if (input.startDate) dateFilters.push(sql`${videoEvents.createdAt} >= ${input.startDate}`);
        if (input.endDate) dateFilters.push(sql`${videoEvents.createdAt} <= ${input.endDate}`);

        const playConditions = [eq(videoEvents.eventType, "video_play"), ...dateFilters];
        const [playsResult] = await db.select({ total: count() }).from(videoEvents).where(and(...playConditions));

        const milestoneResults = await Promise.all(
          (["video_milestone_25", "video_milestone_50", "video_milestone_75", "video_milestone_100"] as const).map(async (milestone) => {
            const conditions = [eq(videoEvents.eventType, milestone), ...dateFilters];
            const [row] = await db.select({ total: count() }).from(videoEvents).where(and(...conditions));
            return { milestone, count: row?.total ?? 0 };
          }),
        );

        const avgWatchQuery = await db
          .select({ avg: sql<number>`AVG(${videoEvents.watchTimeSeconds})` })
          .from(videoEvents)
          .where(and(eq(videoEvents.eventType, "video_play"), ...dateFilters));

        const totalPlays = playsResult?.total ?? 0;
        const completions = milestoneResults.find(m => m.milestone === "video_milestone_100")?.count ?? 0;
        const completionRate = totalPlays > 0 ? (completions / totalPlays) * 100 : 0;
        const avgWatchTime = Math.round(avgWatchQuery[0]?.avg ?? 0);

        return {
          totalPlays,
          avgWatchTime,
          completionRate,
          milestones: milestoneResults,
        };
      }),

    videoByVariant: adminProcedure
      .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const dateFilters: ReturnType<typeof sql>[] = [];
        if (input.startDate) dateFilters.push(sql`${videoEvents.createdAt} >= ${input.startDate}`);
        if (input.endDate) dateFilters.push(sql`${videoEvents.createdAt} <= ${input.endDate}`);

        const rows = await db
          .select({
            variant: videoEvents.splitTestVariant,
            plays: sql<number>`SUM(CASE WHEN ${videoEvents.eventType} = 'video_play' THEN 1 ELSE 0 END)`,
            completions: sql<number>`SUM(CASE WHEN ${videoEvents.eventType} = 'video_milestone_100' THEN 1 ELSE 0 END)`,
            avgWatch: sql<number>`AVG(${videoEvents.watchTimeSeconds})`,
          })
          .from(videoEvents)
          .where(and(...dateFilters.length > 0 ? dateFilters : [sql`1=1`]))
          .groupBy(videoEvents.splitTestVariant);

        return rows.map(r => ({
          variant: r.variant ?? "default",
          plays: Number(r.plays ?? 0),
          completions: Number(r.completions ?? 0),
          completionRate: Number(r.plays) > 0 ? (Number(r.completions) / Number(r.plays)) * 100 : 0,
          avgWatchTime: Math.round(Number(r.avgWatch ?? 0)),
        }));
      }),
  }),

  // ── Split Tests ───────────────────────────────────────────────────────────

  splitTests: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      return db.select().from(splitTests).orderBy(desc(splitTests.createdAt));
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          pageSlug: z.string(),
          variants: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const result = await db.insert(splitTests).values({
          name: input.name,
          pageSlug: input.pageSlug,
          variants: input.variants,
          status: "draft",
        });
        return { id: Number(result[0].insertId) };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          variants: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const rows = await db.select().from(splitTests).where(eq(splitTests.id, input.id)).limit(1);
        if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Split test not found" });
        if (rows[0].status !== "draft") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Can only update draft split tests" });
        }

        const updateSet: Record<string, unknown> = {};
        if (input.name !== undefined) updateSet.name = input.name;
        if (input.variants !== undefined) updateSet.variants = input.variants;

        if (Object.keys(updateSet).length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
        }

        await db.update(splitTests).set(updateSet).where(eq(splitTests.id, input.id));
        return { success: true };
      }),

    start: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db.update(splitTests)
          .set({ status: "running", startedAt: new Date() })
          .where(eq(splitTests.id, input.id));
        return { success: true };
      }),

    complete: adminProcedure
      .input(z.object({ id: z.number(), winnerVariantId: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db.update(splitTests)
          .set({ status: "completed", completedAt: new Date(), winnerVariantId: input.winnerVariantId })
          .where(eq(splitTests.id, input.id));
        return { success: true };
      }),

    getVariant: publicProcedure
      .input(z.object({ pageSlug: z.string(), sessionId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const rows = await db.select().from(splitTests)
          .where(and(eq(splitTests.pageSlug, input.pageSlug), eq(splitTests.status, "running")))
          .limit(1);

        if (rows.length === 0) return null;

        const test = rows[0];
        const variants = JSON.parse(test.variants) as Array<{
          id: string;
          weight: number;
          contentOverrides?: Record<string, unknown>;
        }>;

        const variantId = assignVariant(input.sessionId, test.id, variants);
        const variant = variants.find((v) => v.id === variantId) ?? variants[0];

        return {
          testId: test.id,
          variantId: variant.id,
          contentOverrides: variant.contentOverrides ?? null,
        };
      }),
  }),

  // ── Tracking Pixels ───────────────────────────────────────────────────────

  tracking: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      return db.select().from(trackingPixels).orderBy(desc(trackingPixels.createdAt));
    }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const rows = await db.select().from(trackingPixels).where(eq(trackingPixels.id, input.id)).limit(1);
        if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Pixel not found" });
        return rows[0];
      }),

    getActive: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const rows = await db.select({
        id: trackingPixels.id,
        name: trackingPixels.name,
        platform: trackingPixels.platform,
        pixelId: trackingPixels.pixelId,
        isActive: trackingPixels.isActive,
        pageScope: trackingPixels.pageScope,
        eventMapping: trackingPixels.eventMapping,
      }).from(trackingPixels).where(eq(trackingPixels.isActive, 1));
      return rows;
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          platform: z.enum(["facebook", "google_analytics", "google_tag_manager", "tiktok", "hyros", "custom"]),
          pixelId: z.string().min(1),
          accessToken: z.string().optional(),
          pageScope: z.string().optional(),
          eventMapping: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const result = await db.insert(trackingPixels).values({
          name: input.name,
          platform: input.platform,
          pixelId: input.pixelId,
          accessToken: input.accessToken ?? null,
          isActive: 1,
          pageScope: input.pageScope ?? null,
          eventMapping: input.eventMapping ?? null,
        });
        return { id: Number(result[0].insertId) };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          platform: z.enum(["facebook", "google_analytics", "google_tag_manager", "tiktok", "hyros", "custom"]).optional(),
          pixelId: z.string().optional(),
          accessToken: z.string().optional(),
          pageScope: z.string().optional(),
          eventMapping: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { id, ...fields } = input;
        const updateSet: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) updateSet[key] = value;
        }
        if (Object.keys(updateSet).length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
        }
        await db.update(trackingPixels).set(updateSet).where(eq(trackingPixels.id, id));
        return { success: true };
      }),

    toggleActive: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const rows = await db.select().from(trackingPixels).where(eq(trackingPixels.id, input.id)).limit(1);
        if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Pixel not found" });
        const newActive = rows[0].isActive === 1 ? 0 : 1;
        await db.update(trackingPixels).set({ isActive: newActive }).where(eq(trackingPixels.id, input.id));
        return { active: newActive };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db.delete(trackingPixels).where(eq(trackingPixels.id, input.id));
        return { success: true };
      }),
  }),

  // ── Event Tracking ────────────────────────────────────────────────────────

  events: router({
    track: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          eventType: z.enum([
            "page_view",
            "checkout_start",
            "purchase",
            "upsell_view",
            "upsell_accept",
            "upsell_decline",
            "downsell_view",
            "downsell_accept",
            "downsell_decline",
          ]),
          pageSlug: z.string(),
          orderId: z.number().optional(),
          splitTestVariant: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        await db.insert(funnelEvents).values({
          sessionId: input.sessionId,
          eventType: input.eventType,
          pageSlug: input.pageSlug,
          orderId: input.orderId ?? null,
          splitTestVariant: input.splitTestVariant ?? null,
        });

        return { success: true };
      }),
  }),

  // ── Mux Video Management ───────────────────────────────────────────────────

  mux: router({
    createUpload: adminProcedure
      .input(z.object({ filename: z.string().min(1) }))
      .mutation(async ({ input }) => {
        return createDirectUpload(input.filename);
      }),

    getStatus: adminProcedure
      .input(z.object({ uploadId: z.string() }))
      .query(async ({ input }) => {
        return getAssetStatus(input.uploadId);
      }),

    list: adminProcedure.query(async () => {
      return listAssets();
    }),

    delete: adminProcedure
      .input(z.object({ muxAssetId: z.string() }))
      .mutation(async ({ input }) => {
        await deleteAsset(input.muxAssetId);
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const updateSet: Record<string, unknown> = {};
        if (input.title !== undefined) updateSet.title = input.title;
        if (Object.keys(updateSet).length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
        }
        await db.update(muxAssets).set(updateSet).where(eq(muxAssets.id, input.id));
        return { success: true };
      }),
  }),

  // ── Settings ────────────────────────────────────────────────────────────────

  settings: router({
    get: adminProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, input.key)).limit(1);
        if (rows.length === 0) return { key: input.key, value: null };
        return { key: rows[0].key, value: rows[0].value };
      }),

    update: adminProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const existing = await db.select({ id: siteSettings.id }).from(siteSettings).where(eq(siteSettings.key, input.key)).limit(1);
        if (existing.length > 0) {
          await db.update(siteSettings).set({ value: input.value }).where(eq(siteSettings.key, input.key));
        } else {
          await db.insert(siteSettings).values({ key: input.key, value: input.value });
        }
        return { success: true };
      }),
  }),

  // ── AI Copy Assistant ──────────────────────────────────────────────────────

  ai: router({
    suggest: adminProcedure
      .input(
        z.object({
          slug: z.string(),
          prompt: z.string().min(1).max(500),
          currentContent: z.record(z.string(), z.string()).default({}),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 10 requests/hour/IP
        const identifier = `ai-suggest:${getRateLimitIdentifier(ctx.req)}`;
        const rateCheck = await checkRateLimit(identifier, {
          maxRequests: 10,
          windowMs: 60 * 60 * 1000,
        });

        if (!rateCheck.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Rate limit exceeded. Try again in ${Math.ceil((rateCheck.resetAt - Date.now()) / 60000)} minutes.`,
          });
        }

        if (!ENV.anthropicApiKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "ANTHROPIC_API_KEY is not configured",
          });
        }

        const systemPrompt = buildAiSystemPrompt(input.slug, input.currentContent);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": ENV.anthropicApiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: "user", content: input.prompt }],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!anthropicResponse.ok) {
          const errorText = await anthropicResponse.text();
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `AI request failed: ${anthropicResponse.status} – ${errorText}`,
          });
        }

        const anthropicResult = await anthropicResponse.json() as {
          content: Array<{ type: string; text?: string }>;
        };

        const rawContent = anthropicResult.content
          ?.find((block) => block.type === "text")?.text;

        if (!rawContent) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AI returned an empty response",
          });
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AI returned invalid JSON",
          });
        }

        const validated = validateAiSuggestions(parsed);

        if (Object.keys(validated.suggestions).length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "AI could not generate any suggestions for this prompt. Try being more specific.",
          });
        }

        return validated;
      }),
  }),
});
