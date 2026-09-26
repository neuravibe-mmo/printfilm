import { useMemo, useState } from "react";
import {
  LabeledControl,
  SettingsLoading,
  SettingsPanel,
  SettingsStatusBar,
  SettingsTabShell,
} from "@/components/settings/SettingsPanel";
import { SecretField } from "@/components/settings/SecretField";
import { Switch } from "@/components/ui/switch";
import { useAdminModelSettings } from "@/hooks/useAdminModelSettings";
import { useI18n } from "@/i18n/useI18n";

// 阿里云 OSS 存储配置
export function OssSettingsPanel() {
  const { t } = useI18n();
  const { form, loading, saving, patchField, save } = useAdminModelSettings();
  const [ossKeyIdInput, setOssKeyIdInput] = useState("");
  const [ossKeySecretInput, setOssKeySecretInput] = useState("");
  const [clearOssId, setClearOssId] = useState(false);
  const [clearOssSecret, setClearOssSecret] = useState(false);

  const ossReady = useMemo(() => {
    if (!form?.oss_enabled) return false;
    const hasCreds =
      (form.has_oss_access_key_id && !clearOssId) || ossKeyIdInput.trim().length > 0;
    const hasSecret =
      (form.has_oss_access_key_secret && !clearOssSecret) || ossKeySecretInput.trim().length > 0;
    return Boolean(form.oss_bucket && hasCreds && hasSecret);
  }, [form, clearOssId, clearOssSecret, ossKeyIdInput, ossKeySecretInput]);

  async function handleSave() {
    if (!form) return;
    await save(
      {
        oss_enabled: form.oss_enabled,
        oss_endpoint: form.oss_endpoint,
        oss_region: form.oss_region,
        oss_bucket: form.oss_bucket,
        oss_folder: form.oss_folder,
        oss_public_base: form.oss_public_base,
        oss_upload_async: form.oss_upload_async,
        oss_upload_queue: form.oss_upload_queue,
        oss_access_key_id: ossKeyIdInput.trim() || undefined,
        oss_access_key_secret: ossKeySecretInput.trim() || undefined,
        clear_oss_access_key_id: clearOssId,
        clear_oss_access_key_secret: clearOssSecret,
      },
      t("settings.oss.savedSuccess"),
    );
    setOssKeyIdInput("");
    setOssKeySecretInput("");
    setClearOssId(false);
    setClearOssSecret(false);
  }

  if (loading || !form) {
    return <SettingsLoading />;
  }

  return (
    <SettingsTabShell onSave={() => void handleSave()} saving={saving}>
      <SettingsStatusBar
        title={t("settings.oss.statusBarTitle")}
        items={[
          {
            id: "oss",
            label: t("settings.oss.aliyunOss"),
            ready: ossReady,
            readyText: t("settings.ready"),
            pendingText: form.oss_enabled ? t("settings.oss.incompleteCreds") : t("settings.oss.notEnabled"),
          },
          {
            id: "async",
            label: t("settings.oss.asyncUpload"),
            ready: form.oss_upload_async,
            readyText: t("settings.oss.enabled"),
            pendingText: t("settings.oss.disabled"),
          },
        ]}
        extra={
          <span className="settings-status-extra">
            {t("settings.oss.sourcePrefix")}
            {form.source === "db" ? t("settings.oss.sourceAdmin") : t("settings.oss.sourceEnv")}
          </span>
        }
      />

      <div className="settings-routing-grid">
        <SettingsPanel
          className="settings-panel--compact"
          title={t("settings.oss.sectionOss")}
          description={t("settings.oss.sectionOssDesc")}
        >
          <div className="settings-toggle-row">
            <div>
              <strong>{t("settings.oss.enableOss")}</strong>
              <span>{t("settings.oss.enableOssHint")}</span>
            </div>
            <Switch checked={form.oss_enabled} onCheckedChange={(v) => patchField("oss_enabled", v)} />
          </div>
          <div className="settings-field-grid mt-3">
            <LabeledControl label={t("settings.oss.endpoint")}>
              <input
                className="settings-input"
                placeholder="oss-cn-beijing.aliyuncs.com"
                value={form.oss_endpoint}
                onChange={(e) => patchField("oss_endpoint", e.target.value)}
              />
            </LabeledControl>
            <LabeledControl label={t("settings.oss.region")}>
              <input
                className="settings-input"
                placeholder="cn-hangzhou"
                value={form.oss_region}
                onChange={(e) => patchField("oss_region", e.target.value)}
              />
            </LabeledControl>
            <LabeledControl label={t("settings.oss.bucket")}>
              <input
                className="settings-input"
                value={form.oss_bucket}
                onChange={(e) => patchField("oss_bucket", e.target.value)}
              />
            </LabeledControl>
            <LabeledControl label={t("settings.oss.folderPrefix")}>
              <input
                className="settings-input"
                placeholder="kepu"
                value={form.oss_folder}
                onChange={(e) => patchField("oss_folder", e.target.value)}
              />
            </LabeledControl>
            <LabeledControl
              label={t("settings.oss.publicAccessBase")}
              hint={t("settings.oss.publicAccessBaseHint")}
              className="settings-field-span-full"
            >
              <input
                className="settings-input"
                placeholder="https://cdn.example.com"
                value={form.oss_public_base}
                onChange={(e) => patchField("oss_public_base", e.target.value)}
              />
            </LabeledControl>
            <LabeledControl label={t("settings.oss.uploadQueueName")}>
              <input
                className="settings-input"
                value={form.oss_upload_queue}
                onChange={(e) => patchField("oss_upload_queue", e.target.value)}
              />
            </LabeledControl>
            <SecretField
              label={t("settings.oss.accessKeyId")}
              value={ossKeyIdInput}
              configured={form.has_oss_access_key_id && !clearOssId}
              onChange={setOssKeyIdInput}
              onClear={() => {
                setOssKeyIdInput("");
                setClearOssId(true);
              }}
            />
            <SecretField
              label={t("settings.oss.accessKeySecret")}
              value={ossKeySecretInput}
              configured={form.has_oss_access_key_secret && !clearOssSecret}
              onChange={setOssKeySecretInput}
              onClear={() => {
                setOssKeySecretInput("");
                setClearOssSecret(true);
              }}
            />
          </div>
          <div className="settings-toggle-row mt-3">
            <div>
              <strong>{t("settings.oss.asyncUploadTitle")}</strong>
              <span>{t("settings.oss.asyncUploadHint")}</span>
            </div>
            <Switch checked={form.oss_upload_async} onCheckedChange={(v) => patchField("oss_upload_async", v)} />
          </div>
        </SettingsPanel>
      </div>
    </SettingsTabShell>
  );
}
