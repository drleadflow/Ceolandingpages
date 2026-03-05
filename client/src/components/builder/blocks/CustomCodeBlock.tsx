import { useEffect, useRef } from "react";
import type { ComponentConfig } from "@puckeditor/core";

export type CustomCodeBlockProps = {
  html: string;
  css: string;
};

export const CustomCodeBlock: ComponentConfig<CustomCodeBlockProps> = {
  label: "Custom Code",
  fields: {
    html: { type: "textarea", label: "HTML" },
    css: { type: "textarea", label: "CSS" },
  },
  defaultProps: { html: "<div>Custom content here</div>", css: "" },
  render: ({ html, css }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = html;
    }, [html]);

    return (
      <>
        {css && <style>{css}</style>}
        <div ref={containerRef} className="custom-code-block" />
      </>
    );
  },
};
