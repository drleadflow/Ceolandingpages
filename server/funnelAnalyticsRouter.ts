import { z } from "zod";
import { eq, and, sql, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { funnelStepEvents, funnelSteps } from "../drizzle/schema";

export const funnelAnalyticsRouter = router({
  // Public: track a step event (called from the renderer)
  trackEvent: publicProcedure
    .input(z.object({
      funnelId: z.number(),
      stepKey: z.string(),
      sessionId: z.string(),
      eventType: z.enum(["step_view", "step_complete", "step_skip", "form_submit", "button_click"]),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.insert(funnelStepEvents).values({
        funnelId: input.funnelId,
        stepKey: input.stepKey,
        sessionId: input.sessionId,
        eventType: input.eventType,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });
      return { success: true };
    }),

  // Admin: step-level drop-off data
  stepDropoff: adminProcedure
    .input(z.object({
      funnelId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get steps for ordering
      const steps = await db.select({ stepKey: funnelSteps.stepKey, name: funnelSteps.name, sortOrder: funnelSteps.sortOrder })
        .from(funnelSteps)
        .where(eq(funnelSteps.funnelId, input.funnelId))
        .orderBy(funnelSteps.sortOrder);

      // Get view counts per step
      const filters = [eq(funnelStepEvents.funnelId, input.funnelId), eq(funnelStepEvents.eventType, "step_view")];
      if (input.startDate) filters.push(sql`${funnelStepEvents.createdAt} >= ${input.startDate}`);
      if (input.endDate) filters.push(sql`${funnelStepEvents.createdAt} <= ${input.endDate}`);

      const viewCounts = await db
        .select({ stepKey: funnelStepEvents.stepKey, views: count() })
        .from(funnelStepEvents)
        .where(and(...filters))
        .groupBy(funnelStepEvents.stepKey);

      const viewMap = new Map(viewCounts.map(r => [r.stepKey, r.views]));

      return steps.map(step => ({
        stepKey: step.stepKey,
        name: step.name,
        sortOrder: step.sortOrder,
        views: viewMap.get(step.stepKey) ?? 0,
      }));
    }),

  // Admin: recent events list
  recentEvents: adminProcedure
    .input(z.object({ funnelId: z.number(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const rows = await db.select().from(funnelStepEvents)
        .where(eq(funnelStepEvents.funnelId, input.funnelId))
        .orderBy(desc(funnelStepEvents.createdAt))
        .limit(input.limit);
      return rows.map(r => ({
        ...r,
        metadata: r.metadata ? (() => { try { return JSON.parse(r.metadata!); } catch { return null; } })() : null,
      }));
    }),
});
