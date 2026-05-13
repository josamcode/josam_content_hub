export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const DAY_SHORT_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dayName(dayOfWeek) {
  return DAY_LABELS[dayOfWeek] ?? `Day ${dayOfWeek}`;
}

export function formatTime12h(hhmm) {
  if (typeof hhmm !== "string" || !/^\d{2}:\d{2}$/.test(hhmm)) return hhmm || "—";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
