import type { ComponentConfig } from "@puckeditor/core";

export type CalendarBlockProps = {
  calendarUrl: string;
  height: number;
  title: string;
};

export const CalendarBlock: ComponentConfig<CalendarBlockProps> = {
  label: "Calendar",
  fields: {
    calendarUrl: { type: "text", label: "GHL Calendar URL" },
    height: { type: "number", label: "Height (px)", min: 300, max: 900 },
    title: { type: "text", label: "Title (above calendar)" },
  },
  defaultProps: { calendarUrl: "", height: 600, title: "Book Your Call" },
  render: ({ calendarUrl, height, title }) => (
    <div className="space-y-3">
      {title && (
        <h3 className="text-xl font-bold text-white text-center">{title}</h3>
      )}
      {calendarUrl ? (
        <iframe
          src={calendarUrl}
          style={{
            width: "100%",
            height: `${height}px`,
            border: "none",
            borderRadius: "12px",
          }}
          title="Booking Calendar"
        />
      ) : (
        <div
          className="bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 text-sm"
          style={{ height: `${height}px` }}
        >
          Set a calendar URL to display the booking widget
        </div>
      )}
    </div>
  ),
};
