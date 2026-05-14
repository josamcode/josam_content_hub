import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Spinner } from "../../../../components/ui/Spinner";
import { TagInput } from "../../../../components/ui/TagInput";
import { Textarea } from "../../../../components/ui/Textarea";
import { extractErrorMessage } from "../../../../lib/axios";
import { cn } from "../../../../lib/cn";
import { formatPlatform, formatStatus, statusTone } from "../../../../lib/format";
import { useApplyPlatformDefaults } from "../../hooks/useApplyPlatformDefaults";
import { useCancelSchedule } from "../../hooks/useCancelSchedule";
import { useSchedulePlatformPost } from "../../hooks/useSchedulePlatformPost";
import { useScheduleForPlatformPost } from "../../hooks/useScheduleForPlatformPost";
import { useUpdatePlatformPost } from "../../hooks/useUpdatePlatformPost";
import { useValidatePlatformPost } from "../../hooks/useValidatePlatformPost";
import { ScheduleForm } from "../ScheduleForm";
import { ScheduleSummary } from "../ScheduleSummary";
import { CopyButton } from "./CopyButton";
import { ValidationPanel } from "./ValidationPanel";

const PLATFORM_POST_STATUSES = [
  "draft",
  "ready",
  "scheduled",
  "published",
  "failed",
  "manual_pending",
  "manual_done",
];

const STATUS_OPTIONS = PLATFORM_POST_STATUSES.map((value) => ({
  value,
  label: formatStatus(value),
}));

function toDefaultValues(post, fields) {
  const defaults = { status: post.status || "draft", platformPostUrl: post.platformPostUrl || "" };
  for (const field of fields) {
    if (field.kind === "tags") {
      defaults[field.name] = Array.isArray(post[field.name])
        ? [...post[field.name]]
        : [];
    } else {
      defaults[field.name] = post[field.name] || "";
    }
  }
  return defaults;
}

function diffPayload(values, original) {
  const patch = {};
  for (const key of Object.keys(values)) {
    const next = values[key];
    const prev = original[key];
    if (Array.isArray(next) || Array.isArray(prev)) {
      const a = Array.isArray(next) ? next : [];
      const b = Array.isArray(prev) ? prev : [];
      if (a.length !== b.length || a.some((v, i) => v !== b[i])) {
        patch[key] = a;
      }
    } else if (next !== prev) {
      patch[key] = next;
    }
  }
  return patch;
}

function formatHashtagsForCopy(values, prefix = "#") {
  if (!Array.isArray(values) || values.length === 0) return "";
  return values
    .map((value) => `${prefix}${value}`)
    .join(" ");
}

function formatTagsForCopy(values) {
  if (!Array.isArray(values) || values.length === 0) return "";
  return values.join(", ");
}

function fieldCopyValue(field, value) {
  if (field.kind === "tags") {
    return field.prefix
      ? formatHashtagsForCopy(value, field.prefix)
      : formatTagsForCopy(value);
  }
  return value || "";
}

function FieldLabelRow({ label, copyValue, copyLabel }) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      {copyValue !== undefined && (
        <CopyButton value={copyValue} label={copyLabel || `Copy ${label.toLowerCase()}`} />
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5 10 17 19 7.5" />
    </svg>
  );
}

