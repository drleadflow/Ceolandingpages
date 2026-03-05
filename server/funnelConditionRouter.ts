import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { funnelConditionalRoutes } from "../drizzle/schema";

export const funnelConditionRouter = router({
  list: adminProcedure
    .input(z.object({ funnelId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const rows = await db.select().from(funnelConditionalRoutes)
        .where(eq(funnelConditionalRoutes.funnelId, input.funnelId));
      return rows.map(row => ({
        ...row,
        conditions: row.conditions ? (() => { try { return JSON.parse(row.conditions); } catch { return []; } })() : [],
      }));
    }),

  create: adminProcedure
    .input(z.object({
      funnelId: z.number(),
      fromStepKey: z.string(),
      toStepKey: z.string(),
      conditions: z.array(z.object({
        field: z.string(),
        operator: z.enum(["equals", "not_equals", "contains", "gt", "lt"]),
        value: z.string(),
      })),
      conditionLogic: z.enum(["and", "or"]).default("and"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const result = await db.insert(funnelConditionalRoutes).values({
        funnelId: input.funnelId,
        fromStepKey: input.fromStepKey,
        toStepKey: input.toStepKey,
        conditions: JSON.stringify(input.conditions),
        conditionLogic: input.conditionLogic,
      });
      const id = Number(result[0].insertId);
      const rows = await db.select().from(funnelConditionalRoutes).where(eq(funnelConditionalRoutes.id, id)).limit(1);
      return { ...rows[0], conditions: input.conditions };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      toStepKey: z.string().optional(),
      conditions: z.array(z.object({
        field: z.string(),
        operator: z.enum(["equals", "not_equals", "contains", "gt", "lt"]),
        value: z.string(),
      })).optional(),
      conditionLogic: z.enum(["and", "or"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { id, ...fields } = input;
      const updateSet: Record<string, unknown> = {};
      if (fields.toStepKey !== undefined) updateSet.toStepKey = fields.toStepKey;
      if (fields.conditions !== undefined) updateSet.conditions = JSON.stringify(fields.conditions);
      if (fields.conditionLogic !== undefined) updateSet.conditionLogic = fields.conditionLogic;
      if (Object.keys(updateSet).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
      }
      await db.update(funnelConditionalRoutes).set(updateSet).where(eq(funnelConditionalRoutes.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.delete(funnelConditionalRoutes).where(eq(funnelConditionalRoutes.id, input.id));
      return { success: true };
    }),
});
