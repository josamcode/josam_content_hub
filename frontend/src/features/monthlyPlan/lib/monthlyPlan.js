export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function formatMonthLabel(date, locale) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isInMonth(dateStr, monthStart, monthEnd) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d >= monthStart && d <= monthEnd;
}

const NEEDS_SCHEDULE_STATUSES = [
  "idea",
  "scripted",
  "recorded",
  "edited",
  "ready",
];

function buildScheduleMap(calendarEvents, monthStart, monthEnd) {
  const byContentId = new Map();
  if (!Array.isArray(calendarEvents)) return byContentId;

  for (const event of calendarEvents) {
    if (!event.contentItemId) continue;
    if (!isInMonth(event.scheduledAt, monthStart, monthEnd)) continue;
    if (!byContentId.has(event.contentItemId)) {
      byContentId.set(event.contentItemId, []);
    }
    byContentId.get(event.contentItemId).push(event);
  }
  return byContentId;
}

export function groupMonthlyItems(items, monthDate, calendarEvents = []) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const scheduleMap = buildScheduleMap(calendarEvents, monthStart, monthEnd);
  const scheduledContentIds = new Set(scheduleMap.keys());

  const unscheduled = [];
  const scheduledThisMonth = [];
  const publishedThisMonth = [];
  const needsAttention = [];

  for (const item of items) {
    if (item.status === "archived") continue;

    if (item.status === "failed") {
      needsAttention.push(item);
    } else if (item.status === "published") {
      if (isInMonth(item.updatedAt, monthStart, monthEnd)) {
        publishedThisMonth.push(item);
      }
    } else if (scheduledContentIds.has(item.id)) {
      scheduledThisMonth.push({
        ...item,
        _schedules: scheduleMap.get(item.id),
      });
    } else if (NEEDS_SCHEDULE_STATUSES.includes(item.status)) {
      unscheduled.push(item);
    }
  }

  return {
    unscheduled,
    scheduledThisMonth,
    publishedThisMonth,
    needsAttention,
    totalLoaded: items.length,
  };
}

export function filterGroupedItems(groups, filters) {
  const { search, status, category, platform } = filters;

  const applyToArray = (arr) => {
    if (!arr.length) return [];

    return arr.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        const haystack = [item.title, item.hook, item.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (status && item.status !== status) return false;
      if (category && item.category !== category) return false;

      if (platform) {
        const platforms = Array.isArray(item.platforms) ? item.platforms : [];
        if (!platforms.includes(platform)) return false;
      }

      return true;
    });
  };

  return {
    unscheduled: applyToArray(groups.unscheduled),
    scheduledThisMonth: applyToArray(groups.scheduledThisMonth),
    publishedThisMonth: applyToArray(groups.publishedThisMonth),
    needsAttention: applyToArray(groups.needsAttention),
    totalLoaded: groups.totalLoaded,
  };
}

export function computeStats(groups) {
  return {
    total: groups.totalLoaded,
    unscheduled: groups.unscheduled.length,
    scheduled: groups.scheduledThisMonth.length,
    published: groups.publishedThisMonth.length,
    attention: groups.needsAttention.length,
  };
}
