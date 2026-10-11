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
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useToast } from "../components/ui/toast";
import { leadApi, callbackApi, suppressionApi } from "../lib/api";
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

  const activeInEngine =
    (stats.byStatus?.QUEUED || 0) +
    (stats.byStatus?.CONTACTED || 0) +
    (stats.byStatus?.ENGAGED || 0);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
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

      {/* ASE Metrics */}
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

      {/* Tabs */}
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

      {/* View 1: Callback Queue */}
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
        /* View 2: Leads Table */
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
                            {lead.next_action ? (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                                {lead.next_action === "EMAIL" && <Mail className="w-3.5 h-3.5 text-blue-500" />}
                                {lead.next_action === "CALL" && <Phone className="w-3.5 h-3.5 text-green-500" />}
                                <span>{lead.next_action}</span>
                                {lead.next_action_time && (
                                  <span className="text-[10px] text-muted-foreground">
                                    ({new Date(lead.next_action_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
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

      {/* Centered Segmented Pagination & Summary */}
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

      {/* Lead Detail & Timeline Drawer/Modal */}
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

      {/* Callback Completion Modal */}
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

      {/* Add Lead Dialog */}
      <AddLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => { fetchLeads(); fetchStats(); }}
      />

      {/* CSV / Excel Import Dialog */}
      <CsvExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => { fetchLeads(); fetchStats(); }}
      />

      {/* Real-time Authenticated API & Webhook Lead Capture Dialog */}
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {lead.name || lead.email}
              <Badge variant="outline">{lead.status}</Badge>
            </DialogTitle>
          </div>
          <DialogDescription>
            {lead.company || "Independent"} • Organization ID: {lead.organization_id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4 border-y border-border my-2">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Email</div>
            <div className="text-sm font-semibold truncate">{lead.email}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Consent: {lead.email_consent?.status || "GRANTED"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Phone</div>
            <div className="text-sm font-semibold truncate">{lead.phone || "-"}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Voice: {lead.voice_consent?.status || "GRANTED"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Engine Recommendation</div>
            <div className="text-sm font-semibold text-primary">{lead.next_action || "Idle / Complete"}</div>
            {lead.next_action_time && (
              <div className="text-[10px] text-muted-foreground">
                Scheduled: {new Date(lead.next_action_time).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* State Management Toolbar */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-xs text-muted-foreground mr-1">Quick Action:</span>
          <Button
            size="sm"
            variant="outline"
            disabled={updating}
            onClick={() => handleStateChange("INTERESTED")}
          >
            Mark Interested
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={updating}
            onClick={() => handleStateChange("CLOSED_WON")}
          >
            Mark Won
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={updating}
            onClick={() => handleStateChange("CLOSED_LOST")}
          >
            Mark Lost
          </Button>
          <Button
            size="sm"
            variant={lead.do_not_contact ? "secondary" : "destructive"}
            disabled={updating}
            onClick={handleDncToggle}
          >
            {lead.do_not_contact ? "Remove DNC" : "Suppress DNC"}
          </Button>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-primary" />
            Immutable Audit Trail & Timeline ({timeline.length} events)
          </h4>
          <div className="space-y-3">
            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground">No events recorded yet.</p>
            ) : (
              timeline.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 text-xs border-l-2 border-primary/40 pl-3 py-1">
                  <div className="min-w-[120px] text-[10px] text-muted-foreground">
                    {new Date(ev.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-semibold">{ev.event_type}</span>
                    <span className="text-muted-foreground ml-2">via {ev.channel}</span>
                    {ev.payload && (
                      <pre className="mt-1 p-1.5 bg-muted rounded text-[10px] font-mono overflow-x-auto max-w-lg">
                        {JSON.stringify(ev.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))
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
      await leadApi.create({ ...formData, source: "MANUAL" });
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

