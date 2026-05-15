import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { extractErrorMessage } from "../../../../lib/axios";
import { cn } from "../../../../lib/cn";
import { useMediaAssets } from "../../../media/hooks/useMediaAssets";
import { useYouTubeStatus } from "../../../platformSettings/hooks/useYouTubeStatus";
import { useUploadYouTubePost } from "../../hooks/useUploadYouTubePost";

const REAUTH_STATUSES = new Set(["needs_reauth", "revoked", "error"]);

function firstMessage(messages) {
  return Array.isArray(messages) ? messages.find(Boolean) || null : null;
}

export function YouTubeUploadPanel({ post, contentItemId, isDirty }) {
  const { t } = useTranslation(["common", "pages"]);
  const [confirming, setConfirming] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const mediaQuery = useMediaAssets(contentItemId, { type: "video" });
  const youtubeStatusQuery = useYouTubeStatus();

  const uploadMutation = useUploadYouTubePost(
    { platformPostId: post.id, contentItemId },
    {
      onSuccess: (result) => {
        setUploadResult(result || null);
        setUploadError(null);
        setConfirming(false);
      },
      onError: (error) => {
        setUploadError(
          extractErrorMessage(
            error,
            t("contentDetail.composer.youtubeUpload.errorFallback", {
              ns: "pages",
            })
          )
        );
        setConfirming(false);
      },
    }
  );

  const platformPostUrl = uploadResult?.platformPostUrl || post.platformPostUrl;
  const hasSavedTitle = Boolean(post.title && post.title.trim());
  const videoAssets = Array.isArray(mediaQuery.data) ? mediaQuery.data : [];
  const hasVideoAsset = videoAssets.some((asset) => asset?.type === "video");
  const youtubeStatus = youtubeStatusQuery.data?.status;
  const youtubeConnected =
    youtubeStatusQuery.data?.connected === true || youtubeStatus === "connected";
  const connectionRequiresAction =
    youtubeStatusQuery.isSuccess &&
    (!youtubeConnected || REAUTH_STATUSES.has(youtubeStatus));

  const disabledMessage = useMemo(() => {
    if (platformPostUrl) {
      return t("contentDetail.composer.youtubeUpload.alreadyUploaded", {
        ns: "pages",
      });
    }
    if (isDirty) {
      return t("contentDetail.composer.youtubeUpload.saveFirst", {
        ns: "pages",
      });
    }
    if (!hasSavedTitle) {
      return t("contentDetail.composer.youtubeUpload.titleRequired", {
        ns: "pages",
      });
    }
    if (mediaQuery.isLoading) {
      return t("contentDetail.composer.youtubeUpload.checkingVideo", {
        ns: "pages",
      });
    }
    if (mediaQuery.isSuccess && !hasVideoAsset) {
      return t("contentDetail.composer.youtubeUpload.videoRequired", {
        ns: "pages",
      });
    }
    if (youtubeStatusQuery.isLoading) {
      return t("contentDetail.composer.youtubeUpload.checkingConnection", {
        ns: "pages",
      });
    }
    if (connectionRequiresAction) {
      return t("contentDetail.composer.youtubeUpload.connectFirst", {
        ns: "pages",
      });
    }
    return null;
  }, [
    connectionRequiresAction,
    hasSavedTitle,
    hasVideoAsset,
    isDirty,
    mediaQuery.isLoading,
    mediaQuery.isSuccess,
    platformPostUrl,
    t,
    youtubeStatusQuery.isLoading,
  ]);

  useEffect(() => {
    if (disabledMessage) setConfirming(false);
  }, [disabledMessage]);

  const handleUpload = () => {
    if (disabledMessage || uploadMutation.isPending) return;
    if (!confirming) {
      setUploadError(null);
      setConfirming(true);
      return;
    }
    uploadMutation.mutate({});
  };

  const hintMessage =
    uploadError ||
    disabledMessage ||
    firstMessage([
      confirming
        ? t("contentDetail.composer.youtubeUpload.realVideoWarning", {
            ns: "pages",
          })
        : null,
      mediaQuery.isError
        ? t("contentDetail.composer.youtubeUpload.videoCheckUnavailable", {
            ns: "pages",
          })
        : null,
      uploadResult
        ? t("contentDetail.composer.youtubeUpload.success", { ns: "pages" })
        : null,
    ]);

  return (
    <section className="rounded-2xl border border-border bg-surface px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {t("contentDetail.composer.youtubeUpload.eyebrow", {
                ns: "pages",
              })}
            </p>
            {platformPostUrl && (
              <Badge tone="success">
                {t("contentDetail.composer.youtubeUpload.uploaded", {
                  ns: "pages",
                })}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm font-medium text-ink">
            {t("contentDetail.composer.youtubeUpload.title", { ns: "pages" })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {platformPostUrl && (
            <Button
              as="a"
              variant="outline"
              size="sm"
              href={platformPostUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t("contentDetail.composer.youtubeUpload.openVideo", {
                ns: "pages",
              })}
            </Button>
          )}
          {confirming && !platformPostUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={uploadMutation.isPending}
            >
              {t("cancel", { ns: "common" })}
            </Button>
          )}
          <Button
            type="button"
            variant={confirming ? "primary" : "outline"}
            size="sm"
            onClick={handleUpload}
            loading={uploadMutation.isPending}
            disabled={Boolean(disabledMessage) || uploadMutation.isPending}
            title={disabledMessage || undefined}
          >
            {uploadMutation.isPending
              ? t("contentDetail.composer.youtubeUpload.uploading", {
                  ns: "pages",
                })
              : confirming
                ? t("contentDetail.composer.youtubeUpload.confirmUpload", {
                    ns: "pages",
                  })
                : t("contentDetail.composer.youtubeUpload.uploadSchedule", {
                    ns: "pages",
                  })}
          </Button>
        </div>
      </div>

      {hintMessage && (
        <p
          className={cn(
            "mt-3 rounded-lg border px-3 py-2 text-sm",
            uploadError
              ? "border-danger/30 bg-danger/5 text-ink"
              : confirming
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-border bg-canvas/50 text-muted"
          )}
        >
          {uploadError && (
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
              {t("contentDetail.composer.youtubeUpload.uploadFailed", {
                ns: "pages",
              })}
            </span>
          )}
          {hintMessage}
        </p>
      )}
    </section>
  );
}
