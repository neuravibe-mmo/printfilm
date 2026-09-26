import { createContext } from "react";
import type { Locale } from "./detect";
import type { TVars } from "./lookup";
import type { Messages } from "./messages";

export type TFunction = (path: string, vars?: TVars) => string;

export type I18nValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: TFunction;
  m: Messages;
};

export const I18nContext = createContext<I18nValue | null>(null);
