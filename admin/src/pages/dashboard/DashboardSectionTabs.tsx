import { useMemo } from "react";
import { BarChart3, Clapperboard, LayoutDashboard, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/useI18n";

/** 仪表盘主板块 */
export type DashboardSection = "overview" | "usage" | "finance" | "projects";

type DashboardSectionTabsProps = {
  value: DashboardSection;
  onChange: (next: DashboardSection) => void;
};

/** 仪表盘板块切换 */
export function DashboardSectionTabs({ value, onChange }: DashboardSectionTabsProps) {
  const { m } = useI18n();

  const sections = useMemo(
    () => [
      { id: "overview" as const, label: m.dashboard.sections.overview, desc: m.dashboard.sections.overviewDesc, icon: LayoutDashboard },
      { id: "usage" as const, label: m.dashboard.sections.usage, desc: m.dashboard.sections.usageDesc, icon: BarChart3 },
      { id: "finance" as const, label: m.dashboard.sections.finance, desc: m.dashboard.sections.financeDesc, icon: Wallet },
      { id: "projects" as const, label: m.dashboard.sections.projects, desc: m.dashboard.sections.projectsDesc, icon: Clapperboard },
    ],
    [m],
  );

  return (
    <div className="admin-dashboard-section-tabs" role="tablist" aria-label={m.dashboard.title}>
      {sections.map((item) => {
        const active = value === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn("admin-dashboard-section-tab", active && "is-active")}
            onClick={() => onChange(item.id)}
          >
            <span className="admin-dashboard-section-tab-icon">
              <Icon className="h-4 w-4" />
            </span>
            <span className="admin-dashboard-section-tab-text">
              <span className="admin-dashboard-section-tab-label">{item.label}</span>
              <span className="admin-dashboard-section-tab-desc">{item.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
