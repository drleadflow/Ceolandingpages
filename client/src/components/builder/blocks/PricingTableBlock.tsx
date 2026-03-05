import type { ComponentConfig } from "@puckeditor/core";

export type PricingTableBlockProps = {
  tiers: string;
  accentColor: string;
};

interface PricingTier {
  name: string;
  price: string;
  originalPrice?: string;
  features: string[];
  ctaText: string;
  highlighted?: boolean;
}

export const PricingTableBlock: ComponentConfig<PricingTableBlockProps> = {
  label: "Pricing Table",
  fields: {
    tiers: { type: "textarea", label: "Tiers (JSON)" },
    accentColor: { type: "text", label: "Accent Color" },
  },
  defaultProps: {
    tiers: JSON.stringify(
      [
        {
          name: "Starter",
          price: "$197",
          originalPrice: "$297",
          features: ["12-Module Course", "Templates", "Community Access"],
          ctaText: "Get Started",
        },
        {
          name: "Pro",
          price: "$297",
          originalPrice: "$497",
          features: [
            "Everything in Starter",
            "1-on-1 Strategy Call",
            "Priority Support",
          ],
          ctaText: "Go Pro",
          highlighted: true,
        },
        {
          name: "CEO Vault",
          price: "$997",
          originalPrice: "$1997",
          features: ["Everything in Pro", "All Courses", "Lifetime Access"],
          ctaText: "Get Full Access",
        },
      ],
      null,
      2
    ),
    accentColor: "#E5C158",
  },
  render: ({ tiers, accentColor }) => {
    let parsed: PricingTier[] = [];
    try {
      parsed = JSON.parse(tiers);
    } catch {
      /* ignore */
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {parsed.map((tier, i) => (
          <div
            key={i}
            className={`rounded-2xl p-6 space-y-4 ${
              tier.highlighted
                ? "border-2"
                : "border border-white/10"
            }`}
            style={
              tier.highlighted
                ? { borderColor: accentColor }
                : {}
            }
          >
            <h4 className="text-lg font-bold text-white">{tier.name}</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold" style={{ color: accentColor }}>
                {tier.price}
              </span>
              {tier.originalPrice && (
                <span className="text-sm text-white/40 line-through">
                  {tier.originalPrice}
                </span>
              )}
            </div>
            <ul className="space-y-2">
              {tier.features.map((f, j) => (
                <li
                  key={j}
                  className="text-sm text-white/70 flex items-center gap-2"
                >
                  <span style={{ color: accentColor }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3 rounded-xl font-semibold transition-colors"
              style={{
                backgroundColor: tier.highlighted ? accentColor : "transparent",
                color: tier.highlighted ? "black" : accentColor,
                border: `2px solid ${accentColor}`,
              }}
              type="button"
            >
              {tier.ctaText}
            </button>
          </div>
        ))}
      </div>
    );
  },
};
