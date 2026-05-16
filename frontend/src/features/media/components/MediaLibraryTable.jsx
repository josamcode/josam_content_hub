import { useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { extractErrorMessage } from "../../../lib/axios";
import { formatDateTime } from "../../../lib/format";
import { cn } from "../../../lib/cn";
import { useDeleteMediaAsset } from "../hooks/useDeleteMediaAsset";
import {
  formatFileSize,
  formatMediaStatus,
  formatMediaType,
  mediaStatusTone,
} from "../lib/mediaFormat";
import { buildMediaUrl } from "../lib/mediaUrl";

function MediaDeleteAction({ asset }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const contentItemId = asset.contentItem?.id || asset.contentItemId;
  const mutation = useDeleteMediaAsset(
    { id: asset.id, contentItemId },
    {
      onSuccess: () => {
        setConfirming(false);
        setError(null);
      },
      onError: (err) => {
        setError(extractErrorMessage(err, "Delete failed."));
      },
    }
  );

  if (asset.status === "deleted") {
    return <span className="text-xs text-muted">Deleted</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1">
          <span className="text-[11px] uppercase tracking-[0.16em] text-amber-900">
            Delete?
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={mutation.isPending}
            onClick={() => setConfirming(false)}
          >
            Keep
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Confirm
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
      {error ? <span className="max-w-48 text-xs text-danger">{error}</span> : null}
    </div>
  );
}

export function MediaLibraryTable({ assets }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-canvas/60">
            <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-muted">
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Content</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assets.map((asset) => {
              const status = asset.status || "active";
              const url = status === "active" ? buildMediaUrl(asset.fileUrl) : "";
              return (
                <tr key={asset.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="flex min-w-64 flex-col gap-2">
                      <p className="max-w-xs truncate font-medium text-ink" title={asset.fileName}>
                        {asset.fileName || "Untitled file"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="accent">{formatMediaType(asset.type)}</Badge>
                        <Badge tone={mediaStatusTone(status)}>
                          {formatMediaStatus(status)}
                        </Badge>
                        {asset.mimeType ? (
                          <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
                            {asset.mimeType}
                          </span>
                        ) : null}
                      </div>
                      {(status === "missing" || status === "deleted") && (
                        <p className="text-xs text-muted">
                          {status === "missing"
                            ? "Physical file was not found during scan."
                            : "Physical file was removed; DB record remains."}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {asset.contentItem?.id ? (
                      <Link
                        to={`/content/${asset.contentItem.id}`}
                        className="font-medium text-ink underline-offset-2 hover:underline"
                      >
                        {asset.contentItem.title || "Untitled content"}
                      </Link>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatFileSize(asset.fileSizeBytes)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDateTime(asset.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex h-8 items-center rounded-lg border border-border bg-surface px-3 text-xs font-medium text-ink",
                            "transition hover:bg-canvas"
                          )}
                        >
                          Open media
                        </a>
                      ) : null}
                      <MediaDeleteAction asset={asset} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
