import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Flame,
  Phone,
  Mail,
  Building2,
  Clock,
  User,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  RotateCw,
  PhoneCall,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { aseService } from "../../services/ase.service";
import { CallbackStatusBadge, getCallbackUrgency } from "../../components/ase/CallbackStatusBadge";
import { CompleteCallModal } from "../../components/ase/CompleteCallModal";
import { CallbackContextDrawer } from "../../components/ase/CallbackContextDrawer";

const COLUMNS = [
  { key: "NEW", label: "New", color: "border-blue-500" },
  { key: "CONTACTED", label: "Contacted", color: "border-cyan-500" },
  { key: "ENGAGED", label: "Engaged", color: "border-indigo-500" },
  { key: "INTERESTED", label: "Interested", color: "border-emerald-500" },
  { key: "CALLBACK_SCHEDULED", label: "Callback", color: "border-amber-500" },
  { key: "CLOSED_WON", label: "Won", color: "border-green-600" },
  { key: "CLOSED_LOST", label: "Lost", color: "border-slate-400" },
  { key: "SUPPRESSED_DNC", label: "DNC", color: "border-rose-500" },
];

function formatDueTime(dueAt) {
  if (!dueAt) return "Not specified";
  try {
    const d = new Date(dueAt);
    if (isNaN(d.getTime())) return "Not specified";
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Not specified";
  }
}

function isInterestedLead(lead) {
  if (!lead) return false;
  const s = String(lead.status || "").toUpperCase();
  return (
    s === "INTERESTED" ||
    s === "QUALIFIED" ||
    s === "WARM_TRANSFER" ||
    s === "HANDED_OFF"
  );
}

function isCallbackLead(lead) {
  if (!lead) return false;
  if (isInterestedLead(lead)) return false;
  const s = String(lead.status || "").toUpperCase();
  if (s === "CALLBACK_SCHEDULED" || s === "CALLBACK" || s === "CALLBACK_REQUESTED") {
    return true;
  }
  if (
    lead.callback &&
    lead.callback.status !== "COMPLETED" &&
    lead.callback.status !== "CANCELLED" &&
    !["NEW", "CONTACTED", "ENGAGED", "CLOSED_WON", "CLOSED_LOST", "SUPPRESSED_DNC"].includes(s)
  ) {
    return true;
  }
  return false;
}

function getCallbackObject(lead) {
  if (lead.callback) {
    return {
      ...lead.callback,
      id: lead.callback.id || `cb-${lead.id}`,
      lead_id: lead.id,
      lead_name: lead.name,
      lead_company: lead.company,
      lead_phone: lead.phone,
      lead_email: lead.email,
      due_at: lead.callback.due_at || lead.callback_due || lead.next_action_time,
      status: lead.callback.status || "OPEN",
      sla_status: lead.callback.sla_status || "ON_TRACK",
      notes: lead.callback.notes || lead.notes || "Inbound callback requested during outreach.",
      rep_name: lead.callback.rep_name || lead.assigned_rep_name || "Unassigned",
    };
  }
  return {
    id: `cb-${lead.id}`,
    lead_id: lead.id,
    lead_name: lead.name,
    lead_company: lead.company,
    lead_phone: lead.phone,
    lead_email: lead.email,
    due_at: lead.callback_due || lead.next_action_time || new Date().toISOString(),
    status: "OPEN",
    sla_status: lead.callback_due && new Date(lead.callback_due).getTime() < Date.now() ? "BREACHED" : "ON_TRACK",
    notes: lead.notes || "Callback requested during outreach.",
    rep_name: lead.assigned_rep_name || "Unassigned",
  };
}

