import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { extractErrorMessage } from "../../../lib/axios";
import { cn } from "../../../lib/cn";
import { formatDateTime } from "../../../lib/format";
import { useDeleteMediaAsset } from "../hooks/useDeleteMediaAsset";
import {
  formatFileSize,
  isImageAsset,
  isVideoAsset,
  mediaStatusTone,
} from "../lib/mediaFormat";
import { buildMediaUrl } from "../lib/mediaUrl";

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4h6v6" />
      <path d="M10 14 20 4" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4h9l4 4v12H6z" />
      <path d="M14 4v5h5" />
    </svg>
  );
}

function EyeIcon() {
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MediaFallback({ message }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border bg-canvas">
      <div className="flex flex-col items-center gap-1.5 px-4 text-center">
        <FileIcon />
        <span className="text-xs text-muted">{message}</span>
      </div>
    </div>
  );
}

function AssetPreview({ asset, url, onPreview }) {
  const { t } = useTranslation("pages");
  const [mediaError, setMediaError] = useState(false);
  const status = asset.status || "active";
  const isPreviewable =
    status === "active" && Boolean(url) && !mediaError && typeof onPreview === "function";

  const previewContent = (() => {
    if (status === "deleted" || status === "missing") {
      return (
        <MediaFallback
          message={
            status === "deleted"
              ? t("mediaLibrary.preview.deleted")
              : t("mediaLibrary.preview.missing")
          }
        />
      );
    }

    if (!url && status === "active") {
      return (
        <MediaFallback message={t("mediaLibrary.preview.brokenMedia")} />
      );
    }

    if (mediaError && status === "active") {
      return (
        <MediaFallback message={t("mediaLibrary.preview.brokenMedia")} />
      );
    }

    if (isVideoAsset(asset)) {
      return (
        <video
          controls
          src={url}
          className="aspect-video w-full rounded-xl bg-ink/90 object-contain"
          preload="metadata"
          onError={() => setMediaError(true)}
        />
      );
    }

    if (isImageAsset(asset)) {
      return (
        <img
          src={url}
          alt={asset.fileName || ""}
          className="aspect-video w-full rounded-xl bg-canvas object-cover"
          loading="lazy"
          onError={() => setMediaError(true)}
        />
      );
    }

    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border bg-canvas text-muted">
        <FileIcon />
      </div>
    );
  })();

  if (isPreviewable) {
    return (
      <button
        type="button"
        onClick={onPreview}
        className="group relative w-full cursor-pointer overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {previewContent}
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-ink/0 transition group-hover:bg-ink/20">
          <span className="flex items-center gap-2 rounded-lg bg-ink/70 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
            <EyeIcon />
            {t("mediaLibrary.actions.preview")}
          </span>
        </div>
      </button>
    );
  }

  return <div className="w-full">{previewContent}</div>;
}

export function MediaAssetCard({ asset, contentItemId, onPreview }) {
  const { t } = useTranslation("pages");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  const resolvedContentItemId =
    contentItemId || asset.contentItem?.id || asset.contentItemId;

  const deleteMutation = useDeleteMediaAsset(
    { id: asset.id, contentItemId: resolvedContentItemId },
    {
      onSuccess: () => {
        setError(null);
        setConfirming(false);
      },
      onError: (err) => {
        setError(
          extractErrorMessage(
            err,
            t("mediaLibrary.error.deleteFallback")
          )
        );
      },
    }
  );

  const url = buildMediaUrl(asset.fileUrl);
  const status = asset.status || "active";
  const canOpenOriginal = status === "active" && Boolean(url);
  const canDelete = status !== "deleted";
  const hasPreview = typeof onPreview === "function";
  const contentItem = asset.contentItem;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-ink/10 hover:shadow-[0_2px_8px_rgba(20,20,20,0.04)]">
      <AssetPreview asset={asset} url={url} onPreview={hasPreview ? () => onPreview(asset) : undefined} />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="accent">{t(`mediaLibrary.types.${asset.type}`, asset.type)}</Badge>
          <Badge tone={mediaStatusTone(status)}>
            {t(`mediaLibrary.statuses.${status}`, status)}
          </Badge>
          {asset.mimeType && (
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted truncate max-w-[120px]">
              {asset.mimeType}
            </span>
          )}
        </div>

        <p
          className="truncate text-sm font-medium text-ink"
          title={asset.fileName}
        >
          {asset.fileName || t("mediaLibrary.preview.notAvailable")}
        </p>

        <p className="text-[11px] text-muted">
          {formatFileSize(asset.fileSizeBytes)} ·{" "}
          {formatDateTime(asset.createdAt)}
        </p>

        {contentItem?.id && (
          <Link
            to={`/content/${contentItem.id}`}
            className="text-[11px] text-muted underline-offset-2 hover:underline truncate"
            title={contentItem.title}
          >
            {contentItem.title || t("mediaLibrary.preview.noContent")}
          </Link>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
        {hasPreview && canOpenOriginal ? (
          <button
            type="button"
            onClick={() => onPreview(asset)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-ink px-3 text-[12px] font-medium text-canvas transition hover:bg-ink/90"
          >
            <EyeIcon />
            {t("mediaLibrary.actions.preview")}
          </button>
        ) : null}

        {!hasPreview && canOpenOriginal ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-surface px-3 text-[12px] font-medium text-ink transition hover:border-ink/20"
          >
            Open <ExternalIcon />
          </a>
        ) : null}

        {hasPreview && canOpenOriginal && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-surface px-3 text-[12px] font-medium text-ink transition hover:bg-canvas"
            title={t("mediaLibrary.actions.openOriginal")}
          >
            <ExternalIcon />
          </a>
        )}

        {confirming ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1"
            )}
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-900">
              Delete?
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={deleteMutation.isPending}
            >
              {t("mediaLibrary.actions.keep")}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending
                ? t("mediaLibrary.actions.deleting")
                : t("mediaLibrary.actions.confirmDelete")}
            </Button>
          </div>
        ) : canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setError(null);
              setConfirming(true);
            }}
          >
            {t("mediaLibrary.actions.delete")}
          </Button>
        ) : null}

        {status === "deleted" && (
          <span className="text-xs text-muted">
            {t("mediaLibrary.deletedRecord")}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            {t("mediaLibrary.error.deleteTitle")}
          </p>
          <p className="mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
