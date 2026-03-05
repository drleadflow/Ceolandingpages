import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Plus, GripVertical, Copy, Trash2, FileText, FormInput, HelpCircle, CreditCard, Calendar, CheckCircle } from "lucide-react";
import type { FunnelStepType } from "../../../../shared/funnel-builder-types";

interface StepItem {
  id: number;
  stepKey: string;
  name: string;
  type: FunnelStepType;
  sortOrder: number;
}

interface StepSidebarProps {
  steps: StepItem[];
  activeStepId: number | null;
  onSelectStep: (stepId: number) => void;
  onReorder: (stepIds: number[]) => void;
  onAddStep: (name: string, type: FunnelStepType) => void;
  onDuplicateStep: (stepId: number) => void;
  onDeleteStep: (stepId: number) => void;
}

const STEP_TYPE_ICONS: Record<FunnelStepType, React.ReactNode> = {
  content: <FileText className="w-3.5 h-3.5" />,
  form: <FormInput className="w-3.5 h-3.5" />,
  quiz: <HelpCircle className="w-3.5 h-3.5" />,
  checkout: <CreditCard className="w-3.5 h-3.5" />,
  calendar: <Calendar className="w-3.5 h-3.5" />,
  "thank-you": <CheckCircle className="w-3.5 h-3.5" />,
};

function StepRow({
  step,
  isActive,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  step: StepItem;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const controls = useDragControls();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Reorder.Item
      value={step}
      dragListener={false}
      dragControls={controls}
      className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm group transition-colors ${
        isActive
          ? "bg-[#E5C158]/20 text-[#E5C158] border border-[#E5C158]/30"
          : "text-slate-400 hover:bg-slate-700/50 hover:text-white border border-transparent"
      }`}
      onClick={onSelect}
    >
      <div
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 touch-none"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <span className="opacity-60">{STEP_TYPE_ICONS[step.type]}</span>
      <span className="flex-1 truncate">{step.name}</span>
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white transition-opacity"
        >
          <span className="text-xs">...</span>
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-6 z-20 bg-slate-700 border border-slate-600 rounded-lg shadow-xl py-1 min-w-[120px]">
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-600 hover:text-white"
              >
                <Copy className="w-3 h-3" /> Duplicate
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-400 hover:bg-slate-600 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </Reorder.Item>
  );
}

export default function StepSidebar({
  steps,
  activeStepId,
  onSelectStep,
  onReorder,
  onAddStep,
  onDuplicateStep,
  onDeleteStep,
}: StepSidebarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const stepTypes: { type: FunnelStepType; label: string }[] = [
    { type: "content", label: "Content" },
    { type: "form", label: "Form" },
    { type: "quiz", label: "Quiz" },
    { type: "checkout", label: "Checkout" },
    { type: "calendar", label: "Calendar" },
    { type: "thank-you", label: "Thank You" },
  ];

  const handleReorder = (reordered: StepItem[]) => {
    onReorder(reordered.map((s) => s.id));
  };

  return (
    <div className="w-52 shrink-0 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      <div className="px-3 py-3 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Steps</span>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="p-1 text-slate-400 hover:text-[#E5C158] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
              <div className="absolute right-0 top-8 z-20 bg-slate-700 border border-slate-600 rounded-lg shadow-xl py-1 min-w-[140px]">
                {stepTypes.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => {
                      onAddStep(`New ${label}`, type);
                      setShowAddMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-600 hover:text-white"
                  >
                    {STEP_TYPE_ICONS[type]}
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <Reorder.Group axis="y" values={steps} onReorder={handleReorder} className="space-y-1">
          {steps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              isActive={step.id === activeStepId}
              onSelect={() => onSelectStep(step.id)}
              onDuplicate={() => onDuplicateStep(step.id)}
              onDelete={() => onDeleteStep(step.id)}
            />
          ))}
        </Reorder.Group>
      </div>
    </div>
  );
}
