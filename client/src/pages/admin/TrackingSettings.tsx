import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2, Radio } from "lucide-react";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const pixelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  platform: z.enum(["facebook", "google_analytics", "google_tag_manager", "tiktok", "hyros", "posthog", "custom"]),
  pixelId: z.string().min(1, "Pixel/Measurement ID is required"),
  accessToken: z.string().optional(),
  pageScope: z.string().optional(), // JSON string
  eventMapping: z.string().optional(), // JSON string
});

type PixelFormValues = z.infer<typeof pixelSchema>;

// ---------------------------------------------------------------------------
// Platform Config
// ---------------------------------------------------------------------------

const PLATFORM_CONFIG: Record<string, { label: string; color: string; idLabel: string }> = {
  facebook: {
    label: "Facebook",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    idLabel: "Pixel ID",
  },
  google_analytics: {
    label: "GA4",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    idLabel: "Measurement ID",
  },
  google_tag_manager: {
    label: "GTM",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    idLabel: "Container ID",
  },
  tiktok: {
    label: "TikTok",
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    idLabel: "Pixel ID",
  },
  hyros: {
    label: "Hyros",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    idLabel: "Script Hash (ph parameter)",
  },
  posthog: {
    label: "PostHog",
    color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    idLabel: "Project API Key",
  },
  custom: {
    label: "Custom",
    color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    idLabel: "Tracking ID",
  },
};

// ---------------------------------------------------------------------------
// Default Event Mappings
// ---------------------------------------------------------------------------

const DEFAULT_EVENTS: Record<string, Record<string, string>> = {
  facebook: {
    page_view: "PageView",
    checkout_start: "InitiateCheckout",
    purchase: "Purchase",
    upsell_view: "ViewContent",
    upsell_accept: "Purchase",
    downsell_view: "ViewContent",
    downsell_accept: "Purchase",
  },
  google_analytics: {
    page_view: "page_view",
    checkout_start: "begin_checkout",
    purchase: "purchase",
    upsell_view: "view_item",
    upsell_accept: "purchase",
    downsell_view: "view_item",
    downsell_accept: "purchase",
  },
  tiktok: {
    page_view: "ViewContent",
    checkout_start: "InitiateCheckout",
    purchase: "CompletePayment",
    upsell_view: "ViewContent",
    upsell_accept: "CompletePayment",
    downsell_view: "ViewContent",
    downsell_accept: "CompletePayment",
  },
  hyros: {
    page_view: "PageView",
    checkout_start: "InitiateCheckout",
    purchase: "Purchase",
    upsell_view: "ViewContent",
    upsell_accept: "Purchase",
    downsell_view: "ViewContent",
    downsell_accept: "Purchase",
  },
  posthog: {
    page_view: "$pageview",
    checkout_start: "checkout_started",
    purchase: "purchase_completed",
    upsell_view: "upsell_viewed",
    upsell_accept: "upsell_accepted",
    downsell_view: "downsell_viewed",
    downsell_accept: "downsell_accepted",
  },
};

const INTERNAL_EVENTS = [
  "page_view",
  "checkout_start",
  "purchase",
  "upsell_view",
  "upsell_accept",
  "downsell_view",
  "downsell_accept",
];

const PAGE_SCOPE_OPTIONS = [
  "masterclass",
  "sales",
  "agency",
  "upsell",
  "downsell",
  "thank-you",
  "book-session",
  "quiz",
  "roadmap-info",
];

// ---------------------------------------------------------------------------
// Types (inferred from trpc output — kept loose for compatibility)
// ---------------------------------------------------------------------------

