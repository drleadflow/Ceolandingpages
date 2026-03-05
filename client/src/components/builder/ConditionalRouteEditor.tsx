import { useState } from "react";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface StepOption {
  stepKey: string;
  name: string;
}

interface ConditionalRouteEditorProps {
  funnelId: number;
  currentStepKey: string;
  steps: StepOption[];
}

const OPERATORS = [
  { label: "Equals", value: "equals" },
  { label: "Not Equals", value: "not_equals" },
  { label: "Contains", value: "contains" },
  { label: "Greater Than", value: "gt" },
  { label: "Less Than", value: "lt" },
] as const;

export default function ConditionalRouteEditor({
  funnelId,
  currentStepKey,
  steps,
}: ConditionalRouteEditorProps) {
  const utils = trpc.useUtils();
  const { data: routes } = trpc.funnelConditions.list.useQuery({ funnelId });
  const createMutation = trpc.funnelConditions.create.useMutation({
    onSuccess: () => utils.funnelConditions.list.invalidate({ funnelId }),
  });
  const deleteMutation = trpc.funnelConditions.delete.useMutation({
    onSuccess: () => utils.funnelConditions.list.invalidate({ funnelId }),
  });

  const stepRoutes = (routes ?? []).filter((r) => r.fromStepKey === currentStepKey);
  const otherSteps = steps.filter((s) => s.stepKey !== currentStepKey);

  const [newRoute, setNewRoute] = useState({
    toStepKey: "",
    field: "",
    operator: "equals" as string,
    value: "",
  });

  const handleAdd = () => {
    if (!newRoute.toStepKey || !newRoute.field) return;
    createMutation.mutate({
      funnelId,
      fromStepKey: currentStepKey,
      toStepKey: newRoute.toStepKey,
      conditions: [{ field: newRoute.field, operator: newRoute.operator as "equals", value: newRoute.value }],
      conditionLogic: "and",
    });
    setNewRoute({ toStepKey: "", field: "", operator: "equals", value: "" });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Conditional Routes
      </h4>

      {stepRoutes.length === 0 && (
        <p className="text-xs text-slate-500">No conditional routes. Next step will be sequential.</p>
      )}

      {stepRoutes.map((route) => {
        const targetStep = steps.find((s) => s.stepKey === route.toStepKey);
        return (
          <div
            key={route.id}
            className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 text-xs"
          >
            <span className="text-slate-400">If</span>
            <span className="text-white font-mono">
              {(route.conditions as Array<{ field: string; operator: string; value: string }>)?.[0]?.field ?? "?"}
            </span>
            <span className="text-[#E5C158]">
              {(route.conditions as Array<{ operator: string }>)?.[0]?.operator ?? "?"}
            </span>
            <span className="text-white">
              "{(route.conditions as Array<{ value: string }>)?.[0]?.value ?? ""}"
            </span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="text-green-400">{targetStep?.name ?? route.toStepKey}</span>
            <button
              onClick={() => deleteMutation.mutate({ id: route.id })}
              className="ml-auto text-slate-500 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* Add new route */}
      <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Field name"
            value={newRoute.field}
            onChange={(e) => setNewRoute({ ...newRoute, field: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder:text-slate-500"
          />
          <select
            value={newRoute.operator}
            onChange={(e) => setNewRoute({ ...newRoute, operator: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Value"
            value={newRoute.value}
            onChange={(e) => setNewRoute({ ...newRoute, value: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder:text-slate-500"
          />
          <select
            value={newRoute.toStepKey}
            onChange={(e) => setNewRoute({ ...newRoute, toStepKey: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
          >
            <option value="">Go to step...</option>
            {otherSteps.map((s) => (
              <option key={s.stepKey} value={s.stepKey}>{s.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={!newRoute.toStepKey || !newRoute.field || createMutation.isPending}
          className="flex items-center gap-1 text-xs text-[#E5C158] hover:text-[#d4b04a] disabled:opacity-50"
        >
          <Plus className="w-3 h-3" />
          Add Route
        </button>
      </div>
    </div>
  );
}
