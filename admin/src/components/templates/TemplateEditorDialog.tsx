import { ImageOff, Loader2, Save } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminTemplate } from "@/api/client";
import { AdminField } from "@/components/admin/AdminField";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSelect } from "@/components/admin/AdminSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/select";
import { templateCategoryLabel, templateName } from "@/lib/statusLabels";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/useI18n";

export type TemplateFormState = {
  id: string;
  name: string;
  name_en: string;
  name_vi: string;
  description: string;
  description_en: string;
  description_vi: string;
  category: string;
  preview_cover: string;
  style_prefix: string;
  character_prompt: string;
  extra_prompt: string;
  negative_prompt: string;
  default_ratio: string;
  shot_duration_min: number;
  shot_duration_max: number;
  llm_system_addon: string;
  sort_order: number;
  is_active: boolean;
  is_premium: boolean;
};

type TemplateEditorDialogProps = {
  open: boolean;
  saving: boolean;
  editing: AdminTemplate | null;
  form: TemplateFormState;
  categorySuggestions?: string[];
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<TemplateFormState>) => void;
  onSave: () => void;
};

type EditorTab = "basic" | "prompts" | "publish";

// 解析封面预览地址
function coverPreviewSrc(url: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

// 模板新建/编辑弹窗（分 Tab + 封面预览）
export function TemplateEditorDialog({
  open,
  saving,
  editing,
  form,
  categorySuggestions = [],
  onOpenChange,
  onChange,
  onSave,
}: TemplateEditorDialogProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<EditorTab>("basic");
  const previewSrc = useMemo(() => coverPreviewSrc(form.preview_cover), [form.preview_cover]);

  const tabs: { id: EditorTab; label: string }[] = useMemo(
    () => [
      { id: "basic", label: t("templates.tabBasic") },
      { id: "prompts", label: t("templates.tabPrompts") },
      { id: "publish", label: t("templates.tabPublish") },
    ],
    [t],
  );

  const ratioOptions = useMemo(
    () => [
      { value: "16:9", label: t("templates.ratio169") },
      { value: "9:16", label: t("templates.ratio916") },
      { value: "1:1", label: t("templates.ratio11") },
      { value: "4:3", label: "4:3" },
      { value: "3:4", label: "3:4" },
    ],
    [t],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) setTab("basic");
    onOpenChange(next);
  };

  return (
    <AdminModal
      open={open}
      onOpenChange={handleOpenChange}
      size="full"
      className="template-editor-dialog max-h-[92vh] overflow-hidden"
      bodyClassName="p-0 overflow-hidden"
      title={editing ? t("templates.editTitle", { name: templateName(editing.id, editing.name, t) }) : t("templates.createTitle")}
      subtitle={editing ? editing.id : t("templates.createSubtitle")}
      footer={
        <>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? t("templates.saving") : t("templates.saveButton")}
          </Button>
        </>
      }
    >
      <div className="template-editor-layout">
        <aside className="template-editor-preview">
          <div className="template-editor-preview-frame">
            {previewSrc ? (
              <img src={previewSrc} alt={t("templates.coverPreview")} className="template-editor-preview-img" />
            ) : (
              <div className="template-editor-preview-empty">
                <ImageOff className="h-10 w-10 text-[#c0c4cc]" />
                <span>{t("templates.coverPreview")}</span>
              </div>
            )}
          </div>
          <AdminField label={t("templates.coverUrl")} hint={t("templates.coverHint")}>
            <Input
              className="admin-input h-9"
              placeholder="/static/templates/covers/xxx.png"
              value={form.preview_cover}
              onChange={(e) => onChange({ preview_cover: e.target.value })}
            />
          </AdminField>
        </aside>

        <div className="template-editor-main">
          <div className="template-editor-tabs" role="tablist">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={cn("template-editor-tab", tab === item.id && "is-active")}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="template-editor-panel">
            {tab === "basic" ? (
              <div className="template-editor-grid">
                {!editing ? (
                  <AdminField label={t("templates.id")} className="template-editor-field--full">
                    <Input
                      className="admin-input h-9"
                      placeholder={t("templates.idPlaceholder")}
                      value={form.id}
                      onChange={(e) => onChange({ id: e.target.value })}
                    />
                  </AdminField>
                ) : null}
                <AdminField label={`${t("templates.name")} (Gốc / Tiếng Trung)`} className="template-editor-field--full">
                  <Input
                    className="admin-input h-9"
                    value={form.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                  />
                </AdminField>
                <AdminField label={`${t("templates.name")} (Tiếng Việt)`} className="template-editor-field--full">
                  <Input
                    className="admin-input h-9"
                    placeholder="Tên hiển thị tiếng Việt..."
                    value={form.name_vi}
                    onChange={(e) => onChange({ name_vi: e.target.value })}
                  />
                </AdminField>
                <AdminField label={`${t("templates.name")} (English)`} className="template-editor-field--full">
                  <Input
                    className="admin-input h-9"
                    placeholder="English display name..."
                    value={form.name_en}
                    onChange={(e) => onChange({ name_en: e.target.value })}
                  />
                </AdminField>
                <AdminField label={`${t("templates.description")} (Gốc / Tiếng Trung)`} className="template-editor-field--full">
                  <Textarea
                    value={form.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    className="min-h-[72px]"
                  />
                </AdminField>
                <AdminField label={`${t("templates.description")} (Tiếng Việt)`} className="template-editor-field--full">
                  <Textarea
                    placeholder="Mô tả phong cách tiếng Việt..."
                    value={form.description_vi}
                    onChange={(e) => onChange({ description_vi: e.target.value })}
                    className="min-h-[72px]"
                  />
                </AdminField>
                <AdminField label={`${t("templates.description")} (English)`} className="template-editor-field--full">
                  <Textarea
                    placeholder="English description..."
                    value={form.description_en}
                    onChange={(e) => onChange({ description_en: e.target.value })}
                    className="min-h-[72px]"
                  />
                </AdminField>
                <AdminField
                  label={t("templates.categoryField")}
                  hint={
                    categorySuggestions.length
                      ? `${t("templates.commonPrefix")}${categorySuggestions.slice(0, 8).map((c) => templateCategoryLabel(c, t)).join(", ")}${categorySuggestions.length > 8 ? "…" : ""}`
                      : undefined
                  }
                >
                  <Input
                    className="admin-input h-9"
                    placeholder={t("templates.categoryPlaceholder")}
                    value={form.category}
                    onChange={(e) => onChange({ category: e.target.value })}
                  />
                </AdminField>
                <AdminSelect
                  label={t("templates.defaultRatio")}
                  value={form.default_ratio}
                  options={ratioOptions}
                  onChange={(v) => onChange({ default_ratio: v })}
                />
                <AdminField label={t("templates.sortOrder")}>
                  <Input
                    className="admin-input h-9"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => onChange({ sort_order: Number(e.target.value) })}
                  />
                </AdminField>
                <AdminField label={t("templates.shotDurationMin")}>
                  <Input
                    className="admin-input h-9"
                    type="number"
                    value={form.shot_duration_min}
                    onChange={(e) => onChange({ shot_duration_min: Number(e.target.value) })}
                  />
                </AdminField>
                <AdminField label={t("templates.shotDurationMax")}>
                  <Input
                    className="admin-input h-9"
                    type="number"
                    value={form.shot_duration_max}
                    onChange={(e) => onChange({ shot_duration_max: Number(e.target.value) })}
                  />
                </AdminField>
              </div>
            ) : null}

            {tab === "prompts" ? (
              <div className="template-editor-grid template-editor-grid--prompts">
                <AdminField label={t("templates.stylePrefix")} className="template-editor-field--full">
                  <Textarea
                    value={form.style_prefix}
                    onChange={(e) => onChange({ style_prefix: e.target.value })}
                    className="min-h-[100px] font-mono text-[13px]"
                  />
                </AdminField>
                <AdminField label={t("templates.characterPrompt")} className="template-editor-field--full">
                  <Textarea
                    value={form.character_prompt}
                    onChange={(e) => onChange({ character_prompt: e.target.value })}
                    className="min-h-[88px] font-mono text-[13px]"
                  />
                </AdminField>
                <AdminField label={t("templates.extraPrompt")} className="template-editor-field--full">
                  <Textarea
                    value={form.extra_prompt}
                    onChange={(e) => onChange({ extra_prompt: e.target.value })}
                    className="min-h-[88px] font-mono text-[13px]"
                  />
                </AdminField>
                <AdminField label={t("templates.llmSystemAddon")} className="template-editor-field--full">
                  <Textarea
                    value={form.llm_system_addon}
                    onChange={(e) => onChange({ llm_system_addon: e.target.value })}
                    className="min-h-[88px] font-mono text-[13px]"
                  />
                </AdminField>
                <AdminField label={t("templates.negativePrompt")} className="template-editor-field--full">
                  <Textarea
                    value={form.negative_prompt}
                    onChange={(e) => onChange({ negative_prompt: e.target.value })}
                    className="min-h-[88px] font-mono text-[13px]"
                  />
                </AdminField>
              </div>
            ) : null}

            {tab === "publish" ? (
              <div className="template-editor-publish">
                <div className="template-editor-publish-row">
                  <div>
                    <strong>{t("templates.publishDisplay")}</strong>
                    <p>{t("templates.publishDisplayHint")}</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={(v) => onChange({ is_active: v })} />
                </div>
                <div className="template-editor-publish-row">
                  <div>
                    <strong>{t("templates.premiumTemplate")}</strong>
                    <p>{t("templates.premiumTemplateHint")}</p>
                  </div>
                  <Switch checked={form.is_premium} onCheckedChange={(v) => onChange({ is_premium: v })} />
                </div>
                {editing ? (
                  <details className="mt-4 rounded-lg border p-3">
                    <summary className="cursor-pointer text-sm font-medium">{t("templates.advancedConfigReadonly")}</summary>
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="mb-1 text-xs text-[var(--admin-muted)]">seedance_config</div>
                        <pre className="admin-json-readonly">
                          {JSON.stringify(editing.seedance_config ?? {}, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-[var(--admin-muted)]">audio_config</div>
                        <pre className="admin-json-readonly">
                          {JSON.stringify(editing.audio_config ?? {}, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-[var(--admin-muted)]">subtitle_config</div>
                        <pre className="admin-json-readonly">
                          {JSON.stringify(editing.subtitle_config ?? {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </details>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
