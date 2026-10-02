import type { AdminDailyUsage, AdminStats, AdminUsageBucket } from "@/api/client";
import { formatCredits } from "@/lib/utils";

/** Tóm tắt xu hướng hàng ngày trong khung thời gian */
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

/** Đọc giá trị nhóm theo chỉ báo biểu đồ hiện tại */
export function readBucketMetric(row: AdminUsageBucket, metric: DashboardMetric): number {
  if (metric === "cost") return row.cost_fen ?? 0;
  if (metric === "calls") return row.calls;
  return row.charge_fen;
}

/** Giá trị hiển thị chỉ báo định dạng */
export function formatDashboardMetric(value: number, metric: DashboardMetric, locale?: string): string {
  if (metric === "calls") return value.toLocaleString();
  return formatCredits(value, locale);
}

/** Lợi nhuận gộp ước tính (khấu trừ - chi phí) */
export function calcProfitFen(chargeFen: number, costFen: number): number {
  return chargeFen - costFen;
}

/** Tổng số dự án phổ biến khoa học (tổng của từng trạng thái) */
export function sumProjectStatuses(counts: Record<string, number> | undefined): number {
  return Object.values(counts ?? {}).reduce((sum, n) => sum + n, 0);
}

/** Tóm tắt quy mô dự án phim truyện tranh + phổ biến khoa học */
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

/** Tab vận hành và bảo trì được cố định trọn vẹn trong 30 ngày và sẽ không bị ảnh hưởng bởi tính năng lọc ẩn. */
export const PROJECTS_DASHBOARD_FILTERS: DashboardFilterState = {
  days: "30",
  domain: "all",
  capability: "all",
  metric: "charge",
};

/** Sao chép phạm vi thời gian cho tiêu đề biểu đồ/khối */
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

/** Nối chuỗi truy vấn API thống kê */
export function buildStatsQuery(filters: DashboardFilterState): string {
  const params = new URLSearchParams({
    days: filters.days,
    domain: filters.domain,
    capability: filters.capability,
    top_metric: filters.metric,
  });
  return `/api/admin/stats?${params.toString()}`;
}

/** Chuyển đổi thứ hạng của người dùng thành nhóm dữ liệu biểu đồ */
export function topUsersToBuckets(users: import("@/api/client").AdminTopUser[]): AdminUsageBucket[] {
  return users.map((user) => ({
    key: String(user.user_id),
    calls: user.calls,
    charge_fen: user.charge_fen,
    cost_fen: user.cost_fen ?? 0,
  }));
}

/** Biểu đồ thanh Viết tắt của người dùng trục Y */
export function topUserChartLabel(userId: string, users: import("@/api/client").AdminTopUser[]): string {
  const user = users.find((item) => String(item.user_id) === userId);
  const email = user?.email ?? "";
  const local = email.split("@")[0]?.trim();
  if (local) return local.length > 12 ? `${local.slice(0, 11)}…` : local;
  return `ID ${userId}`;
}

