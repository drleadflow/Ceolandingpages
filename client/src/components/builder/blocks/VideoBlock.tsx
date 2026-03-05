import type { ComponentConfig } from "@puckeditor/core";
import { FunnelVideoPlayer } from "../../funnel/FunnelVideoPlayer";

export type VideoBlockProps = {
  videoUrl: string;
  thumbnailUrl: string;
  overlayStyle: "front-and-center" | "loud" | "classy" | "none";
};

export const VideoBlock: ComponentConfig<VideoBlockProps> = {
  label: "Video",
  fields: {
    videoUrl: { type: "text", label: "Video URL / Mux Playback ID" },
    thumbnailUrl: { type: "text", label: "Thumbnail URL" },
    overlayStyle: {
      type: "select",
      label: "Overlay Style",
      options: [
        { label: "Front & Center", value: "front-and-center" },
        { label: "Loud", value: "loud" },
        { label: "Classy", value: "classy" },
        { label: "None", value: "none" },
      ],
    },
  },
  defaultProps: {
    videoUrl: "",
    thumbnailUrl: "",
    overlayStyle: "front-and-center",
  },
  render: ({ videoUrl, thumbnailUrl, overlayStyle }) => {
    if (!videoUrl) {
      return (
        <div className="bg-slate-700 flex items-center justify-center text-slate-400 text-sm aspect-video rounded-lg">
          No video set
        </div>
      );
    }
    return (
      <FunnelVideoPlayer
        videoUrl={videoUrl}
        thumbnailUrl={thumbnailUrl || undefined}
        overlayStyle={overlayStyle}
      />
    );
  },
};
