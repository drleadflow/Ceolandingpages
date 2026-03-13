import { ENV } from "./_core/env";
import { logger } from "./_core/logger";

interface GHLLeadPayload {
  // Contact info
  firstName: string;
  email: string;
  phone?: string;
  businessName: string;
  website?: string;

  // Quiz data
  businessType: string;
  industry?: string;
  monthlyRevenue: string;
  biggestFrustration: string;
  ninetyDayGoal: string;

  // Scores
  overallScore: number;
  leadScore: number;

  // Roadmap link
  dashboardUrl: string;
  roadmapId: number;

  // Diagnostic
  topStrength: string;
  biggestGap: string;
}

/**
 * Push a new lead into GoHighLevel via webhook.
 * Fires async after quiz submission - does not block the user response.
 * Maps fields to GHL custom contact fields.
 */
export async function pushLeadToGHL(payload: GHLLeadPayload): Promise<boolean> {
  if (!ENV.ghlWebhookUrl) {
    logger.debug("GHL webhook not configured, skipping");
    return false;
  }

  try {
    const body = {
      // Standard GHL contact fields
      firstName: payload.firstName,
      email: payload.email,
      phone: payload.phone || "",
      companyName: payload.businessName,
      website: payload.website || "",

      // Custom fields (mapped by key name - configure in GHL to match)
      businessType: payload.businessType,
      industry: payload.industry || "",
      monthlyRevenue: payload.monthlyRevenue,
      biggestFrustration: payload.biggestFrustration,
      ninetyDayGoal: payload.ninetyDayGoal,
      overallScore: String(payload.overallScore),
      leadScore: String(payload.leadScore),
      topStrength: payload.topStrength,
      biggestGap: payload.biggestGap,
      dashboardUrl: payload.dashboardUrl,
      roadmapId: String(payload.roadmapId),

      // Tags for GHL automation triggers
      tags: ["titan-quiz-lead", `score-${payload.leadScore >= 70 ? "hot" : payload.leadScore >= 40 ? "warm" : "cold"}`].join(","),
      source: "Titan Dashboard Quiz",
    };

    const response = await fetch(ENV.ghlWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.warn(
        { status: response.status, detail },
        "GHL webhook returned non-OK status"
      );
      return false;
    }

    logger.info(
      { email: payload.email, leadScore: payload.leadScore },
      "Lead pushed to GHL successfully"
    );
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to push lead to GHL");
    return false;
  }
}

/**
 * Push a purchase to Zapier for Skool course invite.
 * Fires in parallel with GHL — does not block.
 */
export async function pushToZapier(payload: { firstName: string; email: string; phone?: string; product: string; amount: number }): Promise<boolean> {
  const url = payload.product === "Health Pro CEO Vault"
    ? ENV.zapierVaultUrl
    : payload.product === "FB Ads Mastery Course"
      ? ENV.zapierCourseUrl
      : "";

  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: payload.firstName,
        email: payload.email,
        phone: payload.phone || "",
        purchase_product: payload.product,
        purchase_amount: String(payload.amount),
      }),
    });

    if (!response.ok) {
      logger.warn({ status: response.status, product: payload.product }, "Zapier webhook returned non-OK");
      return false;
    }

    logger.info({ email: payload.email, product: payload.product }, "Pushed to Zapier for Skool invite");
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to push to Zapier");
    return false;
  }
}

interface GHLMasterclassPayload {
  firstName: string;
  email: string;
  phone?: string;
  practiceType: string;
  website?: string;
}

/**
 * Push a masterclass opt-in lead to GHL via a dedicated webhook.
 * Fires async after masterclass form submission.
 */
export async function pushMasterclassLeadToGHL(payload: GHLMasterclassPayload): Promise<boolean> {
  if (!ENV.ghlWebhookMasterclassUrl) {
    logger.debug("GHL masterclass webhook not configured, skipping");
    return false;
  }

  try {
    const body = {
      firstName: payload.firstName,
      email: payload.email,
      phone: payload.phone || "",
      businessType: payload.practiceType,
      website: payload.website || "",
      tags: "masterclass-lead",
      source: "Masterclass Opt-In",
    };

    const response = await fetch(ENV.ghlWebhookMasterclassUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.warn({ status: response.status, detail }, "GHL masterclass webhook returned non-OK");
      return false;
    }

    logger.info({ email: payload.email }, "Masterclass lead pushed to GHL");
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to push masterclass lead to GHL");
    return false;
  }
}

interface GHLRoadmapOptinPayload {
  firstName: string;
  email: string;
  businessType?: string;
  biggestFrustration?: string;
  businessName?: string;
}

/**
 * Push an early quiz opt-in (after email step) to GHL via a dedicated webhook.
 * Captures partial lead data before full quiz completion.
 */
export async function pushRoadmapOptinToGHL(payload: GHLRoadmapOptinPayload): Promise<boolean> {
  if (!ENV.ghlWebhookRoadmapOptinUrl) {
    logger.debug("GHL roadmap opt-in webhook not configured, skipping");
    return false;
  }

  try {
    const body = {
      firstName: payload.firstName,
      email: payload.email,
      businessType: payload.businessType || "",
      biggestFrustration: payload.biggestFrustration || "",
      companyName: payload.businessName || "",
      tags: "roadmap-optin",
      source: "Scaling Roadmap Opt-In",
    };

    const response = await fetch(ENV.ghlWebhookRoadmapOptinUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.warn({ status: response.status, detail }, "GHL roadmap opt-in webhook returned non-OK");
      return false;
    }

    logger.info({ email: payload.email }, "Roadmap opt-in lead pushed to GHL");
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to push roadmap opt-in to GHL");
    return false;
  }
}

interface GHLPurchasePayload {
  firstName: string;
  email: string;
  phone?: string;
  tag: string;
  product: string;
  amount: number;
}

/**
 * Resolve the GHL webhook URL for a given product tag.
 * Each product has its own GHL webhook trigger for separate workflows.
 */
function getWebhookUrlForProduct(tag: string): string {
  switch (tag) {
    case "fb-ads-course-buyer":
      return ENV.ghlWebhookCourseUrl || ENV.ghlWebhookUrl;
    case "vault-member":
      return ENV.ghlWebhookVaultUrl || ENV.ghlWebhookUrl;
    case "strategy-session-buyer":
      return ENV.ghlWebhookSessionUrl || ENV.ghlWebhookUrl;
    default:
      return ENV.ghlWebhookUrl;
  }
}

/**
 * Push a purchase event to GoHighLevel via webhook.
 * Routes to product-specific webhook URLs for separate GHL workflows.
 */
export async function pushPurchaseToGHL(payload: GHLPurchasePayload): Promise<boolean> {
  const webhookUrl = getWebhookUrlForProduct(payload.tag);
  if (!webhookUrl) {
    logger.debug("GHL purchase webhook not configured, skipping");
    return false;
  }

  try {
    const body = {
      first_name: payload.firstName,
      email: payload.email,
      phone: payload.phone || "",
      tags: payload.tag,
      source: `Funnel Purchase - ${payload.product}`,
      purchase_product: payload.product,
      purchase_amount: String(payload.amount),
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.warn({ status: response.status, detail }, "GHL purchase webhook returned non-OK");
      return false;
    }

    logger.info({ email: payload.email, product: payload.product, webhookUrl }, "Purchase pushed to GHL");
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to push purchase to GHL");
    return false;
  }
}
