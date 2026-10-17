import React from "react";
import { Badge } from "../ui/badge";
import { AlertTriangle, Clock, CheckCircle2, XCircle, Flame } from "lucide-react";

export function getCallbackUrgency(dueAt, status) {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "CANCELLED") return "CANCELLED";
  if (!dueAt) return "UPCOMING";

  const diffMs = new Date(dueAt).getTime() - Date.now();
  if (diffMs < 0 || status === "OVERDUE") return "SLA BREACHED";
  if (diffMs <= 5 * 60 * 1000) return "DUE NOW";
  if (diffMs <= 30 * 60 * 1000) return "DUE IN 30M";
  return "UPCOMING";
}

export function CallbackStatusBadge({ dueAt, status, className = "" }) {
  const urgency = getCallbackUrgency(dueAt, status);

  if (urgency === "SLA BREACHED") {
    return (
      <Badge
        variant="destructive"
        className={`bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-semibold px-2.5 py-0.5 gap-1.5 ${className}`}
      >
        <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
        SLA BREACHED
      </Badge>
    );
  }

  if (urgency === "DUE NOW") {
    return (
      <Badge
        variant="outline"
        className={`bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold px-2.5 py-0.5 gap-1.5 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        DUE NOW
      </Badge>
    );
  }

  if (urgency === "DUE IN 30M") {
    return (
      <Badge
        variant="outline"
        className={`bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 font-medium px-2.5 py-0.5 gap-1.5 ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-orange-600" />
        DUE IN 30M
      </Badge>
    );
  }

  if (urgency === "COMPLETED") {
    return (
      <Badge
        variant="outline"
        className={`bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-medium px-2.5 py-0.5 gap-1.5 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        COMPLETED
      </Badge>
    );
  }

  if (urgency === "CANCELLED") {
    return (
      <Badge
        variant="secondary"
        className={`bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 font-medium px-2.5 py-0.5 gap-1.5 ${className}`}
      >
        <XCircle className="w-3.5 h-3.5 text-slate-500" />
        CANCELLED
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 font-medium px-2.5 py-0.5 gap-1.5 ${className}`}
    >
      <Clock className="w-3.5 h-3.5 text-slate-400" />
      UPCOMING
    </Badge>
  );
}
