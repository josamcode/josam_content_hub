import { useEffect, useId, useMemo, useState } from "react";
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
import { useCategoryDefaults } from "../../../categoryDefaults/hooks/useCategoryDefaults";
import { ScheduleForm } from "../ScheduleForm";
import { ScheduleSummary } from "../ScheduleSummary";
import { CategoryGuidancePanel } from "./CategoryGuidancePanel";
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

const ACTIVE_SCHEDULE_STATUSES = new Set([
  "scheduled",
  "manual_pending",
  "processing",
]);

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

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        "shrink-0 text-muted transition-transform duration-150",
        open ? "rotate-180" : "rotate-0"
      )}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function AccordionSection({
  title,
  subtitle,
  meta,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const reactId = useId();
  const contentId = `${reactId}-content`;

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={cn(
          "flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition",
          "hover:bg-canvas/40",
          isOpen ? "border-b border-border bg-canvas/40" : "border-b border-transparent"
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            {title}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-sm text-ink">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {meta}
          <ChevronIcon open={isOpen} />
        </div>
      </button>
      {isOpen && (
        <div id={contentId} className="px-4 py-4">
          {children}
        </div>
      )}
    </section>
  );
}

export function PlatformComposerForm({ post, contentItemId, fields, category }) {
  const original = useMemo(() => toDefaultValues(post, fields), [post, fields]);

  const hashtagsField = useMemo(
    () =>
      fields.find(
        (field) => field.name === "hashtags" && field.kind === "tags"
      ) || null,
    [fields]
  );
  const supportsHashtags = Boolean(hashtagsField);

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
  const [confirmingReplaceHashtags, setConfirmingReplaceHashtags] =
    useState(false);

  const categoryDefaultsQuery = useCategoryDefaults();
  const categoryEntry = useMemo(() => {
    if (!Array.isArray(categoryDefaultsQuery.data) || !category) return null;
    return (
      categoryDefaultsQuery.data.find((item) => item.category === category) ||
      null
    );
  }, [categoryDefaultsQuery.data, category]);

  const watchedHashtags = supportsHashtags
    ? watch(hashtagsField.name)
    : undefined;
  const currentHashtagsCount = Array.isArray(watchedHashtags)
    ? watchedHashtags.length
    : 0;

  function applyCategoryHashtags() {
    if (!supportsHashtags || !categoryEntry) return;
    const next = Array.isArray(categoryEntry.defaultHashtags)
      ? [...categoryEntry.defaultHashtags]
      : [];
    setValue(hashtagsField.name, next, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }

  const handleFillCategoryHashtags = () => {
    if (currentHashtagsCount > 0) return;
    applyCategoryHashtags();
  };

  const handleStartReplaceHashtags = () => {
    setConfirmingReplaceHashtags(true);
  };

  const handleCancelReplaceHashtags = () => {
    setConfirmingReplaceHashtags(false);
  };

  const handleConfirmReplaceHashtags = () => {
    applyCategoryHashtags();
    setConfirmingReplaceHashtags(false);
  };

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

  const hasActiveSchedule = ACTIVE_SCHEDULE_STATUSES.has(post.status);
  const hasValidation = Boolean(validation);

  const [validationOpen, setValidationOpen] = useState(hasValidation);
  useEffect(() => {
    if (hasValidation) setValidationOpen(true);
  }, [hasValidation]);

  const [scheduleOpen, setScheduleOpen] = useState(hasActiveSchedule);
  useEffect(() => {
    if (hasActiveSchedule) setScheduleOpen(true);
  }, [hasActiveSchedule]);

  const defaultsAppliedRecently = Boolean(defaultsAppliedAt);

  return (
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

      <AccordionSection
        title="Smart defaults & category guidance"
        subtitle={
          category
            ? "Apply saved platform defaults or use category-level guidance."
            : "Apply saved platform defaults."
        }
        defaultOpen={false}
        meta={
          defaultsAppliedRecently ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-700">
              Applied
            </span>
          ) : null
        }
      >
        <div className="flex flex-col gap-4">
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

          {category && (
            <div className="border-t border-border pt-4">
              <CategoryGuidancePanel
                category={category}
                platform={post.platform}
                supportsHashtags={supportsHashtags}
                hashtagsCount={currentHashtagsCount}
                confirmingReplace={confirmingReplaceHashtags}
                applying={false}
                onFill={handleFillCategoryHashtags}
                onStartReplace={handleStartReplaceHashtags}
                onConfirmReplace={handleConfirmReplaceHashtags}
                onCancelReplace={handleCancelReplaceHashtags}
                embedded
              />
            </div>
          )}
        </div>
      </AccordionSection>

      <AccordionSection
        title="Compose"
        subtitle={`Caption, ${supportsHashtags ? "hashtags, " : ""}URL and status for the ${formatPlatform(post.platform)} version.`}
        defaultOpen={true}
      >
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
      </AccordionSection>

      <AccordionSection
        title="Validation"
        subtitle={
          hasValidation
            ? validation?.valid
              ? "Looks good."
              : "A few things need attention."
            : "Run platform validation before marking ready."
        }
        open={validationOpen}
        onOpenChange={setValidationOpen}
        meta={
          hasValidation ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]",
                validation?.valid
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : validationSource === "patch"
                    ? "border-danger/30 bg-danger/5 text-danger"
                    : "border-amber-200 bg-amber-50 text-amber-800"
              )}
            >
              {validation?.valid
                ? "Valid"
                : validationSource === "patch"
                  ? "Blocked"
                  : "Warnings"}
            </span>
          ) : null
        }
      >
        {hasValidation ? (
          <ValidationPanel result={validation} source={validationSource} />
        ) : (
          <p className="text-sm text-muted">
            No validation run yet. Click <span className="font-medium text-ink">Validate</span> above to check this version against platform rules.
          </p>
        )}
      </AccordionSection>

      <AccordionSection
        title="Schedule"
        subtitle={
          hasActiveSchedule
            ? "This post is currently scheduled."
            : "Pick a time to publish or remind you."
        }
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        meta={
          hasActiveSchedule ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-sky-700">
              {formatStatus(post.status)}
            </span>
          ) : null
        }
      >
        <SchedulePanel post={post} contentItemId={contentItemId} />
      </AccordionSection>

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
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            Platform defaults
          </p>
          <p className="mt-0.5 text-sm text-ink">
            Use saved defaults for{" "}
            <span className="font-medium">this platform</span> (title, caption,
            description, tags, hashtags).
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
    ACTIVE_SCHEDULE_STATUSES.has(cachedSchedule.status);

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
    <div className="flex flex-col gap-3">
      {savedAt && (
        <span className="inline-flex items-center gap-1 self-start rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
          Saved
        </span>
      )}

      {scheduleQuery.isLoading && hasActiveSchedule === false && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Spinner size="sm" />
          Loading schedule…
        </div>
      )}

      {scheduleQuery.isError && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
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
            "rounded-xl border px-3 py-2 text-sm",
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
        <div className="flex flex-col gap-3">
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
      )}
    </div>
  );
}
