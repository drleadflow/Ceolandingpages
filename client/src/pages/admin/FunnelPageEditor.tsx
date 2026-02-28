import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus, Save, ExternalLink, Eye, EyeOff, Monitor, Smartphone, Upload, X, FileEdit, Sparkles } from "lucide-react";
import { AiAssistantPanel } from "@/components/admin/AiAssistantPanel";

type PageSlug = "sales" | "upsell" | "downsell" | "thank-you" | "book-session" | "call-prep";

const PAGE_SLUGS: PageSlug[] = ["sales", "upsell", "downsell", "thank-you", "book-session", "call-prep"];

const SLUG_TO_PATH: Record<PageSlug, string> = {
  sales: "/fb-ads-course",
  upsell: "/offer/vault",
  downsell: "/offer/session",
  "thank-you": "/thank-you",
  "book-session": "/book-session",
  "call-prep": "/call-prep",
};

const SLUG_LABELS: Record<PageSlug, string> = {
  sales: "Sales Page",
  upsell: "Upsell Page",
  downsell: "Downsell Page",
  "thank-you": "Thank You Page",
  "book-session": "Booking Page",
  "call-prep": "Call Prep Page",
};

interface FaqItem {
  q: string;
  a: string;
}

interface FormState {
  headline: string;
  subheadline: string;
  bodyText: string;
  ctaText: string;
  declineText: string;
  originalPriceCents: string;
  salePriceCents: string;
  heroImageUrl: string;
  videoUrl: string;
  videoOverlayStyle: string;
  senjaWidgetId: string;
  valueStackItems: string[];
  faqItems: FaqItem[];
}

const EMPTY_FORM: FormState = {
  headline: "",
  subheadline: "",
  bodyText: "",
  ctaText: "",
  declineText: "",
  originalPriceCents: "",
  salePriceCents: "",
  heroImageUrl: "",
  videoUrl: "",
  videoOverlayStyle: "front-and-center",
  senjaWidgetId: "",
  valueStackItems: [],
  faqItems: [],
};

function parseValueStack(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // ignore
  }
  return [];
}

function parseFaqItems(raw: unknown): FaqItem[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      return parsed.map((item: unknown) => {
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          return { q: String(obj.q ?? ""), a: String(obj.a ?? "") };
        }
        return { q: "", a: "" };
      });
    }
  } catch {
    // ignore
  }
  return [];
}

function dataToForm(data: Record<string, unknown>): FormState {
  return {
    headline: String(data.headline ?? ""),
    subheadline: String(data.subheadline ?? ""),
    bodyText: String(data.bodyText ?? ""),
    ctaText: String(data.ctaText ?? ""),
    declineText: String(data.declineText ?? ""),
    originalPriceCents: data.originalPriceCents != null ? String(data.originalPriceCents) : "",
    salePriceCents: data.salePriceCents != null ? String(data.salePriceCents) : "",
    heroImageUrl: String(data.heroImageUrl ?? ""),
    videoUrl: String(data.videoUrl ?? ""),
    videoOverlayStyle: String(data.videoOverlayStyle ?? "front-and-center"),
    senjaWidgetId: String(data.senjaWidgetId ?? ""),
    valueStackItems: parseValueStack(data.valueStackItems),
    faqItems: parseFaqItems(data.faqItems),
  };
}

function formToPayload(slug: PageSlug, form: FormState) {
  return {
    slug,
    headline: form.headline || undefined,
    subheadline: form.subheadline || undefined,
    bodyText: form.bodyText || undefined,
    ctaText: form.ctaText || undefined,
    declineText: form.declineText || undefined,
    originalPrice: form.originalPriceCents !== "" ? Number(form.originalPriceCents) : undefined,
    salePrice: form.salePriceCents !== "" ? Number(form.salePriceCents) : undefined,
    heroImageUrl: form.heroImageUrl || undefined,
    videoUrl: form.videoUrl || undefined,
    videoOverlayStyle: form.videoOverlayStyle || undefined,
    senjaWidgetId: form.senjaWidgetId || undefined,
    valueStackItems: JSON.stringify(form.valueStackItems),
    faqItems: JSON.stringify(form.faqItems),
  };
}

