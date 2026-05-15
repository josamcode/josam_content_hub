import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { extractErrorMessage } from "../../../lib/axios";
import { useConnectYouTube } from "../hooks/useConnectYouTube";
import { useDisconnectYouTube } from "../hooks/useDisconnectYouTube";
import { useYouTubeStatus } from "../hooks/useYouTubeStatus";

const STATUS_TONES = {
  connected: "success",
  needs_reauth: "warning",
  revoked: "neutral",
  error: "danger",
  disconnected: "neutral",
};

function friendlyErrorMessage(message, t) {
  if (message === "YouTube OAuth is not configured") {
    return t("platformSettings.youtubeConnection.configMissing", {
      ns: "pages",
    });
  }

  return message;
}

export function YouTubeConnectionPanel() {
  const { t } = useTranslation(["common", "pages"]);
  const [connectError, setConnectError] = useState(null);
  const [disconnectError, setDisconnectError] = useState(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const statusQuery = useYouTubeStatus();
  const status = statusQuery.data;
  const statusKey = status?.status || "disconnected";
  const isConnected = statusKey === "connected";
  const canDisconnect =
    status && !["disconnected", "revoked"].includes(statusKey);
  const scopes = Array.isArray(status?.scopes) ? status.scopes : [];
  const visibleScopes = scopes.slice(0, 2);

  const connectMutation = useConnectYouTube({
    onSuccess: (data) => {
      setConnectError(null);
      const authorizationUrl = data?.authorizationUrl;
      if (authorizationUrl) {
        window.location.assign(authorizationUrl);
      } else {
        setConnectError(
          t("platformSettings.youtubeConnection.connectErrorFallback", {
            ns: "pages",
          })
        );
      }
    },
    onError: (error) => {
      const message = extractErrorMessage(
        error,
        t("platformSettings.youtubeConnection.connectErrorFallback", {
          ns: "pages",
        })
      );
      setConnectError(friendlyErrorMessage(message, t));
    },
  });

  const disconnectMutation = useDisconnectYouTube({
    onSuccess: () => {
      setConfirmDisconnect(false);
      setDisconnectError(null);
    },
    onError: (error) => {
      setDisconnectError(
        extractErrorMessage(
          error,
          t("platformSettings.youtubeConnection.disconnectErrorFallback", {
            ns: "pages",
          })
        )
      );
    },
  });

  function handleConnect() {
    setConnectError(null);
    connectMutation.mutate();
  }

  function handleDisconnect() {
    setDisconnectError(null);

    if (!confirmDisconnect) {
      setConfirmDisconnect(true);
      return;
    }

    disconnectMutation.mutate();
  }

  function handleRefresh() {
    setConnectError(null);
    setDisconnectError(null);
    setConfirmDisconnect(false);
    statusQuery.refetch();
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {t("platformSettings.youtubeConnection.eyebrow", {
                ns: "pages",
              })}
            </p>
            <h3 className="mt-1 font-display text-lg leading-tight text-ink">
              {t("platformSettings.youtubeConnection.title", { ns: "pages" })}
            </h3>
          </div>

          {statusQuery.isLoading ? (
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <Spinner size="sm" />
              {t("platformSettings.youtubeConnection.loading", {
                ns: "pages",
              })}
            </span>
          ) : (
            <Badge tone={STATUS_TONES[statusKey] || "neutral"}>
              {t(`platformSettings.youtubeConnection.status.${statusKey}`, {
                ns: "pages",
              })}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted">
          {t("platformSettings.youtubeConnection.uploadUnavailable", {
            ns: "pages",
          })}
        </p>

        {statusQuery.isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
            {extractErrorMessage(
              statusQuery.error,
              t("platformSettings.youtubeConnection.statusErrorFallback", {
                ns: "pages",
              })
            )}
          </div>
        )}

        {!statusQuery.isLoading && !statusQuery.isError && (
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("platformSettings.youtubeConnection.account", {
                  ns: "pages",
                })}
              </p>
              <p className="mt-1 text-ink">
                {status?.accountName ||
                  t("platformSettings.youtubeConnection.accountEmpty", {
                    ns: "pages",
                  })}
              </p>
              {status?.accountId && (
                <p className="mt-0.5 break-all text-xs text-muted">
                  {status.accountId}
                </p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("platformSettings.youtubeConnection.scopes", {
                  ns: "pages",
                })}
              </p>
              {visibleScopes.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {visibleScopes.map((scope) => (
                    <Badge key={scope} tone="neutral" className="break-all">
                      {scope}
                    </Badge>
                  ))}
                  {scopes.length > visibleScopes.length && (
                    <Badge tone="neutral">
                      {t("platformSettings.youtubeConnection.moreScopes", {
                        ns: "pages",
                        count: scopes.length - visibleScopes.length,
                      })}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-muted">
                  {t("platformSettings.youtubeConnection.scopesEmpty", {
                    ns: "pages",
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {(connectError || disconnectError) && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
              {t("platformSettings.youtubeConnection.actionFailed", {
                ns: "pages",
              })}
            </p>
            <p className="mt-1">{connectError || disconnectError}</p>
          </div>
        )}

        {confirmDisconnect && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t("platformSettings.youtubeConnection.confirmDisconnect", {
              ns: "pages",
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={isConnected ? "outline" : "primary"}
            size="sm"
            onClick={handleConnect}
            loading={connectMutation.isPending}
            disabled={connectMutation.isPending}
          >
            {isConnected
              ? t("platformSettings.youtubeConnection.reconnect", {
                  ns: "pages",
                })
              : t("platformSettings.youtubeConnection.connect", {
                  ns: "pages",
                })}
          </Button>

          <Button
            type="button"
            variant={confirmDisconnect ? "primary" : "outline"}
            size="sm"
            onClick={handleDisconnect}
            loading={disconnectMutation.isPending}
            disabled={!canDisconnect || disconnectMutation.isPending}
          >
            {confirmDisconnect
              ? t("platformSettings.youtubeConnection.confirm", {
                  ns: "pages",
                })
              : t("platformSettings.youtubeConnection.disconnect", {
                  ns: "pages",
                })}
          </Button>

          {confirmDisconnect && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDisconnect(false)}
              disabled={disconnectMutation.isPending}
            >
              {t("platformSettings.youtubeConnection.cancel", {
                ns: "pages",
              })}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            loading={statusQuery.isFetching && !statusQuery.isLoading}
          >
            {t("platformSettings.youtubeConnection.refresh", { ns: "pages" })}
          </Button>
        </div>
      </div>
    </section>
  );
}
