import type { ComponentConfig } from "@puckeditor/core";

export type SelectBlockProps = {
  fieldName: string;
  label: string;
  displayType: "dropdown" | "radio" | "checkbox";
  options: string;
  required: boolean;
};

export const SelectBlock: ComponentConfig<SelectBlockProps> = {
  label: "Select / Choice",
  fields: {
    fieldName: { type: "text", label: "Field Name (for data)" },
    label: { type: "text", label: "Label" },
    displayType: {
      type: "select",
      label: "Display Type",
      options: [
        { label: "Dropdown", value: "dropdown" },
        { label: "Radio Buttons", value: "radio" },
        { label: "Checkboxes", value: "checkbox" },
      ],
    },
    options: { type: "textarea", label: "Options (one per line)" },
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
    fieldName: "choice",
    label: "Select an option",
    displayType: "radio",
    options: "Option A\nOption B\nOption C",
    required: true,
  },
  render: ({ fieldName, label, displayType, options, required }) => {
    const optionList = options.split("\n").filter((o) => o.trim());
    const inputType = displayType === "checkbox" ? "checkbox" : "radio";

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {displayType === "dropdown" ? (
          <select
            name={fieldName}
            required={required}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#E5C158]/50"
          >
            <option value="">Choose...</option>
            {optionList.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-2">
            {optionList.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
              >
                <input
                  type={inputType}
                  name={fieldName}
                  value={opt}
                  className="accent-[#E5C158]"
                />
                <span className="text-white/90">{opt}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  },
};
