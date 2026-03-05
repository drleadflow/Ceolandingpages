import { useState, useEffect } from "react";
import type { ComponentConfig } from "@puckeditor/core";

export type CountdownBlockProps = {
  endTime: string;
  label: string;
  expiredText: string;
};

export const CountdownBlock: ComponentConfig<CountdownBlockProps> = {
  label: "Countdown",
  fields: {
    endTime: {
      type: "text",
      label: "End Time (ISO) or duration (e.g. '30m')",
    },
    label: { type: "text", label: "Label" },
    expiredText: { type: "text", label: "Expired Text" },
  },
  defaultProps: {
    endTime: "30m",
    label: "Offer expires in",
    expiredText: "Offer has expired",
  },
  render: ({ endTime, label, expiredText }) => {
    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
      let target: number;
      if (endTime.endsWith("m")) {
        const minutes = parseInt(endTime);
        target = Date.now() + minutes * 60 * 1000;
      } else {
        target = new Date(endTime).getTime();
      }

      const tick = () => {
        const diff = Math.max(0, target - Date.now());
        setRemaining(diff);
      };
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }, [endTime]);

    if (remaining === null) return <></>;
    if (remaining <= 0) {
      return (
        <p className="text-center text-red-400 font-semibold">{expiredText}</p>
      );
    }

    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return (
      <div className="text-center space-y-2">
        <p className="text-sm text-white/60">{label}</p>
        <div className="flex justify-center gap-3">
          {[
            { val: hours, label: "HRS" },
            { val: minutes, label: "MIN" },
            { val: seconds, label: "SEC" },
          ].map(({ val, label: l }) => (
            <div key={l} className="bg-white/10 rounded-xl px-4 py-3 min-w-[70px]">
              <div className="text-2xl font-bold text-[#E5C158] font-mono">
                {String(val).padStart(2, "0")}
              </div>
              <div className="text-xs text-white/40">{l}</div>
            </div>
          ))}
        </div>
      </div>
    );
  },
};
