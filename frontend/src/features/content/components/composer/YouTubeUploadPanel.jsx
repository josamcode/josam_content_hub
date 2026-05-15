import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { extractErrorMessage } from "../../../../lib/axios";
import { cn } from "../../../../lib/cn";
import { formatDateTime } from "../../../../lib/format";
import { useMediaAssets } from "../../../media/hooks/useMediaAssets";
import { useYouTubeStatus } from "../../../platformSettings/hooks/useYouTubeStatus";
import { usePublishAttempts } from "../../../publishLogs/hooks/usePublishAttempts";
import {
  attemptStatusLabel,
  attemptStatusTone,
} from "../../../publishLogs/lib/attemptStatus";
import { useUploadYouTubePost } from "../../hooks/useUploadYouTubePost";

const REAUTH_STATUSES = new Set(["needs_reauth", "revoked", "error"]);
const YOUTUBE_STUDIO_URL = "https://studio.youtube.com";

function firstMessage(messages) {
  return Array.isArray(messages) ? messages.find(Boolean) || null : null;
}

function classifyUploadError(error, t) {
  const rawMessage = extractErrorMessage(
    error,
    t("contentDetail.composer.youtubeUpload.errorFallback", {
      ns: "pages",
    })
  );
  const status = error?.response?.status;
  const text = rawMessage.toLowerCase();
  let label = rawMessage;

  if (status === 409 || text.includes("already")) {
    label = t("contentDetail.composer.youtubeUpload.errors.alreadyUploaded", {
      ns: "pages",
    });
  } else if (text.includes("title")) {
    label = t("contentDetail.composer.youtubeUpload.errors.missingTitle", {
      ns: "pages",
    });
  } else if (text.includes("video") || text.includes("media")) {
    label = t("contentDetail.composer.youtubeUpload.errors.missingVideo", {
      ns: "pages",
    });
  } else if (
    text.includes("reauth") ||
    text.includes("re-auth") ||
    text.includes("connected") ||
    text.includes("oauth")
  ) {
    label = t("contentDetail.composer.youtubeUpload.errors.notConnected", {
      ns: "pages",
    });
  } else if (status === 429 || text.includes("quota") || text.includes("rate")) {
    label = t("contentDetail.composer.youtubeUpload.errors.quotaExceeded", {
      ns: "pages",
    });
  } else if (status >= 500) {
    label = t("contentDetail.composer.youtubeUpload.errors.serverError", {
      ns: "pages",
    });
  }

  return {
    label,
    detail: label === rawMessage ? null : rawMessage,
  };
}

export function YouTubeUploadPanel({ post, contentItemId, isDirty }) {
  const { t, i18n } = useTranslation(["common", "pages"]);
  const [confirming, setConfirming] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const mediaQuery = useMediaAssets(contentItemId, { type: "video" });
  const youtubeStatusQuery = useYouTubeStatus();
  const publishAttemptsQuery = usePublishAttempts({
    page: 1,
    limit: 50,
    platform: "youtube",
  });

  const uploadMutation = useUploadYouTubePost(
    { platformPostId: post.id, contentItemId },
    {
      onSuccess: (result) => {
        setUploadResult(result || null);
        setUploadError(null);
        setConfirming(false);
      },
      onError: (error) => {
        setUploadError(classifyUploadError(error, t));
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
  const latestAttempt = useMemo(() => {
    const attempts = publishAttemptsQuery.data?.items || [];
    return attempts.find(
      (attempt) =>
        attempt.platformPostId === post.id && attempt.platform === "youtube"
    );
  }, [post.id, publishAttemptsQuery.data?.items]);

  const disabledMessage = useMemo(() => {
    if (platformPostUrl) {
      return t("contentDetail.composer.youtubeUpload.alreadyUploadedDetail", {
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
    uploadError?.label ||
    disabledMessage ||
    firstMessage([
      confirming
        ? t("contentDetail.composer.youtubeUpload.confirmWarning", {
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
    <section
      className={cn(
        "rounded-2xl border px-4 py-4",
        platformPostUrl
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-border bg-surface"
      )}
    >
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
          {platformPostUrl ? (
            <p className="mt-1 text-sm text-emerald-800">
              {t("contentDetail.composer.youtubeUpload.alreadyUploadedDetail", {
                ns: "pages",
              })}
            </p>
          ) : (
            <div className="mt-2 space-y-1 text-xs text-muted">
              <p>
                {t("contentDetail.composer.youtubeUpload.realVideoWarning", {
                  ns: "pages",
                })}
              </p>
              <p>
                {t("contentDetail.composer.youtubeUpload.privateByDefault", {
                  ns: "pages",
                })}
              </p>
              <p>
                {t("contentDetail.composer.youtubeUpload.studioCleanup", {
                  ns: "pages",
                })}
              </p>
            </div>
          )}
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
          <Button as={Link} variant="ghost" size="sm" to="/publish-logs">
            {t("contentDetail.composer.youtubeUpload.viewPublishLogs", {
              ns: "pages",
            })}
          </Button>
          <Button
            as="a"
            variant="ghost"
            size="sm"
            href={YOUTUBE_STUDIO_URL}
            target="_blank"
            rel="noreferrer"
          >
            YouTube Studio
          </Button>
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
                : t("contentDetail.composer.youtubeUpload.prepareUpload", {
                    ns: "pages",
                  })}
          </Button>
        </div>
      </div>

      {latestAttempt && (
        <div className="mt-3 rounded-lg border border-border bg-canvas/50 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {t("contentDetail.composer.youtubeUpload.latestAttempt", {
                ns: "pages",
              })}
            </p>
            <Badge tone={attemptStatusTone(latestAttempt.status)}>
              {attemptStatusLabel(latestAttempt.status, t)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink">
            {formatDateTime(latestAttempt.attemptedAt, i18n.language)}
          </p>
          {latestAttempt.status === "failed" && (
            <p className="mt-1 text-xs text-muted">
              {t("contentDetail.composer.youtubeUpload.failedAttemptHint", {
                ns: "pages",
              })}
            </p>
          )}
        </div>
      )}

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
          {uploadError?.detail && (
            <span className="mt-1 block text-xs text-muted">
              {uploadError.detail}
            </span>
          )}
        </p>
      )}
    </section>
  );
}
