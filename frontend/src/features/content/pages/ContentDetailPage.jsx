import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { cn } from "../../../lib/cn";
import {
  CONTENT_CATEGORIES,
  CONTENT_STATUSES,
  formatCategory,
  formatDate,
  formatDateTime,
  formatPlatform,
  formatStatus,
  statusTone,
} from "../../../lib/format";
import { ContentDetailSkeleton } from "../components/ContentDetailSkeleton";
import { MediaUploadSection } from "../../media/components/MediaUploadSection";
import { PlatformTabs } from "../components/PlatformTabs";
import { PublishHistorySummary } from "../components/PublishHistorySummary";
import { useContentItem } from "../hooks/useContentItem";
import { useUpdateContentItem } from "../hooks/useUpdateContentItem";

const PLATFORM_DOT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

const updateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  category: z.enum(CONTENT_CATEGORIES, {
    errorMap: () => ({ message: "Pick a category" }),
  }),
  status: z.enum(CONTENT_STATUSES, {
    errorMap: () => ({ message: "Pick a status" }),
  }),
  hook: z.string().max(500, "Keep the hook under 500 characters").optional(),
  script: z.string().max(20000, "Script is too long").optional(),
  notes: z.string().max(20000, "Notes are too long").optional(),
});

const CATEGORY_OPTIONS = CONTENT_CATEGORIES.map((value) => ({
  value,
  label: formatCategory(value),
}));

const STATUS_OPTIONS = CONTENT_STATUSES.map((value) => ({
  value,
  label: formatStatus(value),
}));

function toDefaultValues(item) {
  return {
    title: item?.title || "",
    category: item?.category || "",
    status: item?.status || "idea",
    hook: item?.hook || "",
    script: item?.script || "",
    notes: item?.notes || "",
  };
}

function diffPayload(values, original) {
  const patch = {};
  for (const key of Object.keys(values)) {
    const next = values[key];
    const prev = original[key];
    if (next !== prev) {
      patch[key] = next;
    }
  }
  return patch;
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m11 19-7-7 7-7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5 10 17 19 7.5" />
    </svg>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-4 flex flex-col gap-1">
      {eyebrow && (
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-xl leading-tight text-ink">{title}</h2>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
  );
}

function HeaderMeta({ item }) {
  const platforms = Array.isArray(item.platformPosts)
    ? Array.from(new Set(item.platformPosts.map((p) => p.platform)))
    : [];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <Badge tone={statusTone(item.status)}>{formatStatus(item.status)}</Badge>
      <span className="rounded-full border border-border bg-canvas px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted">
        {formatCategory(item.category)}
      </span>
      {platforms.map((platform) => (
        <span
          key={platform}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-ink"
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              PLATFORM_DOT[platform] || "bg-muted"
            )}
          />
          {formatPlatform(platform)}
        </span>
      ))}
      <span aria-hidden="true" className="text-muted/40">·</span>
      <span>Created {formatDate(item.createdAt)}</span>
      {item.updatedAt && item.updatedAt !== item.createdAt ? (
        <>
          <span aria-hidden="true" className="text-muted/40">·</span>
          <span>Updated {formatDateTime(item.updatedAt)}</span>
        </>
      ) : null}
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Detail"
        title="Content not found"
        subtitle="This item doesn't exist or you don't have access to it."
        actions={
          <Button as={Link} to="/content" variant="outline" size="sm">
            <ArrowLeftIcon />
            Back to library
          </Button>
        }
      />
      <Card padding="lg">
        <p className="text-sm text-muted">
          If you just deleted or archived this item, head back to the library
          to keep working.
        </p>
      </Card>
    </div>
  );
}

function ErrorBlock({ message, onRetry }) {
  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        Couldn't load content
      </p>
      <p className="mt-2 text-sm text-ink">{message}</p>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Card>
  );
}

