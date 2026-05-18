import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";
import { Textarea } from "../../../../components/ui/Textarea";
import { extractErrorMessage } from "../../../../lib/axios";
import { cn } from "../../../../lib/cn";
import { formatPlatform } from "../../../../lib/format";
import { updatePlatformPost } from "../../api/platformPostApi";
import { useGenerateAiMetadata } from "../../hooks/useGenerateAiMetadata";
import { useQueryClient } from "@tanstack/react-query";

const PLATFORM_DOT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

function Spinner() {
  return (
    <svg
      className="animate-spin"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
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

function AlertIcon() {
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
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function fieldIsEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function normalizeHashtags(hashtags) {
  if (!Array.isArray(hashtags)) return hashtags;
  const seen = new Set();
  return hashtags
    .map((h) => (typeof h === "string" ? h.trim().replace(/^#+/, "") : ""))
    .filter((h) => h.length > 0)
    .filter((h) => {
      if (seen.has(h)) return false;
      seen.add(h);
      return true;
    });
}

const PLATFORM_PATCH_FIELDS = {
  youtube: ["title", "description", "tags", "hashtags"],
};

function buildEmptyPatch(generated, post, platform) {
  const patch = {};
  const fields = PLATFORM_PATCH_FIELDS[platform] || ["caption", "hashtags"];

  for (const field of fields) {
    if (generated[field] !== undefined && fieldIsEmpty(post[field])) {
      patch[field] =
        field === "hashtags" && Array.isArray(generated[field])
          ? normalizeHashtags(generated[field])
          : generated[field];
    }
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

function buildOverwritePatch(generated, platform) {
  const patch = {};
  const fields = PLATFORM_PATCH_FIELDS[platform] || ["caption", "hashtags"];

  for (const field of fields) {
    if (generated[field] !== undefined) {
      patch[field] =
        field === "hashtags" && Array.isArray(generated[field])
          ? normalizeHashtags(generated[field])
          : generated[field];
    }
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export function AiMetadataPanel({
  contentItemId,
  category,
  platformPosts,
  isParentDirty,
}) {
  const { t, i18n } = useTranslation(["common", "pages"]);
  const queryClient = useQueryClient();

  const [idea, setIdea] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [preview, setPreview] = useState(null);
  const [generateError, setGenerateError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [applyState, setApplyState] = useState({});
  const [confirmingOverwrite, setConfirmingOverwrite] = useState({});

  const platforms = useMemo(() => {
    if (!Array.isArray(platformPosts) || platformPosts.length === 0) return [];
    return Array.from(new Set(platformPosts.map((p) => p.platform)));
  }, [platformPosts]);

  useEffect(() => {
    setSelectedPlatforms(platforms);
  }, [platforms]);

  useEffect(() => {
    if (!generatedAt) return;
    const timer = setTimeout(() => setGeneratedAt(null), 3000);
    return () => clearTimeout(timer);
  }, [generatedAt]);

  const generateMutation = useGenerateAiMetadata({
    onSuccess: (data) => {
      const normalized = {};
      for (const platform of Object.keys(data)) {
        normalized[platform] = {
          ...data[platform],
          hashtags: normalizeHashtags(data[platform].hashtags),
        };
      }
      setPreview(normalized);
      setGenerateError(null);
      setGeneratedAt(Date.now());
      setApplyState({});
      setConfirmingOverwrite({});
    },
    onError: (error) => {
      setGenerateError(
        extractErrorMessage(
          error,
          t("contentDetail.aiMetadata.failedToGenerate", { ns: "pages" })
        )
      );
    },
  });

  const handleGenerate = () => {
    setGenerateError(null);
    const targetPlatforms = selectedPlatforms;
    const language = i18n.resolvedLanguage === "ar" ? "ar" : "en";

    generateMutation.mutate({
      idea: idea.trim(),
      category: category || undefined,
      targetPlatforms,
      language,
    });
  };

  const handleApply = async (platform, overwrite) => {
    const generated = preview?.[platform];
    if (!generated) return;

    const post = platformPosts.find((p) => p.platform === platform);
    if (!post) return;

    const patch = overwrite
      ? buildOverwritePatch(generated, platform)
      : buildEmptyPatch(generated, post, platform);

    if (!patch) {
      setApplyState((prev) => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          applied: true,
          error: null,
          applying: false,
        },
      }));
      return;
    }

    setApplyState((prev) => ({
      ...prev,
      [platform]: { applying: true, applied: false, error: null },
    }));

    try {
      await updatePlatformPost(post.id, patch);
      await queryClient.invalidateQueries({
        queryKey: ["platform-posts", contentItemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["content-item", contentItemId],
      });
      setApplyState((prev) => ({
        ...prev,
        [platform]: { applying: false, applied: true, error: null },
      }));
    } catch (error) {
      setApplyState((prev) => ({
        ...prev,
        [platform]: {
          applying: false,
          applied: false,
          error: extractErrorMessage(
            error,
            "Failed to apply metadata."
          ),
        },
      }));
    }

    if (overwrite) {
      setConfirmingOverwrite((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const handleStartOverwrite = (platform) => {
    setConfirmingOverwrite((prev) => ({ ...prev, [platform]: true }));
  };

  const handleCancelOverwrite = (platform) => {
    setConfirmingOverwrite((prev) => ({ ...prev, [platform]: false }));
  };

  const noPlatformsSelected = selectedPlatforms.length === 0;
  const emptyIdea = idea.trim().length === 0;
  const canGenerate = !noPlatformsSelected && !emptyIdea && !generateMutation.isPending;

  const disabledByDirty =
    isParentDirty
      ? t("contentDetail.aiMetadata.composerDirtyWarning", { ns: "pages" })
      : null;

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-5">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            {t("contentDetail.aiMetadata.title", { ns: "pages" })}
          </span>
          <p className="mt-1 text-sm text-muted">
            {t("contentDetail.aiMetadata.description", { ns: "pages" })}
          </p>
        </div>

        <Textarea
          label={t("contentDetail.aiMetadata.ideaLabel", { ns: "pages" })}
          placeholder={t("contentDetail.aiMetadata.ideaPlaceholder", {
            ns: "pages",
          })}
          rows={4}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />

        {platforms.length === 0 ? (
          <p className="text-sm text-muted">
            No platform posts exist for this content item. Add platforms first.
          </p>
        ) : (
          <fieldset>
            <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              {t("contentDetail.aiMetadata.targetPlatforms", { ns: "pages" })}
            </legend>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform);
                return (
                  <label
                    key={platform}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                      "focus-within:ring-2 focus-within:ring-accent/30",
                      isSelected
                        ? "border-ink/40 bg-ink text-canvas"
                        : "border-border bg-surface text-ink hover:border-ink/20"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        PLATFORM_DOT[platform] || "bg-muted",
                        isSelected && "shadow-[0_0_0_2px_var(--color-canvas)]"
                      )}
                    />
                    <span className="select-none">
                      {formatPlatform(platform)}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedPlatforms((prev) =>
                          prev.includes(platform)
                            ? prev.filter((p) => p !== platform)
                            : [...prev, platform]
                        );
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {generateError && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
              {t("contentDetail.aiMetadata.failedToGenerate", { ns: "pages" })}
            </p>
            <p className="mt-1 text-sm text-ink">{generateError}</p>
          </div>
        )}

        {generatedAt && !generateError && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckIcon />
            </span>
            {t("contentDetail.aiMetadata.generatedSuccessfully", {
              ns: "pages",
            })}
          </div>
        )}

        {disabledByDirty && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertIcon />
            <span>{disabledByDirty}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleGenerate}
            loading={generateMutation.isPending}
            disabled={!canGenerate || generateMutation.isPending}
          >
            {generateMutation.isPending
              ? t("contentDetail.aiMetadata.generating", { ns: "pages" })
              : t("contentDetail.aiMetadata.generate", { ns: "pages" })}
          </Button>

          {noPlatformsSelected && (
            <p className="text-xs text-muted">
              {t("contentDetail.aiMetadata.noPlatformsSelected", {
                ns: "pages",
              })}
            </p>
          )}
          {emptyIdea && !noPlatformsSelected && (
            <p className="text-xs text-muted">
              {t("contentDetail.aiMetadata.emptyIdea", { ns: "pages" })}
            </p>
          )}
        </div>

        {preview && (
          <div className="border-t border-border pt-5">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {t("contentDetail.aiMetadata.preview", { ns: "pages" })}
            </p>

            <div className="flex flex-col gap-4">
              {selectedPlatforms.map((platform) => {
                const generated = preview[platform];
                if (!generated) return null;

                const state = applyState[platform] || {};
                const isConfirming = confirmingOverwrite[platform] || false;

                return (
                  <PlatformPreviewBlock
                    key={platform}
                    platform={platform}
                    generated={generated}
                    state={state}
                    isConfirming={isConfirming}
                    disabledByDirty={disabledByDirty}
                    onApplyEmpty={() => handleApply(platform, false)}
                    onStartOverwrite={() => handleStartOverwrite(platform)}
                    onConfirmOverwrite={() => handleApply(platform, true)}
                    onCancelOverwrite={() => handleCancelOverwrite(platform)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function PlatformPreviewBlock({
  platform,
  generated,
  state,
  isConfirming,
  disabledByDirty,
  onApplyEmpty,
  onStartOverwrite,
  onConfirmOverwrite,
  onCancelOverwrite,
}) {
  const { t } = useTranslation(["common", "pages"]);

  const fields = [];
  if (generated.title !== undefined) {
    fields.push({ label: "Title", value: generated.title });
  }
  if (generated.description !== undefined) {
    fields.push({ label: "Description", value: generated.description });
  }
  if (generated.caption !== undefined) {
    fields.push({ label: "Caption", value: generated.caption });
  }
  if (generated.tags !== undefined) {
    fields.push({
      label: "Tags",
      value: Array.isArray(generated.tags) ? generated.tags.join(", ") : "",
    });
  }
  if (generated.hashtags !== undefined) {
    fields.push({
      label: "Hashtags",
      value: Array.isArray(generated.hashtags)
        ? generated.hashtags.map((h) => `#${h}`).join(" ")
        : "",
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              PLATFORM_DOT[platform] || "bg-muted"
            )}
          />
          <span className="text-sm font-medium text-ink">
            {formatPlatform(platform)}
          </span>
        </div>

        {state.applied ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
            <CheckIcon />
            {t("contentDetail.aiMetadata.appliedOverwrite", { ns: "pages" })}
          </span>
        ) : state.applying ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <Spinner />
            {t("applying", { ns: "common" })}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            {!isConfirming ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onApplyEmpty}
                  disabled={
                    state.applying || state.applied || Boolean(disabledByDirty)
                  }
                  title={disabledByDirty || undefined}
                >
                  {t("contentDetail.aiMetadata.applyEmptyFields", {
                    ns: "pages",
                  })}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onStartOverwrite}
                  disabled={
                    state.applying || state.applied || Boolean(disabledByDirty)
                  }
                  title={disabledByDirty || undefined}
                >
                  {t("contentDetail.aiMetadata.overwriteFields", {
                    ns: "pages",
                  })}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancelOverwrite}
                  disabled={state.applying}
                >
                  {t("cancel", { ns: "common" })}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onConfirmOverwrite}
                  loading={state.applying}
                  disabled={state.applying}
                >
                  {state.applying
                    ? t("overwriting", { ns: "common" })
                    : t("overwrite", { ns: "common" })}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isConfirming && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {t("contentDetail.aiMetadata.overwriteConfirmation", {
            ns: "pages",
          })}
        </div>
      )}

      {state.error && (
        <div className="border-b border-danger/30 bg-danger/5 px-4 py-2 text-sm text-ink">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            Couldn't apply
          </p>
          <p className="mt-0.5">{state.error}</p>
        </div>
      )}

      <div className="px-4 py-4">
        <div className="flex flex-col gap-3">
          {fields.map((field) => (
            <div key={field.label}>
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                {field.label}
              </span>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
