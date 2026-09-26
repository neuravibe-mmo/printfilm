import type { Locale } from "./detect";
import { zh } from "./locales/zh";
import { en } from "./locales/en";
import { vi } from "./locales/vi";

export type Messages = typeof zh;

export const messages: Record<Locale, Messages> = {
  zh,
  en,
  vi,
};
