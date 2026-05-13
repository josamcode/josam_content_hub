import { useMemo } from "react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { extractErrorMessage } from "../../../lib/axios";
import { useMediaAssets } from "../hooks/useMediaAssets";
import { MediaAssetCard } from "./MediaAssetCard";
import { MediaAssetSkeleton } from "./MediaAssetSkeleton";
import { MediaUploadCard } from "./MediaUploadCard";

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

function ErrorBlock({ message, onRetry }) {
  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        Couldn't load media
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

export function MediaUploadSection({ contentItemId }) {
  const { data, isLoading, isError, error, refetch } =
    useMediaAssets(contentItemId);

  const assets = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const hasVideo = assets.some((a) => a.type === "video");
  const hasThumbnail = assets.some((a) => a.type === "thumbnail");

  return (
    <Card padding="lg">
      <SectionHeading
        eyebrow="Media"
        title="Video & thumbnail"
        description="Upload the main video and a cover thumbnail for this content item. Other platforms can reuse them."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MediaUploadCard
          contentItemId={contentItemId}
          type="video"
          title={hasVideo ? "Add another video" : "Main video"}
          description={
            hasVideo
              ? "Upload an updated cut. The newest video shows first."
              : "Upload the final cut you'll publish across platforms."
          }
          accept="video/*"
          hint="Up to 500MB · MP4 / MOV / WEBM"
          iconTone="rose"
        />
        <MediaUploadCard
          contentItemId={contentItemId}
          type="thumbnail"
          title={hasThumbnail ? "Add another thumbnail" : "Thumbnail"}
          description={
            hasThumbnail
              ? "Upload a new cover. The newest thumbnail shows first."
              : "Upload the cover image that will represent this piece."
          }
          accept="image/*"
          hint="Up to 20MB · JPG / PNG / WEBP"
          iconTone="accent"
        />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            Uploaded
          </h3>
          <span className="text-[11px] text-muted">
            {assets.length} asset{assets.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <MediaAssetSkeleton count={2} />
        ) : isError ? (
          <ErrorBlock
            message={extractErrorMessage(error, "Unexpected error.")}
            onRetry={() => refetch()}
          />
        ) : assets.length === 0 ? (
          <EmptyState
            title="No media uploaded yet."
            description="Upload the main video and thumbnail for this content item."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {assets.map((asset) => (
              <MediaAssetCard
                key={asset.id}
                asset={asset}
                contentItemId={contentItemId}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
