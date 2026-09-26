import { useMemo } from "react";
import { AdminChipFilter } from "@/components/admin/AdminChipFilter";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { useI18n } from "@/i18n/useI18n";
import type {
  DashboardDays,
  DashboardDomain,
  DashboardCapability,
  DashboardMetric,
  DashboardFilterState,
} from "./dashboardMetrics";

export type {
  DashboardDays,
  DashboardDomain,
  DashboardCapability,
  DashboardMetric,
  DashboardFilterState,
};

type DashboardFiltersProps = {
  value: DashboardFilterState;
  onChange: (next: DashboardFilterState) => void;
};

/** 仪表盘用量筛选条（两行紧凑布局） */
export function DashboardFilters({ value, onChange }: DashboardFiltersProps) {
  const { m } = useI18n();
  const patch = (partial: Partial<DashboardFilterState>) => onChange({ ...value, ...partial });

  const dayOptions = useMemo(
    () => [
      { value: "1", label: m.dashboard.today },
      { value: "7", label: m.dashboard.sevenDays },
      { value: "14", label: m.dashboard.fourteenDays },
      { value: "30", label: m.dashboard.thirtyDays },
    ],
    [m],
  );

  const domainOptions = useMemo(
    () => [
      { value: "all", label: m.dashboard.filters.allDomains },
      { value: "drama", label: m.dashboard.filters.drama },
      { value: "kepu", label: m.dashboard.filters.kepu },
      { value: "api", label: m.dashboard.filters.api },
      { value: "tools", label: m.dashboard.filters.tools },
      { value: "studio", label: m.dashboard.filters.studio },
    ],
    [m],
  );

  const capabilityOptions = useMemo(
    () => [
      { value: "all", label: m.dashboard.filters.allCapabilities },
      { value: "llm", label: m.dashboard.filters.llm },
      { value: "image", label: m.dashboard.filters.image },
      { value: "video", label: m.dashboard.filters.video },
      { value: "tts", label: m.dashboard.filters.tts },
    ],
    [m],
  );

  const metricOptions = useMemo(
    () => [
      { value: "charge", label: m.dashboard.filters.charge },
      { value: "cost", label: m.dashboard.filters.cost },
      { value: "calls", label: m.dashboard.filters.calls },
    ],
    [m],
  );

  return (
    <AdminFilterBar className="admin-dashboard-filters">
      <AdminChipFilter
        label={m.dashboard.filters.timeDimension}
        value={value.days}
        options={dayOptions}
        onChange={(days) => patch({ days: days as DashboardDays })}
        className="admin-chip-filter--segment"
      />
      <AdminChipFilter
        label={m.dashboard.filters.businessDomain}
        value={value.domain}
        options={domainOptions}
        onChange={(domain) => patch({ domain: domain as DashboardDomain })}
        className="admin-chip-filter--segment"
      />
      <AdminChipFilter
        label={m.dashboard.filters.capabilityType}
        value={value.capability}
        options={capabilityOptions}
        onChange={(capability) => patch({ capability: capability as DashboardCapability })}
        className="admin-chip-filter--segment"
      />
      <AdminChipFilter
        label={m.dashboard.filters.statMetric}
        value={value.metric}
        options={metricOptions}
        onChange={(metric) => patch({ metric: metric as DashboardMetric })}
        className="admin-chip-filter--segment"
      />
    </AdminFilterBar>
  );
}
