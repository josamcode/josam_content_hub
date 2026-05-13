import { Button } from "../../../components/ui/Button";

export function Pagination({ page, totalPages, total, limit, onChange, isFetching }) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const canPrev = page > 1;
  const canNext = page < safeTotalPages;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted">
        {total === 0
          ? "No results"
          : `Showing ${start}–${end} of ${total.toLocaleString()}`}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev || isFetching}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-ink">
          Page <strong className="font-semibold">{page}</strong>{" "}
          <span className="text-muted">of {safeTotalPages}</span>
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext || isFetching}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
