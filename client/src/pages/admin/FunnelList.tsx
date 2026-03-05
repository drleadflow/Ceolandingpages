import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Edit2, Trash2, Globe, FileEdit, MoreVertical } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function FunnelList() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: funnels, isLoading } = trpc.funnelBuilder.list.useQuery();
  const createMutation = trpc.funnelBuilder.create.useMutation({
    onSuccess: (newFunnel) => {
      utils.funnelBuilder.list.invalidate();
      navigate(`/admin/builder/${newFunnel.id}`);
    },
  });
  const deleteMutation = trpc.funnelBuilder.delete.useMutation({
    onSuccess: () => utils.funnelBuilder.list.invalidate(),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [createError, setCreateError] = useState("");

  const handleCreate = () => {
    if (!newName.trim() || !newSlug.trim()) return;
    setCreateError("");
    createMutation.mutate(
      { name: newName.trim(), slug: newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") },
      { onError: (err) => setCreateError(err.message) }
    );
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteMutation.mutate({ id });
  };

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-500/20 text-yellow-400",
    published: "bg-green-500/20 text-green-400",
    archived: "bg-slate-500/20 text-slate-400",
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Funnel Builder</h1>
          <p className="text-slate-400 text-sm mt-1">Create and manage interactive step-based funnels</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#E5C158] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#d4b04a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Funnel
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Create New Funnel</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                  }}
                  placeholder="My Lead Gen Funnel"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E5C158]/50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">/f/</span>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="my-lead-gen-funnel"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E5C158]/50"
                  />
                </div>
              </div>
              {createError && <p className="text-red-400 text-sm">{createError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowCreate(false); setNewName(""); setNewSlug(""); setCreateError(""); }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !newName.trim() || !newSlug.trim()}
                  className="bg-[#E5C158] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#d4b04a] disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? "Creating..." : "Create Funnel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Funnel list */}
      {isLoading ? (
        <div className="text-slate-400 text-center py-12">Loading funnels...</div>
      ) : !funnels?.length ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
          <FileEdit className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No funnels yet. Create your first one!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#E5C158] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#d4b04a] transition-colors"
          >
            Create Funnel
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {funnels.map((funnel) => (
            <div
              key={funnel.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:border-slate-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-semibold truncate">{funnel.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[funnel.status] || ""}`}>
                    {funnel.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                  <span>/f/{funnel.slug}</span>
                  <span>v{funnel.version}</span>
                  <span>Updated {new Date(funnel.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {funnel.status === "published" && (
                  <a
                    href={`/f/${funnel.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    title="View live"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => navigate(`/admin/builder/${funnel.id}`)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(funnel.id, funnel.name)}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
