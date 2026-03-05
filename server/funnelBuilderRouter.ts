import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { router, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { funnels, funnelSteps } from "../drizzle/schema";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseFunnelRow(row: typeof funnels.$inferSelect) {
  return {
    ...row,
    settings: row.settings ? (() => { try { return JSON.parse(row.settings!); } catch { return row.settings; } })() : null,
  };
}

function parseFunnelStepRow(row: typeof funnelSteps.$inferSelect) {
  return {
    ...row,
    puckData: row.puckData ? (() => { try { return JSON.parse(row.puckData!); } catch { return row.puckData; } })() : null,
    draftPuckData: row.draftPuckData ? (() => { try { return JSON.parse(row.draftPuckData!); } catch { return row.draftPuckData; } })() : null,
    settings: row.settings ? (() => { try { return JSON.parse(row.settings!); } catch { return row.settings; } })() : null,
  };
}

// ── Router ────────────────────────────────────────────────────────────────────

export const funnelBuilderRouter = router({

  // ── Funnels ───────────────────────────────────────────────────────────────

  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const rows = await db.select().from(funnels).orderBy(desc(funnels.updatedAt));
    return rows.map(parseFunnelRow);
  }),

  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const funnelRows = await db.select().from(funnels).where(eq(funnels.id, input.id)).limit(1);
      if (funnelRows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });

      const stepRows = await db.select().from(funnelSteps)
        .where(eq(funnelSteps.funnelId, input.id))
        .orderBy(funnelSteps.sortOrder);

      return {
        ...parseFunnelRow(funnelRows[0]),
        steps: stepRows.map(parseFunnelStepRow),
      };
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check slug uniqueness
      const existing = await db.select({ id: funnels.id }).from(funnels)
        .where(eq(funnels.slug, input.slug)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "A funnel with this slug already exists" });
      }

      const result = await db.insert(funnels).values({
        name: input.name,
        slug: input.slug,
        status: "draft",
        version: 1,
      });

      const funnelId = Number(result[0].insertId);

      // Create default "Welcome" step
      await db.insert(funnelSteps).values({
        funnelId,
        stepKey: nanoid(),
        name: "Welcome",
        type: "content",
        sortOrder: 0,
      });

      const funnelRows = await db.select().from(funnels).where(eq(funnels.id, funnelId)).limit(1);
      return parseFunnelRow(funnelRows[0]);
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
      settings: z.string().optional(),
    }))
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

      // Check slug uniqueness if slug is being changed
      if (updateSet.slug) {
        const existing = await db.select({ id: funnels.id }).from(funnels)
          .where(and(eq(funnels.slug, updateSet.slug as string), sql`${funnels.id} != ${id}`))
          .limit(1);
        if (existing.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "A funnel with this slug already exists" });
        }
      }

      await db.update(funnels).set(updateSet).where(eq(funnels.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const rows = await db.select({ id: funnels.id }).from(funnels).where(eq(funnels.id, input.id)).limit(1);
      if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });

      // Delete all steps first, then the funnel
      await db.delete(funnelSteps).where(eq(funnelSteps.funnelId, input.id));
      await db.delete(funnels).where(eq(funnels.id, input.id));
      return { success: true };
    }),

  publish: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const funnelRows = await db.select().from(funnels).where(eq(funnels.id, input.id)).limit(1);
      if (funnelRows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });

      const funnel = funnelRows[0];

      // For each step: copy draftPuckData → puckData
      const stepRows = await db.select().from(funnelSteps).where(eq(funnelSteps.funnelId, input.id));
      await Promise.all(
        stepRows.map(async (step) => {
          if (step.draftPuckData !== null) {
            await db.update(funnelSteps)
              .set({ puckData: step.draftPuckData, draftPuckData: null })
              .where(eq(funnelSteps.id, step.id));
          }
        }),
      );

      // Update funnel status, bump version, set publishedAt
      await db.update(funnels).set({
        status: "published",
        version: funnel.version + 1,
        publishedAt: new Date(),
      }).where(eq(funnels.id, input.id));

      return { success: true };
    }),

  // ── Steps ─────────────────────────────────────────────────────────────────

  steps: router({
    list: adminProcedure
      .input(z.object({ funnelId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const rows = await db.select().from(funnelSteps)
          .where(eq(funnelSteps.funnelId, input.funnelId))
          .orderBy(funnelSteps.sortOrder);
        return rows.map(parseFunnelStepRow);
      }),

    create: adminProcedure
      .input(z.object({
        funnelId: z.number(),
        name: z.string().min(1).max(255),
        type: z.enum(["content", "form", "quiz", "checkout", "calendar", "thank-you"]).default("content"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Verify funnel exists
        const funnelRows = await db.select({ id: funnels.id }).from(funnels)
          .where(eq(funnels.id, input.funnelId)).limit(1);
        if (funnelRows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });

        // Get max sortOrder
        const [maxRow] = await db
          .select({ maxSort: sql<number>`MAX(${funnelSteps.sortOrder})` })
          .from(funnelSteps)
          .where(eq(funnelSteps.funnelId, input.funnelId));

        const nextSortOrder = (Number(maxRow?.maxSort ?? -1)) + 1;

        const result = await db.insert(funnelSteps).values({
          funnelId: input.funnelId,
          stepKey: nanoid(),
          name: input.name,
          type: input.type,
          sortOrder: nextSortOrder,
        });

        const stepId = Number(result[0].insertId);
        const stepRows = await db.select().from(funnelSteps).where(eq(funnelSteps.id, stepId)).limit(1);
        return parseFunnelStepRow(stepRows[0]);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        type: z.enum(["content", "form", "quiz", "checkout", "calendar", "thank-you"]).optional(),
        draftPuckData: z.string().optional(),
        settings: z.string().optional(),
      }))
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

        await db.update(funnelSteps).set(updateSet).where(eq(funnelSteps.id, id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const rows = await db.select({ id: funnelSteps.id }).from(funnelSteps)
          .where(eq(funnelSteps.id, input.id)).limit(1);
        if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Step not found" });

        await db.delete(funnelSteps).where(eq(funnelSteps.id, input.id));
        return { success: true };
      }),

    reorder: adminProcedure
      .input(z.object({
        funnelId: z.number(),
        stepIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        await Promise.all(
          input.stepIds.map(async (stepId, index) => {
            await db.update(funnelSteps)
              .set({ sortOrder: index })
              .where(and(eq(funnelSteps.id, stepId), eq(funnelSteps.funnelId, input.funnelId)));
          }),
        );

        return { success: true };
      }),

    duplicate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const rows = await db.select().from(funnelSteps).where(eq(funnelSteps.id, input.id)).limit(1);
        if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Step not found" });

        const original = rows[0];

        // Shift all steps with sortOrder > original's sortOrder up by 1
        await db.update(funnelSteps)
          .set({ sortOrder: sql`${funnelSteps.sortOrder} + 1` })
          .where(and(
            eq(funnelSteps.funnelId, original.funnelId),
            sql`${funnelSteps.sortOrder} > ${original.sortOrder}`,
          ));

        const result = await db.insert(funnelSteps).values({
          funnelId: original.funnelId,
          stepKey: nanoid(),
          name: `Copy of ${original.name}`,
          type: original.type,
          sortOrder: original.sortOrder + 1,
          puckData: original.puckData,
          draftPuckData: original.draftPuckData,
          settings: original.settings,
        });

        const newStepId = Number(result[0].insertId);
        const newStepRows = await db.select().from(funnelSteps).where(eq(funnelSteps.id, newStepId)).limit(1);
        return parseFunnelStepRow(newStepRows[0]);
      }),
  }),
});
