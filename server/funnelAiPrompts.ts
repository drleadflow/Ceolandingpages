// AI Copy Assistant — system prompt builder and suggestion validation

const PAGE_DESCRIPTIONS: Record<string, string> = {
  sales:
    "Main sales page for health professionals. Audience: doctors, chiropractors, physios looking to grow with Facebook ads. Tone: confident, outcome-driven, authoritative. Purpose: convert visitors into course buyers.",
  upsell:
    "Post-purchase upsell page. Audience: buyers who just purchased the FB Ads course. Tone: excited, aspirational, urgent. Purpose: upgrade to the CEO Vault (all-access).",
  downsell:
    "Downsell page after upsell decline. Audience: buyers who declined the vault. Tone: empathetic, low-pressure, value-focused. Purpose: sell a 1-on-1 strategy session as a lighter alternative.",
  "thank-you":
    "Thank-you / confirmation page. Audience: buyers post-purchase. Tone: warm, congratulatory, action-oriented. Purpose: set expectations and drive community engagement.",
  "book-session":
    "Booking confirmation page. Audience: buyers who purchased a strategy session. Tone: professional, encouraging. Purpose: drive calendar booking.",
  "call-prep":
    "Call preparation page. Audience: buyers with an upcoming strategy call. Tone: supportive, instructional. Purpose: help them prepare for maximum session value.",
};

const COPY_RULES = `
Copy rules you MUST follow:
- Headlines: outcome-led, specific, benefit-driven. Lead with the transformation.
- Subheadlines: expand on the headline with proof or specificity. Keep under 2 sentences.
- CTA text: action-oriented, first-person ("Yes, I want..." or "Get instant access"). Include price when relevant.
- Decline text: soft, non-judgmental, brief.
- Body text: conversational, scannable, benefit-focused. Use short paragraphs.
- Value stack items: start each with a concrete deliverable, then explain the benefit after a dash.
- Quantify benefits wherever possible (numbers, percentages, timeframes).
- Never use hype words like "revolutionary", "game-changing", "unprecedented".
- Match the tone described for this page type.
`.trim();

const TEXT_FIELDS = [
  "headline",
  "subheadline",
  "bodyText",
  "ctaText",
  "declineText",
] as const;

type TextFieldKey = (typeof TEXT_FIELDS)[number];

const FIELD_MAX_LENGTHS: Record<TextFieldKey, number> = {
  headline: 200,
  subheadline: 500,
  bodyText: 2000,
  ctaText: 100,
  declineText: 100,
};

export function buildAiSystemPrompt(
  slug: string,
  currentContent: Record<string, string>,
): string {
  const pageDescription =
    PAGE_DESCRIPTIONS[slug] ?? "A funnel page for health professionals.";

  const currentContentBlock = Object.entries(currentContent)
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k}: "${v}"`)
    .join("\n");

  return `You are a direct-response copywriting expert specializing in health professional marketing funnels.

Page context:
${pageDescription}

Current content on this page:
${currentContentBlock || "  (no content set yet)"}

${COPY_RULES}

Output format — respond with ONLY valid JSON, no markdown:
{
  "suggestions": {
    // Only include fields you are changing. Keys must be one of: headline, subheadline, bodyText, ctaText, declineText
  },
  "rationale": "Brief explanation of why these changes improve conversion"
}

IMPORTANT:
- Only suggest text field changes. NEVER suggest price changes.
- Only include fields that you are actually improving — omit unchanged fields.
- Keep suggestions concise and within character limits.`;
}

export interface AiSuggestions {
  suggestions: Partial<Record<TextFieldKey, string>>;
  rationale: string;
}

export function validateAiSuggestions(raw: unknown): AiSuggestions {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("AI response is not a valid object");
  }

  const obj = raw as Record<string, unknown>;

  // Validate rationale
  const rationale =
    typeof obj.rationale === "string" ? obj.rationale.slice(0, 500) : "";

  // Validate suggestions — whitelist-only field validation
  const suggestions: Partial<Record<TextFieldKey, string>> = {};

  if (typeof obj.suggestions === "object" && obj.suggestions !== null) {
    const rawSuggestions = obj.suggestions as Record<string, unknown>;
    for (const field of TEXT_FIELDS) {
      const value = rawSuggestions[field];
      if (value !== undefined && value !== null) {
        const str = String(value).trim();
        if (str.length > 0) {
          suggestions[field] = str.slice(0, FIELD_MAX_LENGTHS[field]);
        }
      }
    }
  }

  return { suggestions, rationale };
}
