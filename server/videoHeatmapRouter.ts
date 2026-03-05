import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, sql, desc } from "drizzle-orm";
import { publicProcedure, adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { videoHeatmapViews } from "../drizzle/schema";

export const videoHeatmapRouter = router({
  // Public: receives beacon/fetch POST from client
  trackView: publicProcedure
    .input(
      z.object({
        sessionId: z.string().min(1),
        videoId: z.string().min(1),
        pageSlug: z.string().min(1),
        playbackVector: z.array(z.number().min(0).max(1)).max(7200).default([]),
        seekEvents: z.array(z.object({ from: z.number().min(0), to: z.number().min(0) })).max(500).default([]),
        maxSecondReached: z.number().default(0),
        totalWatchTimeSec: z.number().default(0),
        videoDurationSec: z.number().default(0),
        deviceType: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.insert(videoHeatmapViews).values({
        sessionId: input.sessionId,
        videoId: input.videoId,
        pageSlug: input.pageSlug,
        playbackVector: JSON.stringify(input.playbackVector),
        seekEvents: JSON.stringify(input.seekEvents),
        maxSecondReached: input.maxSecondReached,
        totalWatchTimeSec: input.totalWatchTimeSec,
        videoDurationSec: input.videoDurationSec,
        deviceType: input.deviceType ?? null,
      });

      return { success: true };
    }),

  // Admin: per-second retention curve for a video
  getRetention: adminProcedure
    .input(z.object({ videoId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select({ playbackVector: videoHeatmapViews.playbackVector, videoDurationSec: videoHeatmapViews.videoDurationSec })
        .from(videoHeatmapViews)
        .where(eq(videoHeatmapViews.videoId, input.videoId))
        .limit(5000);

      if (rows.length === 0) return { retention: [], totalViews: 0 };

      // Find max duration across all views (reduce instead of spread to avoid stack overflow)
      const maxDuration = rows.reduce((m, r) => Math.max(m, r.videoDurationSec ?? 0), 0);
      if (maxDuration === 0) return { retention: [], totalViews: 0 };

      // Sum vectors element-wise
      const sums = new Array(maxDuration).fill(0);
      for (const row of rows) {
        if (!row.playbackVector) continue;
        const vector: number[] = JSON.parse(row.playbackVector);
        for (let i = 0; i < vector.length && i < maxDuration; i++) {
          sums[i] += vector[i];
        }
      }

      const totalViews = rows.length;
      const retention = sums.map((sum, sec) => ({
        second: sec,
        percent: Math.round((sum / totalViews) * 100),
        viewers: sum,
      }));

      return { retention, totalViews };
    }),

  // Admin: aggregated seek zones (skip vs rewind)
  getSeekZones: adminProcedure
    .input(z.object({ videoId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select({ seekEvents: videoHeatmapViews.seekEvents, videoDurationSec: videoHeatmapViews.videoDurationSec })
        .from(videoHeatmapViews)
        .where(eq(videoHeatmapViews.videoId, input.videoId))
        .limit(5000);

      const maxDuration = rows.reduce((m, r) => Math.max(m, r.videoDurationSec ?? 0), 1);

      // Build per-second skip/rewind counts
      const skips = new Array(maxDuration).fill(0);
      const rewinds = new Array(maxDuration).fill(0);

      for (const row of rows) {
        if (!row.seekEvents) continue;
        const events: Array<{ from: number; to: number }> = JSON.parse(row.seekEvents);
        for (const evt of events) {
          if (evt.to > evt.from) {
            // Skip forward — mark the skipped-over zone
            for (let s = evt.from; s < evt.to && s < maxDuration; s++) {
              skips[s]++;
            }
          } else {
            // Rewind — mark the rewound-to zone
            for (let s = evt.to; s < evt.from && s < maxDuration; s++) {
              rewinds[s]++;
            }
          }
        }
      }

      const zones = Array.from({ length: maxDuration }, (_, i) => ({
        second: i,
        skips: skips[i],
        rewinds: rewinds[i],
      }));

      return { zones, totalViews: rows.length };
    }),

  // Admin: summary stats for all videos or a specific video
  getVideoStats: adminProcedure
    .input(z.object({ videoId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const baseCondition = input.videoId ? eq(videoHeatmapViews.videoId, input.videoId) : undefined;

      const statsRows = await db
        .select({
          videoId: videoHeatmapViews.videoId,
          pageSlug: videoHeatmapViews.pageSlug,
          totalViews: sql<number>`COUNT(*)`,
          avgWatchTime: sql<number>`ROUND(AVG(${videoHeatmapViews.totalWatchTimeSec}))`,
          avgMaxSecond: sql<number>`ROUND(AVG(${videoHeatmapViews.maxSecondReached}))`,
          avgDuration: sql<number>`ROUND(AVG(${videoHeatmapViews.videoDurationSec}))`,
          lastViewed: sql<string>`MAX(${videoHeatmapViews.createdAt})`,
        })
        .from(videoHeatmapViews)
        .where(baseCondition)
        .groupBy(videoHeatmapViews.videoId, videoHeatmapViews.pageSlug)
        .orderBy(desc(sql`COUNT(*)`));

      return statsRows.map((row) => ({
        videoId: row.videoId,
        pageSlug: row.pageSlug,
        totalViews: Number(row.totalViews),
        avgWatchTimeSec: Number(row.avgWatchTime),
        avgMaxSecondReached: Number(row.avgMaxSecond),
        avgDurationSec: Number(row.avgDuration),
        avgCompletionPercent:
          Number(row.avgDuration) > 0
            ? Math.round((Number(row.avgWatchTime) / Number(row.avgDuration)) * 100)
            : 0,
        lastViewed: row.lastViewed,
      }));
    }),
});
