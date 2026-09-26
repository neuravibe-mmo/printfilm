import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Clapperboard,
  FileVideo,
  Film,
  Image,
  Layers,
  LayoutDashboard,
  ListVideo,
  LogOut,
  Maximize2,
  Menu,
  Receipt,
  Settings,
  BookOpen,
  Shapes,
  Users,
  Wallet,
} from "lucide-react";
import { clearAuth, getCachedUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useI18n, type TFunction } from "@/i18n";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";

type NavItem = {
  to: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  matchPrefix?: boolean;
};

type NavGroup = {
  labelKey: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    labelKey: "nav.groups.overview",
    items: [{ to: "/", labelKey: "nav.items.dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    labelKey: "nav.groups.business",
    items: [
      { to: "/users", labelKey: "nav.items.users", icon: Users },
      { to: "/orders", labelKey: "nav.items.orders", icon: Receipt },
      { to: "/finance", labelKey: "nav.items.finance", icon: Wallet },
      { to: "/projects", labelKey: "nav.items.projects", icon: Clapperboard },
      { to: "/works", labelKey: "nav.items.works", icon: FileVideo },
    ],
  },
  {
    labelKey: "nav.groups.drama",
    items: [
      { to: "/drama-projects", labelKey: "nav.items.dramaProjects", icon: Film, matchPrefix: true },
      { to: "/drama-assets", labelKey: "nav.items.dramaAssets", icon: Image, matchPrefix: true },
      { to: "/drama-episodes", labelKey: "nav.items.dramaEpisodes", icon: ListVideo, matchPrefix: true },
      { to: "/drama-fragments", labelKey: "nav.items.dramaFragments", icon: Layers, matchPrefix: true },
    ],
  },
  {
    labelKey: "nav.groups.resources",
    items: [
      { to: "/templates", labelKey: "nav.items.templates", icon: Shapes },
      { to: "/queues", labelKey: "nav.items.queues", icon: Layers },
    ],
  },
  {
    labelKey: "nav.groups.system",
    items: [
      { to: "/settings", labelKey: "nav.items.settings", icon: Settings },
      { to: "/guide", labelKey: "nav.items.guide", icon: BookOpen },
    ],
  },
];

function resolveTitle(pathname: string, t: TFunction): string {
  if (pathname.startsWith("/drama-projects/")) return t("titles.dramaProjectDetail");
  if (pathname.startsWith("/drama-assets/")) return t("titles.dramaAssetDetail");
  if (pathname.startsWith("/drama-episodes/")) return t("titles.dramaEpisodeDetail");
  if (pathname.startsWith("/drama-fragments/")) return t("titles.dramaFragmentDetail");
  const direct = t(`titles.${pathname}`);
  return direct !== `titles.${pathname}` ? direct : t("titles.default");
}

// Admin shell: dark sidebar + glass top bar
export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCachedUser();
  const { t } = useI18n();

  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  const title = resolveTitle(location.pathname, t);
  const initial = (user?.nickname || user?.email || "A").slice(0, 1).toUpperCase();

  return (
    <div className={cn("admin-app", collapsed && "is-collapsed")}>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">PF</div>
          {!collapsed && (
            <div>
              <div className="admin-brand-name">PRINTFILM</div>
              <div className="admin-brand-sub">{t("nav.brandSub")}</div>
            </div>
          )}
        </div>

        <nav className="admin-nav">
          {navGroups.map((group) => (
            <div key={group.labelKey} className="admin-nav-group">
              {!collapsed ? (
                <div className="admin-nav-group-label">{t(group.labelKey)}</div>
              ) : null}
              {group.items.map((item) => {
                const label = t(item.labelKey);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end ?? !item.matchPrefix}
                    className={({ isActive }) =>
                      cn(
                        "admin-nav-item",
                        (isActive || (item.matchPrefix && location.pathname.startsWith(`${item.to}/`))) &&
                          "is-active",
                      )
                    }
                    title={label}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-user-card">
          <div className="admin-avatar">{initial}</div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-[#e8f0eb]">{user?.email}</div>
              <div className="text-xs text-[rgba(240,245,242,0.45)]">{t("nav.superAdmin")}</div>
            </div>
          )}
          <button
            type="button"
            className="admin-icon-btn !text-[rgba(240,245,242,0.55)] hover:!text-[#e8f0eb]"
            onClick={handleLogout}
            title={t("nav.logout")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="admin-icon-btn"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <div className="admin-topbar-title">{title}</div>
              <div className="admin-topbar-crumb">PRINTFILM · {t("nav.opsManagement")}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <LanguageSwitch />
            <button type="button" className="admin-icon-btn" title={t("nav.notifications")}>
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="admin-icon-btn"
              title={document?.fullscreenElement ? t("nav.exitFullscreen") : t("nav.fullscreen")}
              onClick={() => {
                if (!document.fullscreenElement) void document.documentElement.requestFullscreen();
                else void document.exitFullscreen();
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
