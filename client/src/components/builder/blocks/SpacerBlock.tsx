import type { ComponentConfig } from "@puckeditor/core";

export type SpacerBlockProps = {
  height: number;
};

export const SpacerBlock: ComponentConfig<SpacerBlockProps> = {
  label: "Spacer",
  fields: {
    height: { type: "number", label: "Height (px)", min: 8, max: 200 },
  },
  defaultProps: { height: 32 },
  render: ({ height }) => <div style={{ height: `${height}px` }} />,
};