export function PlatformComposerForm({ post, contentItemId, fields }) {
  const original = useMemo(() => toDefaultValues(post, fields), [post, fields]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    getValues,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: original,
  });

  useEffect(() => {
    reset(original);
  }, [original, reset]);

  const [submitError, setSubmitError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [validation, setValidation] = useState(null);
  const [validationSource, setValidationSource] = useState(null);
  const [defaultsError, setDefaultsError] = useState(null);
  const [defaultsAppliedAt, setDefaultsAppliedAt] = useState(null);
  const [confirmingOverwrite, setConfirmingOverwrite] = useState(false);

  useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setSavedAt(null), 2500);
    return () => clearTimeout(timer);
  }, [savedAt]);

  useEffect(() => {
    if (!defaultsAppliedAt) return;
    const timer = setTimeout(() => setDefaultsAppliedAt(null), 3000);
    return () => clearTimeout(timer);
  }, [defaultsAppliedAt]);

  const updateMutation = useUpdatePlatformPost(
    { id: post.id, contentItemId },
    {
      onSuccess: () => {
        setSubmitError(null);
        setValidation(null);
        setValidationSource(null);
        setSavedAt(Date.now());
      },
      onError: (error) => {
        const status = error?.response?.status;
        const errors = error?.response?.data?.errors;
        if (status === 422 && errors && Array.isArray(errors.warnings)) {
          setValidation(errors);
          setValidationSource("patch");
          setSubmitError(null);
        } else {
          setValidation(null);
          setSubmitError(
            extractErrorMessage(error, "We couldn't save this just now.")
          );
        }
      },
    }
  );

  const applyDefaultsMutation = useApplyPlatformDefaults(
    { id: post.id, contentItemId },
    {
      onSuccess: (updatedPost) => {
        setDefaultsError(null);
        setSubmitError(null);
        setConfirmingOverwrite(false);
        setDefaultsAppliedAt(Date.now());
        if (updatedPost) {
          reset(toDefaultValues(updatedPost, fields));
        }
      },
      onError: (error) => {
        setDefaultsError(
          extractErrorMessage(error, "We couldn't apply defaults just now.")
        );
      },
    }
  );

  const validateMutation = useValidatePlatformPost(post.id, {
    onSuccess: (result) => {
      setValidation(result);
      setValidationSource("validate");
      setSubmitError(null);
    },
    onError: (error) => {
      setSubmitError(
        extractErrorMessage(error, "Validation request failed.")
      );
    },
  });

  const submitting = updateMutation.isPending;
  const validating = validateMutation.isPending;
  const applyingDefaults = applyDefaultsMutation.isPending;

  const handleApplyDefaults = ({ overwrite }) => {
    setDefaultsError(null);
    setSubmitError(null);
    applyDefaultsMutation.mutate({ overwrite });
  };

  const handleStartOverwrite = () => {
    setDefaultsError(null);
    setConfirmingOverwrite(true);
  };

  const handleCancelOverwrite = () => {
    setConfirmingOverwrite(false);
  };

  const handleSave = async (values) => {
    setSubmitError(null);
    const patch = diffPayload(values, original);
    if (Object.keys(patch).length === 0) return;
    await updateMutation.mutateAsync(patch);
  };

  const handleMarkReady = async () => {
    setSubmitError(null);
    const values = getValues();
    const patch = { ...diffPayload(values, original), status: "ready" };
    await updateMutation.mutateAsync(patch);
    if (!updateMutation.isError) {
      setValue("status", "ready", { shouldDirty: false });
    }
  };

  const handleValidate = () => {
    setSubmitError(null);
    validateMutation.mutate();
  };

  const handleRevert = () => {
    setSubmitError(null);
    setValidation(null);
    setValidationSource(null);
    reset(original);
  };

  return (
    <div className="flex flex-col gap-6">
    <form onSubmit={handleSubmit(handleSave)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(post.status)}>{formatStatus(post.status)}</Badge>
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {formatPlatform(post.platform)} version
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {savedAt && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
              <CheckIcon />
              Saved
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleValidate}
            loading={validating}
          >
            {validating ? "Validating" : "Validate"}
          </Button>
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={handleMarkReady}
            disabled={submitting || post.status === "ready"}
          >
            Mark as ready
          </Button>
        </div>
      </div>

      {submitError && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-ink">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            Couldn't save
          </p>
          <p className="mt-1">{submitError}</p>
        </div>
      )}

      <DefaultsPanel
        isDirty={isDirty}
        confirmingOverwrite={confirmingOverwrite}
        applying={applyingDefaults}
        appliedAt={defaultsAppliedAt}
        error={defaultsError}
        onFillEmpty={() => handleApplyDefaults({ overwrite: false })}
        onStartOverwrite={handleStartOverwrite}
        onConfirmOverwrite={() => handleApplyDefaults({ overwrite: true })}
        onCancelOverwrite={handleCancelOverwrite}
      />

      <ValidationPanel result={validation} source={validationSource} />

      <div className="flex flex-col gap-4">
        {fields.map((field) => {
          const value = watch(field.name);
          const error = errors[field.name]?.message;

          if (field.kind === "input") {
            return (
              <div key={field.name}>
                <FieldLabelRow
                  label={field.label}
                  copyValue={fieldCopyValue(field, value)}
                />
                <Input
                  placeholder={field.placeholder}
                  hint={field.hint}
                  error={error}
                  {...register(field.name, field.rules)}
                />
              </div>
            );
          }

          if (field.kind === "textarea") {
            return (
              <div key={field.name}>
                <FieldLabelRow
                  label={field.label}
                  copyValue={fieldCopyValue(field, value)}
                />
                <Textarea
                  rows={field.rows || 6}
                  placeholder={field.placeholder}
                  counter={field.maxLength}
                  value={value}
                  hint={field.hint}
                  error={error}
                  {...register(field.name, field.rules)}
                />
              </div>
            );
          }

          if (field.kind === "tags") {
            return (
              <Controller
                key={field.name}
                control={control}
                name={field.name}
                render={({ field: ctrl }) => (
                  <div>
                    <FieldLabelRow
                      label={field.label}
                      copyValue={fieldCopyValue(field, ctrl.value)}
                      copyLabel={field.copyLabel}
                    />
                    <TagInput
                      value={ctrl.value || []}
                      onChange={ctrl.onChange}
                      placeholder={field.placeholder}
                      prefix={field.prefix}
                      hint={field.hint}
                      error={error}
                    />
                  </div>
                )}
              />
            );
          }

          return null;
        })}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
          <Input
            label="Platform post URL"
            type="url"
            placeholder="https://..."
            hint="Set after the post is live."
            error={errors.platformPostUrl?.message}
            {...register("platformPostUrl")}
          />
          <Controller
            control={control}
            name="status"
            render={({ field: ctrl }) => (
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                {...ctrl}
              />
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4",
          !isDirty && "opacity-60"
        )}
      >
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {isDirty ? "You have unsaved changes" : "No unsaved changes"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleRevert}
            disabled={!isDirty || submitting}
          >
            Revert
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
            disabled={!isDirty}
          >
            {submitting ? "Saving" : "Save"}
          </Button>
        </div>
      </div>
    </form>

    <SchedulePanel post={post} contentItemId={contentItemId} />
    </div>
  );
}

