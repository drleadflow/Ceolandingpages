import type { ComponentConfig } from "@puckeditor/core";

export type DividerBlockProps = {
  color: string;
  thickness: number;
  width: "full" | "wide" | "medium" | "narrow";
};

export const DividerBlock: ComponentConfig<DividerBlockProps> = {
  label: "Divider",
  fields: {
    color: { type: "text", label: "Color (CSS)" },
    thickness: { type: "number", label: "Thickness (px)", min: 1, max: 8 },
    width: {
      type: "select",
      label: "Width",
      options: [
        { label: "Full", value: "full" },
        { label: "Wide (80%)", value: "wide" },
        { label: "Medium (60%)", value: "medium" },
        { label: "Narrow (40%)", value: "narrow" },
      ],
    },
  },
  defaultProps: { color: "#334155", thickness: 1, width: "full" },
  render: ({ color, thickness, width }) => {
    const widths = { full: "100%", wide: "80%", medium: "60%", narrow: "40%" };
    return (
      <hr
        style={{
          borderColor: color,
          borderTopWidth: `${thickness}px`,
          width: widths[width],
          margin: "0 auto",
          borderStyle: "solid",
        }}
      />
    );
  },
};