export default function AsePipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingCallback, setCompletingCallback] = useState(null);
  const [contextLeadId, setContextLeadId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsRes, callbacksRes] = await Promise.all([
        aseService.getLeads({ limit: 100 }).catch(() => ({ items: [] })),
        aseService.getCallbacks({ limit: 100 }).catch(() => ({ items: [] })),
      ]);

      const cbMap = new Map();
      (callbacksRes?.items || []).forEach((cb) => {
        if (cb.lead_id) {
          cbMap.set(Number(cb.lead_id), cb);
          cbMap.set(String(cb.lead_id), cb);
        }
      });

      const mergedLeads = (leadsRes?.items || []).map((l) => {
        const foundCb = cbMap.get(l.id) || l.callback || null;
        return {
          ...l,
          callback: foundCb,
        };
      });

      const existingIds = new Set(mergedLeads.map((l) => Number(l.id)));
      (callbacksRes?.items || []).forEach((cb) => {
        if (cb.lead_id && !existingIds.has(Number(cb.lead_id))) {
          existingIds.add(Number(cb.lead_id));
          mergedLeads.push({
            id: cb.lead_id,
            name: cb.lead_name || "Callback Lead",
            company: cb.lead_company || "",
            email: cb.lead_email || "",
            phone: cb.lead_phone || "",
            priority: cb.priority ?? cb.lead_priority ?? 50,
            status: "CALLBACK_SCHEDULED",
            callback: cb,
            callback_due: cb.due_at,
            next_action: "REP_CALLBACK",
            assigned_rep_name: cb.rep_name || cb.assigned_rep_name || "Unassigned",
          });
        } else if (!cb.lead_id) {
          mergedLeads.push({
            id: `cb-${cb.id}`,
            name: cb.lead_name || "Callback Lead",
            company: cb.lead_company || "",
            email: cb.lead_email || "",
            phone: cb.lead_phone || "",
            priority: cb.priority ?? 50,
            status: "CALLBACK_SCHEDULED",
            callback: cb,
            callback_due: cb.due_at,
            next_action: "REP_CALLBACK",
            assigned_rep_name: cb.rep_name || cb.assigned_rep_name || "Unassigned",
          });
        }
      });

      setLeads(mergedLeads);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getLeadsByStatus = (status) => {
    if (status === "INTERESTED") {
      return leads.filter((l) => isInterestedLead(l));
    }
    if (status === "CALLBACK_SCHEDULED") {
      return leads.filter((l) => isCallbackLead(l));
    }
    if (status === "NEW") {
      return leads.filter((l) => {
        const s = String(l.status || "").toUpperCase();
        return (s === "NEW" || s === "QUEUED") && !isInterestedLead(l) && !isCallbackLead(l);
      });
    }
    if (status === "CONTACTED") {
      return leads.filter((l) => {
        const s = String(l.status || "").toUpperCase();
        return s === "CONTACTED" && !isInterestedLead(l) && !isCallbackLead(l);
      });
    }
    if (status === "ENGAGED") {
      return leads.filter((l) => {
        const s = String(l.status || "").toUpperCase();
        return s === "ENGAGED" && !isInterestedLead(l) && !isCallbackLead(l);
      });
    }
    if (status === "CLOSED_WON") {
      return leads.filter((l) => String(l.status || "").toUpperCase() === "CLOSED_WON");
    }
    if (status === "CLOSED_LOST") {
      return leads.filter((l) => {
        const s = String(l.status || "").toUpperCase();
        return s === "CLOSED_LOST" || s === "CLOSED_UNQUALIFIED" || s === "NOT_INTERESTED" || s === "NO_RESPONSE";
      });
    }
    if (status === "SUPPRESSED_DNC") {
      return leads.filter((l) => {
        const s = String(l.status || "").toUpperCase();
        return s === "SUPPRESSED_DNC" || Boolean(l.do_not_contact);
      });
    }
    return leads.filter((l) => String(l.status || "").toUpperCase() === status);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Kanban</h1>
          <p className="text-muted-foreground mt-1">
            Visual progression of leads across autonomous outreach stages and rep handoffs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RotateCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/ase/callbacks">
              <PhoneCall className="w-4 h-4 mr-1.5 text-amber-600" />
              Callbacks Queue
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/ase/leads">Table View</Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colLeads = getLeadsByStatus(col.key);
          const isTerminal = ["CLOSED_WON", "CLOSED_LOST", "SUPPRESSED_DNC"].includes(col.key);
          const isCallbackCol = col.key === "CALLBACK_SCHEDULED";
          const isInterestedCol = col.key === "INTERESTED";

          return (
            <div
              key={col.key}
              className={`flex-shrink-0 w-80 rounded-lg border bg-muted/20 flex flex-col max-h-[780px] border-t-4 ${col.color}`}
            >
              <div className="p-3 border-b flex items-center justify-between bg-card rounded-t">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs tracking-wider uppercase">{col.label}</span>
                  {isInterestedCol && colLeads.length > 0 && (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  )}
                  {isCallbackCol && colLeads.some((l) => {
                    const cb = l.callback || {};
                    return getCallbackUrgency(cb.due_at || l.callback_due, cb.status) === "SLA BREACHED";
                  }) && (
                    <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  )}
                </div>
                <Badge
                  variant={colLeads.length > 0 ? "default" : "secondary"}
                  className={`text-xs ${
                    isInterestedCol && colLeads.length > 0
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : isCallbackCol && colLeads.length > 0
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : ""
                  }`}
                >
                  {colLeads.length}
                </Badge>
              </div>

              <div className="p-2 flex-1 overflow-y-auto space-y-2">
                {colLeads.map((lead) => {
                  const isLeadInterested = isInterestedCol || isInterestedLead(lead);
                  const isLeadInCallback = isCallbackCol || isCallbackLead(lead);
                  const cbObj = isLeadInCallback ? getCallbackObject(lead) : null;
                  const urgency = cbObj ? getCallbackUrgency(cbObj.due_at, cbObj.status) : null;
                  const isBreached = urgency === "SLA BREACHED";

                  if (isLeadInterested) {
                    return (
                      <Card
                        key={lead.id}
                        className="shadow-none transition-all duration-200 hover:shadow-md border border-emerald-400/80 hover:border-emerald-500 bg-card hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10"
                      >
                        <CardContent className="p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-bold px-2 py-0.5 text-[10px] gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              HIGH INTENT
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono font-semibold">
                              P-{lead.priority}
                            </Badge>
                          </div>

                          <div>
                            <Link
                              to={`/ase/leads/${lead.id}`}
                              className="font-bold text-xs hover:underline text-foreground block truncate"
                            >
                              {lead.name}
                            </Link>
                            <div className="flex flex-col gap-0.5 mt-1 text-[11px] text-muted-foreground">
                              {lead.company && (
                                <span className="flex items-center gap-1 truncate font-medium text-foreground/80">
                                  <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                  {lead.company}
                                </span>
                              )}
                              {lead.phone && (
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="flex items-center gap-1 font-mono hover:text-primary transition-colors truncate"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                  {lead.phone}
                                </a>
                              )}
                              {lead.email && (
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="flex items-center gap-1 hover:text-primary transition-colors truncate"
                                >
                                  <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                                  {lead.email}
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-md p-2 text-[11px] text-muted-foreground border border-emerald-200/70 dark:border-emerald-800/40">
                            <div className="flex items-start gap-1.5">
                              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <p className="line-clamp-2 leading-relaxed text-foreground/90 font-medium">
                                {lead.callback?.notes || lead.notes || lead.metadata?.summary || "High intent interest confirmed. Prospect ready for rep engagement."}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {lead.next_action ? `Next: ${lead.next_action}` : "Ready for Outreach"}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 truncate max-w-[110px]">
                                <User className="w-3 h-3 shrink-0 text-muted-foreground" />
                                <span className="truncate">{lead.assigned_rep_name || lead.callback?.rep_name || "Unassigned"}</span>
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] px-2 font-medium"
                                onClick={() => setContextLeadId(lead.id)}
                              >
                                Context
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-[10px] px-2 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => setCompletingCallback(getCallbackObject(lead))}
                              >
                                <PhoneCall className="w-3 h-3 mr-1" />
                                Connect
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  if (isLeadInCallback && cbObj) {
                    return (
                      <Card
                        key={lead.id}
                        className={`shadow-none transition-all duration-200 hover:shadow-md border ${
                          isBreached
                            ? "border-rose-400 bg-rose-50/20 dark:bg-rose-950/20"
                            : "border-border hover:border-amber-400/80 bg-card"
                        }`}
                      >
                        <CardContent className="p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <CallbackStatusBadge dueAt={cbObj.due_at} status={cbObj.status} />
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono font-semibold">
                              P-{lead.priority}
                            </Badge>
                          </div>

                          <div>
                            <Link
                              to={`/ase/leads/${lead.id}`}
                              className="font-bold text-xs hover:underline text-foreground block truncate"
                            >
                              {lead.name}
                            </Link>
                            <div className="flex flex-col gap-0.5 mt-1 text-[11px] text-muted-foreground">
                              {lead.company && (
                                <span className="flex items-center gap-1 truncate font-medium text-foreground/80">
                                  <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                  {lead.company}
                                </span>
                              )}
                              {lead.phone && (
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="flex items-center gap-1 font-mono hover:text-primary transition-colors truncate"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                  {lead.phone}
                                </a>
                              )}
                              {lead.email && (
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="flex items-center gap-1 hover:text-primary transition-colors truncate"
                                >
                                  <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                                  {lead.email}
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="bg-muted/50 rounded-md p-2 text-[11px] text-muted-foreground border border-border/40">
                            <div className="flex items-start gap-1.5">
                              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
                              <p className="line-clamp-2 leading-relaxed">
                                {cbObj.notes || "Inbound callback requested during outreach."}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className={`w-3 h-3 ${isBreached ? "text-rose-500 font-bold" : "text-muted-foreground"}`} />
                                <span className={isBreached ? "text-rose-600 font-semibold dark:text-rose-400" : ""}>
                                  {formatDueTime(cbObj.due_at)}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 truncate max-w-[110px]">
                                <User className="w-3 h-3 shrink-0 text-muted-foreground" />
                                <span className="truncate">{cbObj.rep_name || "Unassigned"}</span>
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] px-2 font-medium"
                                onClick={() => setContextLeadId(lead.id)}
                              >
                                Context
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-[10px] px-2 font-medium bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={() => setCompletingCallback(cbObj)}
                              >
                                <PhoneCall className="w-3 h-3 mr-1" />
                                Resolve
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <Card key={lead.id} className="shadow-none hover:border-primary/50 transition-colors">
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-start justify-between">
                          <Link
                            to={`/ase/leads/${lead.id}`}
                            className="font-semibold text-xs hover:underline text-primary truncate max-w-[170px]"
                          >
                            {lead.name}
                          </Link>
                          <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                            P-{lead.priority}
                          </Badge>
                        </div>

                        <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
                          {lead.company && (
                            <span className="flex items-center gap-1 truncate">
                              <Building2 className="w-3 h-3 shrink-0 text-muted-foreground" />
                              {lead.company}
                            </span>
                          )}
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1 font-mono hover:text-primary transition-colors truncate">
                              <Phone className="w-3 h-3 shrink-0 text-muted-foreground" />
                              {lead.phone}
                            </a>
                          )}
                          {lead.email && !lead.phone && (
                            <span className="truncate">{lead.email}</span>
                          )}
                        </div>

                        {lead.next_action && !isTerminal && (
                          <div className="text-[10px] text-primary font-medium flex items-center gap-1 bg-primary/5 p-1 rounded">
                            {lead.next_action === "EMAIL" ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                            Next: {lead.next_action}
                          </div>
                        )}

                        {isTerminal && (
                          <div className="text-[10px] text-muted-foreground italic">
                            Outreach Complete
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1 truncate max-w-[120px]">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.assigned_rep_name || "Unassigned"}</span>
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] px-1.5"
                            onClick={() => setContextLeadId(lead.id)}
                          >
                            Context
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {colLeads.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {completingCallback && (
        <CompleteCallModal
          callback={completingCallback}
          isOpen={Boolean(completingCallback)}
          onClose={() => setCompletingCallback(null)}
          onSuccess={fetchData}
        />
      )}

      {contextLeadId && (
        <CallbackContextDrawer
          leadId={contextLeadId}
          isOpen={Boolean(contextLeadId)}
          onClose={() => setContextLeadId(null)}
        />
      )}
    </div>
  );
}
