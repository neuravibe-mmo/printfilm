import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsSaveSlot } from "@/components/settings/SettingsSaveContext";
import { useI18n } from "@/i18n/useI18n";

type PanelProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

// Cấu hình bảng phân vùng: tiêu đề + nội dung
export function SettingsPanel({ title, description, actions, children, className }: PanelProps) {
  return (
    <section className={cn("settings-panel", className)}>
      <div className="settings-panel-header">
        <div className="min-w-0">
          <h3 className="settings-panel-title">{title}</h3>
          {description ? <p className="settings-panel-desc">{description}</p> : null}
        </div>
        {actions ? <div className="settings-panel-actions">{actions}</div> : null}
      </div>
      <div className="settings-panel-body">{children}</div>
    </section>
  );
}

type SettingsTabShellProps = {
  children: ReactNode;
  onSave?: () => void | Promise<void>;
  saving?: boolean;
  saveLabel?: string;
};

// Vùng nội dung tab: Đăng ký thao tác lưu ở phần đầu trang, không còn chiếm một dòng thanh công cụ riêng
export function SettingsTabShell({ children, onSave, saving, saveLabel }: SettingsTabShellProps) {
  const { m } = useI18n();
  const effectiveSaveLabel = saveLabel ?? m.settings.save;
  const { registerSave } = useSettingsSaveSlot();
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const hasOnSave = Boolean(onSave);

  useEffect(() => {
    if (!hasOnSave) {
      registerSave(null);
      return () => registerSave(null);
    }
    registerSave({
      onSave: () => onSaveRef.current?.(),
      saving,
      label: effectiveSaveLabel,
    });
    return () => registerSave(null);
  }, [hasOnSave, saving, effectiveSaveLabel, registerSave]);

  return (
    <div className="settings-tab-shell">
      <div className="settings-tab-body">{children}</div>
    </div>
  );
}

// Tải phần giữ chỗ
export function SettingsLoading({ label }: { label?: string }) {
  const { m } = useI18n();
  const effectiveLabel = label ?? m.settings.loading;
  return (
    <div className="settings-loading">
      <Loader2 className="h-4 w-4 animate-spin" />
      {effectiveLabel}
    </div>
  );
}

// Chặn tiêu đề bằng biểu tượng
export function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="settings-section-title">
      <span className="settings-section-icon">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

// Nhãn biểu mẫu + điều khiển
export function LabeledControl({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("settings-field", className)}>
      <span className="settings-field-label">{label}</span>
      {children}
      {hint ? <span className="settings-field-hint">{hint}</span> : null}
    </label>
  );
}

// Bảng phụ được nhúng (nền xám nhạt, dùng cho thanh trạng thái hoặc nhóm độc lập)
export function SettingsSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("settings-surface", className)}>{children}</div>;
}

export type SettingsStatusItem = {
  id: string;
  label: string;
  ready: boolean;
  readyText?: string;
  pendingText?: string;
};

// Thanh trạng thái/sẵn sàng trên cùng (phù hợp với định tuyến của mô hình)
export function SettingsStatusBar({
  title,
  items,
  extra,
}: {
  title: string;
  items: SettingsStatusItem[];
  extra?: ReactNode;
}) {
  const { m } = useI18n();
  return (
    <SettingsSurface className="settings-readiness-bar">
      <div className="settings-readiness-title-row">
        <div className="settings-readiness-title">{title}</div>
        {extra}
      </div>
      <div className="settings-readiness-row">
        {items.map((item) => (
          <div key={item.id} className={cn("settings-readiness-item", item.ready && "is-ready")}>
            <span className={cn("settings-readiness-dot", item.ready ? "is-on" : "is-off")} />
            <span>{item.label}</span>
            <em>{item.ready ? item.readyText ?? m.settings.configured : item.pendingText ?? m.settings.notReady}</em>
          </div>
        ))}
      </div>
    </SettingsSurface>
  );
}
