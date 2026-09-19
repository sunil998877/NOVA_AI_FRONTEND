import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SegmentedPagination({
  currentPage = 1,
  totalPages = 1023,
  onPageChange,
  onNext,
  onPrev,
  hasNext = true,
  hasPrev = false,
  className = "",
}) {
  const getPageNumbers = () => {
    const total = Math.max(1, totalPages || 1);
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
      className={`flex items-center justify-center pt-6 pb-2 ${className}`}
    >
      <div className="inline-flex items-stretch overflow-hidden rounded-[2px] border border-[#555a66] divide-x divide-[#555a66] shadow-sm select-none">
        {currentPage > 1 && (
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev && currentPage <= 1}
            className="flex items-center justify-center gap-1 bg-[#212328] hover:bg-[#2d313a] active:bg-[#1a1c20] text-white px-3.5 h-[38px] text-sm font-normal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-4 stroke-[2.5]" />
            <span>Previous</span>
          </button>
        )}

        {pages.map((item, index) => {
          if (item === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center bg-[#212328] text-white/90 px-3.5 h-[38px] text-sm font-normal cursor-default select-none"
              >
                ...
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
              className={`flex items-center justify-center h-[38px] text-sm transition-colors ${
                isCurrent
                  ? "bg-[#1877f2] text-white font-medium min-w-[42px] px-3.5 shadow-inner"
                  : "bg-[#212328] hover:bg-[#2d313a] active:bg-[#1a1c20] text-white font-normal min-w-[42px] px-3.5 cursor-pointer"
              }`}
            >
              {typeof item === "number" ? item.toLocaleString() : item}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="flex items-center justify-center gap-1.5 bg-[#212328] hover:bg-[#2d313a] active:bg-[#1a1c20] text-white px-4 h-[38px] text-sm font-normal transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="size-4 stroke-[2.5]" />
        </button>
      </div>
    </nav>
  );
}

export default SegmentedPagination;
