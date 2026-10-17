import React from "react";
import { PhoneCall, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

export function CallbackEmptyState({ onRefresh, isFiltered = false }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/50">
      <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-4">
        {isFiltered ? (
          <PhoneCall className="w-7 h-7 text-muted-foreground" />
        ) : (
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        )}
      </div>

      <h3 className="text-lg font-semibold text-foreground">
        {isFiltered ? "No matching callbacks found" : "Callback queue is clear"}
      </h3>

      <p className="text-sm text-muted-foreground max-w-sm mt-1.5 mb-6">
        {isFiltered
          ? "No callbacks matched your active search or filter criteria. Try resetting your filters."
          : "All scheduled callbacks have been resolved or handed off. Autonomous sales outreach is active."}
      </p>

      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Queue
        </Button>
      )}
    </div>
  );
}
