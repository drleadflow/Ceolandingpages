// Shared types for the Interactive Funnel Builder

export type FunnelStatus = "draft" | "published" | "archived";

export type FunnelStepType = "content" | "form" | "quiz" | "checkout" | "calendar" | "thank-you";

export interface FunnelSettings {
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
  tracking?: {
    pixelIds?: number[]; // reference to trackingPixels table
  };
  transition?: "slide-left" | "slide-up" | "fade" | "none";
}

export interface FunnelStepSettings {
  backgroundColor?: string;
  showProgressBar?: boolean;
  autoAdvanceMs?: number;
}

// Minimal summary for the step sidebar
export interface FunnelStepSummary {
  id: number;
  stepKey: string;
  name: string;
  type: FunnelStepType;
  sortOrder: number;
}

// Full funnel document returned from API
export interface FunnelDocument {
  id: number;
  name: string;
  slug: string;
  status: FunnelStatus;
  settings: FunnelSettings;
  version: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  steps: FunnelStepDetail[];
}

export interface FunnelStepDetail {
  id: number;
  stepKey: string;
  name: string;
  type: FunnelStepType;
  sortOrder: number;
  puckData: Record<string, unknown> | null;
  draftPuckData: Record<string, unknown> | null;
  settings: FunnelStepSettings;
}

// ── Phase 2: Conditional Routes ──

export interface ConditionalRouteCondition {
  field: string;       // form field name or quiz question id
  operator: "equals" | "not_equals" | "contains" | "gt" | "lt";
  value: string;
}

export interface ConditionalRoute {
  id: number;
  funnelId: number;
  fromStepKey: string;
  toStepKey: string;
  conditions: ConditionalRouteCondition[];
  conditionLogic: "and" | "or";
}

// ── Phase 2: Submissions ──

export interface FunnelSubmissionData {
  id: number;
  funnelId: number;
  sessionId: string;
  data: Record<string, unknown>;
  completedSteps: string[];
  quizAnswers: Record<string, string>;
  leadScore: number;
  ghlSynced: boolean;
  createdAt: string;
}
