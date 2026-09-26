import {
  Activity,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clapperboard,
  Film,
  Layers,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AdminStats, AdminUpstreamUsage } from "@/api/client";
import type { DashboardInsightItem } from "@/pages/dashboard/DashboardInsightGrid";
import { calcProfitFen, sumDailyUsage, sumProjectStatuses } from "@/pages/dashboard/dashboardMetrics";
import { fenToYuan, formatCredits } from "@/lib/utils";
import { projectStatusLabel } from "@/lib/statusLabels";

/** 财务账单 Tab 图标指标 */
export function buildFinanceInsights(
  stats: AdminStats | null,
  upstream: AdminUpstreamUsage | null,
  t?: (key: string, vars?: Record<string, string | number>) => string,
  locale?: string,
): DashboardInsightItem[] {
  if (!stats) return [];

  const monthCharge = stats.usage_charge_month_fen ?? 0;
  const monthCost = stats.usage_cost_month_fen ?? 0;
  const profitFen = calcProfitFen(monthCharge, monthCost);
  const recent = (upstream?.series ?? []).slice(-7);
  const localCost7 = recent.reduce((sum, row) => sum + row.local_cost_fen, 0);
  const officialCost7 = recent.reduce((sum, row) => sum + row.official_cost_fen, 0);
  const delta7 = localCost7 - officialCost7;

  const items: DashboardInsightItem[] = [
    {
      key: "paid-total",
      label: t ? t("dashboard.finance.paidTotal") : "累计充值",
      value: formatCredits(stats.order_paid_total_fen, locale),
      hint: t
        ? t("dashboard.finance.todayAmount", { amount: fenToYuan(stats.order_paid_today_fen) })
        : `今日 ¥${fenToYuan(stats.order_paid_today_fen)}`,
      icon: Banknote,
      tone: "blue",
    },
    {
      key: "charge-month",
      label: t ? t("dashboard.finance.chargeMonth") : "本月扣费",
      value: formatCredits(monthCharge, locale),
      hint: t
        ? t("dashboard.finance.todayAmount", { amount: fenToYuan(stats.usage_charge_today_fen ?? 0) })
        : `今日 ¥${fenToYuan(stats.usage_charge_today_fen ?? 0)}`,
      icon: Zap,
      tone: "purple",
    },
    {
      key: "cost-month",
      label: t ? t("dashboard.finance.costMonth") : "本月成本",
      value: formatCredits(monthCost, locale),
      hint: t
        ? t("dashboard.finance.todayAmount", { amount: fenToYuan(stats.usage_cost_today_fen ?? 0) })
        : `今日 ¥${fenToYuan(stats.usage_cost_today_fen ?? 0)}`,
      icon: Wallet,
      tone: "sand",
    },
    {
      key: "profit-month",
      label: t ? t("dashboard.finance.profitMonth") : "本月毛利",
      value: formatCredits(profitFen, locale),
      hint:
        monthCharge > 0
          ? t
            ? t("dashboard.finance.profitRate", { pct: ((profitFen / monthCharge) * 100).toFixed(1) })
            : `毛利率 ${((profitFen / monthCharge) * 100).toFixed(1)}%`
          : undefined,
      icon: Percent,
      tone: profitFen >= 0 ? "mint" : "rose",
    },
  ];

  if (upstream?.configured && officialCost7 > 0) {
    items.push({
      key: "upstream-delta",
      label: t ? t("dashboard.finance.recent7Delta") : "近 7 日成本差额",
      value: formatCredits(delta7, locale),
      hint: t
        ? t("dashboard.finance.localVsOfficial", { local: fenToYuan(localCost7), official: fenToYuan(officialCost7) })
        : `本地 ¥${fenToYuan(localCost7)} / 官方 ¥${fenToYuan(officialCost7)}`,
      icon: delta7 >= 0 ? TrendingUp : TrendingDown,
      tone: delta7 >= 0 ? "teal" : "rose",
    });
  }

  items.push({
    key: "paid-today",
    label: t ? t("dashboard.finance.paidToday") : "今日到账",
    value: formatCredits(stats.order_paid_today_fen, locale),
    hint: t ? t("dashboard.finance.rechargeOrder") : "充值订单",
    icon: CircleDollarSign,
    tone: "teal",
  });

  return items;
}

const STATUS_META: Record<string, { icon: LucideIcon; tone: DashboardInsightItem["tone"] }> = {
  DONE: { icon: CheckCircle2, tone: "mint" },
  DRAFT: { icon: Layers, tone: "slate" },
  FAILED: { icon: TrendingDown, tone: "rose" },
  SCRIPTING: { icon: Clapperboard, tone: "blue" },
  IMAGING: { icon: Film, tone: "purple" },
  VIDEOING: { icon: Activity, tone: "teal" },
};

/** 项目运维 Tab 图标指标 */
export function buildProjectInsights(
  stats: AdminStats | null,
  periodDaily: ReturnType<typeof sumDailyUsage>,
  t?: (key: string, vars?: Record<string, string | number>) => string,
): DashboardInsightItem[] {
  if (!stats) return [];

  const kepuTotal = sumProjectStatuses(stats.project_status_counts);
  const items: DashboardInsightItem[] = [
    {
      key: "kepu-total",
      label: t ? t("dashboard.projectsSection.kepuProjects") : "科普项目",
      value: kepuTotal,
      hint: t
        ? t("dashboard.projectsSection.dramaCountDesc", { count: stats.drama_project_count ?? 0 })
        : `漫剧 ${stats.drama_project_count ?? 0} 部`,
      icon: Clapperboard,
      tone: "blue",
    },
    {
      key: "drama-total",
      label: t ? t("dashboard.projectsSection.dramaProjects") : "漫剧项目",
      value: stats.drama_project_count ?? 0,
      hint: t ? t("dashboard.projectsSection.allSiteProjects") : "全站项目",
      icon: Film,
      tone: "teal",
    },
    {
      key: "calls-today",
      label: t ? t("dashboard.projectsSection.callsToday") : "今日调用",
      value: (stats.usage_calls_today ?? 0).toLocaleString(),
      hint: t
        ? t("dashboard.projectsSection.thisMonthCalls", { count: stats.usage_calls_month ?? 0 })
        : `本月 ${stats.usage_calls_month ?? 0} 次`,
      icon: Activity,
      tone: "mint",
    },
    {
      key: "calls-total",
      label: t ? t("dashboard.projectsSection.callsTotal") : "累计调用",
      value: (stats.usage_calls_total ?? 0).toLocaleString(),
      hint: t
        ? t("dashboard.projectsSection.recentWindowCalls", { count: periodDaily.calls.toLocaleString() })
        : `近窗 ${periodDaily.calls.toLocaleString()} 次`,
      icon: Layers,
      tone: "slate",
    },
  ];

  const statusEntries = Object.entries(stats.project_status_counts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  for (const [status, count] of statusEntries) {
    const meta = STATUS_META[status] ?? { icon: Layers, tone: "sand" as const };
    items.push({
      key: `status-${status}`,
      label: projectStatusLabel(status, t),
      value: count,
      hint:
        kepuTotal > 0
          ? t
            ? t("dashboard.projectsSection.shareKepuPct", { pct: ((count / kepuTotal) * 100).toFixed(1) })
            : `占科普 ${((count / kepuTotal) * 100).toFixed(1)}%`
          : undefined,
      icon: meta.icon,
      tone: meta.tone,
    });
  }

  return items;
}
