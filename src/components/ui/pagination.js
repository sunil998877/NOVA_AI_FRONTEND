import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SegmentedPagination({
  currentPage = 1,
  totalPages = 2,
  onPageChange,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  className = "",
}) {
  const effectiveTotalPages = Math.max(2, totalPages || 2);
  const effectiveHasPrev = hasPrev !== undefined ? hasPrev : currentPage > 1;
  const effectiveHasNext = hasNext !== undefined ? hasNext : currentPage < effectiveTotalPages;
  const handlePrev = onPrev || (() => onPageChange?.(Math.max(1, currentPage - 1)));
  const handleNext = onNext || (() => onPageChange?.(Math.min(effectiveTotalPages, currentPage + 1)));

  const getPageNumbers = () => {
    const total = effectiveTotalPages;
    const current = Math.max(1, Math.min(currentPage || 1, total));

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 2) {
      return [1, 2, 3, "...", total];
    }

    if (current >= total - 1) {
      return [1, "...", total - 2, total - 1, total];
    }

    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  const pages = getPageNumbers();

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-center -mt-[10px] pt-3.5 pb-2 ${className}`}
    >
      <div className="inline-flex items-stretch overflow-hidden rounded-md border border-orange-500/40 divide-x divide-orange-500/30 shadow-sm select-none">
        {currentPage > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            disabled={!effectiveHasPrev}
            className="flex items-center justify-center gap-1 bg-white hover:bg-orange-50 active:bg-orange-100 text-orange-500 px-3.5 h-[38px] text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-4 stroke-[2.5]" />
            <span>Prev</span>
          </button>
        )}

        {pages.map((item, index) => {
          if (item === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center bg-white text-orange-400 px-3.5 h-[38px] text-sm font-normal cursor-default select-none"
              >
                …
              </span>
            );
          }

          const isCurrent = item === currentPage;

          return (
            <button
              key={`page-${item}`}
              type="button"
              onClick={() => onPageChange?.(item)}
              aria-current={isCurrent ? "page" : undefined}
              className={`flex items-center justify-center h-[38px] text-sm font-bold transition-colors min-w-[42px] px-3.5 ${
                isCurrent
                  ? "bg-orange-500 text-white shadow-inner shadow-orange-600/20"
                  : "bg-white hover:bg-orange-50 active:bg-orange-100 text-orange-500 cursor-pointer"
              }`}
            >
              {typeof item === "number" ? item.toLocaleString() : item}
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleNext}
          disabled={!effectiveHasNext}
          className="flex items-center justify-center gap-1.5 bg-white hover:bg-orange-50 active:bg-orange-100 text-orange-500 px-4 h-[38px] text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="size-4 stroke-[2.5]" />
        </button>
      </div>
    </nav>
  );
}

export default SegmentedPagination;
