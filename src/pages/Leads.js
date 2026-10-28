import React, { useState, useEffect } from "react";
import {
  Plus,
  Upload,
  Trash2,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Webhook,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Phone,
  Mail,
  ShieldAlert,
  UserCheck,
  ChevronRight,
  Activity,
  Code,
  Zap,
  Search,
  Sparkles,
  Bot,
  X,
  ExternalLink,
  Building,
} from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useToast } from "../components/ui/toast";
import { leadApi, callbackApi, suppressionApi, voiceApi } from "../lib/api";
import SegmentedPagination from "../components/ui/pagination";
import CsvExcelImportDialog from "../components/leads/CsvExcelImportDialog";
import ApiWebhookCaptureDialog from "../components/leads/ApiWebhookCaptureDialog";

const HEALTH_COLORS = {
  GREEN: "bg-emerald-500",
  AMBER: "bg-amber-500",
  RED: "bg-rose-500 animate-pulse",
};

const STATUS_VARIANTS = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  QUEUED: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  CONTACTED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  ENGAGED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  INTERESTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold",
  CALLBACK_SCHEDULED: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-semibold",
  CLOSED_WON: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 font-bold",
  CLOSED_LOST: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  SUPPRESSED_DNC: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 font-bold",
};

export default function Leads() {
  const [activeTab, setActiveTab] = useState("all");
  const [leads, setLeads] = useState([]);
  const [callbacks, setCallbacks] = useState([]);
  const [stats, setStats] = useState({ total: 0, bySource: {}, byStatus: {}, callbacks: {} });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [apiWebhookOpen, setApiWebhookOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [completeCallbackTarget, setCompleteCallbackTarget] = useState(null);

  const fetchLeads = async (page = currentPage, query = searchQuery) => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize };
      if (query && query.trim()) params.q = query.trim();
      if (activeTab === "pipeline") params.status = "CONTACTED";
      if (activeTab === "dnc") params.status = "SUPPRESSED_DNC";
      if (activeTab === "api") params.source = "API";
      if (activeTab === "csv") params.source = "CSV_IMPORT";
      const res = await leadApi.list(params);
      setLeads(res.data || []);
      if (res.pagination?.total !== undefined) {
        setTotalCount(Number(res.pagination.total) || 0);
      } else {
        setTotalCount((res.data || []).length);
      }
    } catch (err) {
      toastError("Error", err.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchLeads(1, searchQuery);
    fetchStats();
    fetchCallbacks();
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchLeads(1, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchLeads(newPage, searchQuery);
  };

  const calculatedPages = Math.ceil(totalCount / pageSize);
  const totalPages = Math.max(calculatedPages > 0 ? calculatedPages : 4, 1);

  const fetchStats = async () => {
    try {
      const res = await leadApi.stats();
      setStats(res.data || { total: 0, bySource: {}, byStatus: {}, callbacks: {} });
    } catch (err) { }
  };

  const fetchCallbacks = async () => {
    try {
      const res = await callbackApi.list();
      setCallbacks(res.data || []);
    } catch (err) { }
  };

  const openLeadDetail = async (leadId) => {
    try {
      const res = await leadApi.get(leadId);
      setSelectedLead(res.data);
      setDetailOpen(true);
    } catch (err) {
      toastError("Error", "Could not load lead detail");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await leadApi.remove(id);
      success("Deleted", "Lead has been deleted.");
      fetchLeads();
      fetchStats();
    } catch (err) {
      toastError("Error", err.message);
    }
  };

  const handleQuickCall = async (lead) => {
    if (!lead?.phone) return;
    try {
      const res = await voiceApi.callLead({
        leadId: Number(lead.id),
        phone: lead.phone,
        name: lead.name,
      });
      if (res?.data?.status === "SUCCEEDED") {
        success("Call Placed", `Outbound voice call placed to ${lead.phone} via Plivo.`);
        fetchLeads();
      } else {
        toastError("Call Failed", res?.data?.error || "Could not place call.");
      }
    } catch (err) {
      toastError("Calling Error", err.message || "Failed to initiate call.");
    }
  };

  const activeInEngine =
    (stats.byStatus?.QUEUED || 0) +
    (stats.byStatus?.CONTACTED || 0) +
    (stats.byStatus?.ENGAGED || 0);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Autonomous Sales Engine</h1>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
              24/7 Engine Active
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Autonomous multi-channel outreach, durable timers, and sales rep callback handoffs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setApiWebhookOpen(true)}
            className="border-purple-200 dark:border-purple-800 hover:bg-purple-50/50"
          >
            <Webhook className="mr-2 h-4 w-4 text-purple-600" /> API / Webhook Capture
          </Button>
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50/50"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Import CSV / Excel
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Lead
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ingested Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Across CSV / Excel & API Webhook intake</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Active in Outreach
              <Activity className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{activeInEngine}</div>
            <p className="text-xs text-muted-foreground mt-1">Queued, Contacted & Engaged</p>
          </CardContent>
        </Card>

        <Card className={stats.callbacks?.overdue_count > 0 ? "border-rose-400 bg-rose-50/20" : "border-border"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Hot Rep Callbacks
              <Flame className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600">{stats.callbacks?.open_count || 0} Open</span>
              {stats.callbacks?.overdue_count > 0 && (
                <span className="text-xs font-semibold text-rose-600">({stats.callbacks.overdue_count} Overdue)</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires human sales rep follow-up</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Closed / DNC
              <ShieldAlert className="h-4 w-4 text-slate-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.byStatus?.CLOSED_WON || 0) + (stats.byStatus?.SUPPRESSED_DNC || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.byStatus?.CLOSED_WON || 0} Won • {stats.byStatus?.SUPPRESSED_DNC || 0} DNC Suppressed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <Button
          variant={activeTab === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("all")}
        >
          All Leads ({stats.total || 0})
        </Button>
        <Button
          variant={activeTab === "callbacks" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("callbacks")}
          className="relative"
        >
          <Clock className="w-3.5 h-3.5 mr-1.5" />
          Callback Queue ({stats.callbacks?.open_count || 0})
          {stats.callbacks?.overdue_count > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">
              {stats.callbacks.overdue_count}
            </span>
          )}
        </Button>
        <Button
          variant={activeTab === "pipeline" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("pipeline")}
        >
          Active Pipeline
        </Button>
        <Button
          variant={activeTab === "api" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("api")}
        >
          <Webhook className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
          API Stream ({stats.bySource?.API || 0})
        </Button>
        <Button
          variant={activeTab === "csv" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("csv")}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
          CSV / Excel ({stats.bySource?.CSV_IMPORT || 0})
        </Button>
        <Button
          variant={activeTab === "dnc" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("dnc")}
        >
          DNC Suppressed
        </Button>
      </div>

      {activeTab === "callbacks" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Human Sales Rep Callback Queue (30m SLA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Phone / Email</TableHead>
                    <TableHead>Due Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[140px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callbacks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No pending callbacks. Leads requiring human follow-up will appear here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    callbacks.map((cb) => {
                      const isOverdue = cb.status === "OVERDUE" || (cb.status === "OPEN" && new Date(cb.due_at) < new Date());
                      return (
                        <TableRow key={cb.id} className={isOverdue ? "bg-rose-50/30 dark:bg-rose-950/20" : ""}>
                          <TableCell className="font-medium">
                            <button
                              onClick={() => openLeadDetail(cb.lead_id)}
                              className="text-left hover:underline text-primary"
                            >
                              {cb.lead_name || "Lead #" + cb.lead_id}
                            </button>
                            <div className="text-xs text-muted-foreground">{cb.lead_company || "-"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-mono">{cb.lead_phone || "-"}</div>
                            <div className="text-xs text-muted-foreground">{cb.lead_email}</div>
                          </TableCell>
                          <TableCell>
                            <div className={`text-xs font-semibold ${isOverdue ? "text-rose-600" : "text-muted-foreground"}`}>
                              {new Date(cb.due_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(cb.due_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isOverdue ? "destructive" : "secondary"}>
                              {isOverdue ? "OVERDUE" : cb.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-xs truncate">{cb.notes || "Handoff from voice/email"}</TableCell>
                          <TableCell>
                            {cb.status !== "COMPLETED" ? (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setCompleteCallbackTarget(cb)}
                              >
                                Complete Call
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-emerald-600">Completed</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <CardTitle>Autonomous Pipeline Leads</CardTitle>
            <div className="relative w-full sm:w-72 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Find lead by name, company, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-sm rounded-lg border-border focus-visible:ring-primary/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center font-bold text-xs">#</TableHead>
                    <TableHead>Lead / Company</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Lifecycle State</TableHead>
                    <TableHead>Next Best Action</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">Loading leads...</TableCell>
                    </TableRow>
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No leads found in this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead, index) => {
                      const counters = lead.attempt_counters || { email: 0, voice: 0 };
                      const healthDot = HEALTH_COLORS[lead.health] || HEALTH_COLORS.GREEN;
                      const statusClass = STATUS_VARIANTS[lead.status] || "bg-secondary text-secondary-foreground";
                      const rowNumber = (currentPage - 1) * pageSize + index + 1;
                      const nextAction = lead.next_action || ((lead.status === "QUEUED" || lead.status === "NEW") && !lead.do_not_contact ? "EMAIL" : null);

                      return (
                        <TableRow key={lead.id} className="hover:bg-muted/50 cursor-pointer">
                          <TableCell onClick={() => openLeadDetail(lead.id)} className="w-[50px] text-center py-3 font-mono text-xs font-semibold text-muted-foreground">
                            {rowNumber}
                          </TableCell>
                          <TableCell onClick={() => openLeadDetail(lead.id)}>
                            <div className="font-medium flex items-center gap-1.5">
                              {lead.name || lead.email.split("@")[0]}
                              {lead.do_not_contact ? (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0">DNC</Badge>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {lead.company || lead.email}
                            </div>
                          </TableCell>
                          <TableCell onClick={() => openLeadDetail(lead.id)}>
                            <Badge variant="outline" className="font-mono text-xs">
                              P-{lead.priority || 50}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={() => openLeadDetail(lead.id)}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${statusClass}`}>
                              {lead.status}
                            </span>
                          </TableCell>
                          <TableCell onClick={() => openLeadDetail(lead.id)}>
                            {nextAction ? (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                                {nextAction === "EMAIL" && <Mail className="w-3.5 h-3.5 text-blue-500" />}
                                {nextAction === "CALL" && <Phone className="w-3.5 h-3.5 text-green-500" />}
                                <span>{nextAction}</span>
                                {lead.next_action_time && (
                                  <span className="text-[10px] text-muted-foreground">
                                    ({new Date(lead.next_action_time).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })} IST)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell onClick={() => openLeadDetail(lead.id)}>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>✉ {counters.email || 0}</span>
                              <span>📞 {counters.voice || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {lead.phone && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Call with Plivo"
                                  className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  onClick={(e) => { e.stopPropagation(); handleQuickCall(lead); }}
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openLeadDetail(lead.id)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col items-center justify-center -mt-3 mb-6 gap-2">
        <SegmentedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
        <p className="text-center text-xs text-muted-foreground">
          Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalCount || leads.length} lead{(totalCount || leads.length) !== 1 ? "s" : ""}
        </p>
      </div>

      {selectedLead && (
        <LeadDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          data={selectedLead}
          onRefresh={() => {
            openLeadDetail(selectedLead.lead.id);
            fetchLeads();
            fetchStats();
          }}
        />
      )}

      {completeCallbackTarget && (
        <CompleteCallbackDialog
          open={Boolean(completeCallbackTarget)}
          onOpenChange={(v) => !v && setCompleteCallbackTarget(null)}
          callback={completeCallbackTarget}
          onSuccess={() => {
            fetchCallbacks();
            fetchStats();
            fetchLeads();
          }}
        />
      )}

      <AddLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => { setCurrentPage(1); fetchLeads(1); fetchStats(); }}
      />

      <CsvExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => { fetchLeads(); fetchStats(); }}
      />

      <ApiWebhookCaptureDialog
        open={apiWebhookOpen}
        onOpenChange={setApiWebhookOpen}
        onSuccess={() => { fetchLeads(); fetchStats(); }}
      />
    </div>
  );
}

function LeadDetailModal({ open, onOpenChange, data, onRefresh }) {
  const { lead, timeline = [] } = data;
  const { success, error: toastError } = useToast();
  const [updating, setUpdating] = useState(false);

  const handleStateChange = async (newStatus) => {
    try {
      setUpdating(true);
      await leadApi.update(lead.id, { status: newStatus });
      success("State Updated", `Lead transitioned to ${newStatus}`);
      onRefresh();
    } catch (err) {
      toastError("Error", err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDncToggle = async () => {
    try {
      setUpdating(true);
      await leadApi.update(lead.id, { do_not_contact: !lead.do_not_contact });
      success("Updated", lead.do_not_contact ? "Lead removed from DNC" : "Lead placed on DNC");
      onRefresh();
    } catch (err) {
      toastError("Error", err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickCall = async () => {
    if (!lead.phone) return;
    try {
      setUpdating(true);
      const res = await voiceApi.callLead({
        leadId: Number(lead.id),
        phone: lead.phone,
        name: lead.name,
      });
      if (res?.data?.status === "SUCCEEDED") {
        success("Call Placed", `Outbound voice call placed to ${lead.phone} via Plivo.`);
        onRefresh();
      } else {
        toastError("Call Failed", res?.data?.error || "Could not place call.");
      }
    } catch (err) {
      toastError("Calling Error", err.message || "Failed to initiate call.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAutonomousCall = async () => {
    if (!lead.phone) return;
    try {
      setUpdating(true);
      await voiceApi.triggerAutonomousCall({ leadId: Number(lead.id) });
      success("Autonomous Call Fired", `ASE Engine initiated voice call for ${lead.name || lead.email}`);
      onRefresh();
    } catch (err) {
      toastError("Autonomous Call Failed", err.message || "Failed to trigger call.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl lg:max-w-6xl xl:max-w-7xl w-[96vw] max-h-[90vh] overflow-y-auto p-6 md:p-8 sm:max-w-5xl lg:sm:max-w-6xl xl:sm:max-w-7xl">
        <DialogHeader className="border-b border-border/80 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2.5 text-foreground">
                {lead.name || lead.email}
                <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-border font-semibold">
                  {lead.status}
                </Badge>
                {lead.priority && (
                  <Badge variant="secondary" className="text-xs font-mono">
                    P{lead.priority}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span className="font-medium text-foreground">{lead.company || "Independent"}</span>
                <span>•</span>
                <span>Organization ID: {lead.organization_id}</span>
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/ase/leads/${lead.id}`}
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/30"
              >
                <span>Full Profile Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Email Address</span>
            <span className="text-sm font-semibold truncate block text-foreground">{lead.email}</span>
            <span className="text-xs text-muted-foreground block">
              Consent: <strong className="text-emerald-600 font-medium">{lead.email_consent?.status || "UNKNOWN"}</strong>
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Phone Number</span>
            <span className="text-sm font-semibold font-mono truncate block text-foreground">{lead.phone || "Not configured"}</span>
            <span className="text-xs text-muted-foreground block">
              Voice: <strong className="text-emerald-600 font-medium">{lead.voice_consent?.status || "UNKNOWN"}</strong>
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Engine Recommendation</span>
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400 block">{lead.next_action || "Idle / Complete"}</span>
            <span className="text-xs text-muted-foreground font-mono block">
              {lead.next_action_time ? `${new Date(lead.next_action_time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" })} IST` : "No pending touch"}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Lifecycle Health</span>
            <span className="text-sm font-semibold text-foreground block">
              Status: <strong className="text-primary">{lead.status}</strong>
            </span>
            <span className="text-xs text-muted-foreground block">
              DNC Flag: <strong className={lead.do_not_contact ? "text-rose-600" : "text-emerald-600"}>{lead.do_not_contact ? "Suppressed" : "Active"}</strong>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">Quick Actions:</span>
            {lead.phone && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 font-semibold shadow-none"
                disabled={updating || lead.do_not_contact}
                onClick={handleQuickCall}
              >
                <Phone className="w-3.5 h-3.5" />
                Call (Plivo)
              </Button>
            )}
            {lead.phone && (
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 h-8 font-semibold shadow-none"
                disabled={updating || lead.do_not_contact}
                onClick={handleAutonomousCall}
              >
                <Bot className="w-3.5 h-3.5" />
                Auto Call
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold"
              disabled={updating}
              onClick={() => handleStateChange("INTERESTED")}
            >
              Mark Interested
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold"
              disabled={updating}
              onClick={() => handleStateChange("CLOSED_WON")}
            >
              Mark Won
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold"
              disabled={updating}
              onClick={() => handleStateChange("CLOSED_LOST")}
            >
              Mark Lost
            </Button>
            <Button
              size="sm"
              variant={lead.do_not_contact ? "secondary" : "destructive"}
              className="h-8 text-xs font-semibold"
              disabled={updating}
              onClick={handleDncToggle}
            >
              {lead.do_not_contact ? "Remove DNC" : "Suppress DNC"}
            </Button>
          </div>
        </div>

        {lead.metadata?.company_research && (
          <div className="rounded-xl border border-violet-200/80 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/20 p-5 text-xs">
            <div className="flex items-center justify-between mb-3 border-b border-violet-200/60 dark:border-violet-800 pb-2">
              <span className="font-bold text-violet-700 dark:text-violet-300 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-violet-600" />
                AI Company Intelligence ({lead.metadata.company_research.company})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded border border-violet-300 font-mono text-muted-foreground uppercase">
                {lead.metadata.company_research.source || "ai_analyzed"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Executive Overview</span>
                <p className="text-foreground/90 text-xs leading-relaxed">{lead.metadata.company_research.summary}</p>
              </div>
              {lead.metadata.company_research.coreServices && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Core Services & Solutions</span>
                  <p className="text-foreground/90 text-xs leading-relaxed">{lead.metadata.company_research.coreServices}</p>
                </div>
              )}
            </div>
            {lead.metadata.company_research.growthOpportunity && (
              <div className="mt-3 rounded-lg p-3 bg-background/80 border border-violet-200/80 dark:border-violet-800">
                <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300 block mb-0.5">Autonomous Outreach Angle</span>
                <p className="text-xs text-foreground leading-relaxed">{lead.metadata.company_research.growthOpportunity}</p>
              </div>
            )}
          </div>
        )}

        <div className="border border-border/80 rounded-xl p-5 bg-card">
          <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Activity className="w-4 h-4 text-primary" />
              Immutable Audit Trail & Timeline ({timeline.length} events)
            </h4>
            <span className="text-xs text-muted-foreground font-mono">Real-time outbox stream</span>
          </div>

          <div className="space-y-3">
            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No events recorded yet.</p>
            ) : (
                timeline.map((ev) => {
                  const p = ev.payload || {};
                  let title = ev.event_type;
                  let description = null;

                  if (ev.event_type === "ActionScheduled") {
                    title = `Outreach Scheduled (${p.action || ev.channel || "EMAIL"})`;
                    description = p.scheduled_for ? `Queued for ${new Date(p.scheduled_for).toLocaleTimeString()}` : "Queued by the Autonomous Engine";
                  } else if (ev.event_type === "ActionDispatched") {
                    title = `Outreach Dispatched (${p.action || ev.channel || "EMAIL"})`;
                    description = `Sent via ${ev.channel || "EMAIL"} channel`;
                  } else if (ev.event_type === "ActionCompleted" || ev.event_type === "EMAIL_SENT") {
                    title = `Outreach Delivered Successfully`;
                    description = p.subject ? `Subject: "${p.subject}"` : `Delivered to recipient inbox`;
                  } else if (ev.event_type === "ActionFailed" || ev.event_type === "EMAIL_FAILED") {
                    title = `Outreach Attempt Failed`;
                    description = p.error || p.reason || "Action was blocked or rejected by mail server";
                  } else if (ev.event_type === "LeadStateChanged") {
                    title = `Lead Status Updated`;
                    description = p.from_state && p.to_state ? `Moved from ${p.from_state} to ${p.to_state}` : "Lifecycle state updated";
                  } else if (ev.event_type === "COMPANY_RESEARCHED") {
                    title = `AI Company Research Completed`;
                    description = p.summary || `Researched ${p.company || "lead"}`;
                  } else if (ev.event_type === "ORCHESTRATOR_DECISION") {
                    title = `Autonomous Engine Decision`;
                    description = p.nextAction ? `Next action: ${p.nextAction}` : "Evaluated lead progression";
                  }

                  return (
                    <div key={ev.id} className="flex items-start gap-4 text-xs border-l-2 border-primary/50 pl-4 py-2 hover:bg-muted/20 rounded-r-lg transition-colors">
                      <div className="min-w-[140px] text-xs font-mono text-muted-foreground pt-0.5">
                        {new Date(ev.created_at).toLocaleString()}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 font-bold rounded bg-muted text-muted-foreground uppercase font-mono">via {ev.channel}</span>
                        </div>
                        {description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompleteCallbackDialog({ open, onOpenChange, callback, onSuccess }) {
  const [disposition, setDisposition] = useState("interested");
  const [notes, setNotes] = useState("");
  const [leadStatus, setLeadStatus] = useState("ENGAGED");
  const [loading, setLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleComplete = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await callbackApi.update(callback.id, {
        status: "COMPLETED",
        notes,
        leadDisposition: disposition,
        leadStatus,
      });
      success("Callback Complete", "Rep callback logged successfully.");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toastError("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Sales Rep Callback</DialogTitle>
          <DialogDescription>Log the outcome for {callback.lead_name || "Lead"}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleComplete} className="space-y-4">
          <div className="space-y-2">
            <Label>Call Disposition</Label>
            <select
              className="w-full border rounded-md p-2 text-sm bg-background"
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
            >
              <option value="interested">Interested / Qualified</option>
              <option value="callback_again">Needs Follow-up Call</option>
              <option value="closed_won">Deal Closed (Won)</option>
              <option value="not_interested">Not Interested</option>
              <option value="wrong_number">Wrong Number / DNC</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Next Lead State</Label>
            <select
              className="w-full border rounded-md p-2 text-sm bg-background"
              value={leadStatus}
              onChange={(e) => setLeadStatus(e.target.value)}
            >
              <option value="ENGAGED">ENGAGED (Continue Engine)</option>
              <option value="INTERESTED">INTERESTED</option>
              <option value="CLOSED_WON">CLOSED_WON</option>
              <option value="CLOSED_LOST">CLOSED_LOST</option>
              <option value="SUPPRESSED_DNC">SUPPRESSED_DNC</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Rep Call Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Discussed pricing tier, sent proposal"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save & Complete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddLeadDialog({ open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({ name: "", email: "", company: "", phone: "", priority: 50 });
  const [loading, setLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await leadApi.create({
        ...formData,
        source: "MANUAL",
        consentEmail: true,
        matchDomain: false,
        updateExisting: false,
      });
      if (res?.data?.status === "skipped") {
        toastError("Already exists", "This email or phone is already in the lead list.");
        onSuccess();
        return;
      }
      success("Lead Added", "Successfully added a new lead.");
      onSuccess();
      onOpenChange(false);
      setFormData({ name: "", email: "", company: "", phone: "", priority: 50 });
    } catch (err) {
      toastError("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>Manually add a single lead to your Autonomous Sales Engine.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Priority (1-100, higher runs first)</Label>
            <Input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Lead"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

