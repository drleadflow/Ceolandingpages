import { useState } from "react";
import { Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type PageSlug = "sales" | "sales-dual" | "agency" | "quiz" | "upsell" | "downsell" | "thank-you" | "book-session" | "call-prep" | "masterclass" | "roadmap-info";

interface FormState {
  headline: string;
  subheadline: string;
  bodyText: string;
  ctaText: string;
  declineText: string;
}

type SuggestionField = keyof FormState;

const FIELD_LABELS: Record<SuggestionField, string> = {
  headline: "Headline",
  subheadline: "Subheadline",
  bodyText: "Body Text",
  ctaText: "CTA Text",
  declineText: "Decline Text",
};

const EXAMPLE_PROMPTS: Record<string, string[]> = {
  sales: [
    "Write a more urgent headline",
    "Make the subheadline more benefit-driven",
    "Improve the CTA to increase conversions",
  ],
  upsell: [
    "Create more urgency in the headline",
    "Make the value proposition clearer",
    "Write a softer decline text",
  ],
  downsell: [
    "Make the headline more empathetic",
    "Emphasize the 1-on-1 value in the subheadline",
    "Write a friendlier CTA",
  ],
  default: [
    "Write a more compelling headline",
    "Improve the subheadline",
    "Make the CTA more action-oriented",
  ],
};

interface AiAssistantPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: PageSlug;
  currentForm: FormState;
  onApplySuggestions: (suggestions: Partial<FormState>) => void;
}

export function AiAssistantPanel({
  open,
  onOpenChange,
  slug,
  currentForm,
  onApplySuggestions,
}: AiAssistantPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<Partial<Record<SuggestionField, string>> | null>(null);
  const [rationale, setRationale] = useState("");
  const [selected, setSelected] = useState<Set<SuggestionField>>(new Set());

  const suggestMutation = trpc.funnelAdmin.ai.suggest.useMutation({
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
      setRationale(data.rationale);
      // Select all suggestions by default
      setSelected(new Set(Object.keys(data.suggestions) as SuggestionField[]));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleGenerate() {
    if (!prompt.trim()) return;

    // Build currentContent from text fields only
    const currentContent: Record<string, string> = {};
    for (const key of ["headline", "subheadline", "bodyText", "ctaText", "declineText"] as const) {
      if (currentForm[key]) {
        currentContent[key] = currentForm[key];
      }
    }

    setSuggestions(null);
    setRationale("");
    setSelected(new Set());

    suggestMutation.mutate({
      slug,
      prompt: prompt.trim(),
      currentContent,
    });
  }

  function toggleField(field: SuggestionField) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }

  function handleApply() {
    if (!suggestions) return;

    const toApply: Partial<FormState> = {};
    const selectedArr = Array.from(selected);
    for (const field of selectedArr) {
      const value = suggestions[field];
      if (value !== undefined) {
        (toApply as Record<string, string>)[field] = value;
      }
    }

    onApplySuggestions(toApply);
    toast.success("AI suggestions applied");
    onOpenChange(false);

    // Reset state
    setPrompt("");
    setSuggestions(null);
    setRationale("");
    setSelected(new Set());
  }

  const examples = EXAMPLE_PROMPTS[slug] ?? EXAMPLE_PROMPTS.default;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg bg-slate-900 border-slate-700 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-slate-100">
            <Sparkles className="h-5 w-5 text-violet-400" />
            AI Copy Assistant
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Describe what you want to improve and AI will suggest copy changes.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4 px-4 pb-4">
          {/* Example prompts */}
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 transition hover:border-violet-500/50 hover:text-violet-300"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Prompt input */}
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Write a more urgent headline that emphasizes the time-limited offer..."
            rows={3}
            maxLength={500}
            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 resize-none"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{prompt.length}/500</span>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || suggestMutation.isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {suggestMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate
                </span>
              )}
            </Button>
          </div>

          {/* Suggestions */}
          {suggestions && Object.keys(suggestions).length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-medium text-slate-300">Suggestions</h3>

              {rationale && (
                <p className="rounded-lg bg-slate-800/50 p-3 text-xs text-slate-400 italic">
                  {rationale}
                </p>
              )}

              {(Object.entries(suggestions) as [SuggestionField, string][]).map(
                ([field, suggested]) => {
                  const current = currentForm[field];
                  const isSelected = selected.has(field);

                  return (
                    <div
                      key={field}
                      className={`rounded-lg border p-3 transition cursor-pointer ${
                        isSelected
                          ? "border-violet-500/50 bg-violet-500/10"
                          : "border-slate-700 bg-slate-800/50"
                      }`}
                      onClick={() => toggleField(field)}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">
                          {FIELD_LABELS[field]}
                        </span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                            isSelected
                              ? "border-violet-500 bg-violet-500"
                              : "border-slate-600"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>

                      {current && (
                        <div className="mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500">
                            Current
                          </span>
                          <p className="mt-0.5 text-xs text-slate-500 line-through">
                            {current.length > 150 ? current.slice(0, 150) + "..." : current}
                          </p>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-emerald-400">
                          Suggested
                        </span>
                        <p className="mt-0.5 text-sm text-slate-200">
                          {suggested.length > 200 ? suggested.slice(0, 200) + "..." : suggested}
                        </p>
                      </div>
                    </div>
                  );
                },
              )}

              <Button
                onClick={handleApply}
                disabled={selected.size === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Apply Selected ({selected.size})
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
