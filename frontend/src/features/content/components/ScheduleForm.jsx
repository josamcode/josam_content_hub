import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["common", "pages"]);
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

  const publishModeOptions = useMemo(
    () => [
      {
        value: "manual",
        label: t("contentDetail.composer.scheduleForm.publishModes.manual", {
          ns: "pages",
        }),
      },
      {
        value: "reminder",
        label: t(
          "contentDetail.composer.scheduleForm.publishModes.reminder",
          { ns: "pages" }
        ),
      },
      {
        value: "auto",
        label: t("contentDetail.composer.scheduleForm.publishModes.auto", {
          ns: "pages",
        }),
      },
    ],
    [t]
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
    mode === "edit"
      ? t("contentDetail.composer.scheduleForm.actions.saveReschedule", {
          ns: "pages",
        })
      : t("contentDetail.composer.scheduleForm.actions.schedulePost", {
          ns: "pages",
        });

  const displaySubmitLabel =
    submitLabel === "Save reschedule"
      ? t("contentDetail.composer.scheduleForm.actions.saveReschedule", {
          ns: "pages",
        })
      : submitLabel === "Schedule this post"
        ? t("contentDetail.composer.scheduleForm.actions.schedulePost", {
            ns: "pages",
          })
        : submitLabel || defaultSubmitLabel;

  const displayCancelLabel =
    cancelLabel === "Discard"
      ? t("contentDetail.composer.scheduleForm.actions.discard", {
          ns: "pages",
        })
      : cancelLabel === "Cancel"
        ? t("cancel", { ns: "common" })
        : cancelLabel;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1.2fr]">
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DatePicker
              label={t("contentDetail.composer.scheduleForm.labels.date", {
                ns: "pages",
              })}
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
              label={t("contentDetail.composer.scheduleForm.labels.time", {
                ns: "pages",
              })}
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
              label={t("contentDetail.composer.scheduleForm.labels.timezone", {
                ns: "pages",
              })}
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
            label={t(
              "contentDetail.composer.scheduleForm.labels.publishMode",
              { ns: "pages" }
            )}
            options={publishModeOptions}
            hint={t("contentDetail.composer.scheduleForm.publishModeHint", {
              ns: "pages",
            })}
            error={errors.publishMode?.message}
            {...field}
          />
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {mode === "edit"
            ? t("contentDetail.composer.scheduleForm.mode.reschedule", {
                ns: "pages",
              })
            : t("contentDetail.composer.scheduleForm.mode.create", {
                ns: "pages",
              })}
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
              {isCancelling
                ? t("contentDetail.composer.scheduleForm.actions.cancelling", {
                    ns: "pages",
                  })
                : t(
                    "contentDetail.composer.scheduleForm.actions.cancelSchedule",
                    { ns: "pages" }
                  )}
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
              {displayCancelLabel}
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit(submit)}
            loading={isSubmitting}
            disabled={isCancelling}
          >
            {isSubmitting ? t("saving", { ns: "common" }) : displaySubmitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
