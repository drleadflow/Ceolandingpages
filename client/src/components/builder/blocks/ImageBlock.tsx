import type { ComponentConfig } from "@puckeditor/core";

export type ImageBlockProps = {
  src: string;
  alt: string;
  width: "full" | "large" | "medium" | "small";
  borderRadius: "none" | "md" | "lg" | "full";
};

export const ImageBlock: ComponentConfig<ImageBlockProps> = {
  label: "Image",
  fields: {
    src: { type: "text", label: "Image URL" },
    alt: { type: "text", label: "Alt Text" },
    width: {
      type: "select",
      label: "Width",
      options: [
        { label: "Full", value: "full" },
        { label: "Large (80%)", value: "large" },
        { label: "Medium (60%)", value: "medium" },
        { label: "Small (40%)", value: "small" },
      ],
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "none" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Full (Circle)", value: "full" },
      ],
    },
  },
  defaultProps: {
    src: "",
    alt: "Image",
    width: "full",
    borderRadius: "md",
  },
  render: ({ src, alt, width, borderRadius }) => {
    const widths = { full: "100%", large: "80%", medium: "60%", small: "40%" };
    const radii = { none: "0", md: "0.5rem", lg: "1rem", full: "9999px" };
    if (!src) {
      return (
        <div
          className="bg-slate-700 flex items-center justify-center text-slate-400 text-sm"
          style={{ width: widths[width], aspectRatio: "16/9", borderRadius: radii[borderRadius], margin: "0 auto" }}
        >
          No image set
        </div>
      );
    }
    return (
      <img
        src={src}
        alt={alt}
        style={{ width: widths[width], borderRadius: radii[borderRadius], margin: "0 auto", display: "block" }}
      />
    );
  },
};
