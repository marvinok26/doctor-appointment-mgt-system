"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import type { PagedResult } from "@/types/api";

interface PaginationProps {
  result: Pick<PagedResult<unknown>, "page" | "totalPages" | "hasPreviousPage" | "hasNextPage" | "totalCount">;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

/** Page numbers to render, collapsing long runs to "1 … 4 5 6 … 12" around the current page. */
function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(page);
  });
  return result;
}

/**
 * Every list in the app uses this: a page-size selector on the left (search/filter changes and
 * page-size changes both refetch from the API — nothing is re-sliced client-side from an
 * already-fetched page) and numbered page links on the right, so jumping from page 2 to page 9
 * doesn't take seven clicks.
 */
export function Pagination({ result, pageSize, onPageChange, onPageSizeChange, pageSizeOptions = [5, 10, 20, 50] }: PaginationProps) {
  if (result.totalCount === 0) return null;

  const pages = buildPageList(result.page, result.totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400 sm:flex-row">
      <label className="flex items-center gap-2">
        Show
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        per page · {result.totalCount} total
      </label>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(result.page - 1)}
          disabled={!result.hasPreviousPage}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 disabled:opacity-40 dark:border-slate-700"
          aria-label="Previous page"
        >
          <FontAwesomeIcon icon={icons.chevronLeft} />
        </button>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === result.page ? "page" : undefined}
              className={`min-w-[2rem] rounded-md border px-2 py-1.5 text-sm ${
                p === result.page
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(result.page + 1)}
          disabled={!result.hasNextPage}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 disabled:opacity-40 dark:border-slate-700"
          aria-label="Next page"
        >
          <FontAwesomeIcon icon={icons.chevronRight} />
        </button>
      </div>
    </div>
  );
}
