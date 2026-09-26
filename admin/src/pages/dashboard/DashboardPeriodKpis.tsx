import { Activity, Film, Percent, TrendingUp } from "lucide-react";
import type { AdminStats } from "@/api/client";
import { fenToYuan } from "@/lib/utils";
import type { DashboardFilterState } from "@/pages/dashboard/DashboardFilters";
import { DashboardKpiCard } from "@/pages/dashboard/DashboardKpiCard";
import { calcProfitFen, dashboardRangeLabel, projectScaleHint, sumDailyUsage } from "@/pages/dashboard/dashboardMetrics";
import { useI18n } from "@/i18n/useI18n";

type DashboardPeriodKpisProps = {
  stats: AdminStats | null;
  filters: DashboardFilterState;
  loading: boolean;
};

/** 第二行 KPI：随筛选时间窗变化的调用/扣费/毛利/项目规模 */
export function DashboardPeriodKpis({ stats, filters, loading }: DashboardPeriodKpisProps) {
  const { m, t } = useI18n();
  const placeholder = loading ? "…" : "—";
  const rangeLabel = dashboardRangeLabel(filters.days, m.dashboard);
  const period = sumDailyUsage(stats?.daily_usage ?? []);
  const profitFen = calcProfitFen(period.charge_fen, period.cost_fen);
  const profitPct =
    period.charge_fen > 0 ? `${((profitFen / period.charge_fen) * 100).toFixed(1)}%` : undefined;

  return (
    <div className="admin-dashboard-kpi-grid admin-dashboard-kpi-grid--secondary">
      <DashboardKpiCard
        label={`${rangeLabel} ${m.dashboard.filters.calls}`}
        value={stats ? period.calls.toLocaleString() : placeholder}
        hint={stats ? t("dashboard.period.totalCalls", { count: stats.usage_calls_total ?? 0 }) : m.dashboard.period.callsHint}
        icon={Activity}
        tone="mint"
      />
      <DashboardKpiCard
        label={`${rangeLabel} ${m.dashboard.filters.charge}`}
        value={stats ? `¥${fenToYuan(period.charge_fen)}` : placeholder}
        hint={stats ? `¥${fenToYuan(stats.usage_charge_month_fen ?? 0)}` : m.dashboard.period.userChargeHint}
        icon={TrendingUp}
        tone="blue"
      />
      <DashboardKpiCard
        label={`${rangeLabel} ${m.dashboard.period.profit}`}
        value={stats ? `¥${fenToYuan(profitFen)}` : placeholder}
        hint={stats ? `¥${fenToYuan(period.cost_fen)}` : m.dashboard.period.costDeductHint}
        icon={Percent}
        tone="rose"
        trend={profitPct ? t("dashboard.period.profitRate", { pct: profitPct }) : undefined}
      />
      <DashboardKpiCard
        label={m.dashboard.period.dramaProjects}
        value={stats ? stats.drama_project_count ?? 0 : placeholder}
        hint={projectScaleHint(stats, t) ?? m.dashboard.period.projectScale}
        icon={Film}
        tone="slate"
      />
    </div>
  );
}
