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