interface ValueStackEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
}

function ValueStackEditor({ items, onChange }: ValueStackEditorProps) {
  function updateItem(index: number, value: string) {
    const next = items.map((item, i) => (i === index ? value : item));
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, ""]);
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={`Value item ${index + 1}`}
            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeItem(index)}
            className="text-slate-400 hover:text-red-400 hover:bg-slate-700 flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
}

interface FaqEditorProps {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
}

function FaqEditor({ items, onChange }: FaqEditorProps) {
  function updateItem(index: number, field: "q" | "a", value: string) {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, { q: "", a: "" }]);
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-md border border-slate-700 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <Input
                value={item.q}
                onChange={(e) => updateItem(index, "q", e.target.value)}
                placeholder="Question"
                className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
              />
              <Textarea
                value={item.a}
                onChange={(e) => updateItem(index, "a", e.target.value)}
                placeholder="Answer"
                rows={2}
                className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 resize-none"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              className="text-slate-400 hover:text-red-400 hover:bg-slate-700 flex-shrink-0 mt-0.5"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add FAQ
      </Button>
    </div>
  );
}

// ── Live Preview Panel ──

interface LivePreviewProps {
  slug: PageSlug;
  refreshKey: number;
}

function LivePreview({ slug, refreshKey }: LivePreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const previewUrl = `${window.location.origin}${SLUG_TO_PATH[slug]}?preview=true`;

  return (
    <div className="flex flex-col h-full">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800/50 px-3 py-2">
        <span className="text-xs font-medium text-slate-400">Live Preview</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDevice("desktop")}
            className={`rounded p-1.5 transition ${device === "desktop" ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
            title="Desktop view"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`rounded p-1.5 transition ${device === "mobile" ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
            title="Mobile view"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* iframe container */}
      <div className="flex-1 flex items-start justify-center overflow-auto bg-slate-950 p-4">
        <div
          className="bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            width: device === "mobile" ? "375px" : "100%",
            maxWidth: device === "mobile" ? "375px" : "100%",
            height: device === "mobile" ? "667px" : "100%",
          }}
        >
          <iframe
            key={`${slug}-${refreshKey}`}
            src={previewUrl}
            className="w-full h-full border-0"
            style={{ minHeight: device === "desktop" ? "600px" : "667px" }}
            title={`Preview: ${SLUG_LABELS[slug]}`}
          />
        </div>
      </div>
    </div>
  );
}

// ── Page Editor Panel ──

interface PageEditorPanelProps {
  slug: PageSlug;
  showPreview: boolean;
}

