import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api, type AdminDramaFragment } from "@/api/client";
import {
  AdminDetailMeta,
  AdminDetailSection,
} from "@/components/admin/AdminDetailLayout";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";

/** 漫剧分镜详情 */
export function DramaFragmentDetailPage() {
  const { m } = useI18n();
  const { fragmentId } = useParams<{ fragmentId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<AdminDramaFragment | null>(null);
  const [loading, setLoading] = useState(true);
  const id = Number(fragmentId);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      navigate("/drama-fragments", { replace: true });
      return;
    }
    setLoading(true);
    void api<AdminDramaFragment>(`/api/admin/drama-fragments/${id}`)
      .then(setDetail)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : m.drama.loadFailed);
        navigate("/drama-fragments", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, navigate, m.drama.loadFailed]);

  if (loading && !detail) {
    return <div className="admin-detail-page-loading">{m.drama.loading}</div>;
  }
  if (!detail) return null;

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-page-toolbar">
        <Button variant="ghost" size="sm" className="admin-detail-back" asChild>
          <Link to="/drama-fragments">
            <ArrowLeft className="h-4 w-4" />
            {m.drama.backToFragments}
          </Link>
        </Button>
        <div className="admin-detail-page-heading">
          <h2 className="admin-detail-page-title">{m.drama.fragments.fragmentPrefix} #{detail.id}</h2>
          <p className="admin-detail-page-sub">
            {m.drama.episode} {detail.episode_name ?? detail.episode_id} ·{" "}
            <AdminEntityLink kind="drama" id={detail.project_id} label={detail.project_title ?? undefined} />
          </p>
        </div>
        <div className="admin-detail-page-actions">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/drama-episodes/${detail.episode_id}`}>{m.drama.viewEpisodes}</Link>
          </Button>
        </div>
      </div>

      {(detail.cover || detail.video) ? (
        <AdminDetailSection title={m.drama.mediaPreview}>
          <div className="admin-detail-media">
            {detail.video ? (
              <video src={detail.video} controls className="max-w-full" />
            ) : detail.cover ? (
              <img src={detail.cover} alt="" />
            ) : null}
          </div>
        </AdminDetailSection>
      ) : null}

      <AdminDetailSection title={m.drama.basicInfo}>
        <AdminDetailMeta
          items={[
            { label: m.drama.fragments.colOrder, value: detail.sort_order },
            {
              label: m.drama.episode,
              value: (
                <Link to={`/drama-episodes/${detail.episode_id}`} className="admin-link">
                  {detail.episode_name ?? `${m.drama.episode} #${detail.episode_id}`}
                </Link>
              ),
            },
            {
              label: m.drama.project,
              value: <AdminEntityLink kind="drama" id={detail.project_id} label={detail.project_title ?? undefined} />,
            },
            { label: m.drama.fragments.colDuration, value: detail.duration_sec != null ? `${detail.duration_sec}s` : "—" },
            { label: m.drama.assets.generationStatus, value: m.drama.statuses[detail.generation_status as keyof typeof m.drama.statuses] || detail.generation_status || "—" },
            { label: m.drama.fragments.assetRefCount, value: detail.asset_ref_count },
            { label: m.drama.fragments.scriptText, value: detail.content || "—", full: true },
          ]}
        />
      </AdminDetailSection>

      {(detail.asset_ids ?? []).length > 0 ? (
        <AdminDetailSection title={m.drama.fragments.relatedAssets}>
          <div className="flex flex-wrap gap-2">
            {(detail.asset_ids ?? []).map((assetId) => (
              <Button key={assetId} size="sm" variant="outline" asChild>
                <Link to={`/drama-assets/${assetId}`}>{m.drama.fragments.assetItem} #{assetId}</Link>
              </Button>
            ))}
          </div>
        </AdminDetailSection>
      ) : null}

      {detail.params ? (
        <AdminDetailSection title={m.drama.paramsJson}>
          <pre className="admin-json-preview">{JSON.stringify(detail.params, null, 2)}</pre>
        </AdminDetailSection>
      ) : null}
    </div>
  );
}
