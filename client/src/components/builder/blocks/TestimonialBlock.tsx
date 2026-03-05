import type { ComponentConfig } from "@puckeditor/core";

export type TestimonialBlockProps = {
  widgetId: string;
  title: string;
};

export const TestimonialBlock: ComponentConfig<TestimonialBlockProps> = {
  label: "Testimonials",
  fields: {
    widgetId: { type: "text", label: "Senja Widget ID" },
    title: { type: "text", label: "Section Title" },
  },
  defaultProps: { widgetId: "", title: "What Our Clients Say" },
  render: ({ widgetId, title }) => (
    <div className="space-y-4">
      {title && (
        <h3 className="text-2xl font-bold text-white text-center">{title}</h3>
      )}
      {widgetId ? (
        <div
          className="senja-embed"
          data-id={widgetId}
          data-mode="shadow"
          data-lazyload="false"
        />
      ) : (
        <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
          Enter a Senja Widget ID to display testimonials
        </div>
      )}
    </div>
  ),
};
