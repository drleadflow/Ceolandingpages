import { Save, Upload, Eye, Monitor, Smartphone, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

interface BuilderToolbarProps {
  funnelName: string;
  funnelSlug: string;
  status: string;
  isSaving: boolean;
  isPublishing: boolean;
  previewMode: "desktop" | "mobile";
  onSave: () => void;
  onPublish: () => void;
  onPreviewModeChange: (mode: "desktop" | "mobile") => void;
  onPreview: () => void;
}

export default function BuilderToolbar({
  funnelName,
  funnelSlug,
  status,
  isSaving,
  isPublishing,
  previewMode,
  onSave,
  onPublish,
  onPreviewModeChange,
  onPreview,
}: BuilderToolbarProps) {
  const statusColors: Record<string, string> = {
    draft: "text-yellow-400",
    published: "text-green-400",
    archived: "text-slate-400",
  };

  return (
    <div className="h-12 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 shrink-0">
      {/* Left: Back + Name */}
      <div className="flex items-center gap-3">
        <Link href="/admin/builder">
          <a className="p-1.5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </a>
        </Link>
        <div>
          <span className="text-white font-semibold text-sm">{funnelName}</span>
          <span className={`ml-2 text-xs ${statusColors[status] || "text-slate-400"}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Center: Device toggle */}
      <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
        <button
          onClick={() => onPreviewModeChange("desktop")}
          className={`p-1.5 rounded-md transition-colors ${
            previewMode === "desktop" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
          }`}
          title="Desktop view"
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPreviewModeChange("mobile")}
          className={`p-1.5 rounded-md transition-colors ${
            previewMode === "mobile" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
          }`}
          title="Mobile view"
        >
          <Smartphone className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#E5C158] text-black rounded-lg font-semibold hover:bg-[#d4b04a] disabled:opacity-50 transition-colors"
        >
          {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Publish
        </button>
      </div>
    </div>
  );
}
