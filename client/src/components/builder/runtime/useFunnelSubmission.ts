import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";

export function useFunnelSubmission(funnelId: number) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const sessionIdRef = useRef(
    typeof crypto !== "undefined"
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  );

  const submitMutation = trpc.funnelSubmissions.submit.useMutation();

  const updateFormData = useCallback((stepData: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const updateQuizAnswer = useCallback((questionId: string, answerId: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  }, []);

  const submitFunnel = useCallback(
    async (completedSteps: string[]) => {
      return submitMutation.mutateAsync({
        funnelId,
        sessionId: sessionIdRef.current,
        data: formData,
        completedSteps,
        quizAnswers: Object.keys(quizAnswers).length > 0 ? quizAnswers : undefined,
      });
    },
    [funnelId, formData, quizAnswers, submitMutation],
  );

  return {
    formData,
    quizAnswers,
    sessionId: sessionIdRef.current,
    isSubmitting: submitMutation.isPending,
    updateFormData,
    updateQuizAnswer,
    submitFunnel,
  };
}
