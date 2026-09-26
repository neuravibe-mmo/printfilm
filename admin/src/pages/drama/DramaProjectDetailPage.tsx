import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, type AdminDramaProject } from "@/api/client";
import {
  AdminDetailMeta,
  AdminDetailSection,
  AdminDetailStatGrid,
  AdminDetailTableWrap,
} from "@/components/admin/AdminDetailLayout";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDramaAssetName, taskStatusLabel, taskTypeLabel } from "@/lib/statusLabels";
import { formatCredits } from "@/lib/utils";
import { useI18n } from "@/i18n/useI18n";

const TABS = ["overview", "episodes", "assets", "tasks"] as const;
type TabKey = (typeof TABS)[number];

function isTabKey(value: string | null): value is TabKey {
  return TABS.includes(value as TabKey);
}

/** 漫剧项目二级详情：概览 / 分集 / 资产 / 任务 */
export function DramaProjectDetailPage() {
  const { m, locale } = useI18n();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TabKey = isTabKey(tabParam) ? tabParam : "overview";

  const [detail, setDetail] = useState<AdminDramaProject | null>(null);
  const [loading, setLoading] = useState(true);

  const id = Number(projectId);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      navigate("/drama-projects", { replace: true });
      return;
    }
    setLoading(true);
    void api<AdminDramaProject>(`/api/admin/drama-projects/${id}`)
      .then(setDetail)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : m.drama.loadFailed);
        navigate("/drama-projects", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, navigate, m.drama.loadFailed]);

  function setTab(next: TabKey) {
    const params = new URLSearchParams(searchParams);
    if (next === "overview") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  }

  const usage = detail?.usage;

  if (loading && !detail) {
    return <div className="admin-detail-page-loading">{m.drama.loading}</div>;
  }
  if (!detail) return null;

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-page-toolbar">
        <Button variant="ghost" size="sm" className="admin-detail-back" asChild>
          <Link to="/drama-projects">
            <ArrowLeft className="h-4 w-4" />
            {m.drama.backToList}
          </Link>
        </Button>
        <div className="admin-detail-page-heading">
          <h2 className="admin-detail-page-title">
            {m.drama.projectDetail.dramaPrefix} #{detail.id} · {detail.title}
          </h2>
          <p className="admin-detail-page-sub">
            <AdminEntityLink kind="user" id={detail.user_id} label={detail.user_email ?? undefined} />
            {detail.summary_status ? ` · ${m.drama.projectDetail.summaryLabel} ${detail.summary_status}` : ""}
          </p>
        </div>
        <div className="admin-detail-page-actions">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/drama-assets?project_id=${detail.id}`}>{m.drama.viewAssets}</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/drama-episodes?project_id=${detail.id}`}>{m.drama.viewEpisodes}</Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="admin-detail-tabs">
        <TabsList className="admin-detail-tabs-list">
          <TabsTrigger value="overview">{m.drama.projectDetail.tabOverview}</TabsTrigger>
          <TabsTrigger value="episodes">{m.drama.projectDetail.tabEpisodes}（{detail.episode_count ?? 0}）</TabsTrigger>
          <TabsTrigger value="assets">{m.drama.projectDetail.tabAssets}（{detail.asset_count ?? 0}）</TabsTrigger>
          <TabsTrigger value="tasks">{m.drama.projectDetail.tabTasks}（{(detail.recent_tasks ?? []).length}）</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="admin-detail-tab-panel">
          <AdminDetailSection title={m.drama.basicInfo}>
            <AdminDetailMeta
              items={[
                {
                  label: m.drama.user,
                  value: (
                    <AdminEntityLink
                      kind="user"
                      id={detail.user_id}
                      label={detail.user_email ?? undefined}
                    />
                  ),
                },
                { label: m.drama.projectDetail.description, value: detail.description || m.drama.noDescription, full: true },
                { label: m.drama.projectDetail.summaryStatus, value: detail.summary_status || "—" },
                { label: m.drama.projectDetail.episodeContentStatus, value: detail.episode_content_status || "—" },
                { label: m.drama.projectDetail.assetsSeedStatus, value: detail.assets_seed_status || "—" },
                { label: m.drama.projectDetail.episodeCount, value: detail.episode_count ?? 0 },
                { label: m.drama.projectDetail.assetCount, value: detail.asset_count ?? 0 },
                { label: m.drama.projectDetail.fragmentCount, value: detail.fragment_count ?? 0 },
                {
                  label: m.drama.updatedAt,
                  value: detail.updated_at ? new Date(detail.updated_at).toLocaleString() : "—",
                  full: true,
                },
              ]}
            />
          </AdminDetailSection>

          <AdminDetailSection title={m.drama.costSummary}>
            <AdminDetailStatGrid
              items={[
                { label: m.drama.charge, value: formatCredits(usage?.charge_fen ?? detail.charge_fen ?? 0, locale) },
                { label: m.drama.cost, value: formatCredits(usage?.cost_fen ?? 0, locale) },
                { label: m.drama.calls, value: usage?.calls ?? 0 },
                {
                  label: m.drama.imageVideoLlmTts,
                  value: `${usage?.image_gens ?? 0}/${usage?.video_gens ?? 0}/${usage?.llm_calls ?? 0}/${usage?.tts_gens ?? 0}`,
                },
              ]}
            />
          </AdminDetailSection>
        </TabsContent>

        <TabsContent value="episodes" className="admin-detail-tab-panel">
          <AdminDetailSection title={`${m.drama.projectDetail.episodesListTitle}（${(detail.episodes ?? []).length}）`}>
            <AdminDetailTableWrap>
              <table>
                <thead>
                  <tr>
                    <th>{m.drama.projects.colId}</th>
                    <th>{m.drama.projectDetail.colEpisodeName}</th>
                    <th>{m.drama.projectDetail.colFragmentCount}</th>
                    <th>{m.drama.projectDetail.colFragmentPlan}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.episodes ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="!text-center text-[var(--admin-muted)]">
                        {m.drama.projectDetail.episodesEmpty}
                      </td>
                    </tr>
                  ) : (
                    (detail.episodes ?? []).map((ep) => (
                      <tr key={ep.id}>
                        <td>{ep.id}</td>
                        <td>{ep.name}</td>
                        <td>{ep.fragment_count}</td>
                        <td>{ep.fragment_plan_status || "—"}</td>
                        <td>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/drama-episodes/${ep.id}`}>{m.drama.view}</Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </AdminDetailTableWrap>
          </AdminDetailSection>
        </TabsContent>

        <TabsContent value="assets" className="admin-detail-tab-panel">
          <AdminDetailSection title={`${m.drama.projectDetail.assetsListTitle}（${(detail.assets ?? []).length}）`}>
            <AdminDetailTableWrap>
              <table>
                <thead>
                  <tr>
                    <th>{m.drama.projects.colId}</th>
                    <th>{m.drama.projectDetail.colAssetType}</th>
                    <th>{m.drama.projectDetail.colAssetName}</th>
                    <th>{m.drama.projectDetail.colAssetCover}</th>
                    <th>{m.drama.projectDetail.colAssetGeneration}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.assets ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="!text-center text-[var(--admin-muted)]">
                        {m.drama.projectDetail.assetsEmpty}
                      </td>
                    </tr>
                  ) : (
                    (detail.assets ?? []).map((a) => (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td>{m.drama.assetTypes[a.type as keyof typeof m.drama.assetTypes] || a.type}</td>
                        <td className="max-w-[160px] truncate">{formatDramaAssetName(a.name, locale) || "—"}</td>
                        <td>{a.has_cover ? m.drama.hasBaseImage : "—"}</td>
                        <td>{m.drama.statuses[a.generation_status as keyof typeof m.drama.statuses] || a.generation_status || "—"}</td>
                        <td>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/drama-assets/${a.id}`}>{m.drama.view}</Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </AdminDetailTableWrap>
          </AdminDetailSection>
        </TabsContent>

        <TabsContent value="tasks" className="admin-detail-tab-panel">
          <AdminDetailSection title={`${m.drama.projectDetail.tasksListTitle}（${(detail.recent_tasks ?? []).length}）`}>
            <AdminDetailTableWrap>
              <table>
                <thead>
                  <tr>
                    <th>{m.drama.projects.colId}</th>
                    <th>{m.drama.projectDetail.colTaskType}</th>
                    <th>{m.drama.projectDetail.colTaskStatus}</th>
                    <th>{m.drama.projectDetail.colTaskChargedEstimated}</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.recent_tasks ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="!text-center text-[var(--admin-muted)]">
                        {m.drama.projectDetail.tasksEmpty}
                      </td>
                    </tr>
                  ) : (
                    (detail.recent_tasks ?? []).map((t) => (
                      <tr key={t.id}>
                        <td>
                          <AdminEntityLink kind="task" id={t.id} />
                        </td>
                        <td>{taskTypeLabel(t.task_type)}</td>
                        <td>{taskStatusLabel(t.status)}</td>
                        <td>
                          {formatCredits(t.billing_charged_fen, locale)} / {formatCredits(t.billing_estimate_fen, locale)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </AdminDetailTableWrap>
          </AdminDetailSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
