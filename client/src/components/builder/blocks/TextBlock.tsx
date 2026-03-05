import type { ComponentConfig } from "@puckeditor/core";

export type TextBlockProps = {
  text: string;
  alignment: "left" | "center" | "right";
  color: string;
  fontSize: "sm" | "base" | "lg" | "xl";
};

export const TextBlock: ComponentConfig<TextBlockProps> = {
  label: "Text",
  fields: {
    text: { type: "textarea", label: "Text" },
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    color: { type: "text", label: "Color (CSS)" },
    fontSize: {
      type: "select",
      label: "Font Size",
      options: [
        { label: "Small", value: "sm" },
        { label: "Base", value: "base" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
      ],
    },
  },
  defaultProps: {
    text: "Your text here",
    alignment: "left",
    color: "#d1d5db",
    fontSize: "base",
  },
  render: ({ text, alignment, color, fontSize }) => {
    const sizes = { sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl" };
    return (
      <p
        className={`leading-relaxed ${sizes[fontSize]}`}
        style={{ textAlign: alignment, color }}
      >
        {text}
      </p>
    );
  },
};
