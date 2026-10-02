import { LOCALES, type Locale } from '../../i18n/detect'
import { useI18n } from '../../i18n'

/** Chuyển đổi tiếng Trung/tiếng Anh ở thanh trên cùng: nhấp để viết tùy chọn và ghi đè ngôn ngữ trình duyệt */
export default function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="pf-nav-lang" role="group" aria-label={t('nav.language')}>
      {LOCALES.map((code: Locale) => (
        <button
          key={code}
          type="button"
          className={locale === code ? 'is-active' : undefined}
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
        >
          {code === 'zh' ? t('nav.langZh') : code === 'vi' ? t('nav.langVi') : t('nav.langEn')}
        </button>
      ))}
    </div>
  )
}
