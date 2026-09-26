import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getActiveLocale } from "@/i18n/detect";

// Merge Tailwind class names with conflict resolution
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format fen to raw numeric string
export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2);
}

// Format credits with localized unit
export function formatCredits(fen: number | null | undefined, locale?: string): string {
  const loc = locale || getActiveLocale();
  const n = ((fen ?? 0) / 100).toFixed(2);
  if (loc === "vi") return `${n} Xu`;
  if (loc === "en") return `${n} Credits`;
  return `¥${n}`;
}

// Format yuan string/number to localized credits
export function formatCreditsFromYuan(yuan: number | string | null | undefined, locale?: string): string {
  const loc = locale || getActiveLocale();
  if (yuan == null || yuan === "") return "—";
  const num = typeof yuan === "number" ? yuan : parseFloat(yuan);
  if (isNaN(num)) return "—";
  const str = num.toFixed(2);
  if (loc === "vi") return `${str} Xu`;
  if (loc === "en") return `${str} Credits`;
  return `¥${str}`;
}

