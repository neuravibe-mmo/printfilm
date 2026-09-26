import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type AdminProject, type PageMeta } from "@/api/client";
import {
  AdminDetailMeta,
  AdminDetailNote,
  AdminDetailSection,
  AdminDetailStatGrid,
  AdminDetailTableWrap,
} from "@/components/admin/AdminDetailLayout";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminUserSearchSelect } from "@/components/admin/AdminUserSearchSelect";
import { PaginationBar } from "@/components/PaginationBar";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page";
import { useAdminDetailQuery } from "@/hooks/useAdminDetailQuery";
import { PROJECT_STATUS_OPTIONS, taskTypeLabel } from "@/lib/statusLabels";
import { fenToYuan } from "@/lib/utils";
import { useI18n, formatDateTime } from "@/i18n";

type ListRes = { items: AdminProject[]; meta: PageMeta };

function statusBadgeVariant(status: string): "destructive" | "success" | "warning" | "info" | "secondary" {
  if (status === "FAILED" || status === "REJECTED") return "destructive";
  if (status === "DONE") return "success";
  if (status === "CANCELLED") return "secondary";
  if (status === "DRAFT") return "secondary";
  return "info";
}

function mediaSrc(url: string | null | undefined): string {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

// 科普项目列表与详情（镜头 / 任务 / 费用 / 媒体预览）
export function ProjectsPage() {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListRes | null>(null);
  const [detail, setDetail] = useState<AdminProject | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const projectDetail = useAdminDetailQuery("open");

  async function load(nextPage = page) {
    try {
      const params = new URLSearchParams({ page: String(nextPage), page_size: String(DEFAULT_PAGE_SIZE) });
      if (status) params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      if (userId) params.set("user_id", String(userId));
      setData(await api<ListRes>(`/api/admin/projects?${params}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.failed"));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function openDetail(id: number) {
    setDetailLoading(true);
    projectDetail.open(id);
    try {
      setDetail(await api<AdminProject>(`/api/admin/projects/${id}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.failed"));
      projectDetail.close();
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    if (!projectDetail.id) {
      setDetail(null);
      return;
    }
    if (detail?.id === projectDetail.id) return;
    void openDetail(projectDetail.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectDetail.id]);

  const usage = detail?.usage;

  function resolveProjectStatus(st: string): string {
    return t(`status.project.${st}`);
  }

  function resolveTaskStatus(st: string): string {
    return t(`status.task.${st}`);
  }

  return (
    <div className="admin-list-page">
      <PageHeader description={t("projects.description")} />
      <AdminFilterBar>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t("projects.allStatus")}</option>
          {PROJECT_STATUS_OPTIONS.filter((opt) => opt.value).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {resolveProjectStatus(opt.value)}
            </option>
          ))}
        </Select>
        <Input placeholder={t("projects.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
        <AdminUserSearchSelect value={userId} onChange={(id) => setUserId(id)} />
        <Button
          size="sm"
          variant="secondary"
          className="admin-filter-action"
          onClick={() => {
            setPage(1);
            void load(1);
          }}
        >
          {t("common.filter")}
        </Button>
      </AdminFilterBar>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t("projects.cols.title")}</TableHead>
              <TableHead>{t("projects.cols.user")}</TableHead>
              <TableHead>{t("projects.cols.template")}</TableHead>
              <TableHead>{t("projects.cols.pipeline")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("projects.cols.progress")}</TableHead>
              <TableHead>{t("projects.cols.shots")}</TableHead>
              <TableHead>{t("projects.cols.charge")}</TableHead>
              <TableHead>{t("projects.cols.created")}</TableHead>
              <TableHead>{t("projects.cols.updated")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.items ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell className="max-w-[180px] truncate">{p.title}</TableCell>
                <TableCell className="text-sm">
                  <AdminEntityLink kind="user" id={p.user_id} label={p.user_email ?? undefined} />
                </TableCell>
                <TableCell className="font-mono text-xs">{p.template_id}</TableCell>
                <TableCell className="text-xs">{p.pipeline_mode}</TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(p.status)}>{resolveProjectStatus(p.status)}</Badge>
                </TableCell>
                <TableCell>{p.progress}%</TableCell>
                <TableCell>{p.shot_count}</TableCell>
                <TableCell>¥{fenToYuan(p.charge_fen ?? 0)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTime(p.created_at, locale)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTime(p.updated_at, locale)}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => void openDetail(p.id)}>
                    {t("common.detail")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data && (
        <PaginationBar
          page={data.meta.page}
          pageSize={data.meta.page_size}
          total={data.meta.total}
          onPageChange={setPage}
        />
      )}

      <AdminModal
        open={projectDetail.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDetail(null);
            projectDetail.close();
          }
        }}
        size="full"
        title={detail ? `${t("projects.modal.project")} #${detail.id} · ${detail.title}` : t("projects.modal.title")}
        subtitle={detail ? resolveProjectStatus(detail.status) : detailLoading ? t("common.loading") : undefined}
        bodyClassName="space-y-3"
      >
        {detailLoading && !detail ? (
          <div className="py-10 text-center text-sm text-[var(--admin-muted)]">{t("common.loading")}</div>
        ) : null}
        {detail ? (
          <>
            <AdminDetailSection title={t("projects.modal.baseInfo")}>
              <AdminDetailMeta
                items={[
                  {
                    label: t("projects.cols.user"),
                    value: (
                      <AdminEntityLink
                        kind="user"
                        id={detail.user_id}
                        label={detail.user_email ?? undefined}
                      />
                    ),
                  },
                  {
                    label: t("projects.modal.statusProgress"),
                    value: `${resolveProjectStatus(detail.status)} · ${detail.progress}% · ${t("projects.cols.shots")} ${detail.shot_count}`,
                  },
                  { label: t("projects.cols.template"), value: detail.template_id },
                  { label: t("projects.cols.pipeline"), value: detail.pipeline_mode },
                  { label: t("projects.modal.source"), value: detail.source_type || "—" },
                  {
                    label: t("projects.modal.resolutionRatio"),
                    value: `${detail.resolution_mode || "—"} · ${detail.output_ratio || "—"}`,
                  },
                  { label: t("projects.modal.dubbing"), value: detail.voice_id || "—", full: true },
                ]}
              />
              <AdminDetailNote empty={!detail.error_msg} className="mt-3">
                {detail.error_msg || t("projects.modal.noError")}
              </AdminDetailNote>
            </AdminDetailSection>

            {(detail.cover_url || detail.final_video_url) ? (
              <AdminDetailSection title={t("projects.modal.mediaPreview")}>
                <div className="admin-detail-media">
                  {detail.cover_url ? (
                    <img src={mediaSrc(detail.cover_url)} alt={t("projects.modal.image")} />
                  ) : null}
                  {detail.final_video_url ? (
                    <video src={mediaSrc(detail.final_video_url)} controls className="max-w-full" />
                  ) : null}
                </div>
              </AdminDetailSection>
            ) : null}

            <AdminDetailSection title={t("projects.modal.costSummary")}>
              <AdminDetailStatGrid
                items={[
                  { label: t("finance.charge"), value: `¥${fenToYuan(usage?.charge_fen ?? detail.charge_fen ?? 0)}` },
                  { label: t("finance.cost"), value: `¥${fenToYuan(usage?.cost_fen ?? 0)}` },
                  { label: "Tokens", value: usage?.tokens ?? 0 },
                  {
                    label: "Image/Video/LLM/TTS",
                    value: `${usage?.image_gens ?? 0}/${usage?.video_gens ?? 0}/${usage?.llm_calls ?? 0}/${usage?.tts_gens ?? 0}`,
                  },
                ]}
              />
            </AdminDetailSection>

            <AdminDetailSection title={`${t("projects.modal.shots")} (${(detail.shots ?? []).length})`}>
              <AdminDetailTableWrap>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t("common.status")}</th>
                      <th>{t("projects.modal.duration")}</th>
                      <th>{t("projects.modal.image")}</th>
                      <th>{t("projects.modal.video")}</th>
                      <th>{t("projects.modal.audio")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.shots ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="!text-center text-[var(--admin-muted)]">
                          {t("projects.modal.noShots")}
                        </td>
                      </tr>
                    ) : (
                      (detail.shots ?? []).map((s) => (
                        <tr key={s.id}>
                          <td>{s.shot_no}</td>
                          <td>{s.status}</td>
                          <td>{s.duration}s</td>
                          <td>{s.has_image ? t("projects.modal.has") : "—"}</td>
                          <td>{s.has_video ? t("projects.modal.has") : "—"}</td>
                          <td>{s.has_audio ? t("projects.modal.has") : "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </AdminDetailTableWrap>
            </AdminDetailSection>

            <AdminDetailSection title={`${t("projects.modal.relatedTasks")} (${(detail.recent_tasks ?? []).length})`}>
              <AdminDetailTableWrap className="max-h-[200px]">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{t("finance.cols.kind")}</th>
                      <th>{t("common.status")}</th>
                      <th>{t("projects.modal.chargedEst")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.recent_tasks ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="!text-center text-[var(--admin-muted)]">
                          {t("projects.modal.noTasks")}
                        </td>
                      </tr>
                    ) : (
                      (detail.recent_tasks ?? []).map((item) => (
                        <tr key={item.id}>
                          <td>
                            <AdminEntityLink kind="task" id={item.id} />
                          </td>
                          <td>{taskTypeLabel(item.task_type)}</td>
                          <td>{resolveTaskStatus(item.status)}</td>
                          <td>
                            ¥{fenToYuan(item.billing_charged_fen)} / ¥{fenToYuan(item.billing_estimate_fen)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </AdminDetailTableWrap>
            </AdminDetailSection>

            {detail.source_text ? (
              <AdminDetailSection title={t("projects.modal.sourceText")}>
                <AdminDetailNote>{detail.source_text}</AdminDetailNote>
              </AdminDetailSection>
            ) : null}
          </>
        ) : null}
      </AdminModal>
    </div>
  );
}