function DefaultsPanel({
  isDirty,
  confirmingOverwrite,
  applying,
  appliedAt,
  error,
  onFillEmpty,
  onStartOverwrite,
  onConfirmOverwrite,
  onCancelOverwrite,
}) {
  const disabledReason = isDirty
    ? "Save or revert unsaved changes before applying defaults."
    : null;

  return (
    <div className="rounded-xl border border-border bg-canvas/40 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            Platform defaults
          </p>
          <p className="mt-0.5 text-sm text-ink">
            Apply your saved platform settings defaults to this post.
          </p>
          {disabledReason && (
            <p className="mt-1 text-xs text-muted">{disabledReason}</p>
          )}
        </div>

        {!confirmingOverwrite ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onFillEmpty}
              loading={applying}
              disabled={applying || isDirty}
              title={disabledReason || undefined}
            >
              {applying ? "Applying" : "Fill empty fields"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onStartOverwrite}
              disabled={applying || isDirty}
              title={disabledReason || undefined}
            >
              Overwrite with defaults
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelOverwrite}
              disabled={applying}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onConfirmOverwrite}
              loading={applying}
              disabled={applying}
            >
              {applying ? "Overwriting" : "Overwrite"}
            </Button>
          </div>
        )}
      </div>

      {confirmingOverwrite && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This will replace current title, caption, description, tags, and
          hashtags with your saved platform defaults. Status, schedule, and
          publish history are not changed.
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            Couldn't apply defaults
          </p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {appliedAt && !error && (
        <p className="mt-3 inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
          Platform defaults applied.
        </p>
      )}
    </div>
  );
}

