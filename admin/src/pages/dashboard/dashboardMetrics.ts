import type { AdminDailyUsage, AdminStats, AdminUsageBucket } from "@/api/client";
import { fenToYuan } from "@/lib/utils";

/** 时间窗内日趋势汇总 */
export function sumDailyUsage(daily: AdminDailyUsage[]) {
  return daily.reduce(
    (acc, row) => ({
      calls: acc.calls + row.calls,
      charge_fen: acc.charge_fen + row.charge_fen,
      cost_fen: acc.cost_fen + (row.cost_fen ?? 0),
    }),
    { calls: 0, charge_fen: 0, cost_fen: 0 },
  );
}

/** 按当前图表指标读取桶数值 */
export function readBucketMetric(row: AdminUsageBucket, metric: DashboardMetric): number {
  if (metric === "cost") return row.cost_fen ?? 0;
  if (metric === "calls") return row.calls;
  return row.charge_fen;
}

/** 格式化指标展示值 */
export function formatDashboardMetric(value: number, metric: DashboardMetric): string {
  if (metric === "calls") return value.toLocaleString();
  return `¥${fenToYuan(value)}`;
}

/** 估算毛利（扣费 - 成本） */
export function calcProfitFen(chargeFen: number, costFen: number): number {
  return chargeFen - costFen;
}

/** 科普项目总数（各状态之和） */
export function sumProjectStatuses(counts: Record<string, number> | undefined): number {
  return Object.values(counts ?? {}).reduce((sum, n) => sum + n, 0);
}

/** 漫剧 + 科普项目规模摘要 */
export function projectScaleHint(
  stats: AdminStats | null,
  t?: (key: string, vars?: Record<string, string | number>) => string,
): string | undefined {
  if (!stats) return undefined;
  const kepu = sumProjectStatuses(stats.project_status_counts);
  const drama = stats.drama_project_count ?? 0;
  return t ? t("dashboard.period.projectScaleSummary", { kepu, drama }) : `科普 ${kepu} · 漫剧 ${drama}`;
}

export type DashboardDays = "1" | "7" | "14" | "30";
export type DashboardDomain = "all" | "drama" | "kepu" | "api" | "tools" | "studio";
export type DashboardCapability = "all" | "llm" | "image" | "video" | "tts";
export type DashboardMetric = "charge" | "cost" | "calls";

export type DashboardFilterState = {
  days: DashboardDays;
  domain: DashboardDomain;
  capability: DashboardCapability;
  metric: DashboardMetric;
};

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilterState = {
  days: "7",
  domain: "all",
  capability: "all",
  metric: "charge",
};

/** 运维 Tab 固定全量 30 日，不受隐藏筛选影响 */
export const PROJECTS_DASHBOARD_FILTERS: DashboardFilterState = {
  days: "30",
  domain: "all",
  capability: "all",
  metric: "charge",
};

/** 图表 / 区块标题用的时间范围文案 */
export function dashboardRangeLabel(
  days: DashboardDays,
  labels?: { today: string; sevenDays: string; fourteenDays: string; thirtyDays: string },
): string {
  if (labels) {
    if (days === "1") return labels.today;
    if (days === "7") return labels.sevenDays;
    if (days === "14") return labels.fourteenDays;
    if (days === "30") return labels.thirtyDays;
  }
  if (days === "1") return "今日";
  return `近 ${days} 日`;
}

/** 拼接 stats API 查询串 */
export function buildStatsQuery(filters: DashboardFilterState): string {
  const params = new URLSearchParams({
    days: filters.days,
    domain: filters.domain,
    capability: filters.capability,
    top_metric: filters.metric,
  });
  return `/api/admin/stats?${params.toString()}`;
}

/** 用户排行转为柱状图数据桶 */
export function topUsersToBuckets(users: import("@/api/client").AdminTopUser[]): AdminUsageBucket[] {
  return users.map((user) => ({
    key: String(user.user_id),
    calls: user.calls,
    charge_fen: user.charge_fen,
    cost_fen: user.cost_fen ?? 0,
  }));
}

/** 柱状图 Y 轴用户简称 */
export function topUserChartLabel(userId: string, users: import("@/api/client").AdminTopUser[]): string {
  const user = users.find((item) => String(item.user_id) === userId);
  const email = user?.email ?? "";
  const local = email.split("@")[0]?.trim();
  if (local) return local.length > 12 ? `${local.slice(0, 11)}…` : local;
  return `ID ${userId}`;
}

