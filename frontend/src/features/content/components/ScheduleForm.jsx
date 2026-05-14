import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "../../../components/ui/Button";
import { DatePicker } from "../../../components/ui/DatePicker";
import { Select } from "../../../components/ui/Select";
import { TimePicker } from "../../../components/ui/TimePicker";
import {
  buildIsoFromLocalParts,
  getBrowserTimezone,
  getTimezoneOptions,
  isoToLocalParts,
} from "../../../lib/datetime";

const PUBLISH_MODE_OPTIONS = [
  { value: "manual", label: "Manual — I'll publish it myself when reminded" },
  { value: "reminder", label: "Reminder — just remind me, no auto-publish" },
  { value: "auto", label: "Auto (when supported)" },
];

const formSchema = z.object({
  date: z.string().min(1, "Pick a date"),
  time: z.string().min(1, "Pick a time"),
  timezone: z.string().min(1, "Timezone is required"),
  publishMode: z.enum(["manual", "reminder", "auto"]),
});

function getInitialValues(schedule) {
  const tz = schedule?.timezone || "Africa/Cairo";
  if (schedule?.scheduledAt) {
    const { date, time } = isoToLocalParts(schedule.scheduledAt, tz);
    return {
      date,
      time,
      timezone: tz,
      publishMode: schedule.publishMode || "manual",
    };
  }
  return {
    date: "",
    time: "",
    timezone: tz,
    publishMode: "manual",
  };
}

export function ScheduleForm({
  mode = "create",
  schedule,
  isSubmitting = false,
  isCancelling = false,
  onSubmit,
  onCancel,
  onDelete,
  submitLabel,
  cancelLabel = "Cancel",
}) {
  const initial = useMemo(() => getInitialValues(schedule), [schedule]);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initial,
  });

  useEffect(() => {
    reset(initial);
  }, [initial, reset]);

  const [extraTimezones] = useState(() => {
    const seeds = [
      schedule?.timezone,
      getBrowserTimezone(),
      "Africa/Cairo",
    ].filter(Boolean);
    return getTimezoneOptions(seeds);
  });

  const timezoneOptions = useMemo(
    () => extraTimezones.map((tz) => ({ value: tz, label: tz })),
    [extraTimezones]
  );

  const watchedPublishMode = useMemo(
    () => initial.publishMode,
    [initial.publishMode]
  );

  const submit = (values) => {
    const isoUtc = buildIsoFromLocalParts({
      dateStr: values.date,
      timeStr: values.time,
      timezone: values.timezone,
    });
    if (!isoUtc) {
      return;
    }
    onSubmit({
      scheduledAt: isoUtc,
      timezone: values.timezone,
      publishMode: values.publishMode,
    });
  };

  const defaultSubmitLabel =
    mode === "edit" ? "Save reschedule" : "Schedule this post";

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1.2fr]">
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DatePicker
              label="Date"
              error={errors.date?.message}
              {...field}
            />
          )}
        />
        <Controller
          control={control}
          name="time"
          render={({ field }) => (
            <TimePicker
              label="Time"
              error={errors.time?.message}
              {...field}
            />
          )}
        />
        <Controller
          control={control}
          name="timezone"
          render={({ field }) => (
            <Select
              label="Timezone"
              options={timezoneOptions}
              error={errors.timezone?.message}
              {...field}
            />
          )}
        />
      </div>

      <Controller
        control={control}
        name="publishMode"
        defaultValue={watchedPublishMode}
        render={({ field }) => (
          <Select
            label="Publish mode"
            options={PUBLISH_MODE_OPTIONS}
            hint="Manual reminder will be created for this scheduled time."
            error={errors.publishMode?.message}
            {...field}
          />
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {mode === "edit" ? "Reschedule mode" : "Pick a slot to schedule"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {mode === "edit" && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onDelete}
              loading={isCancelling}
              disabled={isSubmitting}
            >
              {isCancelling ? "Cancelling" : "Cancel schedule"}
            </Button>
          )}
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onCancel}
              disabled={isSubmitting || isCancelling}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            disabled={isCancelling}
          >
            {isSubmitting
              ? "Saving"
              : submitLabel || defaultSubmitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
