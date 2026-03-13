import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Roadmaps table - stores generated scaling roadmaps
export const roadmaps = mysqlTable("roadmaps", {
  id: int("id").autoincrement().primaryKey(),
  // Quiz responses
  firstName: varchar("firstName", { length: 255 }).notNull(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  businessType: varchar("businessType", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }), // Selected from landing page
  email: varchar("email", { length: 320 }).notNull(),
  monthlyRevenue: varchar("monthlyRevenue", { length: 100 }),
  mainOffer: text("mainOffer"),
  crmUsage: varchar("crmUsage", { length: 255 }),
  leadResponseSpeed: varchar("leadResponseSpeed", { length: 255 }),
  missedLeads: varchar("missedLeads", { length: 100 }),
  chatAgents: varchar("chatAgents", { length: 255 }),
  contentFrequency: varchar("contentFrequency", { length: 100 }),
  audienceSize: varchar("audienceSize", { length: 100 }),
  instagramHandle: varchar("instagramHandle", { length: 255 }),
  monthlyAdBudget: varchar("monthlyAdBudget", { length: 100 }),
  ninetyDayGoal: text("ninetyDayGoal"),
  biggestFrustration: text("biggestFrustration"),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  // All quiz answers as JSON
  allAnswers: text("allAnswers"),

  // Calculated Scores (0-100)
  overallScore: int("overallScore").default(0).notNull(),
  operationsScore: int("operationsScore").default(0).notNull(),
  marketingScore: int("marketingScore").default(0).notNull(),
  salesScore: int("salesScore").default(0).notNull(),
  systemsScore: int("systemsScore").default(0).notNull(),

  // Benchmark data
  industryAverage: int("industryAverage").default(65).notNull(),
  topPerformerScore: int("topPerformerScore").default(88).notNull(),
  userPercentile: int("userPercentile").default(50).notNull(),

  // Insights
  topStrength: varchar("topStrength", { length: 255 }),
  biggestGap: varchar("biggestGap", { length: 255 }),
  potentialRevenue: int("potentialRevenue").default(0).notNull(),

  // Generated content
  titanRoadmap: text("titanRoadmap"),
  offerPlaybook: text("offerPlaybook"),
  facebookAdLaunch: text("facebookAdLaunch"),
  instagramGrowth: text("instagramGrowth"),
  leadGeneration: text("leadGeneration"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted"]).default("new").notNull(),
  leadScore: int("leadScore").default(0).notNull(),
  shareCode: varchar("shareCode", { length: 10 }).unique(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Roadmap = typeof roadmaps.$inferSelect;
export type InsertRoadmap = typeof roadmaps.$inferInsert;

// Task Progress table - tracks which action items users have completed
export const taskProgress = mysqlTable("taskProgress", {
  id: int("id").autoincrement().primaryKey(),
  roadmapId: int("roadmapId").notNull(), // Foreign key to roadmaps table
  playbookType: varchar("playbookType", { length: 50 }).notNull(), // "titan", "offer", "facebook", "instagram", "leadgen"
  taskId: varchar("taskId", { length: 255 }).notNull(), // Unique identifier for the task (e.g., "week1_day1_task1")
  completed: int("completed").default(0).notNull(), // 0 = incomplete, 1 = complete
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskProgress = typeof taskProgress.$inferSelect;
export type InsertTaskProgress = typeof taskProgress.$inferInsert;

// Playbook Share Tokens table - generates unique shareable links for individual playbooks
export const playbookShareTokens = mysqlTable("playbookShareTokens", {
  id: int("id").autoincrement().primaryKey(),
  roadmapId: int("roadmapId").notNull(), // Foreign key to roadmaps table
  playbookType: varchar("playbookType", { length: 50 }).notNull(), // "titan", "offer", "facebook", "instagram", "leadgen"
  token: varchar("token", { length: 32 }).notNull().unique(), // Unique shareable token
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlaybookShareToken = typeof playbookShareTokens.$inferSelect;
export type InsertPlaybookShareToken = typeof playbookShareTokens.$inferInsert;

// ── Funnel / Stripe tables ──

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  priceInCents: int("priceInCents").notNull(),
  type: mysqlEnum("type", ["course", "vault", "session"]).notNull(),
  active: int("active").default(1).notNull(),
  installmentCount: int("installmentCount"),
  installmentAmountInCents: int("installmentAmountInCents"),
  installmentIntervalDays: int("installmentIntervalDays").default(30),
  whopPlanId: varchar("whopPlanId", { length: 255 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;

export const funnelOrders = mysqlTable("funnelOrders", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripePaymentMethodId: varchar("stripePaymentMethodId", { length: 255 }),
  status: mysqlEnum("funnelOrderStatus", ["pending", "completed", "failed"]).default("pending").notNull(),
  totalInCents: int("totalInCents").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FunnelOrder = typeof funnelOrders.$inferSelect;

export const funnelOrderItems = mysqlTable("funnelOrderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amountInCents: int("amountInCents").notNull(),
  status: mysqlEnum("funnelItemStatus", ["pending", "paid", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FunnelOrderItem = typeof funnelOrderItems.$inferSelect;

// ── Funnel Page Content CMS ──

export const funnelPageContent = mysqlTable("funnelPageContent", {
  id: int("id").autoincrement().primaryKey(),
  pageSlug: varchar("pageSlug", { length: 100 }).notNull().unique(),
  headline: text("headline"),
  subheadline: text("subheadline"),
  bodyText: text("bodyText"),
  ctaText: varchar("ctaText", { length: 255 }),
  declineText: varchar("declineText", { length: 255 }),
  originalPrice: int("originalPrice"),
  salePrice: int("salePrice"),
  valueStackItems: text("valueStackItems"), // JSON array of strings
  faqItems: text("faqItems"), // JSON array of {q, a}
  heroImageUrl: varchar("heroImageUrl", { length: 500 }),
  videoUrl: varchar("videoUrl", { length: 500 }),
  videoOverlayStyle: varchar("videoOverlayStyle", { length: 50 }),
  videoAutoplayMode: varchar("videoAutoplayMode", { length: 50 }),
  previewUrl: varchar("previewUrl", { length: 500 }),
  senjaWidgetId: varchar("senjaWidgetId", { length: 255 }),
  headerTrackingCode: text("headerTrackingCode"), // Custom scripts injected into <head>
  bodyTrackingCode: text("bodyTrackingCode"), // Custom scripts injected after <body>
  draftContent: text("draftContent"), // JSON blob of all editable fields (unpublished draft)
  isActive: int("isActive").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FunnelPageContent = typeof funnelPageContent.$inferSelect;

// ── Funnel Events (Analytics) ──

export const funnelEvents = mysqlTable("funnelEvents", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  eventType: mysqlEnum("eventType", [
    "page_view", "checkout_start", "purchase",
    "upsell_view", "upsell_accept", "upsell_decline",
    "downsell_view", "downsell_accept", "downsell_decline",
  ]).notNull(),
  pageSlug: varchar("pageSlug", { length: 100 }).notNull(),
  orderId: int("orderId"),
  splitTestVariant: varchar("splitTestVariant", { length: 100 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FunnelEvent = typeof funnelEvents.$inferSelect;

// ── A/B Split Tests ──

export const splitTests = mysqlTable("splitTests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  pageSlug: varchar("pageSlug", { length: 100 }).notNull(),
  status: mysqlEnum("splitTestStatus", ["draft", "running", "completed"]).default("draft").notNull(),
  variants: text("variants").notNull(), // JSON array of { id, name, weight, contentOverrides }
  winnerVariantId: varchar("winnerVariantId", { length: 100 }),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SplitTest = typeof splitTests.$inferSelect;

// ── Tracking Pixels ──

export const trackingPixels = mysqlTable("trackingPixels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  platform: mysqlEnum("platform", [
    "facebook",
    "google_analytics",
    "google_tag_manager",
    "tiktok",
    "hyros",
    "custom",
  ]).notNull(),
  pixelId: varchar("pixelId", { length: 255 }).notNull(),
  accessToken: varchar("accessToken", { length: 500 }), // For CAPI (Facebook)
  isActive: int("isActive").default(1).notNull(),
  pageScope: text("pageScope"), // JSON string[] or null = all pages
  eventMapping: text("eventMapping"), // JSON Record<internalEvent, pixelEvent>
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrackingPixel = typeof trackingPixels.$inferSelect;

// ── Mux Video Assets ──

export const muxAssets = mysqlTable("muxAssets", {
  id: int("id").autoincrement().primaryKey(),
  muxAssetId: varchar("muxAssetId", { length: 255 }).notNull().unique(),
  playbackId: varchar("playbackId", { length: 255 }),
  status: mysqlEnum("muxAssetStatus", ["preparing", "ready", "errored"]).default("preparing").notNull(),
  captionStatus: mysqlEnum("captionStatus", ["generating", "ready", "none"]),
  duration: int("duration"),
  filename: varchar("filename", { length: 500 }),
  title: varchar("title", { length: 255 }),
  uploadId: varchar("uploadId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MuxAsset = typeof muxAssets.$inferSelect;

// ── Video Events (Analytics) ──

export const videoEvents = mysqlTable("videoEvents", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  pageSlug: varchar("pageSlug", { length: 100 }).notNull(),
  videoUrl: varchar("videoUrl", { length: 500 }),
  eventType: mysqlEnum("videoEventType", [
    "video_play",
    "video_pause",
    "video_milestone_25",
    "video_milestone_50",
    "video_milestone_75",
    "video_milestone_100",
  ]).notNull(),
  splitTestVariant: varchar("splitTestVariant", { length: 100 }),
  watchTimeSeconds: int("watchTimeSeconds").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoEvent = typeof videoEvents.$inferSelect;

// ── Video Heatmap Views (Per-Second Retention) ──

export const videoHeatmapViews = mysqlTable("videoHeatmapViews", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  videoId: varchar("videoId", { length: 255 }).notNull(),
  pageSlug: varchar("pageSlug", { length: 100 }).notNull(),
  playbackVector: text("playbackVector"),
  seekEvents: text("seekEvents"),
  maxSecondReached: int("maxSecondReached").default(0),
  totalWatchTimeSec: int("totalWatchTimeSec").default(0),
  videoDurationSec: int("videoDurationSec").default(0),
  deviceType: varchar("deviceType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoHeatmapView = typeof videoHeatmapViews.$inferSelect;

// ── Interactive Funnel Builder ──

export const funnels = mysqlTable("funnels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  status: mysqlEnum("funnelStatus", ["draft", "published", "archived"]).default("draft").notNull(),
  settings: text("settings"), // JSON: theme, tracking, SEO, transitions
  version: int("version").default(1).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Funnel = typeof funnels.$inferSelect;
export type InsertFunnel = typeof funnels.$inferInsert;

export const funnelSteps = mysqlTable("funnelSteps", {
  id: int("id").autoincrement().primaryKey(),
  funnelId: int("funnelId").notNull(),
  stepKey: varchar("stepKey", { length: 50 }).notNull(), // nanoid
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("funnelStepType", ["content", "form", "quiz", "checkout", "calendar", "thank-you"]).default("content").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  puckData: text("puckData"), // JSON: Puck editor data
  draftPuckData: text("draftPuckData"), // JSON: unpublished draft
  settings: text("settings"), // JSON: backgroundColor, showProgressBar, autoAdvanceMs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FunnelStep = typeof funnelSteps.$inferSelect;
export type InsertFunnelStep = typeof funnelSteps.$inferInsert;

export const funnelConditionalRoutes = mysqlTable("funnelConditionalRoutes", {
  id: int("id").autoincrement().primaryKey(),
  funnelId: int("funnelId").notNull(),
  fromStepKey: varchar("fromStepKey", { length: 50 }).notNull(),
  toStepKey: varchar("toStepKey", { length: 50 }).notNull(),
  conditions: text("conditions").notNull(), // JSON: Array<{ field, operator, value }>
  conditionLogic: mysqlEnum("conditionLogic", ["and", "or"]).default("and").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FunnelConditionalRoute = typeof funnelConditionalRoutes.$inferSelect;
export type InsertFunnelConditionalRoute = typeof funnelConditionalRoutes.$inferInsert;

export const funnelSubmissions = mysqlTable("funnelSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  funnelId: int("funnelId").notNull(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  data: text("data"), // JSON: all form values accumulated across steps
  completedSteps: text("completedSteps"), // JSON: string[] of stepKeys visited
  quizAnswers: text("quizAnswers"), // JSON: Record<questionId, answerId>
  leadScore: int("leadScore").default(0),
  ghlSynced: int("ghlSynced").default(0).notNull(), // 0 = not synced, 1 = synced
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FunnelSubmission = typeof funnelSubmissions.$inferSelect;
export type InsertFunnelSubmission = typeof funnelSubmissions.$inferInsert;

// ── Funnel Builder: Versioning, Analytics, Templates ──

export const funnelVersions = mysqlTable("funnelVersions", {
  id: int("id").autoincrement().primaryKey(),
  funnelId: int("funnelId").notNull(),
  version: int("version").notNull(),
  snapshot: text("snapshot").notNull(), // JSON: full funnel + steps snapshot
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
});

export type FunnelVersion = typeof funnelVersions.$inferSelect;

export const funnelStepEvents = mysqlTable("funnelStepEvents", {
  id: int("id").autoincrement().primaryKey(),
  funnelId: int("funnelId").notNull(),
  stepKey: varchar("stepKey", { length: 50 }).notNull(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  eventType: mysqlEnum("funnelStepEventType", ["step_view", "step_complete", "step_skip", "form_submit", "button_click"]).notNull(),
  metadata: text("metadata"), // JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FunnelStepEvent = typeof funnelStepEvents.$inferSelect;

export const funnelTemplates = mysqlTable("funnelTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  thumbnail: varchar("thumbnail", { length: 500 }),
  snapshot: text("snapshot").notNull(), // JSON: funnel settings + steps with puckData
  isSystem: int("isSystem").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FunnelTemplate = typeof funnelTemplates.$inferSelect;
export type InsertFunnelTemplate = typeof funnelTemplates.$inferInsert;

// ── Unified Leads Table ──

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  source: mysqlEnum("leadSource", ["masterclass", "early_capture", "quiz_complete"]).notNull(),
  status: mysqlEnum("leadStatus", ["new", "contacted", "qualified", "converted"]).default("new").notNull(),
  businessName: varchar("leadBusinessName", { length: 255 }),
  businessType: varchar("leadBusinessType", { length: 255 }),
  practiceType: varchar("practiceType", { length: 255 }),
  website: varchar("leadWebsite", { length: 500 }),
  biggestFrustration: text("leadBiggestFrustration"),
  roadmapId: int("roadmapId"),
  metadata: text("leadMetadata"),
  createdAt: timestamp("leadCreatedAt").defaultNow().notNull(),
  updatedAt: timestamp("leadUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ── Site Settings (key-value store for admin toggles) ──

export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