function SchedulePanel({ post, contentItemId }) {
  const scheduleQuery = useScheduleForPlatformPost(post);
  const cachedSchedule = scheduleQuery.data || null;

  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setSavedAt(null), 2500);
    return () => clearTimeout(timer);
  }, [savedAt]);

  const handleMutationError = (error) => {
    const status = error?.response?.status;
    const errors = error?.response?.data?.errors;
    if (status === 422 && errors && Array.isArray(errors.warnings)) {
      setValidation(errors);
      setFeedback(null);
    } else {
      setValidation(null);
      setFeedback({
        tone: "error",
        message: extractErrorMessage(
          error,
          "We couldn't save this schedule just now."
        ),
      });
    }
  };

  const scheduleMutation = useSchedulePlatformPost(
    { platformPostId: post.id, contentItemId },
    {
      onSuccess: () => {
        setEditing(false);
        setValidation(null);
        setFeedback(null);
        setSavedAt(Date.now());
      },
      onError: handleMutationError,
    }
  );

  const cancelMutation = useCancelSchedule(
    {
      scheduleId: cachedSchedule?.id,
      platformPostId: post.id,
      contentItemId,
    },
    {
      onSuccess: () => {
        setEditing(false);
        setValidation(null);
        setFeedback({ tone: "success", message: "Schedule cancelled." });
      },
      onError: (error) => {
        setFeedback({
          tone: "error",
          message: extractErrorMessage(
            error,
            "We couldn't cancel this schedule just now."
          ),
        });
      },
    }
  );

  const hasActiveSchedule =
    Boolean(cachedSchedule) &&
    ["scheduled", "manual_pending", "processing"].includes(
      cachedSchedule.status
    );

  const handleSubmit = (values) => {
    setFeedback(null);
    setValidation(null);
    scheduleMutation.mutate(values);
  };

  const handleCancelSchedule = () => {
    if (!cachedSchedule?.id) return;
    setFeedback(null);
    setValidation(null);
    cancelMutation.mutate();
  };

  return (
    <section className="rounded-2xl border border-border bg-canvas/40 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            Schedule
          </p>
          <h3 className="font-display text-lg leading-tight text-ink">
            {hasActiveSchedule ? "Currently scheduled" : "Schedule this post"}
          </h3>
        </div>
        {savedAt && (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
            Saved
          </span>
        )}
      </div>

      {scheduleQuery.isLoading && hasActiveSchedule === false && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Spinner size="sm" />
          Loading schedule…
        </div>
      )}

      {scheduleQuery.isError && (
        <div className="mb-3 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            Couldn't load schedule
          </p>
          <p className="mt-1">
            {extractErrorMessage(scheduleQuery.error, "Unexpected error.")}
          </p>
        </div>
      )}

      {feedback && (
        <div
          className={cn(
            "mb-3 rounded-xl border px-3 py-2 text-sm",
            feedback.tone === "error"
              ? "border-danger/30 bg-danger/5 text-ink"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          )}
        >
          {feedback.tone === "error" && (
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
              Schedule failed
            </p>
          )}
          <p className={feedback.tone === "error" ? "mt-1" : undefined}>
            {feedback.message}
          </p>
        </div>
      )}

      <ValidationPanel result={validation} source="patch" />

      {hasActiveSchedule && !editing && (
        <div className="mt-3 flex flex-col gap-3">
          <ScheduleSummary schedule={cachedSchedule} />
          <p className="text-xs text-muted">
            Manual reminder will fire at the scheduled time. You can reschedule
            or cancel anytime.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancelSchedule}
              loading={cancelMutation.isPending}
              disabled={scheduleMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling" : "Cancel schedule"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(true);
                setFeedback(null);
                setValidation(null);
              }}
              disabled={cancelMutation.isPending}
            >
              Reschedule
            </Button>
          </div>
        </div>
      )}

      {(!hasActiveSchedule || editing) && (
        <div className="mt-2">
          <ScheduleForm
            mode={editing ? "edit" : "create"}
            schedule={editing ? cachedSchedule : null}
            isSubmitting={scheduleMutation.isPending}
            isCancelling={cancelMutation.isPending}
            onSubmit={handleSubmit}
            onCancel={
              editing
                ? () => {
                    setEditing(false);
                    setFeedback(null);
                    setValidation(null);
                  }
                : null
            }
            onDelete={editing ? handleCancelSchedule : null}
            submitLabel={editing ? "Save reschedule" : "Schedule this post"}
            cancelLabel="Discard"
          />
        </div>
      )}
    </section>
  );
}
