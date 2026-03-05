import type { ComponentConfig } from "@puckeditor/core";

export type CheckoutBlockProps = {
  productSlug: string;
  buttonText: string;
  showPrice: boolean;
  priceText: string;
};

export const CheckoutBlock: ComponentConfig<CheckoutBlockProps> = {
  label: "Checkout",
  fields: {
    productSlug: { type: "text", label: "Product Slug" },
    buttonText: { type: "text", label: "Button Text" },
    showPrice: {
      type: "radio",
      label: "Show Price",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    priceText: { type: "text", label: "Price Display (e.g. $197)" },
  },
  defaultProps: {
    productSlug: "fb-ads-course",
    buttonText: "Get Instant Access",
    showPrice: true,
    priceText: "$197",
  },
  render: ({ buttonText, showPrice, priceText }) => (
    <div className="bg-gradient-to-b from-[#E5C158]/10 to-transparent border border-[#E5C158]/20 rounded-2xl p-6 text-center space-y-4">
      {showPrice && (
        <div className="text-3xl font-bold text-[#E5C158]">{priceText}</div>
      )}
      <button
        className="w-full bg-[#E5C158] text-black font-bold py-4 px-8 rounded-xl text-lg hover:bg-[#d4b04a] transition-colors"
        type="button"
      >
        {buttonText}
      </button>
      <p className="text-xs text-white/40">Secure checkout powered by Whop</p>
    </div>
  ),
};
