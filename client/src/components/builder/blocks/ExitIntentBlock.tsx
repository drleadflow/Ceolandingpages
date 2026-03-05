import type { ComponentConfig } from "@puckeditor/core";

export type ExitIntentBlockProps = {
  headline: string;
  subtext: string;
  ctaText: string;
  ctaUrl: string;
  dismissText: string;
};

export const ExitIntentBlock: ComponentConfig<ExitIntentBlockProps> = {
  label: "Exit Intent",
  fields: {
    headline: { type: "text", label: "Headline" },
    subtext: { type: "textarea", label: "Subtext" },
    ctaText: { type: "text", label: "CTA Button Text" },
    ctaUrl: { type: "text", label: "CTA URL" },
    dismissText: { type: "text", label: "Dismiss Text" },
  },
  defaultProps: {
    headline: "Wait — before you go!",
    subtext:
      "Take our free 2-minute quiz and get a personalized growth roadmap for your practice.",
    ctaText: "Get My Free Roadmap",
    ctaUrl: "/quiz",
    dismissText: "No thanks, I'll figure it out myself",
  },
  render: ({ headline, subtext, ctaText, ctaUrl, dismissText }) => (
    <div className="bg-slate-800 border border-[#E5C158]/30 rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto">
      <p className="text-sm text-[#E5C158] font-medium uppercase tracking-wider">
        Exit Intent Preview
      </p>
      <h3 className="text-2xl font-bold text-white">{headline}</h3>
      <p className="text-white/60">{subtext}</p>
      <a
        href={ctaUrl}
        className="block w-full bg-[#E5C158] text-black font-bold py-3 px-6 rounded-xl hover:bg-[#d4b04a] transition-colors"
      >
        {ctaText}
      </a>
      <p className="text-xs text-white/30 cursor-pointer hover:text-white/50">
        {dismissText}
      </p>
    </div>
  ),
};
