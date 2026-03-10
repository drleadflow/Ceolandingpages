export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || process.env.OPENAI_API_KEY || "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFromName: process.env.EMAIL_FROM_NAME ?? "CEO Scaling Roadmap",
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS ?? "noreply@updates.doctorleadflow.com",
  ghlWebhookUrl: process.env.GHL_WEBHOOK_URL ?? "",
  ghlWebhookCourseUrl: process.env.GHL_WEBHOOK_COURSE_URL ?? "",
  ghlWebhookVaultUrl: process.env.GHL_WEBHOOK_VAULT_URL ?? "",
  ghlWebhookSessionUrl: process.env.GHL_WEBHOOK_SESSION_URL ?? "",
  zapierCourseUrl: process.env.ZAPIER_COURSE_URL ?? "",
  zapierVaultUrl: process.env.ZAPIER_VAULT_URL ?? "",
  whopApiKey: process.env.WHOP_API_KEY ?? "",
  whopSandboxApiKey: process.env.WHOP_SANDBOX_API_KEY ?? "",
  whopCompanyId: process.env.WHOP_COMPANY_ID ?? "",
  whopWebhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "",
  whopSandbox: process.env.WHOP_SANDBOX === "true",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  muxTokenId: process.env.MUX_TOKEN_ID ?? "",
  muxTokenSecret: process.env.MUX_TOKEN_SECRET ?? "",
};

// Validate critical env vars at startup in production
if (ENV.isProduction) {
  const missing: string[] = [];
  if (!ENV.databaseUrl) missing.push("DATABASE_URL");
  if (!ENV.cookieSecret) missing.push("JWT_SECRET");
  if (!ENV.forgeApiKey) missing.push("BUILT_IN_FORGE_API_KEY or OPENAI_API_KEY");

  if (!ENV.whopApiKey) missing.push("WHOP_API_KEY");
  if (!ENV.whopCompanyId) missing.push("WHOP_COMPANY_ID");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. See .env.example for details.`
    );
  }
}
