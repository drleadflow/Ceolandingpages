import { useState } from "react";
import type { ComponentConfig } from "@puckeditor/core";
import { ChevronDown } from "lucide-react";

export type FaqBlockProps = {
  title: string;
  items: string;
};

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-left"
        type="button"
      >
        <span className="text-white font-medium">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <p className="text-white/60 pb-4 text-sm">{answer}</p>}
    </div>
  );
}

export const FaqBlock: ComponentConfig<FaqBlockProps> = {
  label: "FAQ",
  fields: {
    title: { type: "text", label: "Section Title" },
    items: { type: "textarea", label: "FAQ Items (JSON)" },
  },
  defaultProps: {
    title: "Frequently Asked Questions",
    items: JSON.stringify(
      [
        {
          q: "How long do I have access?",
          a: "Lifetime access — watch at your own pace.",
        },
        {
          q: "Is there a money-back guarantee?",
          a: "Yes, 30-day no-questions-asked refund policy.",
        },
        {
          q: "Do I need prior experience?",
          a: "No, the course is designed for beginners and intermediates.",
        },
      ],
      null,
      2
    ),
  },
  render: ({ title, items }) => {
    let parsed: Array<{ q: string; a: string }> = [];
    try {
      parsed = JSON.parse(items);
    } catch {
      /* ignore */
    }
    return (
      <div className="space-y-2">
        {title && (
          <h3 className="text-2xl font-bold text-white text-center mb-4">
            {title}
          </h3>
        )}
        <div className="divide-y divide-white/10">
          {parsed.map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    );
  },
};