function PageEditorPanel({ slug, showPreview }: PageEditorPanelProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [notFound, setNotFound] = useState(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const { data, error, isLoading } = trpc.funnelAdmin.pages.get.useQuery(
    { slug },
    {
      retry: (failureCount, err) => {
        if ((err as { data?: { code?: string } })?.data?.code === "NOT_FOUND") return false;
        return failureCount < 2;
      },
    }
  );

  const hasDraft = Boolean(data?.draftContent);

  const utils = trpc.useUtils();

  const updateMutation = trpc.funnelAdmin.pages.update.useMutation({
    onSuccess: () => {
      toast.success("Draft saved.");
      utils.funnelAdmin.pages.get.invalidate({ slug });
      setPreviewRefreshKey((k) => k + 1);
    },
    onError: (err) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  const publishMutation = trpc.funnelAdmin.pages.publish.useMutation({
    onSuccess: () => {
      toast.success("Page published!");
      utils.funnelAdmin.pages.get.invalidate({ slug });
      utils.funnelAdmin.pages.getPublic.invalidate({ slug });
      utils.funnelAdmin.pages.getPreview.invalidate({ slug });
      setPreviewRefreshKey((k) => k + 1);
    },
    onError: (err) => {
      toast.error(`Publish failed: ${err.message}`);
    },
  });

  const discardMutation = trpc.funnelAdmin.pages.discardDraft.useMutation({
    onSuccess: () => {
      toast.success("Draft discarded.");
      utils.funnelAdmin.pages.get.invalidate({ slug });
      setPreviewRefreshKey((k) => k + 1);
    },
    onError: (err) => {
      toast.error(`Discard failed: ${err.message}`);
    },
  });

  useEffect(() => {
    if (data) {
      setNotFound(false);
      // If a draft exists, populate form from draft; otherwise from published fields
      if (data.draftContent) {
        try {
          const draft = JSON.parse(data.draftContent) as Record<string, unknown>;
          setForm(dataToForm(draft));
        } catch {
          setForm(dataToForm(data as Record<string, unknown>));
        }
      } else {
        setForm(dataToForm(data as Record<string, unknown>));
      }
    } else if (error) {
      const code = (error as { data?: { code?: string } })?.data?.code;
      if (code === "NOT_FOUND") {
        setNotFound(true);
        setForm(EMPTY_FORM);
      }
    }
  }, [data, error]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    try {
      const payload = formToPayload(slug, form);
      await updateMutation.mutateAsync(payload);
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  function handlePublish() {
    publishMutation.mutate({ slug });
  }

  function handleDiscard() {
    discardMutation.mutate({ slug });
  }

  const livePath = SLUG_TO_PATH[slug];
  const liveUrl = `${window.location.origin}${livePath}?preview=true`;

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-400">Loading page content...</div>
    );
  }

  const editorForm = (
    <div className="space-y-6">
      {/* View Live Page link */}
      <div className="flex items-center justify-between">
        {notFound && (
          <div className="rounded-md border border-slate-700 bg-slate-800/50 px-4 py-2 text-slate-400 text-sm">
            No content saved yet — fill in the fields below and save.
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAiPanelOpen(true)}
            className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            AI Assistant
          </Button>
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-slate-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Live Page
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-slate-300">Headline</Label>
          <Input
            value={form.headline}
            onChange={(e) => setField("headline", e.target.value)}
            placeholder="Main headline"
            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Subheadline</Label>
          <Input
            value={form.subheadline}
            onChange={(e) => setField("subheadline", e.target.value)}
            placeholder="Supporting subheadline"
            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Body Text</Label>
        <Textarea
          value={form.bodyText}
          onChange={(e) => setField("bodyText", e.target.value)}
          placeholder="Main body content"
          rows={5}
          className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 resize-y"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-slate-300">CTA Text</Label>
          <Input
            value={form.ctaText}
            onChange={(e) => setField("ctaText", e.target.value)}
            placeholder="e.g. Yes, I want this!"
            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Decline Text</Label>
          <Input
            value={form.declineText}
            onChange={(e) => setField("declineText", e.target.value)}
            placeholder="e.g. No thanks, I'll pass"
            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-slate-300">Original Price (cents)</Label>
          <Input
            type="number"
            value={form.originalPriceCents}
            onChange={(e) => setField("originalPriceCents", e.target.value)}
            placeholder="e.g. 9700"
            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Sale Price (cents)</Label>
          <Input
            type="number"
            value={form.salePriceCents}
            onChange={(e) => setField("salePriceCents", e.target.value)}
            placeholder="e.g. 4700"
            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-slate-300">Video Thumbnail URL</Label>
          <Input
            value={form.heroImageUrl}
            onChange={(e) => setField("heroImageUrl", e.target.value)}
            placeholder="https://..."
            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
          />
          <p className="text-xs text-slate-500">Overrides auto-detected thumbnail. Leave blank for YouTube auto-thumbnails.</p>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Video URL</Label>
          <Input
            value={form.videoUrl}
            onChange={(e) => setField("videoUrl", e.target.value)}
            placeholder="https://..."
            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Video Overlay Style</Label>
        <select
          value={form.videoOverlayStyle}
          onChange={(e) => setField("videoOverlayStyle", e.target.value)}
          className="w-full rounded-md bg-slate-800 border border-slate-600 text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="front-and-center">Front &amp; Center (default)</option>
          <option value="loud">Loud &amp; in Your Face</option>
          <option value="classy">Classy in the Corner</option>
          <option value="none">None</option>
        </select>
        <p className="text-xs text-slate-500">Controls the "Click to Unmute" overlay shown during smart autoplay.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Senja Widget ID</Label>
        <Input
          value={form.senjaWidgetId}
          onChange={(e) => setField("senjaWidgetId", e.target.value)}
          placeholder="Senja embed widget ID"
          className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Value Stack Items</Label>
        <ValueStackEditor
          items={form.valueStackItems}
          onChange={(items) => setField("valueStackItems", items)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">FAQ Items</Label>
        <FaqEditor
          items={form.faqItems}
          onChange={(items) => setField("faqItems", items)}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div>
          {hasDraft && (
            <Button
              onClick={handleDiscard}
              disabled={discardMutation.isPending}
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <X className="h-4 w-4 mr-2" />
              {discardMutation.isPending ? "Discarding..." : "Discard Draft"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishMutation.isPending || !hasDraft}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            {publishMutation.isPending ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );

  const aiPanel = (
    <AiAssistantPanel
      open={aiPanelOpen}
      onOpenChange={setAiPanelOpen}
      slug={slug}
      currentForm={{
        headline: form.headline,
        subheadline: form.subheadline,
        bodyText: form.bodyText,
        ctaText: form.ctaText,
        declineText: form.declineText,
      }}
      onApplySuggestions={(suggestions) => {
        setForm((prev) => ({ ...prev, ...suggestions }));
      }}
    />
  );

  if (!showPreview) {
    return (
      <>
        {aiPanel}
        {editorForm}
      </>
    );
  }

  return (
    <>
      {aiPanel}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Editor side */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] pr-2">
          {editorForm}
        </div>
        {/* Preview side */}
        <div className="hidden xl:block rounded-lg border border-slate-700 overflow-hidden h-[calc(100vh-220px)]">
          <LivePreview slug={slug} refreshKey={previewRefreshKey} />
        </div>
      </div>
    </>
  );
}

// ── Main Page ──

export default function FunnelPageEditor() {
  const [activeSlug, setActiveSlug] = useState<PageSlug>("sales");
  const [showPreview, setShowPreview] = useState(true);

  // Fetch all pages to detect which ones have drafts
  const pagesListQuery = trpc.funnelAdmin.pages.list.useQuery();
  const draftSlugs = useMemo(() => {
    const set = new Set<string>();
    if (pagesListQuery.data) {
      for (const page of pagesListQuery.data) {
        if (page.draftContent) set.add(page.pageSlug);
      }
    }
    return set;
  }, [pagesListQuery.data]);

  return (
    <div className="p-6">
      <div className={showPreview ? "mx-auto max-w-7xl" : "mx-auto max-w-4xl"}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Funnel Page Editor</h1>
            <p className="mt-1 text-sm text-slate-400">
              Edit content for each page in your funnel.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 hidden xl:flex"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
        </div>

        <Tabs
          value={activeSlug}
          onValueChange={(v) => setActiveSlug(v as PageSlug)}
          className="space-y-6"
        >
          <TabsList className="bg-slate-800 border border-slate-700">
            {PAGE_SLUGS.map((slug) => (
              <TabsTrigger
                key={slug}
                value={slug}
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400 capitalize"
              >
                {SLUG_LABELS[slug]}
                {draftSlugs.has(slug) && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                    <FileEdit className="h-2.5 w-2.5 mr-0.5" />
                    Draft
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {PAGE_SLUGS.map((slug) => (
            <TabsContent key={slug} value={slug}>
              <PageEditorPanel slug={slug} showPreview={showPreview} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
