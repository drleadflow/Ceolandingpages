import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { Check, Loader2, Star, Zap, Crown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useFunnel } from "@/contexts/FunnelContext";
import { GuaranteeBlock } from "./GuaranteeBlock";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Tier {
  slug: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  description: string;
  features: string[];
  icon: typeof Star;
  accent: string;
  accentBg: string;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    slug: "fb-ads-course",
    name: "FB Ads Course",
    originalPrice: 297,
    salePrice: 197,
    description: "The complete system to run profitable Facebook ads for your practice.",
    features: [
      "12-module video masterclass",
      "Done-for-you ad templates",
      "Audience targeting blueprint",
      "Ad creative swipe file",
      "30-day live Q&A access",
      "Private community access",
    ],
    icon: Star,
    accent: "text-blue-600",
    accentBg: "bg-blue-50",
  },
  {
    slug: "strategy-session",
    name: "Course + 1-on-1 Strategy Session",
    originalPrice: 497,
    salePrice: 297,
    description: "Everything in the course, plus a private strategy call with Dr. Emeka.",
    features: [
      "Everything in FB Ads Course",
      "60-min 1-on-1 strategy session",
      "Custom growth plan for your practice",
      "Ad campaign audit & optimization",
      "Actionable next steps",
    ],
    icon: Zap,
    accent: "text-indigo-600",
    accentBg: "bg-indigo-50",
    badge: "Best Value",
  },
  {
    slug: "ceo-vault",
    name: "CEO Vault — All Courses",
    originalPrice: 1997,
    salePrice: 997,
    description: "Full access to every course, resource, and private session. The complete toolkit.",
    features: [
      "Everything in Course + Session",
      "All current & future courses",
      "CEO Vault resource library",
      "Priority strategy session booking",
      "Lifetime community access",
      "Monthly group coaching calls",
    ],
    icon: Crown,
    accent: "text-amber-600",
    accentBg: "bg-amber-50",
  },
];

interface PricingTiersProps {
  onPurchaseComplete: (productSlug: string) => void;
  sessionId: string;
  splitTestVariant?: string;
}

export function PricingTiers({ onPurchaseComplete, sessionId, splitTestVariant }: PricingTiersProps) {
  const { setOrder, addProduct } = useFunnel();
  const createCheckout = trpc.funnel.checkout.createCheckout.useMutation();
  const confirmMutation = trpc.funnel.checkout.confirmPurchase.useMutation();
  const trackEvent = trpc.funnelAdmin.events.track.useMutation();

  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<{ checkoutConfigId: string; orderId: number; sandbox?: boolean } | null>(null);
  const [formValues, setFormValues] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: "", email: "", phone: "" },
  });

  const handleSelectTier = (slug: string) => {
    setSelectedTier(slug);
    setCheckoutData(null);
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedTier) return;
    setFormValues(values);
    trackEvent.mutate({
      sessionId,
      eventType: "checkout_start",
      pageSlug: "sales",
      splitTestVariant,
    });
    const result = await createCheckout.mutateAsync(values);
    setOrder(result.orderId, values.email, values.firstName);
    setCheckoutData({ checkoutConfigId: result.checkoutConfigId, orderId: result.orderId, sandbox: result.sandbox });
  };

  const handleCheckoutComplete = async (planId: string, receiptId?: string) => {
    if (!checkoutData || !selectedTier) return;
    try {
      await confirmMutation.mutateAsync({
        orderId: checkoutData.orderId,
        whopPaymentId: receiptId,
      });
    } catch (err) {
      console.error("Confirm purchase failed:", err);
    }
    addProduct(selectedTier);
    trackEvent.mutate({
      sessionId,
      eventType: "purchase",
      pageSlug: "sales",
      orderId: checkoutData.orderId,
      splitTestVariant,
    });
    onPurchaseComplete(selectedTier);
  };

  const handleCheckoutStateChange = (state: string) => {
    if (state === "completed" && checkoutData) {
      handleCheckoutComplete("", undefined);
    }
  };

  return (
    <section id="pricing-tiers" className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--titan-text-primary)" }}>
          Pick the Plan That's Right for You
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm" style={{ color: "var(--titan-text-secondary)" }}>
          All plans include a 30-day money-back guarantee. No risk, all upside.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.slug;

          return (
            <div
              key={tier.slug}
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-sm transition-all ${
                isSelected ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20" : "border-[var(--titan-border)] hover:border-blue-300 hover:shadow-md"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white shadow-sm">
                  {tier.badge}
                </div>
              )}

              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${tier.accentBg}`}>
                <Icon className={`h-6 w-6 ${tier.accent}`} />
              </div>

              <h3 className="mb-1 text-lg font-bold" style={{ color: "var(--titan-text-primary)" }}>
                {tier.name}
              </h3>
              <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--titan-text-secondary)" }}>
                {tier.description}
              </p>

              <div className="mb-4">
                <span className="text-sm text-gray-400 line-through">${tier.originalPrice}</span>
                <span className="ml-2 text-3xl font-bold" style={{ color: "var(--titan-text-primary)" }}>
                  ${tier.salePrice}
                </span>
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm" style={{ color: "var(--titan-text-primary)" }}>
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectTier(tier.slug)}
                disabled={isSelected && createCheckout.isPending}
                className={`w-full rounded-xl px-6 py-3 text-sm font-bold transition-all disabled:opacity-50 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md"
                    : "border-2 border-[var(--titan-border)] bg-white text-[var(--titan-text-primary)] hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                {isSelected && createCheckout.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Setting up...
                  </span>
                ) : isSelected ? "Selected" : `Get Started — $${tier.salePrice}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Checkout form appears below when a tier is selected */}
      {selectedTier && (
        <div className="mx-auto mt-10 max-w-lg">
          <div className="rounded-2xl border border-[var(--titan-border)] bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-center text-lg font-bold" style={{ color: "var(--titan-text-primary)" }}>
              Complete Your Order — {TIERS.find((t) => t.slug === selectedTier)?.name}
            </h3>

            {!checkoutData ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--titan-text-primary)" }}>
                    First Name
                  </label>
                  <input
                    {...form.register("firstName")}
                    placeholder="Your first name"
                    className="w-full rounded-lg border border-[var(--titan-border)] px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {form.formState.errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--titan-text-primary)" }}>
                    Email Address
                  </label>
                  <input
                    {...form.register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-[var(--titan-border)] px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {form.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--titan-text-primary)" }}>
                    Phone Number <span className="text-xs font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    {...form.register("phone")}
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="w-full rounded-lg border border-[var(--titan-border)] px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={createCheckout.isPending}
                  className="w-full rounded-xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--titan-gold) 0%, var(--titan-gold-hover) 100%)" }}
                >
                  {createCheckout.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" /> Setting up checkout...
                    </span>
                  ) : (
                    `Continue to Payment — $${TIERS.find((t) => t.slug === selectedTier)?.salePrice}`
                  )}
                </button>
                {createCheckout.isError && (
                  <p className="text-center text-sm text-red-500">{createCheckout.error.message}</p>
                )}
              </form>
            ) : checkoutData ? (
              <WhopCheckoutEmbed
                sessionId={checkoutData.checkoutConfigId}
                theme="light"
                environment={checkoutData.sandbox ? "sandbox" : "production"}
                prefill={{ email: formValues?.email }}
                setupFutureUsage="off_session"
                skipRedirect
                onComplete={handleCheckoutComplete}
                onStateChange={handleCheckoutStateChange}
                fallback={
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                }
              />
            ) : null}
          </div>

          <div className="mt-6">
            <GuaranteeBlock />
          </div>
        </div>
      )}
    </section>
  );
}
