import React from "react";
import { Search, RotateCw, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export function CallbackFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  sortBy,
  onSortChange,
  onRefresh,
  loading = false,
  counts = {},
}) {
  return (
    <div className="space-y-3 bg-card border border-border/70 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, company, phone or notes..."
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-input rounded-md px-2.5 h-9 bg-background">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-foreground text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="overdue">Sort: Most Overdue</option>
              <option value="due_asc">Sort: Earliest Due Time</option>
              <option value="priority_desc">Sort: Highest Priority</option>
              <option value="newest">Sort: Newest First</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 px-3 gap-1.5 shrink-0"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground mr-1 flex items-center gap-1 font-medium">
            <Filter className="w-3 h-3" />
            Status:
          </span>

          {[
            { id: "all", label: "All Active", count: counts.active ?? 0 },
            { id: "overdue", label: "SLA Breached", count: counts.overdue ?? 0, alert: true },
            { id: "due_now", label: "Due Now / 30m", count: counts.dueSoon ?? 0 },
            { id: "completed", label: "Completed", count: counts.completed ?? 0 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onStatusChange(item.id)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                statusFilter === item.id
                  ? item.alert
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold"
                    : "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === item.id
                    ? item.alert
                      ? "bg-rose-200/80 text-rose-900 dark:bg-rose-900 dark:text-rose-100"
                      : "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background/80 text-muted-foreground"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="p90">P-90+ (Critical)</option>
            <option value="p70">P-70+ (High)</option>
            <option value="p50">P-50+ (Standard)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
