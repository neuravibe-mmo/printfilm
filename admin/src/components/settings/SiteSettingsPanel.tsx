import {
  LabeledControl,
  SettingsLoading,
  SettingsPanel,
  SettingsStatusBar,
  SettingsTabShell,
} from "@/components/settings/SettingsPanel";
import { useAdminModelSettings } from "@/hooks/useAdminModelSettings";
import { useI18n } from "@/i18n/useI18n";

/** 站点公网地址与媒体工具路径 */
export function SiteSettingsPanel() {
  const { t } = useI18n();
  const { form, loading, saving, patchField, save } = useAdminModelSettings();

  async function handleSave() {
    if (!form) return;
    await save(
      {
        public_base_url: form.public_base_url,
        ffmpeg_path: form.ffmpeg_path,
        ffprobe_path: form.ffprobe_path,
      },
      t("settings.site.savedSuccess"),
    );
  }

  if (loading || !form) {
    return <SettingsLoading />;
  }

  const hasPublic = Boolean(form.public_base_url?.trim());
  const hasFfmpeg = Boolean(form.ffmpeg_path?.trim());
  const hasFfprobe = Boolean(form.ffprobe_path?.trim());

  return (
    <SettingsTabShell onSave={() => void handleSave()} saving={saving}>
      <SettingsStatusBar
        title={t("settings.site.statusBarTitle")}
        items={[
          {
            id: "public",
            label: t("settings.site.publicBaseUrl"),
            ready: hasPublic,
            readyText: t("settings.configured"),
            pendingText: t("settings.site.notFilled"),
          },
          {
            id: "ffmpeg",
            label: t("settings.site.ffmpeg"),
            ready: hasFfmpeg,
            readyText: form.ffmpeg_path || t("settings.configured"),
            pendingText: t("settings.site.useDefaultPath"),
          },
          {
            id: "ffprobe",
            label: t("settings.site.ffprobe"),
            ready: hasFfprobe,
            readyText: form.ffprobe_path || t("settings.configured"),
            pendingText: t("settings.site.useDefaultPath"),
          },
        ]}
      />

      <div className="settings-routing-grid">
        <SettingsPanel
          className="settings-panel--compact"
          title={t("settings.site.sectionPublic")}
          description={t("settings.site.sectionPublicDesc")}
        >
          <div className="settings-field-grid">
            <LabeledControl
              label={t("settings.site.backendPublicBaseUrl")}
              hint={t("settings.site.backendPublicBaseUrlHint")}
              className="settings-field-span-full"
            >
              <input
                className="settings-input"
                value={form.public_base_url}
                onChange={(e) => patchField("public_base_url", e.target.value)}
              />
            </LabeledControl>
          </div>
          <p className="settings-panel-footnote">
            {t("settings.site.siteFootnote")}
          </p>
        </SettingsPanel>

        <SettingsPanel
          className="settings-panel--compact"
          title={t("settings.site.sectionMedia")}
          description={t("settings.site.sectionMediaDesc")}
        >
          <div className="settings-field-grid">
            <LabeledControl label={t("settings.site.ffmpegPath")}>
              <input
                className="settings-input"
                placeholder="ffmpeg"
                value={form.ffmpeg_path}
                onChange={(e) => patchField("ffmpeg_path", e.target.value)}
              />
            </LabeledControl>
            <LabeledControl label={t("settings.site.ffprobePath")}>
              <input
                className="settings-input"
                placeholder="ffprobe"
                value={form.ffprobe_path}
                onChange={(e) => patchField("ffprobe_path", e.target.value)}
              />
            </LabeledControl>
          </div>
        </SettingsPanel>
      </div>
    </SettingsTabShell>
  );
}
