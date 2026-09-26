import { useCallback } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminDailyUsage } from "@/api/client";
import { formatCredits } from "@/lib/utils";
import type { DashboardMetric } from "./DashboardFilters";
import { useI18n } from "@/i18n/useI18n";

type UsageTrendChartProps = {
  data: AdminDailyUsage[];
  metric: DashboardMetric;
};

function readMetric(row: AdminDailyUsage, metric: DashboardMetric): number {
  if (metric === "cost") return row.cost_fen ?? 0;
  if (metric === "calls") return row.calls;
  return row.charge_fen;
}

function formatMetric(value: number, metric: DashboardMetric, locale?: string): string {
  if (metric === "calls") return String(value);
  return formatCredits(value, locale);
}

function shortDate(iso: string): string {
  const parts = iso.split("-");
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : iso;
}

/** 用量趋势面积图 */
export function UsageTrendChart({ data, metric }: UsageTrendChartProps) {
  const { m, locale } = useI18n();

  const getMetricLabel = useCallback(
    (targetMetric: DashboardMetric): string => {
      if (targetMetric === "cost") return m.dashboard.filters.upstreamCost;
      if (targetMetric === "calls") return m.dashboard.filters.callCount;
      return m.dashboard.filters.chargeAmount;
    },
    [m],
  );

  const chartData = data.map((row) => ({
    date: row.date,
    label: shortDate(row.date),
    value: readMetric(row, metric),
  }));

  if (chartData.length === 0) {
    return <div className="admin-chart-empty">{m.dashboard.charts.noTrendData}</div>;
  }

  return (
    <div className="admin-chart-wrap">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="usageTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--admin-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--admin-accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--admin-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--admin-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={{ fill: "var(--admin-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={metric === "calls" ? 36 : 64}
            tickFormatter={(v) => (metric === "calls" ? String(v) : formatCredits(Number(v), locale))}
          />
          <Tooltip
            contentStyle={{
              background: "var(--admin-card)",
              border: "1px solid var(--admin-border)",
              borderRadius: "10px",
              fontSize: "12px",
            }}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as { date?: string } | undefined;
              return row?.date ?? "";
            }}
            formatter={(value) => [formatMetric(Number(value ?? 0), metric, locale), getMetricLabel(metric)]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--admin-forest)"
            strokeWidth={2}
            fill="url(#usageTrendFill)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--admin-forest)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
