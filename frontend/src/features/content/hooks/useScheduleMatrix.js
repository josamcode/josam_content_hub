import { useState, useCallback, useMemo, useEffect } from "react";
import { useQueryClient, useQueries } from "@tanstack/react-query";
import {
  findScheduleForPlatformPost,
  saveSchedule,
  cancelSchedule,
} from "../api/scheduleApi";
import { buildIsoFromLocalParts, isoToLocalParts } from "../../../lib/datetime";

const DEFAULT_TIMEZONE = "Africa/Cairo";
const ACTIVE_STATUSES = new Set(["scheduled", "manual_pending", "processing"]);

function getInitialRowState(post, schedule) {
  const tz = schedule?.timezone || DEFAULT_TIMEZONE;
  const hasSchedule =
    schedule && ACTIVE_STATUSES.has(schedule.status) && schedule.scheduledAt;

  if (hasSchedule) {
    const { date, time } = isoToLocalParts(schedule.scheduledAt, tz);
    return {
      enabled: true,
      date,
      time,
      publishMode: schedule.publishMode || "manual",
      timezone: tz,
      hasExistingSchedule: true,
      existingScheduleId: schedule.id,
      existingSchedule: schedule,
    };
  }

  return {
    enabled: false,
    date: "",
    time: "",
    publishMode: "manual",
    timezone: tz,
    hasExistingSchedule: false,
    existingScheduleId: null,
    existingSchedule: null,
  };
}

const EMPTY_ROWS = {};

