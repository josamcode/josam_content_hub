import { useTranslation } from "react-i18next";

import { Button } from "../../../components/ui/Button";

export function PublishLogPagination({
  page,
  totalPages,
  total,
  limit,
  onChange,
  isFetching,
}) {
  const { t, i18n } = useTranslation(["common", "pages"]);
  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const canPrev = page > 1;
  const canNext = page < safeTotalPages;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted">
        {total === 0
          ? t("noResults", { ns: "common" })
          : t("publishLogs.pagination.showing", {
              ns: "pages",
              start,
              end,
              total: total.toLocaleString(locale),
            })}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev || isFetching}
          onClick={() => onChange(page - 1)}
        >
          {t("previous", { ns: "common" })}
        </Button>
        <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-ink">
          {t("page", { ns: "common" })}{" "}
          <strong className="font-semibold">{page}</strong>{" "}
          <span className="text-muted">
            {t("of", { ns: "common" })} {safeTotalPages}
          </span>
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext || isFetching}
          onClick={() => onChange(page + 1)}
        >
          {t("next", { ns: "common" })}
        </Button>
      </div>
    </div>
  );
}
