import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Target,
  Crosshair,
  GitBranch,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Megaphone,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/agenda", icon: CalendarDays, label: "Agenda" },
  { path: "/mural", icon: Megaphone, label: "Mural" },
  { path: "/treinamentos", icon: GraduationCap, label: "Treinamentos" },
  { path: "/kpis", icon: Target, label: "KPIs" },
  { path: "/okrs", icon: Crosshair, label: "OKRs" },
  { path: "/processos", icon: GitBranch, label: "Processos" },
  { path: "/gestao-visual", icon: LayoutGrid, label: "Gestão Visual" },
  { path: "/matrizes", icon: Grid3X3, label: "Matrizes" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img
                src="https://raw.githubusercontent.com/Rainando025/nexa-assets/refs/heads/main/logoinfor.png"
                alt="Inforbarra Logo"
                className="h-8 w-8 object-contain rounded-lg bg-white/10 p-1"
              />
              <span className="font-bold text-lg whitespace-nowrap">Inforbarra Telecom</span>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center w-full">
              <img
                src="https://raw.githubusercontent.com/Rainando025/nexa-assets/refs/heads/main/logoinfor.png"
                alt="Inforbarra Logo"
                className="h-8 w-8 object-contain rounded-lg bg-white/10 p-1"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "nav-item",
                  isActive && "active",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <button
            onClick={onToggle}
            className={cn(
              "nav-item w-full",
              collapsed && "justify-center px-2"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Recolher</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
