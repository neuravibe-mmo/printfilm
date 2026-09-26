import { cn } from "@/lib/utils";
import type { KeyboardEventHandler } from "react";
import { useI18n } from "@/i18n/useI18n";

type AdminSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
};

// 管理端搜索框（带图标）
export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className,
  onKeyDown,
}: AdminSearchInputProps) {
  const { m } = useI18n();
  const effectivePlaceholder = placeholder ?? m.common.searchPlaceholder;
  return (
    <div className={cn("admin-input-search-wrap admin-filter-search", className)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        className="admin-input"
        placeholder={effectivePlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