export function ContentDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, error, isFetching, refetch } =
    useContentItem(id);

  const [submitError, setSubmitError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const original = useMemo(() => toDefaultValues(data), [data]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(updateSchema),
    defaultValues: original,
  });

  useEffect(() => {
    if (data) reset(toDefaultValues(data));
  }, [data, reset]);

  useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setSavedAt(null), 3000);
    return () => clearTimeout(timer);
  }, [savedAt]);

  const mutation = useUpdateContentItem(id, {
    onSuccess: () => {
      setSavedAt(Date.now());
    },
    onError: (err) => {
      setSubmitError(
        extractErrorMessage(err, "We couldn't save your changes just now.")
      );
    },
  });

  const onSubmit = async (values) => {
    setSubmitError(null);
    const patch = diffPayload(values, original);
    if (Object.keys(patch).length === 0) return;
    await mutation.mutateAsync(patch);
  };

  const onRevert = () => {
    setSubmitError(null);
    reset(original);
  };

  const hookValue = watch("hook") || "";

  if (isLoading) return <ContentDetailSkeleton />;

  if (isError && error?.response?.status === 404) {
    return <NotFoundState />;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Detail"
          title="Content"
          subtitle="We couldn't load this item."
          actions={
            <Button as={Link} to="/content" variant="outline" size="sm">
              <ArrowLeftIcon />
              Back to library
            </Button>
          }
        />
        <ErrorBlock
          message={extractErrorMessage(error, "Unexpected error.")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data) return <NotFoundState />;

  const submitting = mutation.isPending;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Library / Detail"
        title={data.title || "Untitled"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to="/content"
              variant="outline"
              size="sm"
              type="button"
            >
              <ArrowLeftIcon />
              Back
            </Button>
            {isFetching && (
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
                Refreshing
              </span>
            )}
          </div>
        }
      />
      <div className="-mt-4">
        <HeaderMeta item={data} />
      </div>

      {savedAt && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckIcon />
          </span>
          Changes saved.
        </div>
      )}

      {submitError && (
        <Card padding="md" className="border-danger/30 bg-danger/5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            Couldn't save
          </p>
          <p className="mt-1 text-sm text-ink">{submitError}</p>
        </Card>
      )}

      <Card padding="lg">
        <SectionHeading
          eyebrow="Main info"
          title="The basics"
          description="Title, category and status are the core signals for this item."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <Input
            label="Title"
            placeholder="Give it a working title"
            error={errors.title?.message}
            {...register("title")}
          />
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select
                label="Category"
                options={CATEGORY_OPTIONS}
                error={errors.category?.message}
                {...field}
              />
            )}
          />
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                error={errors.status?.message}
                {...field}
              />
            )}
          />
        </div>

        <div className="mt-4">
          <Textarea
            label="Hook"
            placeholder="The one-line idea that grabs attention."
            rows={3}
            counter={500}
            value={hookValue}
            error={errors.hook?.message}
            {...register("hook")}
          />
        </div>
      </Card>

      <Card padding="lg">
        <SectionHeading
          eyebrow="Body"
          title="Script & notes"
          description="Everything you're writing toward this piece."
        />
        <div className="flex flex-col gap-4">
          <Textarea
            label="Script"
            placeholder="The full script or outline."
            rows={10}
            error={errors.script?.message}
            {...register("script")}
          />
          <Textarea
            label="Notes"
            placeholder="Research links, references, talking points."
            rows={5}
            error={errors.notes?.message}
            {...register("notes")}
          />
        </div>
      </Card>

      <MediaUploadSection contentItemId={data.id} />

      <section>
        <div className="mb-4 flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            Platforms
          </span>
          <h2 className="font-display text-xl leading-tight text-ink">
            Platform composer
          </h2>
          <p className="text-sm text-muted">
            Tailor copy per platform. Save changes, validate against platform rules,
            and mark a version as ready when it's set.
          </p>
        </div>
        <PlatformTabs contentItemId={data.id} />
      </section>

      {Array.isArray(data.publishAttempts) && data.publishAttempts.length > 0 && (
        <Card padding="lg">
          <SectionHeading
            eyebrow="History"
            title="Publish history"
            description="Recent publish attempts on this piece."
          />
          <PublishHistorySummary attempts={data.publishAttempts} />
        </Card>
      )}

      <div
        className={cn(
          "sticky bottom-0 -mx-6 mt-4 border-t bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-10 md:px-10 transition-opacity",
          isDirty ? "border-border opacity-100" : "border-transparent opacity-0 pointer-events-none"
        )}
        aria-hidden={!isDirty}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            You have unsaved changes
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onRevert}
              disabled={submitting}
            >
              Revert
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={submitting}
              onClick={handleSubmit(onSubmit)}
            >
              {submitting ? "Saving" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