export function useScheduleMatrix({ contentItemId, platformPosts }) {
  const queryClient = useQueryClient();
  const posts = Array.isArray(platformPosts) ? platformPosts : [];

  const scheduleQueries = useQueries({
    queries: posts.map((post) => ({
      queryKey: ["schedule-matrix", post.id],
      queryFn: () => findScheduleForPlatformPost(post.id),
      enabled: Boolean(post.id),
      staleTime: 30_000,
    })),
  });

  const isLoading = scheduleQueries.some((q) => q.isLoading);

  const initialRows = useMemo(() => {
    if (posts.length === 0) return EMPTY_ROWS;
    const map = {};
    posts.forEach((post, index) => {
      const schedule = scheduleQueries[index]?.data || null;
      map[post.id] = getInitialRowState(post, schedule);
    });
    return map;
  }, [posts, scheduleQueries]);

  const [rows, setRows] = useState(initialRows);
  const [initialized, setInitialized] = useState(false);
  const [rowErrors, setRowErrors] = useState({});
  const [savingRows, setSavingRows] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [globalSuccess, setGlobalSuccess] = useState(null);

  useEffect(() => {
    if (!isLoading && !initialized) {
      setRows(initialRows);
      setInitialized(true);
    }
  }, [isLoading, initialized, initialRows]);

  const setRowEnabled = useCallback((platformPostId, enabled) => {
    setRows((prev) => ({
      ...prev,
      [platformPostId]: { ...prev[platformPostId], enabled },
    }));
  }, []);

  const setRowDate = useCallback((platformPostId, date) => {
    setRows((prev) => ({
      ...prev,
      [platformPostId]: { ...prev[platformPostId], date },
    }));
  }, []);

  const setRowTime = useCallback((platformPostId, time) => {
    setRows((prev) => ({
      ...prev,
      [platformPostId]: { ...prev[platformPostId], time },
    }));
  }, []);

  const setRowMode = useCallback((platformPostId, publishMode) => {
    setRows((prev) => ({
      ...prev,
      [platformPostId]: { ...prev[platformPostId], publishMode },
    }));
  }, []);

  const validate = useCallback(() => {
    const rowErrors = {};
    const enabledPosts = posts.filter((p) => rows[p.id]?.enabled);

    if (enabledPosts.length === 0) {
      return { valid: false, global: true, rowErrors };
    }

    let hasPastWarning = false;
    const now = new Date();

    for (const post of enabledPosts) {
      const row = rows[post.id];
      const rowErrs = [];
      if (!row.date) rowErrs.push("Date is required.");
      if (!row.time) rowErrs.push("Time is required.");
      if (!row.date || !row.time) {
        rowErrors[post.id] = rowErrs.join(" ");
        continue;
      }

      const scheduledAt = buildIsoFromLocalParts({
        dateStr: row.date,
        timeStr: row.time,
        timezone: row.timezone,
      });
      if (!scheduledAt) {
        rowErrors[post.id] = "Invalid date or time.";
        continue;
      }

      if (new Date(scheduledAt).getTime() < now.getTime()) {
        hasPastWarning = true;
      }
    }

    if (Object.keys(rowErrors).length > 0) {
      return { valid: false, rowErrors, hasPastWarning };
    }

    return { valid: true, rowErrors: {}, hasPastWarning };
  }, [posts, rows]);

  const invalidateQueries = useCallback(
    async (postIds) => {
      await queryClient.invalidateQueries({
        queryKey: ["platform-posts", contentItemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["content-item", contentItemId],
      });
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      postIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: ["schedule-for-platform-post", id],
        });
        queryClient.invalidateQueries({ queryKey: ["schedule-matrix", id] });
      });
    },
    [queryClient, contentItemId]
  );

  const saveAll = useCallback(async () => {
    setGlobalError(null);
    setGlobalSuccess(null);
    setRowErrors({});

    const validation = validate();
    if (!validation.valid) {
      if (validation.global) {
        setGlobalError({ code: "noRowsEnabled" });
      }
      if (Object.keys(validation.rowErrors).length > 0) {
        setRowErrors(validation.rowErrors);
      }
      return { success: false };
    }

    const enabledPosts = posts.filter((p) => rows[p.id]?.enabled);
    const saving = {};
    enabledPosts.forEach((p) => {
      saving[p.id] = true;
    });
    setSavingRows(saving);

    let hasError = false;
    const newRowErrors = {};
    const savedIds = [];

    for (const post of enabledPosts) {
      const row = rows[post.id];
      try {
        const scheduledAt = buildIsoFromLocalParts({
          dateStr: row.date,
          timeStr: row.time,
          timezone: row.timezone,
        });

        if (!scheduledAt) {
          newRowErrors[post.id] = "Invalid date or time.";
          hasError = true;
          continue;
        }

        const schedule = await saveSchedule(post.id, {
          scheduledAt,
          timezone: row.timezone,
          publishMode: row.publishMode,
        });

        savedIds.push(post.id);

        setRows((prev) => ({
          ...prev,
          [post.id]: {
            ...prev[post.id],
            hasExistingSchedule: true,
            existingScheduleId: schedule?.id || null,
            existingSchedule: schedule || null,
          },
        }));
      } catch (error) {
        hasError = true;
        const status = error?.response?.status;
        const bodyErrors = error?.response?.data?.errors;
        if (
          status === 422 &&
          bodyErrors &&
          Array.isArray(bodyErrors.warnings)
        ) {
          newRowErrors[post.id] = bodyErrors.warnings[0];
        } else {
          newRowErrors[post.id] =
            error?.response?.data?.message || "Failed to save schedule.";
        }
      }
    }

    setSavingRows({});

    if (hasError) {
      setRowErrors(newRowErrors);
      setGlobalError({ code: "someFailed" });
      return { success: false };
    }

    setGlobalSuccess({ code: "savedSuccess", count: savedIds.length });
    await invalidateQueries(savedIds);
    return { success: true };
  }, [posts, rows, validate, invalidateQueries]);

  const cancelRow = useCallback(
    async (platformPostId) => {
      const row = rows[platformPostId];
      if (!row?.hasExistingSchedule || !row.existingScheduleId) return;

      setSavingRows((prev) => ({ ...prev, [platformPostId]: true }));
      setRowErrors((prev) => {
        const next = { ...prev };
        delete next[platformPostId];
        return next;
      });

      try {
        await cancelSchedule(row.existingScheduleId);

        setRows((prev) => ({
          ...prev,
          [platformPostId]: {
            ...prev[platformPostId],
            enabled: false,
            date: "",
            time: "",
            hasExistingSchedule: false,
            existingScheduleId: null,
            existingSchedule: null,
          },
        }));

        await invalidateQueries([platformPostId]);
      } catch (error) {
        setRowErrors((prev) => ({
          ...prev,
          [platformPostId]:
            error?.response?.data?.message || "Failed to cancel schedule.",
        }));
      } finally {
        setSavingRows((prev) => ({ ...prev, [platformPostId]: false }));
      }
    },
    [rows, invalidateQueries]
  );

  const applySameDate = useCallback(() => {
    const enabledPosts = posts.filter((p) => rows[p.id]?.enabled);
    if (enabledPosts.length < 2) return;

    const firstDate = rows[enabledPosts[0].id]?.date;
    if (!firstDate) return;

    setRows((prev) => {
      const next = { ...prev };
      enabledPosts.forEach((p, i) => {
        if (i === 0) return;
        next[p.id] = { ...next[p.id], date: firstDate };
      });
      return next;
    });
  }, [posts, rows]);

  const offsetTimes = useCallback(() => {
    const enabledPosts = posts.filter((p) => rows[p.id]?.enabled);
    if (enabledPosts.length < 2) return;

    const firstTime = rows[enabledPosts[0].id]?.time;
    if (!firstTime) return;

    const [hh, mm] = firstTime.split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;

    const baseMinutes = hh * 60 + mm;

    setRows((prev) => {
      const next = { ...prev };
      enabledPosts.forEach((p, i) => {
        if (i === 0) return;
        const offsetMinutes = baseMinutes + i * 5;
        const newHh = Math.floor(offsetMinutes / 60) % 24;
        const newMm = offsetMinutes % 60;
        next[p.id] = {
          ...next[p.id],
          time: `${String(newHh).padStart(2, "0")}:${String(newMm).padStart(2, "0")}`,
        };
      });
      return next;
    });
  }, [posts, rows]);

  const clearMessages = useCallback(() => {
    setGlobalError(null);
    setGlobalSuccess(null);
  }, []);

  return {
    rows,
    isLoading,
    setRowEnabled,
    setRowDate,
    setRowTime,
    setRowMode,
    saveAll,
    cancelRow,
    applySameDate,
    offsetTimes,
    rowErrors,
    globalError,
    globalSuccess,
    savingRows,
    clearMessages,
  };
}
