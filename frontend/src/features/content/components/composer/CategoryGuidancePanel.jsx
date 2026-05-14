import { useMemo } from "react";

import { Button } from "../../../../components/ui/Button";
import { useCategoryDefaults } from "../../../categoryDefaults/hooks/useCategoryDefaults";
import {
  CATEGORY_LABELS,
  categoryLabel,
} from "../../../categoryDefaults/lib/categoryDefaults";

function HashtagPill({ value }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-ink/80">
      #{value}
    </span>
  );
}

function PlatformPill({ value }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] capitalize text-ink/80">
      {value}
    </span>
  );
}

function GuidanceRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

export function CategoryGuidancePanel({
  category,
  platform,
  supportsHashtags,
  hashtagsCount = 0,
  confirmingReplace,
  applying,
  onFill,
  onStartReplace,
  onConfirmReplace,
  onCancelReplace,
  embedded = false,
}) {
  const { data, isLoading, isError } = useCategoryDefaults();

  const entry = useMemo(() => {
    if (!Array.isArray(data) || !category) return null;
    return data.find((item) => item.category === category) || null;
  }, [data, category]);

  if (isLoading || isError) return null;
  if (!entry) return null;
  if (!entry.isActive) return null;

  const goal = entry.defaultGoal?.trim() || "";
  const hookStyle = entry.defaultHookStyle?.trim() || "";
  const captionStyle = entry.defaultCaptionStyle?.trim() || "";
  const hashtags = Array.isArray(entry.defaultHashtags)
    ? entry.defaultHashtags
    : [];
  const platforms = Array.isArray(entry.defaultPlatforms)
    ? entry.defaultPlatforms
    : [];

  const hasAnyContent =
    goal ||
    hookStyle ||
    captionStyle ||
    hashtags.length > 0 ||
    platforms.length > 0;

  if (!hasAnyContent) return null;

  const label =
    CATEGORY_LABELS[category] || categoryLabel(category) || "Category";

  const hashtagsEmpty = hashtagsCount === 0;
  const canFill = supportsHashtags && hashtags.length > 0 && hashtagsEmpty;
  const canReplace =
    supportsHashtags && hashtags.length > 0 && !hashtagsEmpty;

  const containerClass = embedded
    ? ""
    : "rounded-xl border border-accent/15 bg-accent-soft/40 px-4 py-3";
  const eyebrowClass = embedded
    ? "text-[11px] font-medium uppercase tracking-[0.18em] text-muted"
    : "text-[11px] font-medium uppercase tracking-[0.18em] text-accent";

  return (
    <div className={containerClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={eyebrowClass}>Category guidance</p>
          <p className="mt-0.5 text-sm text-ink">
            Suggestions from <span className="font-medium">{label}</span>{" "}
            defaults — nothing is changed automatically.
          </p>
        </div>

        {supportsHashtags && hashtags.length > 0 && !confirmingReplace && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onFill}
              loading={applying && hashtagsEmpty}
              disabled={!canFill || applying}
              title={
                hashtagsEmpty
                  ? undefined
                  : "Hashtags field is not empty. Use Replace to overwrite."
              }
            >
              Use category hashtags
            </Button>
            {canReplace && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onStartReplace}
                disabled={applying}
              >
                Replace hashtags
              </Button>
            )}
          </div>
        )}

        {confirmingReplace && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelReplace}
              disabled={applying}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onConfirmReplace}
              loading={applying}
              disabled={applying}
            >
              {applying ? "Replacing" : "Replace"}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {goal && <GuidanceRow label="Goal">{goal}</GuidanceRow>}
        {hookStyle && (
          <GuidanceRow label="Hook style">{hookStyle}</GuidanceRow>
        )}
        {captionStyle && (
          <GuidanceRow label="Caption style">{captionStyle}</GuidanceRow>
        )}
        {hashtags.length > 0 && (
          <GuidanceRow label="Default hashtags">
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <HashtagPill key={tag} value={tag} />
              ))}
            </div>
          </GuidanceRow>
        )}
        {platforms.length > 0 && (
          <GuidanceRow label="Default platforms">
            <div className="flex flex-wrap gap-1.5">
              {platforms.map((p) => (
                <PlatformPill key={p} value={p} />
              ))}
            </div>
          </GuidanceRow>
        )}
      </div>

      {confirmingReplace && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This replaces the current hashtags on the {platform || "platform"}{" "}
          version with the category defaults. Other fields (caption, title,
          description, tags) are not touched.
        </p>
      )}

      {supportsHashtags &&
        hashtags.length === 0 &&
        !confirmingReplace && (
          <p className="mt-3 text-xs text-muted">
            No default hashtags set for this category yet.
          </p>
        )}
    </div>
  );
}
