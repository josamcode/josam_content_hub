import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { extractErrorMessage } from "../../../lib/axios";
import {
  useMetaStatus,
  useMetaPages,
  useConnectMeta,
  useSelectMetaPage,
  useDisconnectMeta,
} from "../hooks/useMetaIntegration";

const STATUS_TONES = {
  connected: "success",
  needs_reauth: "warning",
  revoked: "neutral",
  error: "danger",
  disconnected: "neutral",
};

function friendlyErrorMessage(message, t) {
  if (message === "Meta OAuth is not configured") {
    return t("platformSettings.metaConnection.configMissing", {
      ns: "pages",
    });
  }

  return message;
}

export function MetaConnectionPanel() {
  const { t } = useTranslation(["common", "pages"]);
  const [connectError, setConnectError] = useState(null);
  const [disconnectError, setDisconnectError] = useState(null);
  const [selectPageError, setSelectPageError] = useState(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState(null);

  const statusQuery = useMetaStatus();
  const status = statusQuery.data;
  const statusKey = status?.status || "disconnected";
  const isConnected = statusKey === "connected";
  const needsReauth = ["needs_reauth", "revoked", "error"].includes(statusKey);
  const canDisconnect =
    status && !["disconnected", "revoked"].includes(statusKey);
  const scopes = Array.isArray(status?.scopes) ? status.scopes : [];
  const visibleScopes = scopes.slice(0, 2);

  const hasSelectedPage = !!(status?.selectedPage?.id);
  const hasInstagram = !!(
    status?.instagramAccount?.id || status?.instagramAccount?.username
  );

  const pagesQuery = useMetaPages({
    enabled: isConnected && !hasSelectedPage,
  });
  const pages = Array.isArray(pagesQuery.data?.pages)
    ? pagesQuery.data.pages
    : [];

  const connectMutation = useConnectMeta({
    onSuccess: (data) => {
      setConnectError(null);
      const authorizationUrl = data?.authorizationUrl;
      if (authorizationUrl) {
        window.location.assign(authorizationUrl);
      } else {
        setConnectError(
          t("platformSettings.metaConnection.connectErrorFallback", {
            ns: "pages",
          })
        );
      }
    },
    onError: (error) => {
      const message = extractErrorMessage(
        error,
        t("platformSettings.metaConnection.connectErrorFallback", {
          ns: "pages",
        })
      );
      setConnectError(friendlyErrorMessage(message, t));
    },
  });

  const disconnectMutation = useDisconnectMeta({
    onSuccess: () => {
      setConfirmDisconnect(false);
      setDisconnectError(null);
    },
    onError: (error) => {
      setDisconnectError(
        extractErrorMessage(
          error,
          t("platformSettings.metaConnection.disconnectErrorFallback", {
            ns: "pages",
          })
        )
      );
    },
  });

  const selectPageMutation = useSelectMetaPage({
    onSuccess: () => {
      setSelectPageError(null);
      setSelectedPageId(null);
    },
    onError: (error) => {
      setSelectPageError(
        extractErrorMessage(
          error,
          t("platformSettings.metaConnection.selectPageErrorFallback", {
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
    setSelectPageError(null);
    setConfirmDisconnect(false);
    setSelectedPageId(null);
    statusQuery.refetch();
    if (pagesQuery.isEnabled || isConnected) {
      pagesQuery.refetch();
    }
  }

  function handleSelectPage() {
    if (!selectedPageId) return;
    setSelectPageError(null);
    selectPageMutation.mutate(selectedPageId);
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {t("platformSettings.metaConnection.eyebrow", {
                ns: "pages",
              })}
            </p>
            <h3 className="mt-1 font-display text-lg leading-tight text-ink">
              {t("platformSettings.metaConnection.title", { ns: "pages" })}
            </h3>
          </div>

          {statusQuery.isLoading ? (
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <Spinner size="sm" />
              {t("platformSettings.metaConnection.loading", {
                ns: "pages",
              })}
            </span>
          ) : (
            <Badge tone={STATUS_TONES[statusKey] || "neutral"}>
              {t(
                `platformSettings.metaConnection.status.${statusKey}`,
                {
                  ns: "pages",
                }
              )}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted">
          {t("platformSettings.metaConnection.publishUnavailable", {
            ns: "pages",
          })}
        </p>

        {statusQuery.isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
            {extractErrorMessage(
              statusQuery.error,
              t("platformSettings.metaConnection.statusErrorFallback", {
                ns: "pages",
              })
            )}
          </div>
        )}

        {!statusQuery.isLoading && !statusQuery.isError && (
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("platformSettings.metaConnection.account", {
                  ns: "pages",
                })}
              </p>
              <p className="mt-1 text-ink">
                {status?.accountName ||
                  t("platformSettings.metaConnection.accountEmpty", {
                    ns: "pages",
                  })}
              </p>
              {status?.accountId && (
                <p className="mt-0.5 break-all text-xs text-muted">
                  {status.accountId}
                </p>
              )}
            </div>

            {hasSelectedPage && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                  {t("platformSettings.metaConnection.selectedPage", {
                    ns: "pages",
                  })}
                </p>
                <p className="mt-1 text-ink">{status.selectedPage.name}</p>
                <p className="mt-0.5 break-all text-xs text-muted">
                  {status.selectedPage.id}
                </p>
              </div>
            )}

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("platformSettings.metaConnection.instagramAccount", {
                  ns: "pages",
                })}
              </p>
              {hasInstagram ? (
                <>
                  <p className="mt-1 text-ink">
                    {status.instagramAccount.username ||
                      status.instagramAccount.name ||
                      status.instagramAccount.id}
                  </p>
                  {status.instagramAccount.id && (
                    <p className="mt-0.5 break-all text-xs text-muted">
                      {status.instagramAccount.id}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-muted">
                  {isConnected
                    ? t("platformSettings.metaConnection.noInstagram", {
                        ns: "pages",
                      })
                    : t("platformSettings.metaConnection.instagramEmpty", {
                        ns: "pages",
                      })}
                </p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("platformSettings.metaConnection.scopes", {
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
                      {t("platformSettings.metaConnection.moreScopes", {
                        ns: "pages",
                        count: scopes.length - visibleScopes.length,
                      })}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-muted">
                  {t("platformSettings.metaConnection.scopesEmpty", {
                    ns: "pages",
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {isConnected && !hasSelectedPage && pages.length > 0 && (
          <div className="rounded-lg border border-border bg-canvas/50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("platformSettings.metaConnection.availablePages", {
                ns: "pages",
              })}
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {pages.map((page) => (
                <label
                  key={page.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedPageId === page.id
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="metaPage"
                    value={page.id}
                    checked={selectedPageId === page.id}
                    onChange={() => setSelectedPageId(page.id)}
                    className="h-4 w-4"
                  />
                  <span className="flex-1 text-ink">{page.name}</span>
                  <span className="text-xs text-muted">{page.id}</span>
                </label>
              ))}
            </div>
            <div className="mt-3">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSelectPage}
                loading={selectPageMutation.isPending}
                disabled={!selectedPageId || selectPageMutation.isPending}
              >
                {t("platformSettings.metaConnection.selectPage", {
                  ns: "pages",
                })}
              </Button>
            </div>
          </div>
        )}

        {isConnected &&
          !hasSelectedPage &&
          !pagesQuery.isLoading &&
          pagesQuery.isFetched &&
          pages.length === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {t("platformSettings.metaConnection.noPagesAvailable", {
                ns: "pages",
              })}
            </div>
          )}

        {isConnected && !hasSelectedPage && pagesQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" />
            {t("platformSettings.metaConnection.loadingPages", {
              ns: "pages",
            })}
          </div>
        )}

        {pagesQuery.isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
            {extractErrorMessage(
              pagesQuery.error,
              t("platformSettings.metaConnection.pagesErrorFallback", {
                ns: "pages",
              })
            )}
          </div>
        )}

        {selectPageError && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
              {t("platformSettings.metaConnection.actionFailed", {
                ns: "pages",
              })}
            </p>
            <p className="mt-1">{selectPageError}</p>
          </div>
        )}

        {(connectError || disconnectError) && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
              {t("platformSettings.metaConnection.actionFailed", {
                ns: "pages",
              })}
            </p>
            <p className="mt-1">{connectError || disconnectError}</p>
          </div>
        )}

        {confirmDisconnect && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t("platformSettings.metaConnection.confirmDisconnect", {
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
            {needsReauth
              ? t("platformSettings.metaConnection.reconnect", {
                  ns: "pages",
                })
              : t("platformSettings.metaConnection.connect", {
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
              ? t("platformSettings.metaConnection.confirm", {
                  ns: "pages",
                })
              : t("platformSettings.metaConnection.disconnect", {
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
              {t("platformSettings.metaConnection.cancel", {
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
            {t("platformSettings.metaConnection.refresh", { ns: "pages" })}
          </Button>
        </div>
      </div>
    </section>
  );
}
