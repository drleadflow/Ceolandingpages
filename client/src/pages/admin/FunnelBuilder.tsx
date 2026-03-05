import { useState, useCallback, useRef } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import BuilderToolbar from "@/components/builder/BuilderToolbar";
import StepSidebar from "@/components/builder/StepSidebar";
import StepEditor from "@/components/builder/StepEditor";
import PreviewPanel from "@/components/builder/PreviewPanel";
import type { FunnelStepType } from "../../../../shared/funnel-builder-types";

type ViewMode = "editor" | "preview";

export default function FunnelBuilder() {
  const [, params] = useRoute("/admin/builder/:id");
  const funnelId = params?.id ? Number(params.id) : null;

  const utils = trpc.useUtils();

  // ── Queries ──
  const { data: funnel, isLoading } = trpc.funnelBuilder.get.useQuery(
    { id: funnelId! },
    { enabled: funnelId !== null },
  );

  // ── Mutations ──
  const saveMutation = trpc.funnelBuilder.steps.update.useMutation({
    onSuccess: () => utils.funnelBuilder.get.invalidate({ id: funnelId! }),
  });
  const publishMutation = trpc.funnelBuilder.publish.useMutation({
    onSuccess: () => utils.funnelBuilder.get.invalidate({ id: funnelId! }),
  });
  const addStepMutation = trpc.funnelBuilder.steps.create.useMutation({
    onSuccess: () => utils.funnelBuilder.get.invalidate({ id: funnelId! }),
  });
  const deleteStepMutation = trpc.funnelBuilder.steps.delete.useMutation({
    onSuccess: () => utils.funnelBuilder.get.invalidate({ id: funnelId! }),
  });
  const reorderMutation = trpc.funnelBuilder.steps.reorder.useMutation({
    onSuccess: () => utils.funnelBuilder.get.invalidate({ id: funnelId! }),
  });
  const duplicateMutation = trpc.funnelBuilder.steps.duplicate.useMutation({
    onSuccess: () => utils.funnelBuilder.get.invalidate({ id: funnelId! }),
  });

  // ── Local state ──
  const [activeStepId, setActiveStepId] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [viewMode, setViewMode] = useState<ViewMode>("editor");
  const pendingPuckDataRef = useRef<Record<string, unknown> | null>(null);

  // Auto-select first step
  const steps = funnel?.steps ?? [];
  if (steps.length > 0 && activeStepId === null) {
    setActiveStepId(steps[0].id);
  }
  // If active step was deleted, select first
  if (activeStepId !== null && !steps.find((s) => s.id === activeStepId) && steps.length > 0) {
    setActiveStepId(steps[0].id);
  }

  const activeStep = steps.find((s) => s.id === activeStepId) ?? null;

  // ── Handlers ──
  const handlePuckChange = useCallback((data: Record<string, unknown>) => {
    pendingPuckDataRef.current = data;
  }, []);

  const handleSave = useCallback(() => {
    if (!activeStepId || !pendingPuckDataRef.current) return;
    saveMutation.mutate({
      id: activeStepId,
      draftPuckData: JSON.stringify(pendingPuckDataRef.current),
    });
  }, [activeStepId, saveMutation]);

  const handlePublish = useCallback(() => {
    if (!funnelId) return;
    // Save current step first if there are pending changes
    if (activeStepId && pendingPuckDataRef.current) {
      saveMutation.mutate(
        {
          id: activeStepId,
          draftPuckData: JSON.stringify(pendingPuckDataRef.current),
        },
        {
          onSuccess: () => publishMutation.mutate({ id: funnelId }),
        },
      );
    } else {
      publishMutation.mutate({ id: funnelId });
    }
  }, [funnelId, activeStepId, saveMutation, publishMutation]);

  const handleAddStep = useCallback(
    (name: string, type: FunnelStepType) => {
      if (!funnelId) return;
      addStepMutation.mutate(
        { funnelId, name, type },
        {
          onSuccess: (newStep) => {
            setActiveStepId(newStep.id);
          },
        },
      );
    },
    [funnelId, addStepMutation],
  );

  const handleDeleteStep = useCallback(
    (stepId: number) => {
      if (!confirm("Delete this step?")) return;
      deleteStepMutation.mutate({ id: stepId });
    },
    [deleteStepMutation],
  );

  const handleReorder = useCallback(
    (stepIds: number[]) => {
      if (!funnelId) return;
      reorderMutation.mutate({ funnelId, stepIds });
    },
    [funnelId, reorderMutation],
  );

  const handleDuplicate = useCallback(
    (stepId: number) => {
      duplicateMutation.mutate({ id: stepId });
    },
    [duplicateMutation],
  );

  const handlePreview = useCallback(() => {
    if (funnel?.slug) {
      window.open(`/f/${funnel.slug}`, "_blank");
    }
  }, [funnel?.slug]);

  // ── Render ──
  if (!funnelId) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Invalid funnel ID
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Loading builder...
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Funnel not found
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      <BuilderToolbar
        funnelName={funnel.name}
        funnelSlug={funnel.slug}
        status={funnel.status}
        isSaving={saveMutation.isPending}
        isPublishing={publishMutation.isPending}
        previewMode={previewMode}
        onSave={handleSave}
        onPublish={handlePublish}
        onPreviewModeChange={setPreviewMode}
        onPreview={handlePreview}
      />
      <div className="flex-1 flex min-h-0">
        <StepSidebar
          steps={steps.map((s) => ({
            id: s.id,
            stepKey: s.stepKey,
            name: s.name,
            type: s.type as FunnelStepType,
            sortOrder: s.sortOrder,
          }))}
          activeStepId={activeStepId}
          onSelectStep={(id) => {
            // Save current step before switching
            if (activeStepId && pendingPuckDataRef.current) {
              saveMutation.mutate({
                id: activeStepId,
                draftPuckData: JSON.stringify(pendingPuckDataRef.current),
              });
              pendingPuckDataRef.current = null;
            }
            setActiveStepId(id);
          }}
          onReorder={handleReorder}
          onAddStep={handleAddStep}
          onDuplicateStep={handleDuplicate}
          onDeleteStep={handleDeleteStep}
        />
        <div className="flex-1 min-w-0">
          {activeStep ? (
            viewMode === "editor" ? (
              <StepEditor
                stepId={activeStep.id}
                puckData={activeStep.draftPuckData ?? activeStep.puckData}
                onChange={handlePuckChange}
                previewMode={previewMode}
              />
            ) : (
              <PreviewPanel
                puckData={activeStep.draftPuckData ?? activeStep.puckData}
                previewMode={previewMode}
                stepName={activeStep.name}
              />
            )
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              Select a step to start editing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
