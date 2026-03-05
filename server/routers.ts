import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { roadmapRouter } from "./roadmapRouter";
import { progressRouter } from "./progressRouter";
import { funnelRouter } from "./funnelRouter";
import { funnelAdminRouter } from "./funnelAdminRouter";
import { funnelBuilderRouter } from "./funnelBuilderRouter";
import { funnelConditionRouter } from "./funnelConditionRouter";
import { funnelSubmissionRouter } from "./funnelSubmissionRouter";
import { funnelAnalyticsRouter } from "./funnelAnalyticsRouter";
import { funnelTemplateRouter } from "./funnelTemplateRouter";
import { videoHeatmapRouter } from "./videoHeatmapRouter";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  roadmap: roadmapRouter,
  progress: progressRouter,
  funnel: funnelRouter,
  funnelAdmin: funnelAdminRouter,
  funnelBuilder: funnelBuilderRouter,
  funnelConditions: funnelConditionRouter,
  funnelSubmissions: funnelSubmissionRouter,
  funnelAnalytics: funnelAnalyticsRouter,
  funnelTemplates: funnelTemplateRouter,
  videoHeatmap: videoHeatmapRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
