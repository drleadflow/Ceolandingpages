import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { funnelSubmissions, funnels, funnelSteps, funnelConditionalRoutes } from "../drizzle/schema";

export const funnelSubmissionRouter = router({
  // Public: get published funnel data for rendering
  getPublished: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const funnelRows = await db.select().from(funnels)
        .where(and(eq(funnels.slug, input.slug), eq(funnels.status, "published")))
        .limit(1);
      if (funnelRows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });

      const funnel = funnelRows[0];
      const steps = await db.select().from(funnelSteps)
        .where(eq(funnelSteps.funnelId, funnel.id))
        .orderBy(funnelSteps.sortOrder);
      const routes = await db.select().from(funnelConditionalRoutes)
        .where(eq(funnelConditionalRoutes.funnelId, funnel.id));

      return {
        id: funnel.id,
        name: funnel.name,
        slug: funnel.slug,
        settings: funnel.settings ? (() => { try { return JSON.parse(funnel.settings!); } catch { return {}; } })() : {},
        steps: steps.map(s => ({
          id: s.id,
          stepKey: s.stepKey,
          name: s.name,
          type: s.type,
          sortOrder: s.sortOrder,
          puckData: s.puckData ? (() => { try { return JSON.parse(s.puckData!); } catch { return null; } })() : null,
          settings: s.settings ? (() => { try { return JSON.parse(s.settings!); } catch { return {}; } })() : {},
        })),
        conditionalRoutes: routes.map(r => ({
          ...r,
          conditions: r.conditions ? (() => { try { return JSON.parse(r.conditions); } catch { return []; } })() : [],
        })),
      };
    }),

  // Public: submit funnel data
  submit: publicProcedure
    .input(z.object({
      funnelId: z.number(),
      sessionId: z.string(),
      data: z.record(z.string(), z.unknown()),
      completedSteps: z.array(z.string()),
      quizAnswers: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if submission already exists for this session
      const existing = await db.select({ id: funnelSubmissions.id }).from(funnelSubmissions)
        .where(and(
          eq(funnelSubmissions.funnelId, input.funnelId),
          eq(funnelSubmissions.sessionId, input.sessionId),
        )).limit(1);

      if (existing.length > 0) {
        // Update existing submission
        await db.update(funnelSubmissions).set({
          data: JSON.stringify(input.data),
          completedSteps: JSON.stringify(input.completedSteps),
          quizAnswers: input.quizAnswers ? JSON.stringify(input.quizAnswers) : undefined,
        }).where(eq(funnelSubmissions.id, existing[0].id));
        return { id: existing[0].id, created: false };
      }

      // Create new submission
      const result = await db.insert(funnelSubmissions).values({
        funnelId: input.funnelId,
        sessionId: input.sessionId,
        data: JSON.stringify(input.data),
        completedSteps: JSON.stringify(input.completedSteps),
        quizAnswers: input.quizAnswers ? JSON.stringify(input.quizAnswers) : null,
      });

      const submissionId = Number(result[0].insertId);

      // Fire GHL webhook async (don't block response)
      pushToGHL(input.data).catch(err => console.error("GHL webhook push failed:", err));

      return { id: submissionId, created: true };
    }),

  // Admin: list submissions for a funnel
  list: adminProcedure
    .input(z.object({ funnelId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const rows = await db.select().from(funnelSubmissions)
        .where(eq(funnelSubmissions.funnelId, input.funnelId))
        .orderBy(desc(funnelSubmissions.createdAt))
        .limit(input.limit);
      return rows.map(row => ({
        ...row,
        data: row.data ? (() => { try { return JSON.parse(row.data!); } catch { return {}; } })() : {},
        completedSteps: row.completedSteps ? (() => { try { return JSON.parse(row.completedSteps!); } catch { return []; } })() : [],
        quizAnswers: row.quizAnswers ? (() => { try { return JSON.parse(row.quizAnswers!); } catch { return {}; } })() : {},
      }));
    }),
});

// ── GHL Webhook ──

async function pushToGHL(data: Record<string, unknown>) {
  const ghlUrl = process.env.GHL_WEBHOOK_URL;
  if (!ghlUrl) return;

  await fetch(ghlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      tags: "funnel-builder-lead",
      source: "Funnel Builder Submission",
    }),
  });
}
