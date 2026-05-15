import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { TimePicker } from "../../../components/ui/TimePicker";
import { extractErrorMessage } from "../../../lib/axios";
import { getBrowserTimezone, getTimezoneOptions } from "../../../lib/datetime";
import { PLATFORMS, formatPlatform } from "../../../lib/format";
import { useCreateQueueSlot } from "../hooks/useCreateQueueSlot";
import { useUpdateQueueSlot } from "../hooks/useUpdateQueueSlot";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const schema = z.object({
  platform: z.enum(PLATFORMS, {
    errorMap: () => ({ message: "Pick a platform" }),
  }),
  dayOfWeek: z.coerce
    .number({ invalid_type_error: "Pick a day" })
    .int()
    .min(0)
    .max(6),
  timeOfDay: z
    .string()
    .regex(TIME_REGEX, "Use 24-hour HH:mm format"),
  timezone: z.string().trim().min(1, "Timezone is required"),
});

const PLATFORM_OPTIONS = PLATFORMS.map((value) => ({
  value,
  label: formatPlatform(value),
}));

function describeError(error, t) {
  const status = error?.response?.status;
  if (status === 409) {
    return t("queueSettings.form.duplicateSlot", { ns: "pages" });
  }
  return extractErrorMessage(
    error,
    t("queueSettings.form.saveErrorFallback", { ns: "pages" })
  );
}

export function QueueSlotForm({
  mode = "create",
  slot,
  defaultPlatform,
  onCancel,
  onSuccess,
}) {
  const { t } = useTranslation(["common", "pages"]);
  const [submitError, setSubmitError] = useState(null);

  const dayOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, idx) => ({
        value: String(idx),
        label: t(`queueSettings.days.${idx}`, { ns: "pages" }),
      })),
    [t]
  );

  const timezoneOptions = useMemo(() => {
    const seeds = [
      slot?.timezone,
      getBrowserTimezone(),
      "Africa/Cairo",
    ].filter(Boolean);
    return getTimezoneOptions(seeds).map((tz) => ({ value: tz, label: tz }));
  }, [slot?.timezone]);

  const defaultValues = useMemo(
    () => ({
      platform: slot?.platform || defaultPlatform || "tiktok",
      dayOfWeek:
        typeof slot?.dayOfWeek === "number" ? String(slot.dayOfWeek) : "0",
      timeOfDay: slot?.timeOfDay || "20:00",
      timezone: slot?.timezone || "Africa/Cairo",
    }),
    [slot, defaultPlatform]
  );

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const createMutation = useCreateQueueSlot({
    onSuccess: () => {
      setSubmitError(null);
      onSuccess?.();
    },
    onError: (error) => {
      setSubmitError(describeError(error, t));
    },
  });

  const updateMutation = useUpdateQueueSlot(slot?.id, {
    onSuccess: () => {
      setSubmitError(null);
      onSuccess?.();
    },
    onError: (error) => {
      setSubmitError(describeError(error, t));
    },
  });

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values) => {
    setSubmitError(null);
    const payload = {
      platform: values.platform,
      dayOfWeek: Number(values.dayOfWeek),
      timeOfDay: values.timeOfDay,
      timezone: values.timezone,
    };
    if (mode === "edit" && slot?.id) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-3 rounded-xl border border-border bg-canvas/40 p-4"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.8fr_1.2fr]">
        <Controller
          control={control}
          name="platform"
          render={({ field }) => (
            <Select
              label={t("queueSettings.form.labels.platform", { ns: "pages" })}
              options={PLATFORM_OPTIONS}
              error={errors.platform?.message}
              {...field}
            />
          )}
        />
        <Controller
          control={control}
          name="dayOfWeek"
          render={({ field }) => (
            <Select
              label={t("queueSettings.form.labels.day", { ns: "pages" })}
              options={dayOptions}
              error={errors.dayOfWeek?.message}
              {...field}
            />
          )}
        />
        <Controller
          control={control}
          name="timeOfDay"
          render={({ field }) => (
            <TimePicker
              label={t("queueSettings.form.labels.time", { ns: "pages" })}
              error={errors.timeOfDay?.message}
              {...field}
            />
          )}
        />
        <Controller
          control={control}
          name="timezone"
          render={({ field }) => (
            <Select
              label={t("queueSettings.form.labels.timezone", { ns: "pages" })}
              options={timezoneOptions}
              error={errors.timezone?.message}
              {...field}
            />
          )}
        />
      </div>

      {submitError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            {t("queueSettings.form.saveErrorTitle", { ns: "pages" })}
          </p>
          <p className="mt-1">{submitError}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
          >
            {t("cancel", { ns: "common" })}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={submitting}
        >
          {submitting
            ? t("saving", { ns: "common" })
            : mode === "edit"
              ? t("saveChanges", { ns: "common" })
              : t("queueSettings.actions.addSlot", { ns: "pages" })}
        </Button>
      </div>
    </form>
  );
}
