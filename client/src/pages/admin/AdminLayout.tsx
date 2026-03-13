import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Users,
  Package,
  FileText,
  BarChart2,
  FlaskConical,
  Radio,
  Video,
  Layers,
  BarChart3,
  Settings,
  GraduationCap,
} from "lucide-react";

type NavItem = {
  label: string;
  path: string;
  icon: ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Leads", path: "/admin/leads", icon: <Users className="w-4 h-4" /> },
  { label: "Products", path: "/admin/funnel/products", icon: <Package className="w-4 h-4" /> },
  { label: "Pages", path: "/admin/funnel/pages", icon: <FileText className="w-4 h-4" /> },
  { label: "Analytics", path: "/admin/funnel/analytics", icon: <BarChart2 className="w-4 h-4" /> },
  { label: "Split Tests", path: "/admin/funnel/split-tests", icon: <FlaskConical className="w-4 h-4" /> },
  { label: "Tracking", path: "/admin/funnel/tracking", icon: <Radio className="w-4 h-4" /> },
  { label: "Videos", path: "/admin/video-library", icon: <Video className="w-4 h-4" /> },
  { label: "Video Analytics", path: "/admin/video-analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Masterclass", path: "/admin/masterclass", icon: <GraduationCap className="w-4 h-4" /> },
  { label: "Builder", path: "/admin/builder", icon: <Layers className="w-4 h-4" /> },
  { label: "Settings", path: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800">
          <span className="text-[#E5C158] font-bold text-lg tracking-tight">
            Titan Admin
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              location === item.path ||
              (item.path === "/admin/leads" && location === "/admin");
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
