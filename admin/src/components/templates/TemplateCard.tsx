import { Crown, ImageOff, Pencil, Trash2 } from "lucide-react";
import type { AdminTemplate } from "@/api/client";
import { Switch } from "@/components/ui/switch";
import { templateCategoryLabel, templateDesc, templateName } from "@/lib/statusLabels";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/useI18n";

type TemplateCardProps = {
  template: AdminTemplate;
  onEdit: (tpl: AdminTemplate) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, value: boolean) => void;
  onTogglePremium: (id: string, value: boolean) => void;
};

// 解析封面 URL（相对 /static 走 Vite 代理）
function coverSrc(url: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

// 模板卡片：封面 + 元信息 + 快捷开关
export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onToggleActive,
  onTogglePremium,
}: TemplateCardProps) {
  const { t } = useI18n();
  const src = coverSrc(template.preview_cover);
  const categories = template.category?.length ? template.category : [t("templates.uncategorized")];
  const displayName = templateName(template.id, template.name, t, template);
  const displayDesc = templateDesc(template.id, template.description, t, template);

  return (
    <article
      className={cn(
        "template-card group",
        !template.is_active && "template-card--inactive",
      )}
    >
      <button
        type="button"
        className="template-card-cover"
        onClick={() => onEdit(template)}
        aria-label={t("templates.editTitle", { name: displayName })}
      >
        {src ? (
          <img src={src} alt={displayName} loading="lazy" className="template-card-cover-img" />
        ) : (
          <div className="template-card-cover-fallback">
            <ImageOff className="h-8 w-8 text-white/70" />
          </div>
        )}
        <div className="template-card-cover-gradient" />
        <div className="template-card-cover-meta">
          <span className="template-card-sort">#{template.sort_order}</span>
          {template.is_premium ? (
            <span className="template-card-badge template-card-badge--premium">
              <Crown className="h-3 w-3" />
              Premium
            </span>
          ) : null}
          {!template.is_active ? (
            <span className="template-card-badge template-card-badge--off">{t("templates.off")}</span>
          ) : null}
        </div>
      </button>

      <div className="template-card-body">
        <div className="template-card-head">
          <div className="min-w-0 flex-1">
            <h3 className="template-card-title">{displayName}</h3>
            <p className="template-card-id">{template.id}</p>
          </div>
          <div className="template-card-actions">
            <button type="button" className="template-card-icon-btn" onClick={() => onEdit(template)} title={t("common.edit")}>
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="template-card-icon-btn template-card-icon-btn--danger"
              onClick={() => onDelete(template.id)}
              title={t("common.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {displayDesc ? (
          <p className="template-card-desc">{displayDesc}</p>
        ) : (
          <p className="template-card-desc template-card-desc--empty">{t("templates.noDescription")}</p>
        )}

        <div className="template-card-tags">
          {categories.slice(0, 3).map((tag) => (
            <span key={tag} className="template-card-tag">
              {templateCategoryLabel(tag, t)}
            </span>
          ))}
          <span className="template-card-tag template-card-tag--muted">{template.default_ratio}</span>
        </div>

        <div className="template-card-foot">
          <label className="template-card-toggle">
            <span>{t("templates.active")}</span>
            <Switch
              checked={template.is_active}
              onCheckedChange={(v) => onToggleActive(template.id, v)}
            />
          </label>
          <label className="template-card-toggle">
            <span>{t("templates.premium")}</span>
            <Switch
              checked={template.is_premium}
              onCheckedChange={(v) => onTogglePremium(template.id, v)}
            />
          </label>
        </div>
      </div>
    </article>
  );
}
