import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function SettingsPage() {
  const settingQuery = trpc.funnelAdmin.settings.get.useQuery({ key: "checkout_test_mode" });
  const updateMutation = trpc.funnelAdmin.settings.update.useMutation({
    onSuccess: () => settingQuery.refetch(),
  });

  const isTestMode = settingQuery.data?.value === "true";
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    setPending(true);
    await updateMutation.mutateAsync({ key: "checkout_test_mode", value: isTestMode ? "false" : "true" });
    setPending(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      <div className="max-w-xl rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Checkout Settings</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-200">Test Mode (Sandbox)</p>
            <p className="text-xs text-slate-400 mt-1">
              When enabled, checkouts use Whop sandbox. No real charges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isTestMode
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {isTestMode ? "TEST" : "LIVE"}
            </span>

            <button
              onClick={toggle}
              disabled={pending || settingQuery.isLoading}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                isTestMode ? "bg-amber-500" : "bg-slate-600"
              } ${pending ? "opacity-50" : ""}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ${
                  isTestMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {isTestMode && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-300">
              <strong>Test mode is ON.</strong> Use card{" "}
              <code className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-amber-200">
                4242 4242 4242 4242
              </code>{" "}
              with any future date and CVC.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
