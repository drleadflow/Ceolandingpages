import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, CheckCircle, Loader2, AlertCircle, Film } from "lucide-react";

type UploadState = "idle" | "uploading" | "processing" | "complete" | "error";

interface MuxVideoUploaderProps {
  onComplete?: (playbackId: string) => void;
  className?: string;
}

export function MuxVideoUploader({ onComplete, className = "" }: MuxVideoUploaderProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createUpload = trpc.funnelAdmin.mux.createUpload.useMutation();

  // Poll for asset status while processing
  const statusQuery = trpc.funnelAdmin.mux.getStatus.useQuery(
    { uploadId: uploadId ?? "" },
    {
      enabled: state === "processing" && !!uploadId,
      refetchInterval: 3000,
    },
  );

  // Watch for status changes
  useEffect(() => {
    if (!statusQuery.data) return;
    const asset = statusQuery.data;
    if (asset.status === "ready" && asset.playbackId) {
      setState("complete");
      setPlaybackId(asset.playbackId);
      onComplete?.(asset.playbackId);
      toast.success("Video ready!");
    } else if (asset.status === "errored") {
      setState("error");
      toast.error("Video processing failed");
    }
  }, [statusQuery.data, onComplete]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a video file");
        return;
      }

      setFilename(file.name);
      setState("uploading");
      setProgress(0);

      try {
        // 1. Get direct upload URL from our API
        const { uploadUrl, uploadId: newUploadId } = await createUpload.mutateAsync({
          filename: file.name,
        });

        setUploadId(newUploadId);

        // 2. Upload directly to Mux via PUT
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.open("PUT", uploadUrl);
          xhr.send(file);
        });

        // 3. Switch to processing state (polling will pick up readiness)
        setState("processing");
        toast.success("Upload complete, processing video...");
      } catch (err) {
        setState("error");
        toast.error("Upload failed. Please try again.");
      }
    },
    [createUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setUploadId(null);
    setPlaybackId(null);
    setFilename("");
  }, []);

  return (
    <div className={className}>
      {state === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-800/30 transition-colors"
        >
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">Drop a video file or click to upload</p>
          <p className="text-slate-500 text-sm mt-1">MP4, MOV, WebM supported</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
      )}

      {state === "uploading" && (
        <div className="border border-slate-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-slate-300 text-sm">Uploading {filename}...</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">{progress}%</p>
        </div>
      )}

      {state === "processing" && (
        <div className="border border-slate-700 rounded-lg p-6 text-center">
          <Loader2 className="w-6 h-6 text-yellow-400 animate-spin mx-auto mb-2" />
          <p className="text-slate-300 text-sm">Processing video...</p>
          <p className="text-slate-500 text-xs mt-1">This usually takes 30-60 seconds</p>
        </div>
      )}

      {state === "complete" && (
        <div className="border border-emerald-700/50 bg-emerald-900/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300 font-medium">Video ready!</span>
          </div>
          {playbackId && (
            <div className="flex items-center gap-2 mt-2">
              <Film className="w-4 h-4 text-slate-400" />
              <code className="text-slate-400 text-xs bg-slate-800 px-2 py-1 rounded">
                {playbackId}
              </code>
            </div>
          )}
          <button
            onClick={reset}
            className="text-slate-400 hover:text-white text-sm mt-3 underline"
          >
            Upload another
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="border border-red-700/50 bg-red-900/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300 font-medium">Upload failed</span>
          </div>
          <button
            onClick={reset}
            className="text-slate-400 hover:text-white text-sm mt-2 underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
