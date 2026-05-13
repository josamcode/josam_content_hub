import { useState } from "react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { extractErrorMessage } from "../../../lib/axios";
import { cn } from "../../../lib/cn";
import { formatDateTime } from "../../../lib/format";
import { useDeleteMediaAsset } from "../hooks/useDeleteMediaAsset";
import {
  formatFileSize,
  formatMediaType,
  isImageAsset,
  isVideoAsset,
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

function AssetPreview({ asset, url }) {
  if (isVideoAsset(asset)) {
    return (
      <video
        controls
        src={url}
        className="aspect-video w-full rounded-xl bg-ink/90 object-contain"
        preload="metadata"
      />
    );
  }
  if (isImageAsset(asset)) {
    return (
      <img
        src={url}
        alt={asset.fileName || formatMediaType(asset.type)}
        className="aspect-video w-full rounded-xl bg-canvas object-contain"
        loading="lazy"
      />
    );
  }
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border bg-canvas text-muted">
      <FileIcon />
    </div>
  );
}

export function MediaAssetCard({ asset, contentItemId }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  const deleteMutation = useDeleteMediaAsset(
    { id: asset.id, contentItemId },
    {
      onSuccess: () => {
        setError(null);
        setConfirming(false);
      },
      onError: (err) => {
        setError(
          extractErrorMessage(err, "We couldn't delete this asset just now.")
        );
      },
    }
  );

  const url = buildMediaUrl(asset.fileUrl);
  const typeLabel = formatMediaType(asset.type);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
      <AssetPreview asset={asset} url={url} />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="accent">{typeLabel}</Badge>
          {asset.mimeType && (
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
              {asset.mimeType}
            </span>
          )}
        </div>
        <p className="truncate text-sm font-medium text-ink" title={asset.fileName}>
          {asset.fileName || "Untitled file"}
        </p>
        <p className="text-[11px] text-muted">
          {formatFileSize(asset.fileSizeBytes)} · Uploaded{" "}
          {formatDateTime(asset.createdAt)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-surface px-3 text-[12px] font-medium text-ink transition hover:border-ink/20"
          >
            Open <ExternalIcon />
          </a>
        ) : null}
        {confirming ? (
          <div className={cn("flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1")}>
            <span className="text-[11px] uppercase tracking-[0.16em] text-amber-900">
              Delete?
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={deleteMutation.isPending}
            >
              Keep
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting" : "Confirm"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setError(null);
              setConfirming(true);
            }}
          >
            Delete
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            Couldn't delete
          </p>
          <p className="mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
