import { useState, useCallback, useMemo } from "react";

interface ConditionalRoute {
  fromStepKey: string;
  toStepKey: string;
  conditions: Array<{ field: string; operator: string; value: string }>;
  conditionLogic: "and" | "or";
}

interface Step {
  stepKey: string;
  sortOrder: number;
}

function evaluateCondition(
  condition: { field: string; operator: string; value: string },
  formData: Record<string, unknown>,
): boolean {
  const fieldValue = String(formData[condition.field] ?? "");
  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "not_equals":
      return fieldValue !== condition.value;
    case "contains":
      return fieldValue.includes(condition.value);
    case "gt":
      return Number(fieldValue) > Number(condition.value);
    case "lt":
      return Number(fieldValue) < Number(condition.value);
    default:
      return false;
  }
}

function evaluateRoute(
  route: ConditionalRoute,
  formData: Record<string, unknown>,
): boolean {
  if (route.conditions.length === 0) return true;
  if (route.conditionLogic === "and") {
    return route.conditions.every((c) => evaluateCondition(c, formData));
  }
  return route.conditions.some((c) => evaluateCondition(c, formData));
}

export function useStepNavigation<S extends Step>(
  steps: S[],
  conditionalRoutes: ConditionalRoute[],
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visitedStepKeys, setVisitedStepKeys] = useState<string[]>([]);

  const sortedSteps = useMemo(
    () => [...steps].sort((a, b) => a.sortOrder - b.sortOrder),
    [steps],
  );

  const currentStep: S | null = sortedSteps[currentIndex] ?? null;
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === sortedSteps.length - 1;
  const totalSteps = sortedSteps.length;

  const goToNext = useCallback(
    (formData: Record<string, unknown>) => {
      if (!currentStep) return;

      // Mark current step as visited
      setVisitedStepKeys((prev) =>
        prev.includes(currentStep.stepKey) ? prev : [...prev, currentStep.stepKey],
      );

      // Check conditional routes from this step
      const matchingRoutes = conditionalRoutes.filter(
        (r) => r.fromStepKey === currentStep.stepKey,
      );

      for (const route of matchingRoutes) {
        if (evaluateRoute(route, formData)) {
          const targetIndex = sortedSteps.findIndex(
            (s) => s.stepKey === route.toStepKey,
          );
          if (targetIndex >= 0) {
            setCurrentIndex(targetIndex);
            return;
          }
        }
      }

      // Default: go to next sequential step
      if (currentIndex < sortedSteps.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
    [currentStep, currentIndex, sortedSteps, conditionalRoutes],
  );

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  return {
    currentStep,
    currentIndex,
    isFirstStep,
    isLastStep,
    totalSteps,
    visitedStepKeys,
    goToNext,
    goToPrev,
  };
}
