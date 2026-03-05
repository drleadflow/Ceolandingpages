import { Render } from "@puckeditor/core";
import { puckConfig } from "./puck-config";

interface PreviewPanelProps {
  puckData: Record<string, unknown> | null;
  previewMode: "desktop" | "mobile";
  stepName: string;
}

const EMPTY_PUCK_DATA = {
  root: { props: {} },
  content: [],
  zones: {},
};

export default function PreviewPanel({
  puckData,
  previewMode,
  stepName,
}: PreviewPanelProps) {
  const data = (puckData as Parameters<typeof Render>[0]["data"]) ?? EMPTY_PUCK_DATA;

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      <div className="px-4 py-2 border-b border-slate-700 text-xs text-slate-500">
        Preview: {stepName}
      </div>
      <div className="flex-1 overflow-auto flex justify-center p-4">
        <div
          className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            width: previewMode === "mobile" ? "390px" : "100%",
            maxWidth: "100%",
          }}
        >
          <div className="p-6">
            <Render config={puckConfig} data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
