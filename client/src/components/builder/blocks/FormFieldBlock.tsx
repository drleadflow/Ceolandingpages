import type { ComponentConfig } from "@puckeditor/core";

export type FormFieldBlockProps = {
  fieldName: string;
  fieldType: "text" | "email" | "phone" | "textarea";
  label: string;
  placeholder: string;
  required: boolean;
};

export const FormFieldBlock: ComponentConfig<FormFieldBlockProps> = {
  label: "Form Field",
  fields: {
    fieldName: { type: "text", label: "Field Name (for data)" },
    fieldType: {
      type: "select",
      label: "Input Type",
      options: [
        { label: "Text", value: "text" },
        { label: "Email", value: "email" },
        { label: "Phone", value: "phone" },
        { label: "Textarea", value: "textarea" },
      ],
    },
    label: { type: "text", label: "Label" },
    placeholder: { type: "text", label: "Placeholder" },
    required: {
      type: "radio",
      label: "Required",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },
  defaultProps: {
    fieldName: "name",
    fieldType: "text",
    label: "Your Name",
    placeholder: "Enter your name...",
    required: true,
  },
  render: ({ fieldName, fieldType, label, placeholder, required }) => {
    const inputClasses =
      "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#E5C158]/50 focus:border-[#E5C158]/50 transition-colors";
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-white/80">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {fieldType === "textarea" ? (
          <textarea
            name={fieldName}
            placeholder={placeholder}
            required={required}
            rows={4}
            className={inputClasses}
          />
        ) : (
          <input
            type={fieldType === "phone" ? "tel" : fieldType}
            name={fieldName}
            placeholder={placeholder}
            required={required}
            className={inputClasses}
          />
        )}
      </div>
    );
  },
};