type TrackingPixel = {
  id: number | string;
  name: string;
  platform: string;
  pixelId: string;
  accessToken?: string | null;
  pageScope?: string | null; // JSON string or null
  eventMapping?: string | null; // JSON string or null
  isActive: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseScopeArray(pageScope: string | null | undefined): string[] {
  if (!pageScope) return [];
  try {
    const parsed = JSON.parse(pageScope);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseEventMapping(
  eventMapping: string | null | undefined
): Record<string, string> {
  if (!eventMapping) return {};
  try {
    const parsed = JSON.parse(eventMapping);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrackingSettings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPixel, setEditingPixel] = useState<TrackingPixel | null>(null);

  // Local state for checkboxes and event mapping (not wired to react-hook-form directly)
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [eventMappingState, setEventMappingState] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();

  const { data: pixels, isLoading } = trpc.funnelAdmin.tracking.list.useQuery();

  const createPixel = trpc.funnelAdmin.tracking.create.useMutation({
    onSuccess: () => {
      utils.funnelAdmin.tracking.list.invalidate();
      closeDialog();
    },
  });

  const updatePixel = trpc.funnelAdmin.tracking.update.useMutation({
    onSuccess: () => {
      utils.funnelAdmin.tracking.list.invalidate();
      closeDialog();
    },
  });

  const toggleActive = trpc.funnelAdmin.tracking.toggleActive.useMutation({
    onSuccess: () => {
      utils.funnelAdmin.tracking.list.invalidate();
    },
  });

  const deletePixel = trpc.funnelAdmin.tracking.delete.useMutation({
    onSuccess: () => {
      utils.funnelAdmin.tracking.list.invalidate();
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<PixelFormValues>({
    resolver: zodResolver(pixelSchema) as any,
    defaultValues: {
      name: "",
      platform: "facebook",
      pixelId: "",
      accessToken: "",
      pageScope: "",
      eventMapping: "",
    },
  });

  const watchedPlatform = form.watch("platform");

  function openCreateDialog() {
    setEditingPixel(null);
    const defaultMapping = DEFAULT_EVENTS["facebook"] ?? {};
    setSelectedPages([]);
    setEventMappingState(defaultMapping);
    form.reset({
      name: "",
      platform: "facebook",
      pixelId: "",
      accessToken: "",
      pageScope: "",
      eventMapping: JSON.stringify(defaultMapping),
    });
    setDialogOpen(true);
  }

  function openEditDialog(pixel: TrackingPixel) {
    setEditingPixel(pixel);
    const pages = parseScopeArray(pixel.pageScope);
    const mapping = parseEventMapping(pixel.eventMapping);
    setSelectedPages(pages);
    setEventMappingState(mapping);
    form.reset({
      name: pixel.name,
      platform: pixel.platform as PixelFormValues["platform"],
      pixelId: pixel.pixelId,
      accessToken: pixel.accessToken ?? "",
      pageScope: pixel.pageScope ?? "",
      eventMapping: pixel.eventMapping ?? "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingPixel(null);
  }

  function handlePlatformChange(platform: string) {
    form.setValue("platform", platform as PixelFormValues["platform"]);
    // Auto-fill event mapping defaults when creating new pixel
    if (!editingPixel) {
      const defaults = DEFAULT_EVENTS[platform] ?? {};
      setEventMappingState(defaults);
      form.setValue("eventMapping", JSON.stringify(defaults));
    }
  }

  function handlePageToggle(page: string) {
    setSelectedPages((prev) => {
      const next = prev.includes(page)
        ? prev.filter((p) => p !== page)
        : [...prev, page];
      form.setValue("pageScope", next.length > 0 ? JSON.stringify(next) : "");
      return next;
    });
  }

  function handleEventMappingChange(internalEvent: string, mappedValue: string) {
    setEventMappingState((prev) => {
      const next = { ...prev, [internalEvent]: mappedValue };
      form.setValue("eventMapping", JSON.stringify(next));
      return next;
    });
  }

  function handleDelete(pixel: TrackingPixel) {
    if (window.confirm(`Delete pixel "${pixel.name}"? This cannot be undone.`)) {
      deletePixel.mutate({ id: pixel.id as number });
    }
  }

  function onSubmit(values: PixelFormValues) {
    const payload = {
      name: values.name,
      platform: values.platform,
      pixelId: values.pixelId,
      accessToken: values.accessToken || undefined,
      pageScope: selectedPages.length > 0 ? JSON.stringify(selectedPages) : undefined,
      eventMapping:
        Object.keys(eventMappingState).length > 0
          ? JSON.stringify(eventMappingState)
          : undefined,
    };

    if (editingPixel) {
      updatePixel.mutate({ id: editingPixel.id as number, ...payload });
    } else {
      createPixel.mutate(payload);
    }
  }

  const isSaving = createPixel.isPending || updatePixel.isPending;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
              <Radio className="w-6 h-6 text-[#E5C158]" />
              Tracking Pixels
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage tracking pixels and analytics integrations
            </p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="bg-[#E5C158] hover:bg-[#E5C158]/90 text-slate-950 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Pixel
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              Loading tracking pixels...
            </div>
          ) : !pixels || pixels.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No tracking pixels yet. Click "Add Pixel" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Platform</TableHead>
                    <TableHead className="text-slate-300">Pixel ID</TableHead>
                    <TableHead className="text-slate-300">Pages</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pixels.map((pixel: TrackingPixel) => {
                    const config = PLATFORM_CONFIG[pixel.platform] ?? PLATFORM_CONFIG.custom;
                    const pages = parseScopeArray(pixel.pageScope);
                    return (
                      <TableRow
                        key={pixel.id}
                        className="border-slate-700 hover:bg-slate-700/40"
                      >
                        <TableCell className="text-slate-200 font-medium">
                          {pixel.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border ${config.color}`}
                          >
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 font-mono text-sm">
                          {pixel.pixelId}
                        </TableCell>
                        <TableCell>
                          {pages.length === 0 ? (
                            <Badge
                              variant="outline"
                              className="border-slate-600 text-slate-400"
                            >
                              All Pages
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {pages.map((p) => (
                                <Badge
                                  key={p}
                                  variant="outline"
                                  className="border-slate-600 text-slate-300 text-xs"
                                >
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {pixel.isActive !== 0 ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/20">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(pixel)}
                              className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleActive.mutate({ id: pixel.id as number })
                              }
                              className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                              title={pixel.isActive !== 0 ? "Deactivate" : "Activate"}
                            >
                              {pixel.isActive !== 0 ? (
                                <ToggleRight className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(pixel)}
                              className="text-slate-400 hover:text-red-400 hover:bg-slate-700"
                              title="Delete pixel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              {editingPixel ? "Edit Tracking Pixel" : "Add Tracking Pixel"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Facebook Main Pixel"
                        className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Platform */}
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Platform</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);
                        handlePlatformChange(val);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {cfg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pixel ID — label changes based on platform */}
              <FormField
                control={form.control}
                name="pixelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">
                      {PLATFORM_CONFIG[watchedPlatform]?.idLabel ?? "Pixel ID"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          watchedPlatform === "google_analytics"
                            ? "G-XXXXXXXXXX"
                            : watchedPlatform === "google_tag_manager"
                            ? "GTM-XXXXXXX"
                            : "1234567890"
                        }
                        className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Access Token / API Key — for Facebook (CAPI) and Hyros */}
              {(watchedPlatform === "facebook" || watchedPlatform === "hyros") && (
                <FormField
                  control={form.control}
                  name="accessToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">
                        {watchedPlatform === "hyros" ? "API Key" : "Access Token"}{" "}
                        <span className="text-slate-500 font-normal">
                          ({watchedPlatform === "hyros" ? "required for server-side tracking" : "optional, for CAPI"})
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder={watchedPlatform === "hyros" ? "API_xxxxxxxxxxxxxxx" : "EAAxxxxxxxxxxxxxxx"}
                          className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Page Scope — checkboxes */}
              <div className="pt-1">
                <p className="text-sm font-medium text-slate-300 mb-1">
                  Page Scope{" "}
                  <span className="text-slate-500 font-normal">(optional — leave empty for all pages)</span>
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PAGE_SCOPE_OPTIONS.map((page) => (
                    <label
                      key={page}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPages.includes(page)}
                        onChange={() => handlePageToggle(page)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-[#E5C158] cursor-pointer"
                      />
                      <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                        {page}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedPages.length === 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    No pages selected — pixel will fire on all pages.
                  </p>
                )}
              </div>

              {/* Event Mapping */}
              <div className="pt-1">
                <p className="text-sm font-medium text-slate-300 mb-1">
                  Event Mapping
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Map internal events to platform-specific event names.
                </p>
                <div className="space-y-2">
                  {INTERNAL_EVENTS.map((evt) => (
                    <div key={evt} className="grid grid-cols-2 gap-2 items-center">
                      <span className="text-xs text-slate-400 font-mono bg-slate-800/60 rounded px-2 py-1.5 truncate">
                        {evt}
                      </span>
                      <Input
                        value={eventMappingState[evt] ?? ""}
                        onChange={(e) =>
                          handleEventMappingChange(evt, e.target.value)
                        }
                        placeholder="platform event"
                        className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-600 font-mono text-xs h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeDialog}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#E5C158] hover:bg-[#E5C158]/90 text-slate-950 font-semibold"
                >
                  {isSaving
                    ? "Saving..."
                    : editingPixel
                    ? "Save Changes"
                    : "Add Pixel"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
