import type { ComponentConfig } from "@puckeditor/core";

export type ValueStackBlockProps = {
  title: string;
  items: string;
  totalValue: string;
  yourPrice: string;
};

export const ValueStackBlock: ComponentConfig<ValueStackBlockProps> = {
  label: "Value Stack",
  fields: {
    title: { type: "text", label: "Title" },
    items: {
      type: "textarea",
      label: "Items (Name | $Value, one per line)",
    },
    totalValue: { type: "text", label: "Total Value" },
    yourPrice: { type: "text", label: "Your Price" },
  },
  defaultProps: {
    title: "Everything You Get",
    items:
      "12-Module FB Ads Course | $997\nAd Copy Templates | $297\nTargeting Playbook | $197\nPrivate Community | $497",
    totalValue: "$1,988",
    yourPrice: "$197",
  },
  render: ({ title, items, totalValue, yourPrice }) => {
    const parsed = items
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [name, value] = line.split("|").map((s) => s.trim());
        return { name: name || line, value: value || "" };
      });
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-xl font-bold text-white text-center">{title}</h3>
        <div className="space-y-3">
          {parsed.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center border-b border-white/5 pb-2"
            >
              <span className="text-white/80">{item.name}</span>
              <span className="text-white/50 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-white/20">
          <span className="text-white/60">Total Value:</span>
          <span className="text-white line-through">{totalValue}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white font-bold text-lg">Your Price:</span>
          <span className="text-[#E5C158] font-bold text-2xl">{yourPrice}</span>
        </div>
      </div>
    );
  },
};
