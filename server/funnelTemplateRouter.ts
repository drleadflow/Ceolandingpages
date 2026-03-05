import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { funnelTemplates } from "../drizzle/schema";

export const funnelTemplateRouter = router({
  list: adminProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const query = input?.category
        ? db.select().from(funnelTemplates).where(eq(funnelTemplates.category, input.category))
        : db.select().from(funnelTemplates);
      const rows = await query.orderBy(desc(funnelTemplates.createdAt));
      return rows.map(r => ({
        ...r,
        snapshot: r.snapshot ? (() => { try { return JSON.parse(r.snapshot); } catch { return null; } })() : null,
      }));
    }),

  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const rows = await db.select().from(funnelTemplates).where(eq(funnelTemplates.id, input.id)).limit(1);
      if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      const r = rows[0];
      return { ...r, snapshot: r.snapshot ? (() => { try { return JSON.parse(r.snapshot); } catch { return null; } })() : null };
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().min(1),
      thumbnail: z.string().optional(),
      snapshot: z.string(), // JSON string
      isSystem: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const result = await db.insert(funnelTemplates).values(input);
      return { id: Number(result[0].insertId) };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.delete(funnelTemplates).where(eq(funnelTemplates.id, input.id));
      return { success: true };
    }),
});
