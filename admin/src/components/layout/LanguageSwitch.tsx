import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Globe, Check } from "lucide-react";
import { useI18n, LOCALES, LOCALE_LABELS, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "admin-icon-btn relative flex items-center justify-center gap-1.5 px-2 text-xs font-medium",
            className,
          )}
          title={t("nav.language")}
          aria-label={t("nav.language")}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block uppercase tracking-wider text-[11px] font-semibold opacity-90">
            {locale}
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[150px] overflow-hidden rounded-xl border border-[#ebeef5] bg-white p-1 text-[#303133] shadow-[0_10px_30px_rgba(0,0,0,0.08)] animate-in fade-in-80"
        >
          {LOCALES.map((code: Locale) => {
            const isCurrent = locale === code;
            const item = LOCALE_LABELS[code];
            return (
              <DropdownMenu.Item
                key={code}
                onClick={() => setLocale(code)}
                className={cn(
                  "relative flex cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-colors",
                  isCurrent
                    ? "bg-[#10b981]/10 text-[#059669] font-semibold"
                    : "hover:bg-[#f5f7fa] hover:text-[#111827]",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none">{item.flag}</span>
                  <span>{item.label}</span>
                </div>
                {isCurrent && <Check className="h-3.5 w-3.5 text-[#059669]" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
