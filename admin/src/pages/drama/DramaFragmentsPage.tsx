import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, type AdminDramaFragment, type PageMeta } from "@/api/client";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminUserSearchSelect } from "@/components/admin/AdminUserSearchSelect";
import { PaginationBar } from "@/components/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { DRAMA_GENERATION_STATUSES } from "@/lib/dramaLabels";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { useI18n } from "@/i18n/useI18n";

type ListRes = { items: AdminDramaFragment[]; meta: PageMeta };

/** 全站漫剧分镜列表 */
export function DramaFragmentsPage() {
  const { m } = useI18n();
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get("project_id");
  const initialEpisodeId = searchParams.get("episode_id");

  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState(initialProjectId ?? "");
  const [episodeId, setEpisodeId] = useState(initialEpisodeId ?? "");
  const [generationStatus, setGenerationStatus] = useState("");
  const [data, setData] = useState<ListRes | null>(null);

  async function load(nextPage = page) {
    try {
      const params = new URLSearchParams({ page: String(nextPage), page_size: String(DEFAULT_PAGE_SIZE) });
      if (q.trim()) params.set("q", q.trim());
      if (userId) params.set("user_id", String(userId));
      if (projectId.trim()) params.set("project_id", projectId.trim());
      if (episodeId.trim()) params.set("episode_id", episodeId.trim());
      if (generationStatus.trim()) params.set("generation_status", generationStatus.trim());
      setData(await api<ListRes>(`/api/admin/drama-fragments?${params}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.drama.loadFailed);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="admin-list-page">
      <PageHeader description={m.drama.fragments.pageDesc} />
      <AdminFilterBar>
        <Input placeholder={m.drama.fragments.filterContentEpisodeProject} value={q} onChange={(e) => setQ(e.target.value)} />
        <AdminUserSearchSelect value={userId} onChange={setUserId} />
        <Input placeholder={m.drama.fragments.filterProjectId} value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        <Input placeholder={m.drama.fragments.filterEpisodeId} value={episodeId} onChange={(e) => setEpisodeId(e.target.value)} />
        <select
          className="admin-native-select"
          value={generationStatus}
          onChange={(e) => setGenerationStatus(e.target.value)}
        >
          <option value="">{m.drama.allGenerationStatuses}</option>
          {DRAMA_GENERATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {m.drama.statuses[s as keyof typeof m.drama.statuses] || s}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="secondary"
          className="admin-filter-action"
          onClick={() => {
            setPage(1);
            void load(1);
          }}
        >
          {m.drama.filter}
        </Button>
      </AdminFilterBar>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{m.drama.fragments.colId}</th>
              <th>{m.drama.fragments.colOrder}</th>
              <th>{m.drama.fragments.colContent}</th>
              <th>{m.drama.fragments.colEpisode}</th>
              <th>{m.drama.fragments.colProject}</th>
              <th>{m.drama.fragments.colDuration}</th>
              <th>{m.drama.fragments.colGeneration}</th>
              <th>{m.drama.fragments.colAssetRef}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.sort_order}</td>
                <td className="max-w-[200px] truncate">{row.content || "—"}</td>
                <td className="max-w-[100px] truncate">{row.episode_name || row.episode_id}</td>
                <td>
                  <AdminEntityLink kind="drama" id={row.project_id} label={row.project_title ?? undefined} />
                </td>
                <td>{row.duration_sec != null ? `${row.duration_sec}s` : "—"}</td>
                <td className="text-xs text-[var(--admin-muted)]">
                  {m.drama.statuses[row.generation_status as keyof typeof m.drama.statuses] || row.generation_status || "—"}
                </td>
                <td>{row.asset_ref_count}</td>
                <td>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/drama-fragments/${row.id}`}>{m.drama.view}</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {(data?.items.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={9} className="!text-center text-[var(--admin-muted)]">
                  {m.drama.fragments.empty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {data?.meta ? (
        <PaginationBar
          page={data.meta.page}
          pageSize={data.meta.page_size}
          total={data.meta.total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
