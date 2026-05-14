const PLATFORM_LABELS = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

export function formatPlatform(platform) {
  if (!platform) return "—";
  return PLATFORM_LABELS[platform] || platform;
}

const STATUS_LABELS = {
  draft: "Draft",
  ready: "Ready",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
  manual_pending: "Manual pending",
  manual_done: "Manual done",
  cancelled: "Cancelled",
  idea: "Idea",
  scripted: "Scripted",
  recorded: "Recorded",
  edited: "Edited",
  archived: "Archived",
  pending: "Pending",
  done: "Done",
  snoozed: "Snoozed",
  dismissed: "Dismissed",
  success: "Success",
  manual_completed: "Manual completed",
  pending_manual: "Pending manual",
};

export function formatStatus(status, t) {
  if (!status) return "—";
  if (typeof t === "function") {
    return t(status, {
      ns: "status",
      defaultValue: STATUS_LABELS[status] || status.replace(/_/g, " "),
    });
  }
  return STATUS_LABELS[status] || status.replace(/_/g, " ");
}

export function statusTone(status) {
  switch (status) {
    case "ready":
    case "published":
    case "manual_done":
    case "success":
    case "manual_completed":
    case "done":
      return "success";
    case "scheduled":
    case "manual_pending":
    case "snoozed":
    case "pending_manual":
      return "warning";
    case "failed":
    case "cancelled":
    case "dismissed":
      return "danger";
    default:
      return "neutral";
  }
}

const CATEGORY_LABELS = {
  programming: "Programming",
  software_engineering: "Software engineering",
  business_systems: "Business systems",
  ara_financial: "Ara Financial",
  portfolio_client_acquisition: "Portfolio & clients",
  course_content: "Course content",
  saas_product_journey: "SaaS journey",
  personal_brand: "Personal brand",
};

export function formatCategory(category, t) {
  if (!category) return "—";
  if (typeof t === "function") {
    return t(`categories.${category}`, {
      ns: "status",
      defaultValue: CATEGORY_LABELS[category] || category.replace(/_/g, " "),
    });
  }
  return CATEGORY_LABELS[category] || category.replace(/_/g, " ");
}

function dateOnlyFormatter(locale) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dateWithTimeFormatter(locale) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function safeDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDate(value, locale) {
  const date = safeDate(value);
  return date ? dateOnlyFormatter(locale).format(date) : "—";
}

export function formatDateTime(value, locale) {
  const date = safeDate(value);
  return date ? dateWithTimeFormatter(locale).format(date) : "—";
}

export function formatRelative(value, now = new Date(), locale) {
  if (typeof now === "string") {
    locale = now;
    now = new Date();
  }

  const date = safeDate(value);
  if (!date) return "—";

  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absMs < minute) return "just now";
  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (absMs < 7 * day) return rtf.format(Math.round(diffMs / day), "day");
  return formatDate(date, locale);
}

export const CONTENT_STATUSES = [
  "idea",
  "scripted",
  "recorded",
  "edited",
  "ready",
  "scheduled",
  "published",
  "failed",
  "archived",
];

export const CONTENT_CATEGORIES = Object.keys(CATEGORY_LABELS);

export const PLATFORMS = Object.keys(PLATFORM_LABELS);
