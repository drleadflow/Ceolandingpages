import { useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import StepRenderer from "./StepRenderer";
import { useStepNavigation } from "./useStepNavigation";
import { useFunnelSubmission } from "./useFunnelSubmission";
import SwipeContainer from "./SwipeContainer";

interface FunnelStep {
  id: number;
  stepKey: string;
  name: string;
  type: string;
  sortOrder: number;
  puckData: Record<string, unknown> | null;
  settings: Record<string, unknown>;
}

interface ConditionalRoute {
  fromStepKey: string;
  toStepKey: string;
  conditions: Array<{ field: string; operator: string; value: string }>;
  conditionLogic: "and" | "or";
}

interface FunnelRendererProps {
  funnelId: number;
  steps: FunnelStep[];
  conditionalRoutes: ConditionalRoute[];
  settings: Record<string, unknown>;
}

export default function FunnelRenderer({
  funnelId,
  steps,
  conditionalRoutes,
  settings,
}: FunnelRendererProps) {
  const {
    currentStep,
    currentIndex,
    isLastStep,
    totalSteps,
    visitedStepKeys,
    goToNext,
    goToPrev,
  } = useStepNavigation(steps, conditionalRoutes);

  const { formData, updateFormData, updateQuizAnswer, submitFunnel, isSubmitting } =
    useFunnelSubmission(funnelId);

  const formRef = useRef<HTMLFormElement>(null);

  const handleNext = useCallback(() => {
    // Gather form data from current step's form fields
    if (formRef.current) {
      const fd = new FormData(formRef.current);
      const stepData: Record<string, unknown> = {};
      fd.forEach((value, key) => {
        if (key === "quiz-answer" && currentStep) {
          // quiz answers handled via data attribute or questionId
        } else {
          stepData[key] = value;
        }
      });
      if (Object.keys(stepData).length > 0) {
        updateFormData(stepData);
      }
    }

    if (isLastStep) {
      // Submit
      const allVisited = [...visitedStepKeys, currentStep?.stepKey].filter(Boolean) as string[];
      submitFunnel(allVisited);
    } else {
      goToNext(formData);
    }
  }, [currentStep, isLastStep, formData, visitedStepKeys, updateFormData, goToNext, submitFunnel]);

  // Listen for button clicks within the rendered content
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("button");
      if (!button) return;

      // Check if it's a "next-step" action button (from ButtonBlock)
      const text = button.textContent?.toLowerCase() ?? "";
      if (text.includes("continue") || text.includes("next") || text.includes("submit") || text.includes("get started")) {
        e.preventDefault();
        handleNext();
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [handleNext]);

  if (!currentStep) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        No steps available
      </div>
    );
  }

  const transition = (settings as { transition?: string })?.transition ?? "slide-left";
  const variants = {
    "slide-left": {
      initial: { x: "100%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "-100%", opacity: 0 },
    },
    "slide-up": {
      initial: { y: "100%", opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: "-100%", opacity: 0 },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    none: {
      initial: {},
      animate: {},
      exit: {},
    },
  };

  const motionVariants = variants[transition as keyof typeof variants] ?? variants["slide-left"];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10">
        <div
          className="h-full bg-[#E5C158] transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <SwipeContainer onSwipeLeft={handleNext} onSwipeRight={goToPrev}>
        <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="min-h-screen pt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.stepKey}
              initial={motionVariants.initial}
              animate={motionVariants.animate}
              exit={motionVariants.exit}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="min-h-screen flex flex-col"
            >
              <StepRenderer puckData={currentStep.puckData} />
            </motion.div>
          </AnimatePresence>
        </form>
      </SwipeContainer>
    </div>
  );
}
