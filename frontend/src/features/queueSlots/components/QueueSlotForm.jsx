import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { TimePicker } from "../../../components/ui/TimePicker";
import { extractErrorMessage } from "../../../lib/axios";
import { getBrowserTimezone, getTimezoneOptions } from "../../../lib/datetime";
import { PLATFORMS, formatPlatform } from "../../../lib/format";
import { useCreateQueueSlot } from "../hooks/useCreateQueueSlot";
import { useUpdateQueueSlot } from "../hooks/useUpdateQueueSlot";
import { DAY_LABELS } from "../lib/queueSlotConstants";

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

const DAY_OPTIONS = DAY_LABELS.map((label, idx) => ({
  value: String(idx),
  label,
}));

const PLATFORM_OPTIONS = PLATFORMS.map((value) => ({
  value,
  label: formatPlatform(value),
}));

function describeError(error) {
  const status = error?.response?.status;
  if (status === 409) {
    return "This slot already exists for this platform.";
  }
  return extractErrorMessage(error, "We couldn't save this slot just now.");
}

export function QueueSlotForm({
  mode = "create",
  slot,
  defaultPlatform,
  onCancel,
  onSuccess,
}) {
  const [submitError, setSubmitError] = useState(null);

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
      setSubmitError(describeError(error));
    },
  });

  const updateMutation = useUpdateQueueSlot(slot?.id, {
    onSuccess: () => {
      setSubmitError(null);
      onSuccess?.();
    },
    onError: (error) => {
      setSubmitError(describeError(error));
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
              label="Platform"
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
              label="Day"
              options={DAY_OPTIONS}
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
              label="Time (HH:mm)"
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
              label="Timezone"
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
            Couldn't save
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
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={submitting}
        >
          {submitting
            ? "Saving"
            : mode === "edit"
              ? "Save changes"
              : "Add slot"}
        </Button>
      </div>
    </form>
  );
}
