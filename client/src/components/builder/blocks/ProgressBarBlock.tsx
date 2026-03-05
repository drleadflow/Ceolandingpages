import type { ComponentConfig } from "@puckeditor/core";

export type ProgressBarBlockProps = {
  currentStep: number;
  totalSteps: number;
  showLabel: boolean;
  color: string;
};

export const ProgressBarBlock: ComponentConfig<ProgressBarBlockProps> = {
  label: "Progress Bar",
  fields: {
    currentStep: { type: "number", label: "Current Step (preview)", min: 1 },
    totalSteps: { type: "number", label: "Total Steps (preview)", min: 1 },
    showLabel: {
      type: "radio",
      label: "Show Label",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    color: { type: "text", label: "Bar Color (CSS)" },
  },
  defaultProps: {
    currentStep: 1,
    totalSteps: 5,
    showLabel: true,
    color: "#E5C158",
  },
  render: ({ currentStep, totalSteps, showLabel, color }) => {
    const pct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
    return (
      <div className="space-y-1">
        {showLabel && (
          <div className="flex justify-between text-xs text-white/50">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{pct}%</span>
          </div>
        )}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    );
  },
};
