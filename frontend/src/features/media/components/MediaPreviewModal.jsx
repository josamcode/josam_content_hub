import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/cn";
import { formatDateTime } from "../../../lib/format";
import {
  formatFileSize,
  isImageAsset,
  isVideoAsset,
  mediaStatusTone,
} from "../lib/mediaFormat";
import { buildMediaUrl } from "../lib/mediaUrl";

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
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

function FileLargeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4h9l4 4v12H6z" />
      <path d="M14 4v5h5" />
    </svg>
  );
}

function BrokenMediaBlock({ message, helper }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border bg-canvas">
      <div className="flex flex-col items-center gap-2 text-center px-4">
        <FileLargeIcon />
        <span className="text-sm font-medium text-muted">{message}</span>
        {helper && (
          <span className="text-xs text-muted max-w-sm">{helper}</span>
        )}
      </div>
    </div>
  );
}

function MediaPreviewContent({ asset }) {
  const { t } = useTranslation("pages");
  const [mediaError, setMediaError] = useState(false);
  const status = asset.status || "active";
  const url = status === "active" ? buildMediaUrl(asset.fileUrl) : "";

  if (!url && status === "active") {
    return (
      <BrokenMediaBlock
        message={t("mediaLibrary.preview.brokenMedia")}
        helper={t("mediaLibrary.preview.brokenMediaHelper")}
      />
    );
  }

  if (status === "deleted" || status === "missing") {
    return (
      <BrokenMediaBlock
        message={
          status === "deleted"
            ? t("mediaLibrary.preview.deleted")
            : t("mediaLibrary.preview.missing")
        }
      />
    );
  }

  if (mediaError && status === "active") {
    return (
      <BrokenMediaBlock
        message={t("mediaLibrary.preview.brokenMedia")}
        helper={t("mediaLibrary.preview.brokenMediaHelper")}
      />
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
        className="w-full rounded-xl bg-canvas object-contain"
        style={{ maxHeight: "65vh" }}
        onError={() => setMediaError(true)}
      />
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border bg-canvas text-muted">
      <FileLargeIcon />
    </div>
  );
}

function MetaRow({ label, value, className }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2", className)}>
      <span className="text-xs text-muted shrink-0">{label}</span>
      <span className="text-sm text-ink text-end">{value || "—"}</span>
    </div>
  );
}

export function MediaPreviewModal({ asset, open, onClose }) {
  const { t } = useTranslation("pages");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!asset) return null;

  const status = asset.status || "active";
  const url = buildMediaUrl(asset.fileUrl);
  const canOpenOriginal = status === "active" && Boolean(url);
  const contentItem = asset.contentItem;
  const contentItemId = contentItem?.id || asset.contentItemId;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label={t("mediaLibrary.preview.close")}
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("mediaLibrary.preview.title")}
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl border-t border-border bg-surface shadow-[0_-20px_60px_rgba(20,20,20,0.18)]",
          "md:inset-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:mx-auto md:max-w-3xl md:max-h-[90vh] md:rounded-2xl md:border md:shadow-2xl",
          "transition-transform duration-250 ease-out",
          open ? "translate-y-0" : "translate-y-full md:translate-y-0 md:scale-95 md:opacity-0"
        )}
      >
        <div className="flex justify-center pt-2 md:hidden">
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="flex items-center justify-between px-5 pt-3 pb-2 md:pt-5 md:px-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              {t("mediaLibrary.preview.title")}
            </p>
            <h2 className="font-display text-lg leading-tight text-ink truncate max-w-sm md:max-w-md">
              {asset.fileName || t("mediaLibrary.preview.title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("mediaLibrary.preview.close")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-canvas text-muted transition hover:bg-canvas/70 hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5 md:px-6 md:pb-6">
          <div className="mb-5">
            <MediaPreviewContent asset={asset} />
          </div>

          <div className="rounded-xl border border-border bg-canvas/40 px-4 py-3">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              {t("mediaLibrary.preview.metadata")}
            </p>
            <div className="divide-y divide-border/50">
              <MetaRow
                label={t("mediaLibrary.preview.fileName")}
                value={asset.fileName}
              />
              <MetaRow
                label={t("mediaLibrary.preview.type")}
                value={
                  <Badge tone="accent">{t(`mediaLibrary.types.${asset.type}`, asset.type)}</Badge>
                }
              />
              <MetaRow
                label={t("mediaLibrary.preview.status")}
                value={
                  <Badge tone={mediaStatusTone(status)}>
                    {t(`mediaLibrary.statuses.${status}`, status)}
                  </Badge>
                }
              />
              <MetaRow
                label={t("mediaLibrary.preview.size")}
                value={formatFileSize(asset.fileSizeBytes)}
              />
              {asset.mimeType && (
                <MetaRow
                  label={t("mediaLibrary.preview.mimeType")}
                  value={asset.mimeType}
                />
              )}
              <MetaRow
                label={t("mediaLibrary.preview.uploaded")}
                value={formatDateTime(asset.createdAt)}
              />
              <div className="flex items-baseline justify-between gap-4 py-2">
                <span className="text-xs text-muted shrink-0">
                  {t("mediaLibrary.preview.content")}
                </span>
                <span className="text-sm text-ink text-end">
                  {contentItemId ? (
                    <Link
                      to={`/content/${contentItemId}`}
                      className="font-medium text-ink underline-offset-2 hover:underline"
                      onClick={onClose}
                    >
                      {contentItem?.title || t("mediaLibrary.preview.noContent")}
                    </Link>
                  ) : (
                    <span className="text-muted">
                      {t("mediaLibrary.preview.noContent")}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 md:px-6">
          {canOpenOriginal && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink transition hover:bg-canvas"
            >
              {t("mediaLibrary.actions.openOriginal")}
              <ExternalIcon />
            </a>
          )}
          <Button variant="outline" onClick={onClose}>
            {t("mediaLibrary.preview.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
