import type { ComponentConfig } from "@puckeditor/core";

export type ButtonBlockProps = {
  text: string;
  action: "next-step" | "url" | "submit";
  url: string;
  variant: "primary" | "secondary" | "outline";
  size: "sm" | "md" | "lg";
  fullWidth: boolean;
};

export const ButtonBlock: ComponentConfig<ButtonBlockProps> = {
  label: "Button",
  fields: {
    text: { type: "text", label: "Button Text" },
    action: {
      type: "select",
      label: "Action",
      options: [
        { label: "Next Step", value: "next-step" },
        { label: "Open URL", value: "url" },
        { label: "Submit Form", value: "submit" },
      ],
    },
    url: { type: "text", label: "URL (if action = Open URL)" },
    variant: {
      type: "select",
      label: "Style",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Outline", value: "outline" },
      ],
    },
    size: {
      type: "select",
      label: "Size",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    fullWidth: { type: "radio", label: "Full Width", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
  },
  defaultProps: {
    text: "Continue",
    action: "next-step",
    url: "",
    variant: "primary",
    size: "lg",
    fullWidth: true,
  },
  render: ({ text, variant, size, fullWidth }) => {
    const baseClasses = "font-semibold rounded-lg transition-all duration-200 cursor-pointer";
    const sizeClasses = { sm: "px-4 py-2 text-sm", md: "px-6 py-3 text-base", lg: "px-8 py-4 text-lg" };
    const variantClasses = {
      primary: "bg-[#E5C158] text-black hover:bg-[#d4b04a]",
      secondary: "bg-slate-700 text-white hover:bg-slate-600",
      outline: "border-2 border-[#E5C158] text-[#E5C158] hover:bg-[#E5C158] hover:text-black",
    };
    return (
      <button
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? "w-full" : ""}`}
        type="button"
      >
        {text}
      </button>
    );
  },
};
