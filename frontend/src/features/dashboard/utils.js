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

export function platformInitial(platform) {
  if (!platform) return "•";
  return (PLATFORM_LABELS[platform] || platform).charAt(0).toUpperCase();
}

const STATUS_LABELS = {
  // platform post / schedule / content
  draft: "Draft",
  ready: "Ready",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
  manual_pending: "Manual pending",
  manual_done: "Manual done",
  cancelled: "Cancelled",
  // content
  idea: "Idea",
  scripted: "Scripted",
  recorded: "Recorded",
  edited: "Edited",
  archived: "Archived",
  // reminder
  pending: "Pending",
  done: "Done",
  snoozed: "Snoozed",
  dismissed: "Dismissed",
  // publish attempt
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
    case "draft":
    case "idea":
    case "scripted":
    case "recorded":
    case "edited":
    case "pending":
      return "neutral";
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

export function severityTone(severity) {
  return severity === "critical" ? "danger" : "warning";
}

const ATTENTION_TITLES = {
  ready_not_scheduled: "Ready but not scheduled",
  manual_publish_overdue: "Manual publishing overdue",
  failed_platform_post: "Platform post failed",
  failed_schedule: "Schedule failed",
  draft_platform_missing_text: "Draft missing required text",
};

export function attentionTypeTitle(type, t) {
  if (typeof t === "function") {
    return t(`attentionTypes.${type}`, {
      ns: "status",
      defaultValue: ATTENTION_TITLES[type] || t("attentionTypes.fallback", { ns: "status" }),
    });
  }
  return ATTENTION_TITLES[type] || "Needs your attention";
}

function dateOnlyFormatter(locale) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
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

function timeOnlyFormatter(locale) {
  return new Intl.DateTimeFormat(locale, {
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

export function formatTime(value, locale) {
  const date = safeDate(value);
  return date ? timeOnlyFormatter(locale).format(date) : "—";
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
  if (absMs < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }
  if (absMs < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }
  if (absMs < 7 * day) {
    return rtf.format(Math.round(diffMs / day), "day");
  }
  return formatDateTime(date, locale);
}
