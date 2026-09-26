import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Banknote,
  Clapperboard,
  Film,
  Layers,
  Receipt,
  Settings,
  Shapes,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageSection } from "@/components/admin/PageSection";
import { PageHeader } from "@/components/ui/page";
import { api, type AdminOrder, type AdminStats, type AdminUpstreamUsage, type PageMeta } from "@/api/client";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { fenToYuan, formatCredits } from "@/lib/utils";
import { projectStatusLabel, taskDomainLabel } from "@/lib/statusLabels";
import { Button } from "@/components/ui/button";
import { useI18n, type Messages, type TFunction } from "@/i18n";
import { DashboardFilters } from "@/pages/dashboard/DashboardFilters";
import {
  buildStatsQuery,
  dashboardRangeLabel,
  DEFAULT_DASHBOARD_FILTERS,
  PROJECTS_DASHBOARD_FILTERS,
  sumDailyUsage,
  type DashboardFilterState,
} from "@/pages/dashboard/dashboardMetrics";
import { DashboardKpiCard } from "@/pages/dashboard/DashboardKpiCard";
import { DashboardInsightGrid } from "@/pages/dashboard/DashboardInsightGrid";
import { DashboardPeriodKpis } from "@/pages/dashboard/DashboardPeriodKpis";
import { DashboardSectionTabs, type DashboardSection } from "@/pages/dashboard/DashboardSectionTabs";
import { buildDomainInsights } from "@/pages/dashboard/dashboardInsightMaps";
import { buildFinanceInsights, buildProjectInsights } from "@/pages/dashboard/dashboardSectionInsights";
import { UsageDistributionChart } from "@/pages/dashboard/UsageDistributionChart";
import { TopUsersRankingChart } from "@/pages/dashboard/TopUsersRankingChart";
import { UsageTrendChart } from "@/pages/dashboard/UsageTrendChart";

type OrderRes = { items: AdminOrder[]; meta: PageMeta };

function statusClass(status: string): string {
  if (status === "DONE") return "is-done";
  if (status === "FAILED" || status === "REJECTED" || status === "CANCELLED") return "is-fail";
  if (status === "SCRIPTING" || status === "IMAGING" || status === "VIDEOING" || status === "COMPOSING") {
    return "is-run";
  }
  return "is-warn";
}

function capabilityLabel(key: string, m: Messages): string {
  switch (key) {
    case "llm":
      return m.dashboard.filters.llm;
    case "image":
      return m.dashboard.filters.image;
    case "video":
      return m.dashboard.filters.video;
    case "tts":
      return m.dashboard.filters.tts;
    case "other":
    case "unknown":
      return m.dashboard.filters.other;
    default:
      return key;
  }
}

function domainChartLabel(key: string, m: Messages, t: TFunction): string {
  if (key === "kepu") return m.dashboard.filters.kepu;
  return taskDomainLabel(key, t);
}

