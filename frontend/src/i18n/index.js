import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enNav from "./locales/en/nav.json";
import enStatus from "./locales/en/status.json";
import enPages from "./locales/en/pages.json";

import arCommon from "./locales/ar/common.json";
import arNav from "./locales/ar/nav.json";
import arStatus from "./locales/ar/status.json";
import arPages from "./locales/ar/pages.json";

export const SUPPORTED_LANGUAGES = ["en", "ar"];
export const RTL_LANGUAGES = new Set(["ar"]);
export const DEFAULT_NAMESPACE = "common";
export const NAMESPACES = ["common", "nav", "status", "pages"];

const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    status: enStatus,
    pages: enPages,
  },
  ar: {
    common: arCommon,
    nav: arNav,
    status: arStatus,
    pages: arPages,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    load: "languageOnly",
    ns: NAMESPACES,
    defaultNS: DEFAULT_NAMESPACE,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    returnNull: false,
  });

function applyDocumentLang(lng) {
  if (typeof document === "undefined") return;
  const normalized = SUPPORTED_LANGUAGES.includes(lng) ? lng : "en";
  document.documentElement.lang = normalized;
  document.documentElement.dir = RTL_LANGUAGES.has(normalized) ? "rtl" : "ltr";
}

applyDocumentLang(i18n.resolvedLanguage || i18n.language);
i18n.on("languageChanged", applyDocumentLang);

export default i18n;
