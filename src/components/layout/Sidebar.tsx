import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

type MenuSection = "operacao" | "controle";

const items: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  section: MenuSection;
}> = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "gestor", "lider"], section: "operacao" },
  {
    label: "Equipamentos",
    href: "/equipamentos",
    icon: ClipboardList,
    roles: ["admin", "gestor", "lider", "usuario"],
    section: "operacao",
  },
  { label: "E-mails", href: "/emails", icon: Mail, roles: ["admin", "gestor", "lider"], section: "operacao" },
  { label: "CRM", href: "/crm", icon: BarChart3, roles: ["admin", "lider"], section: "operacao" },
  { label: "Relatorios", href: "/relatorios", icon: BarChart3, roles: ["admin", "gestor", "lider"], section: "operacao" },
  { label: "Usuarios", href: "/usuarios", icon: Users, roles: ["admin"], section: "controle" },
  { label: "Logs", href: "/logs", icon: ShieldCheck, roles: ["admin"], section: "controle" },
];

function canAccessItem(allowedRoles: UserRole[], currentRole: UserRole | null) {
  if (!currentRole) {
    return false;
  }

  return allowedRoles.includes(currentRole);
}

function getInitials(name?: string | null) {
  if (!name) {
    return "EA";
  }

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function VeoliaLogo() {
  return (
    <svg
      aria-label="Veolia"
      className="h-auto w-[148px]"
      viewBox="0 0 560 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="42" cy="55" r="34" stroke="#FF0000" strokeWidth="12" />
      <path d="M42 42C36.2 42 31.5 46.7 31.5 52.5C31.5 61.1 42 72.5 42 72.5C42 72.5 52.5 61.1 52.5 52.5C52.5 46.7 47.8 42 42 42Z" fill="#FF0000" />
      <text x="96" y="74" fill="#FF0000" fontFamily="Arial, sans-serif" fontSize="64" fontWeight="700" letterSpacing="1.5">
        VEOLIA
      </text>
    </svg>
  );
}

function NavSection({ title, entries }: { title: string; entries: typeof items }) {
  return (
    <div>
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/36">{title}</p>
      <div className="space-y-0.5">
        {entries.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3.5 rounded-xl px-3 py-3.5 transition-all duration-150",
                  isActive
                    ? "bg-white/12 text-white"
                    : "text-white/55 hover:bg-white/6 hover:text-white/90",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-white transition-all duration-150",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-all duration-150",
                      isActive ? "text-white" : "text-white/45 group-hover:text-white/80",
                    )}
                  />
                  <span
                    className={cn(
                      "flex-1 text-[14px] leading-none tracking-[-0.01em]",
                      isActive ? "font-medium text-white" : "font-normal",
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { role, profile } = useAuth();

  const visibleItems = items.filter((item) => canAccessItem(item.roles, role));
  const operationItems = visibleItems.filter((item) => item.section === "operacao");
  const controlItems = visibleItems.filter((item) => item.section === "controle");

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[256px] overflow-hidden border-r border-white/8 bg-[linear-gradient(180deg,#002d62_0%,#002654_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.06),transparent_50%)]" />

      <div className="relative z-10 flex h-full flex-col px-4 py-7">
        {/* Logo */}
        <div className="px-1 pb-7">
          <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.24em] text-white/36">Plataforma</span>
          <VeoliaLogo />
        </div>

        <div className="border-t border-white/8" />

        {/* Nav */}
        <nav className="sidebar-scroll relative mt-6 flex-1 space-y-7 overflow-y-auto">
          {operationItems.length > 0 ? <NavSection title="Operacao" entries={operationItems} /> : null}
          {controlItems.length > 0 ? <NavSection title="Controle" entries={controlItems} /> : null}
        </nav>

        <div className="border-t border-white/8" />

        {/* User profile */}
        <div className="mt-5 flex items-center gap-3 px-1">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12 text-[13px] font-semibold text-white">
            {getInitials(profile?.full_name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium leading-none text-white">
              {profile?.full_name ?? "Usuario"}
            </p>
            <p className="mt-1.5 text-[11px] leading-none capitalize text-white/46">{profile?.role ?? "Perfil"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