/** 管理端仪表盘：板块切换 + 渐变 KPI + 可筛选用量图表 */
export function DashboardPage() {
  const { t, m, locale } = useI18n();
  const [section, setSection] = useState<DashboardSection>("overview");
  const [filters, setFilters] = useState<DashboardFilterState>(DEFAULT_DASHBOARD_FILTERS);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [upstreamUsage, setUpstreamUsage] = useState<AdminUpstreamUsage | null>(null);
  const [upstreamSyncing, setUpstreamSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const localeCode = locale === "vi" ? "vi-VN" : locale === "zh" ? "zh-CN" : "en-US";

  const loadUpstreamUsage = useCallback(async () => {
    try {
      const data = await api<AdminUpstreamUsage>("/api/admin/stats/upstream-usage?days=30");
      setUpstreamUsage(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.dashboard.finance.loadFailed);
    }
  }, [m.dashboard.finance.loadFailed]);

  const syncUpstreamUsage = useCallback(async () => {
    setUpstreamSyncing(true);
    try {
      await api("/api/admin/stats/upstream-usage/sync?days=30", { method: "POST" });
      toast.success(m.dashboard.finance.syncSuccess);
      await loadUpstreamUsage();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.dashboard.finance.syncFailed);
    } finally {
      setUpstreamSyncing(false);
    }
  }, [loadUpstreamUsage, m.dashboard.finance.syncSuccess, m.dashboard.finance.syncFailed]);

  const loadData = useCallback(async (nextFilters: DashboardFilterState) => {
    setLoading(true);
    try {
      const [s, o] = await Promise.all([
        api<AdminStats>(buildStatsQuery(nextFilters)),
        api<OrderRes>("/api/admin/orders?page=1&page_size=8&status=paid"),
      ]);
      setStats(s);
      setOrders(o.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.dashboard.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [m.dashboard.loadFailed]);

  const kpiReady = Boolean(stats);
  const kpiPlaceholder = loading ? "…" : "—";
  const statsFilters = section === "projects" ? PROJECTS_DASHBOARD_FILTERS : filters;
  const projectsRangeLabel = dashboardRangeLabel(PROJECTS_DASHBOARD_FILTERS.days, m.dashboard);

  useEffect(() => {
    void loadData(statsFilters);
  }, [statsFilters, loadData]);

  useEffect(() => {
    void loadUpstreamUsage();
  }, [loadUpstreamUsage]);

  const statusEntries = Object.entries(stats?.project_status_counts ?? {}).sort((a, b) => b[1] - a[1]);
  const daily = stats?.daily_usage ?? [];
  const byCapability = stats?.usage_by_capability ?? [];
  const byDomain = stats?.usage_by_domain ?? [];
  const topUsers = stats?.top_users_by_charge ?? [];
  const rangeLabel = dashboardRangeLabel(filters.days, m.dashboard);
  const showUsageFilters = section === "overview" || section === "usage";
  const domainInsights = buildDomainInsights(
    byDomain,
    filters.metric,
    (key) => domainChartLabel(key, m, t),
    t,
  );
  const financeInsights = buildFinanceInsights(stats, upstreamUsage, t, locale);
  const projectInsights = buildProjectInsights(stats, sumDailyUsage(daily), t);
  const metricHint =
    filters.metric === "cost"
      ? m.dashboard.filters.upstreamCost
      : filters.metric === "calls"
        ? m.dashboard.filters.callCount
        : m.dashboard.filters.chargeAmount;

  return (
    <div className="admin-page admin-dashboard-page">
      <PageHeader description={m.dashboard.description} />

      <div className="admin-dashboard-kpi-grid">
        <DashboardKpiCard
          label={m.dashboard.kpi.totalUsers}
          value={kpiReady ? stats!.user_count : kpiPlaceholder}
          hint={m.dashboard.kpi.totalUsersHint}
          icon={Users}
          tone="teal"
        />
        <DashboardKpiCard
          label={m.dashboard.kpi.totalPaid}
          value={kpiReady ? formatCredits(stats!.order_paid_total_fen, locale) : kpiPlaceholder}
          hint={m.dashboard.kpi.totalPaidHint}
          icon={Banknote}
          tone="blue"
        />
        <DashboardKpiCard
          label={m.dashboard.kpi.monthCharge}
          value={kpiReady ? formatCredits(stats!.usage_charge_month_fen ?? 0, locale) : kpiPlaceholder}
          hint={
            kpiReady
              ? t("dashboard.kpi.todayChargeVal", {
                  amount: fenToYuan(stats!.usage_charge_today_fen ?? 0),
                })
              : m.dashboard.kpi.todayChargeHint
          }
          icon={Zap}
          tone="purple"
        />
        <DashboardKpiCard
          label={m.dashboard.kpi.monthCost}
          value={kpiReady ? formatCredits(stats!.usage_cost_month_fen ?? 0, locale) : kpiPlaceholder}
          hint={
            kpiReady
              ? t("dashboard.kpi.todayCostVal", {
                  amount: fenToYuan(stats!.usage_cost_today_fen ?? 0),
                })
              : m.dashboard.kpi.todayCostHint
          }
          icon={Wallet}
          tone="sand"
        />
      </div>

      <DashboardSectionTabs value={section} onChange={setSection} />

      {showUsageFilters ? <DashboardFilters value={filters} onChange={setFilters} /> : null}
      {showUsageFilters ? <DashboardPeriodKpis stats={stats} filters={filters} loading={loading} /> : null}

      {section === "overview" ? (
        <>
          <div className="admin-dashboard-charts">
            <PageSection
              title={t("dashboard.charts.trendWithRange", { range: rangeLabel })}
              description={loading ? m.dashboard.loading : m.dashboard.charts.trendDescOverview}
              bodyClassName="!pt-2"
              className="admin-dashboard-chart-main admin-dashboard-glass min-h-0"
            >
              <UsageTrendChart data={daily} metric={filters.metric} />
            </PageSection>

            <PageSection
              title={m.dashboard.charts.capabilityDist}
              description={`${rangeLabel} · ${metricHint}`}
              bodyClassName="!pt-2"
              className="admin-dashboard-chart-side admin-dashboard-glass min-h-0"
            >
              <UsageDistributionChart
                data={byCapability}
                metric={filters.metric}
                labelForKey={(key) => capabilityLabel(key, m)}
                variant="donut"
              />
            </PageSection>
          </div>

          <PageSection
            title={t("dashboard.charts.topUsersTitleWithRange", { range: rangeLabel })}
            actions={
              <Link to="/orders?tab=usage" className="admin-link">
                {m.dashboard.charts.more}
              </Link>
            }
            bodyClassName="!pt-2"
            className="admin-dashboard-glass min-h-0"
          >
            <TopUsersRankingChart users={topUsers.slice(0, 3)} metric={filters.metric} />
          </PageSection>

          <div className="admin-dashboard-charts">
            <PageSection
              title={m.dashboard.charts.domainDist}
              description={`${rangeLabel} · ${metricHint}`}
              bodyClassName="!pt-2"
              className="admin-dashboard-chart-main admin-dashboard-glass min-h-0"
            >
              <UsageDistributionChart
                data={byDomain}
                metric={filters.metric}
                labelForKey={(key) => domainChartLabel(key, m, t)}
                variant="bar"
              />
            </PageSection>
            <PageSection
              title={m.dashboard.charts.domainInsights}
              description={`${rangeLabel} · ${metricHint}`}
              bodyClassName="!pt-2"
              className="admin-dashboard-chart-side admin-dashboard-glass min-h-0"
            >
              <DashboardInsightGrid items={domainInsights} columns={2} />
            </PageSection>
          </div>
        </>
      ) : null}

      {section === "usage" ? (
        <>
          <div className="admin-dashboard-charts">
            <PageSection
              title={t("dashboard.charts.trendWithRange", { range: rangeLabel })}
              description={loading ? m.dashboard.loading : m.dashboard.charts.trendDescUsage}
              bodyClassName="!pt-2"
              className="admin-dashboard-chart-main admin-dashboard-glass min-h-0"
            >
              <UsageTrendChart data={daily} metric={filters.metric} />
            </PageSection>

            <PageSection
              title={m.dashboard.charts.capabilityDist}
              description={`${rangeLabel} · ${metricHint}`}
              bodyClassName="!pt-2"
              className="admin-dashboard-chart-side admin-dashboard-glass min-h-0"
            >
              <UsageDistributionChart
                data={byCapability}
                metric={filters.metric}
                labelForKey={(key) => capabilityLabel(key, m)}
                variant="donut"
              />
            </PageSection>
          </div>

          <div className="admin-dashboard-charts">
            <PageSection
              title={m.dashboard.charts.domainDist}
              description={`${rangeLabel} · ${metricHint}`}
              bodyClassName="!pt-2"
              className="admin-dashboard-chart-main admin-dashboard-glass min-h-0"
            >
              <UsageDistributionChart
                data={byDomain}
                metric={filters.metric}
                labelForKey={(key) => domainChartLabel(key, m, t)}
                variant="bar"
              />
            </PageSection>
            <PageSection
              title={t("dashboard.charts.topUsersRankingWithRange", { range: rangeLabel })}
              actions={
                <Link to="/orders?tab=usage" className="admin-link">
                  {m.dashboard.charts.usageDetail}
                </Link>
              }
              description={metricHint}
              bodyClassName="!pt-2"
              className="admin-dashboard-chart-side admin-dashboard-glass min-h-0"
            >
              <TopUsersRankingChart users={topUsers} metric={filters.metric} />
            </PageSection>
          </div>
        </>
      ) : null}

      {section === "finance" ? (
        <div className="admin-dashboard-body admin-dashboard-body--finance">
          <PageSection
            title={m.dashboard.finance.overview}
            description={m.dashboard.finance.overviewDesc}
            actions={
              <Link to="/finance" className="admin-link">
                {m.dashboard.finance.listLink}
              </Link>
            }
            bodyClassName="!pt-2"
            className="admin-dashboard-glass min-h-0 admin-dashboard-body--full"
          >
            <DashboardInsightGrid items={financeInsights} columns={3} />
          </PageSection>

          <PageSection
            title={m.dashboard.finance.upstreamTitle}
            description={
              upstreamUsage?.configured
                ? `${t("dashboard.finance.upstreamDescConfigured")}${
                    upstreamUsage.last_sync_at
                      ? t("dashboard.finance.lastSyncAt", {
                          time: new Date(upstreamUsage.last_sync_at).toLocaleString(localeCode),
                        })
                      : ""
                  }`
                : m.dashboard.finance.upstreamDescNotConfigured
            }
            actions={
              upstreamUsage?.configured ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={upstreamSyncing}
                  onClick={() => void syncUpstreamUsage()}
                >
                  {upstreamSyncing ? m.dashboard.finance.refreshing : m.dashboard.finance.refreshData}
                </Button>
              ) : null
            }
            bodyClassName="!pt-0"
            className="admin-dashboard-glass min-h-0"
          >
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{m.dashboard.finance.colDate}</th>
                    <th>{m.dashboard.finance.colLocalCost}</th>
                    <th>{m.dashboard.finance.colLocalTokens}</th>
                    <th>{m.dashboard.finance.colOfficialTokens}</th>
                    <th>{m.dashboard.finance.colOfficialCost}</th>
                    <th>{m.dashboard.finance.colDelta}</th>
                  </tr>
                </thead>
                <tbody>
                  {(upstreamUsage?.series ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="!text-center text-[var(--admin-muted)]">
                        {m.dashboard.finance.emptyComparison}
                      </td>
                    </tr>
                  ) : (
                    [...(upstreamUsage?.series ?? [])].reverse().slice(0, 14).map((row) => (
                      <tr key={row.date}>
                        <td className="font-mono text-xs">{row.date}</td>
                        <td>{formatCredits(row.local_cost_fen, locale)}</td>
                        <td>{row.local_tokens.toLocaleString()}</td>
                        <td>{row.official_tokens > 0 ? row.official_tokens.toLocaleString() : "—"}</td>
                        <td>{row.official_cost_fen > 0 ? formatCredits(row.official_cost_fen, locale) : "—"}</td>
                        <td>
                          {row.official_cost_fen > 0
                            ? `${formatCredits(row.delta_fen, locale)}${row.delta_pct != null ? ` (${row.delta_pct}%)` : ""}`
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </PageSection>

          <PageSection
            title={m.dashboard.finance.recentOrders}
            description={m.dashboard.finance.recentOrdersDesc}
            actions={
              <Link to="/orders" className="admin-link">
                {m.dashboard.finance.allOrdersLink}
              </Link>
            }
            bodyClassName="!pt-0"
            className="admin-dashboard-glass min-h-0"
          >
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{m.dashboard.finance.colOrderUser}</th>
                    <th>{m.dashboard.finance.colOrderAmount}</th>
                    <th>{m.dashboard.finance.colOrderPaidTime}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="!text-center text-[var(--admin-muted)]">
                        {m.dashboard.finance.emptyOrders}
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <AdminEntityLink kind="user" id={o.user_id} label={o.user_email ?? undefined} />
                        </td>
                        <td className="font-semibold text-[var(--admin-forest)]">{formatCredits(o.amount_fen, locale)}</td>
                        <td className="text-xs text-[var(--admin-muted)]">
                          {o.paid_at ? new Date(o.paid_at).toLocaleString(localeCode) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </PageSection>
        </div>
      ) : null}

      {section === "projects" ? (
        <>
          <PageSection
            title={m.dashboard.projectsSection.overview}
            description={m.dashboard.projectsSection.overviewDesc}
            bodyClassName="!pt-2"
            className="admin-dashboard-glass min-h-0"
          >
            <DashboardInsightGrid items={projectInsights} columns={4} />
          </PageSection>

          <div className="admin-dashboard-project-row">
            <PageSection
              title={m.dashboard.projectsSection.videoProjectStatus}
              description={t("dashboard.projectsSection.dramaCountDesc", {
                count: stats?.drama_project_count ?? 0,
              })}
              bodyClassName="!pt-2"
              className="admin-dashboard-glass min-h-0"
            >
              <div className="flex flex-wrap gap-1.5">
                {statusEntries.length === 0 ? (
                  <span className="text-xs text-[var(--admin-muted)]">{m.dashboard.projectsSection.noData}</span>
                ) : (
                  statusEntries.map(([status, count]) => (
                    <span
                      key={status}
                      className={`admin-status-pill !px-2.5 !py-1 !text-[11px] ${statusClass(status)}`}
                    >
                      {projectStatusLabel(status, t)} {count}
                    </span>
                  ))
                )}
              </div>
            </PageSection>

            <PageSection title={m.dashboard.projectsSection.callsStats} bodyClassName="!pt-2" className="admin-dashboard-glass min-h-0">
              <div className="admin-dashboard-stat-grid">
                <div>
                  <div className="admin-dashboard-stat-grid-label">{m.dashboard.projectsSection.callsToday}</div>
                  <div className="admin-dashboard-stat-grid-value">
                    {kpiReady ? stats!.usage_calls_today ?? 0 : kpiPlaceholder}
                  </div>
                </div>
                <div>
                  <div className="admin-dashboard-stat-grid-label">{m.dashboard.projectsSection.callsMonth}</div>
                  <div className="admin-dashboard-stat-grid-value">
                    {kpiReady ? stats!.usage_calls_month ?? 0 : kpiPlaceholder}
                  </div>
                </div>
                <div>
                  <div className="admin-dashboard-stat-grid-label">{m.dashboard.projectsSection.callsTotal}</div>
                  <div className="admin-dashboard-stat-grid-value">
                    {kpiReady ? stats!.usage_calls_total ?? 0 : kpiPlaceholder}
                  </div>
                </div>
              </div>
            </PageSection>
          </div>

          <PageSection
            title={t("dashboard.projectsSection.domainDistWithRange", { range: projectsRangeLabel })}
            bodyClassName="!pt-2"
            className="admin-dashboard-glass min-h-0"
          >
            <UsageDistributionChart
              data={byDomain}
              metric="charge"
              labelForKey={(key) => domainChartLabel(key, m, t)}
              variant="bar"
            />
          </PageSection>

          <PageSection title={m.dashboard.projectsSection.quickEntries} bodyClassName="!pt-2" className="admin-dashboard-glass">
            <div className="admin-dashboard-tools">
              <Link to="/templates" className="admin-dashboard-tool-btn">
                <Shapes className="h-5 w-5" />
                <span>{m.dashboard.projectsSection.tools.templateMgmt}</span>
              </Link>
              <Link to="/orders?tab=usage" className="admin-dashboard-tool-btn">
                <Receipt className="h-5 w-5" />
                <span>{m.dashboard.projectsSection.tools.orderUsage}</span>
              </Link>
              <Link to="/users" className="admin-dashboard-tool-btn">
                <Users className="h-5 w-5" />
                <span>{m.dashboard.projectsSection.tools.userMgmt}</span>
              </Link>
              <Link to="/projects" className="admin-dashboard-tool-btn">
                <Clapperboard className="h-5 w-5" />
                <span>{m.dashboard.projectsSection.tools.aiVideo}</span>
              </Link>
              <Link to="/drama-projects" className="admin-dashboard-tool-btn">
                <Film className="h-5 w-5" />
                <span>{m.dashboard.projectsSection.tools.dramaProjects}</span>
              </Link>
              <Link to="/queues" className="admin-dashboard-tool-btn">
                <Layers className="h-5 w-5" />
                <span>{m.dashboard.projectsSection.tools.taskQueues}</span>
              </Link>
              <Link to="/settings" className="admin-dashboard-tool-btn">
                <Settings className="h-5 w-5" />
                <span>{m.dashboard.projectsSection.tools.systemConfig}</span>
              </Link>
              <Link to="/orders" className="admin-dashboard-tool-btn">
                <Activity className="h-5 w-5" />
                <span>{m.dashboard.projectsSection.tools.financeLedger}</span>
              </Link>
            </div>
          </PageSection>
        </>
      ) : null}
    </div>
  );
}
