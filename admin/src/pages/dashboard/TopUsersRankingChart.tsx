import type { AdminTopUser } from "@/api/client";
import type { DashboardMetric } from "@/pages/dashboard/DashboardFilters";
import { topUsersToBuckets, topUserChartLabel } from "@/pages/dashboard/dashboardMetrics";
import { UsageDistributionChart } from "@/pages/dashboard/UsageDistributionChart";
import { useI18n } from "@/i18n/useI18n";

type TopUsersRankingChartProps = {
  users: AdminTopUser[];
  metric: DashboardMetric;
};

/** 用户消费排行：与领域分布一致的横向柱状图 */
export function TopUsersRankingChart({ users, metric }: TopUsersRankingChartProps) {
  const { m } = useI18n();
  const rows = topUsersToBuckets(users);
  if (rows.length === 0) {
    return <div className="admin-chart-empty">{m.dashboard.charts.noRankData}</div>;
  }

  return (
    <UsageDistributionChart
      data={rows}
      metric={metric}
      labelForKey={(key) => topUserChartLabel(key, users)}
      variant="bar"
      chartHeight={Math.max(220, rows.length * 36)}
      yAxisWidth={96}
    />
  );
}

