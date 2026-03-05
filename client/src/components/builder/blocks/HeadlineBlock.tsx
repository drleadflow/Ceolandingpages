import type { ComponentConfig } from "@puckeditor/core";

export type HeadlineBlockProps = {
  text: string;
  level: "h1" | "h2" | "h3";
  alignment: "left" | "center" | "right";
  color: string;
};

export const HeadlineBlock: ComponentConfig<HeadlineBlockProps> = {
  label: "Headline",
  fields: {
    text: { type: "textarea", label: "Text" },
    level: {
      type: "select",
      label: "Level",
      options: [
        { label: "H1", value: "h1" },
        { label: "H2", value: "h2" },
        { label: "H3", value: "h3" },
      ],
    },
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
  },
  defaultProps: {
    text: "Your headline here",
    level: "h1",
    alignment: "center",
    color: "#ffffff",
  },
  render: ({ text, level, alignment, color }) => {
    const Tag = level;
    const sizes = { h1: "text-4xl md:text-5xl", h2: "text-3xl md:text-4xl", h3: "text-2xl md:text-3xl" };
    return (
      <Tag
        className={`font-bold leading-tight ${sizes[level]}`}
        style={{ textAlign: alignment, color }}
      >
        {text}
      </Tag>
    );
  },
};
