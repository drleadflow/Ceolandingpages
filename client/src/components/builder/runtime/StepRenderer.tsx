import { Render } from "@puckeditor/core";
import { puckConfig } from "../puck-config";

interface StepRendererProps {
  puckData: Record<string, unknown> | null;
}

const EMPTY_PUCK_DATA = {
  root: { props: {} },
  content: [],
  zones: {},
};

export default function StepRenderer({ puckData }: StepRendererProps) {
  const data = (puckData as Parameters<typeof Render>[0]["data"]) ?? EMPTY_PUCK_DATA;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 space-y-6">
      <Render config={puckConfig} data={data} />
    </div>
  );
}
