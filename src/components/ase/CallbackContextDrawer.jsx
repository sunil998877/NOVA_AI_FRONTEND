import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { leadApi } from "../../lib/api";
import {
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Send,
  PhoneCall,
  History,
  AlertCircle,
  Tag,
  Briefcase,
} from "lucide-react";

export function CallbackContextDrawer({ leadId, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [leadData, setLeadData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !leadId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    leadApi
      .get(leadId)
      .then((res) => {
        if (!isMounted) return;
        setLeadData(res.data || null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load lead context");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, leadId]);

  const lead = leadData?.lead;
  const timeline = leadData?.timeline || [];

  const formatDateTime = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={true}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col bg-background text-foreground border-l border-border"
      >
        <div className="p-6 border-b border-border bg-card/40">
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs font-mono font-semibold">
                P-{lead?.priority ?? 50}
              </Badge>
              {lead?.health && (
                <Badge
                  variant="outline"
                  className={
                    lead.health === "GREEN"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : lead.health === "AMBER"
                      ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                      : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
                  }
                >
                  Health: {lead.health}
                </Badge>
              )}
            </div>
            <SheetTitle className="text-xl font-bold truncate">
              {lead?.name || "Lead Context & History"}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              {lead?.company || "Company not specified"}
              {lead?.industry && ` • ${lead.industry}`}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to load lead information</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          ) : lead ? (
            <>
              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Contact Information
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </span>
                    <span className="font-mono font-medium truncate max-w-[200px]">
                      {lead.email || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      Phone
                    </span>
                    <span className="font-mono font-medium">
                      {lead.phone || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Source
                    </span>
                    <span className="font-medium">{lead.source || "Direct"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Lifecycle Status
                    </span>
                    <Badge variant="secondary" className="font-semibold text-[11px]">
                      {lead.status || "NEW"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Outreach & Touch Counts
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border/40">
                    <span className="block text-lg font-bold text-foreground">
                      {lead.touch_count ?? (lead.email_count || 0) + (lead.call_count || 0)}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Total Touches
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border/40">
                    <span className="block text-lg font-bold text-foreground">
                      {lead.email_count ?? 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Emails Sent
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border/40">
                    <span className="block text-lg font-bold text-foreground">
                      {lead.call_count ?? 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Call Attempts
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/30 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Contacted:</span>
                    <span className="font-medium">{formatDateTime(lead.last_contacted_at)}</span>
                  </div>
                  {lead.next_action && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Next Action:</span>
                      <span className="font-semibold text-primary">
                        {lead.next_action} ({formatDateTime(lead.next_action_time)})
                      </span>
                    </div>
                  )}
                  {lead.disposition && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Disposition:</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {lead.disposition}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Compliance & Consent
                </h4>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted-foreground">Consent Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      lead.consent_status === "EXPLICIT_OPT_IN" || lead.consent_status === "OPT_IN"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }
                  >
                    {lead.consent_status || "Standard B2B Legitimate Interest"}
                  </Badge>
                </div>
                {lead.do_not_contact ? (
                  <div className="p-2 rounded bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Do Not Contact / Suppressed
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Interaction & Event Timeline ({timeline.length})
                </h4>

                {timeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-3 text-center border border-dashed rounded-lg">
                    No historical events recorded for this lead yet.
                  </p>
                ) : (
                  <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                    {timeline.map((event) => (
                      <div key={event.id} className="relative text-xs space-y-1">
                        <div className="absolute -left-5 top-0.5 w-2.5 h-2.5 rounded-full border-2 border-background bg-primary" />
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">
                            {event.event_type}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatDateTime(event.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                          {event.channel === "EMAIL" && <Send className="w-3 h-3" />}
                          {event.channel === "CALL" && <PhoneCall className="w-3 h-3" />}
                          <span className="uppercase font-medium">{event.channel}</span>
                          <span>•</span>
                          <span>Status: {event.status}</span>
                        </div>
                        {event.payload && typeof event.payload === "object" && (
                          <div className="mt-1 bg-muted/40 p-2 rounded text-[11px] font-mono text-muted-foreground overflow-x-auto">
                            {event.payload.notes ||
                              event.payload.subject ||
                              JSON.stringify(event.payload)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
