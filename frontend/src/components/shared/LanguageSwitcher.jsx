import { useTranslation } from "react-i18next";

import { cn } from "../../lib/cn";
import { SUPPORTED_LANGUAGES } from "../../i18n";

const LANG_LABEL = {
  en: "EN",
  ar: "عربي",
};

export function LanguageSwitcher({ className, tone = "default" }) {
  const { t, i18n } = useTranslation("common");
  const current = SUPPORTED_LANGUAGES.includes(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : "en";

  const change = (lng) => {
    if (lng === current) return;
    i18n.changeLanguage(lng);
  };

  const isDark = tone === "dark";

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border p-1",
        isDark
          ? "border-canvas/20 bg-canvas/10"
          : "border-border bg-surface",
        className
      )}
    >
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = lng === current;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => change(lng)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition",
              active
                ? isDark
                  ? "bg-canvas text-ink"
                  : "bg-ink text-canvas"
                : isDark
                  ? "text-canvas/80 hover:text-canvas"
                  : "text-muted hover:text-ink"
            )}
          >
            {LANG_LABEL[lng] || lng}
          </button>
        );
      })}
    </div>
  );
}
