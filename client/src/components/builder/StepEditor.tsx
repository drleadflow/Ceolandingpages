import { useCallback, useMemo } from "react";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "./puck-config";

interface StepEditorProps {
  stepId: number;
  puckData: Record<string, unknown> | null;
  onChange: (data: Record<string, unknown>) => void;
  previewMode: "desktop" | "mobile";
}

const EMPTY_PUCK_DATA = {
  root: { props: {} },
  content: [],
  zones: {},
};

export default function StepEditor({
  stepId,
  puckData,
  onChange,
  previewMode,
}: StepEditorProps) {
  const initialData = useMemo(
    () => (puckData as Parameters<typeof Puck>[0]["data"]) ?? EMPTY_PUCK_DATA,
    [stepId] // re-init only when step changes
  );

  const handleChange = useCallback(
    (data: Parameters<typeof Puck>[0]["data"]) => {
      onChange(data as unknown as Record<string, unknown>);
    },
    [onChange],
  );

  return (
    <div className="flex-1 min-w-0 h-full puck-editor-wrapper">
      <style>{`
        .puck-editor-wrapper .Puck {
          height: 100%;
        }
        .puck-editor-wrapper .Puck-root {
          height: 100%;
        }
        .puck-editor-wrapper [class*="PuckLayout"] {
          height: 100% !important;
        }
        .puck-editor-wrapper iframe {
          max-width: ${previewMode === "mobile" ? "390px" : "100%"};
          margin: 0 auto;
          transition: max-width 0.3s ease;
        }
      `}</style>
      <Puck
        key={stepId}
        config={puckConfig}
        data={initialData}
        onChange={handleChange}
      />
    </div>
  );
}
