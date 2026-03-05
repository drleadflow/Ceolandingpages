import { useLocation } from "wouter";
import { Layout, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function FunnelTemplates() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: templates, isLoading } = trpc.funnelTemplates.list.useQuery();
  const deleteMutation = trpc.funnelTemplates.delete.useMutation({
    onSuccess: () => utils.funnelTemplates.list.invalidate(),
  });

  const createFromTemplate = trpc.funnelBuilder.create.useMutation({
    onSuccess: (newFunnel) => {
      utils.funnelBuilder.list.invalidate();
      navigate(`/admin/builder/${newFunnel.id}`);
    },
  });

  const categories = Array.from(new Set((templates ?? []).map(t => t.category)));

  const handleUseTemplate = (template: { name: string; snapshot: unknown }) => {
    const slug = template.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
    createFromTemplate.mutate({ name: template.name, slug });
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layout className="w-6 h-6 text-[#E5C158]" />
          Funnel Templates
        </h1>
        <p className="text-slate-400 text-sm mt-1">Start from a pre-built template</p>
      </div>

      {isLoading ? (
        <div className="text-slate-400 text-center py-12">Loading templates...</div>
      ) : !templates?.length ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
          <Layout className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No templates available yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map(category => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-white mb-3 capitalize">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(templates ?? []).filter(t => t.category === category).map(template => (
                  <div key={template.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors group">
                    <div className="aspect-video bg-slate-700 flex items-center justify-center">
                      {template.thumbnail ? (
                        <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                      ) : (
                        <Layout className="w-8 h-8 text-slate-500" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold">{template.name}</h3>
                      {template.description && <p className="text-slate-400 text-sm mt-1 line-clamp-2">{template.description}</p>}
                      <div className="flex items-center justify-between mt-3">
                        <button
                          onClick={() => handleUseTemplate(template)}
                          disabled={createFromTemplate.isPending}
                          className="flex items-center gap-1.5 text-sm text-[#E5C158] hover:text-[#d4b04a] font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Use Template
                        </button>
                        {!template.isSystem && (
                          <button
                            onClick={() => deleteMutation.mutate({ id: template.id })}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
