import React from "react";
import {
  Phone,
  Building2,
  Clock,
  User,
  MessageSquare,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CallbackStatusBadge, getCallbackUrgency } from "./CallbackStatusBadge";

export function CallbackCard({ callback, onComplete, onOpenContext }) {
  const urgency = getCallbackUrgency(callback.due_at, callback.status);
  const isBreached = urgency === "SLA BREACHED";
  const isCompleted = callback.status === "COMPLETED";

  const priorityScore = callback.priority ?? callback.lead_priority ?? 50;

  const formatDueTime = (dueAt) => {
    if (!dueAt) return "Not specified";
    const d = new Date(dueAt);
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card
      className={`rounded-xl border transition-all duration-200 bg-card hover:shadow-md ${
        isBreached
          ? "border-rose-400/80 shadow-rose-100/50 dark:shadow-none bg-rose-50/15 dark:bg-rose-950/15"
          : "border-border/70 hover:border-border shadow-sm"
      }`}
    >
      <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <CallbackStatusBadge dueAt={callback.due_at} status={callback.status} />
            <Badge
              variant="outline"
              className="font-mono text-xs font-semibold px-2 py-0.5 border-slate-300 dark:border-slate-700 bg-background"
            >
              P-{priorityScore}
            </Badge>
          </div>

          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground line-clamp-1">
              {callback.lead_name || "Prospective Client"}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              {callback.lead_company && (
                <span className="flex items-center gap-1 font-medium text-foreground/80">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  {callback.lead_company}
                </span>
              )}
              {callback.lead_phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  {callback.lead_phone}
                </span>
              )}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground border border-border/40">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="line-clamp-2 leading-relaxed">
                {callback.notes || "Inbound callback requested during outreach. Ready for sales conversation."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${isBreached ? "text-rose-500 font-bold" : "text-muted-foreground"}`} />
              <span className={isBreached ? "text-rose-600 font-medium dark:text-rose-400" : ""}>
                Due: {formatDueTime(callback.due_at)}
              </span>
            </span>

            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              {callback.rep_name || callback.assigned_rep_name || "Unassigned"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {!isCompleted ? (
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-medium shadow-sm transition-colors"
                onClick={() => onComplete(callback)}
              >
                <Phone className="w-3.5 h-3.5 mr-1.5" />
                Complete Call
              </Button>
            ) : (
              <Button size="sm" variant="ghost" disabled className="text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Resolved
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="hover:bg-muted/80 text-foreground font-medium"
              onClick={() => onOpenContext(callback)}
            >
              Context
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
