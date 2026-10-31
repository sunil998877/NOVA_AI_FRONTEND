import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Upload,
  Phone,
  Mail,
  Clock,
  ShieldAlert,
  ChevronRight,
  CheckSquare,
  Square,
  Webhook,
  RefreshCw,
} from "lucide-react";
import { listNextBestAction } from "../../lib/presentNextBestAction";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { useToast } from "../../components/ui/toast";
import { aseService } from "../../services/ase.service";
import { AutonomousCallButton } from "../../components/ase/AutonomousCallButton";
import { ENROLLMENT_META, formatDue, humanize } from "../../lib/cadence";
import SegmentedPagination from "../../components/ui/pagination";
import ApiWebhookCaptureDialog from "../../components/leads/ApiWebhookCaptureDialog";

const HEALTH_COLORS = {
  GREEN: "bg-emerald-500",
  AMBER: "bg-amber-500",
  RED: "bg-rose-500 animate-pulse",
};

const STATUS_BADGES = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  QUEUED: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  CONTACTED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  ENGAGED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  INTERESTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold",
  CALLBACK_SCHEDULED: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold",
  CLOSED_WON: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 font-bold",
  CLOSED_LOST: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  SUPPRESSED_DNC: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 font-bold",
};

function HealthDot({ health }) {
  return (
    <div
      className={`h-2 w-2 shrink-0 rounded-full ${HEALTH_COLORS[health] || HEALTH_COLORS.GREEN}`}
      title={`Health: ${health}`}
    />
  );
}

function SelectToggle({ checked, onClick, label }) {
  return (
    <button type="button" onClick={onClick} className="p-1 shrink-0" aria-label={label} aria-pressed={checked}>
      {checked ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded text-xs ${STATUS_BADGES[status] || "bg-secondary text-secondary-foreground"}`}>
      {status}
    </span>
  );
}

function NbaLine({ nba }) {
  const muted = nba.action === "WAIT" || nba.action === "CLOSED" || nba.action === "DNC";
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-primary">
      {nba.action === "EMAIL" && <Mail className="h-3.5 w-3.5 shrink-0 text-blue-500" />}
      {nba.action === "CALL" && <Phone className="h-3.5 w-3.5 shrink-0 text-green-500" />}
      {nba.action === "REP_CALLBACK" && <Phone className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
      {nba.action === "WAIT" && <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      {nba.action === "DNC" && <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-destructive" />}
      <span className={muted ? "text-muted-foreground" : ""}>{nba.label}</span>
    </div>
  );
}

function CadenceBlock({ cadence, nowrap = false }) {
  if (!cadence) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="min-w-0">
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ENROLLMENT_META[cadence.status]?.tone || "bg-muted"}`}>
        {ENROLLMENT_META[cadence.status]?.label || humanize(cadence.status)}
      </span>
      <div className={`mt-0.5 text-[11px] text-muted-foreground ${nowrap ? "whitespace-nowrap" : ""}`}>
        {humanize(cadence.latestOutcome || cadence.stage)}
        {cadence.nextDueAt ? ` · next ${formatDue(cadence.nextDueAt)}` : ""}
      </div>
    </div>
  );
}

function LeadIdentity({ lead }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <HealthDot health={lead.health} />
      <div className="min-w-0">
        <Link to={`/ase/leads/${lead.id}`} className="block truncate text-sm font-semibold text-primary hover:underline">
          {lead.name}
        </Link>
        <div className="truncate text-xs text-muted-foreground">{lead.email}</div>
      </div>
    </div>
  );
}

function LeadCard({ lead, selected, onToggle }) {
  const nba = listNextBestAction(lead);
  return (
    <div className={`rounded-xl border border-border bg-card p-3.5 ${selected ? "bg-muted/40" : ""}`}>
      <div className="flex items-start gap-2">
        <SelectToggle checked={selected} onClick={() => onToggle(lead.id)} label={`Select ${lead.name || "lead"}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <LeadIdentity lead={lead} />
            <Badge variant="outline" className="shrink-0 font-mono text-xs">P-{lead.priority}</Badge>
          </div>
          <div className="mt-2 truncate text-sm font-medium">{lead.company || "—"}</div>
          <div className="truncate text-xs text-muted-foreground">{lead.industry || lead.location || "—"}</div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StatusPill status={lead.status} />
            <NbaLine nba={nba} />
          </div>
          <div className="mt-2 text-xs">
            <CadenceBlock cadence={lead.cadence} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className={`truncate text-xs ${lead.assigned_rep_name ? "font-medium text-foreground" : "italic text-muted-foreground"}`}>
              {lead.assigned_rep_name || "Unassigned"}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              {lead.phone && <AutonomousCallButton lead={lead} variant="icon" />}
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link to={`/ase/leads/${lead.id}`} aria-label={`Open ${lead.name || "lead"}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function listFiltersFromSearch(searchParams, { q, status, page, limit }) {
  const filters = { q, status, page, limit };
  const source = searchParams.get("source");
  const health = searchParams.get("health");
  const minPriority = searchParams.get("min_priority");
  const emailConsent = searchParams.get("email_consent");
  const doNotContact = searchParams.get("do_not_contact");
  if (source) filters.source = source;
  if (health) filters.health = health;
  if (minPriority) filters.min_priority = minPriority;
  if (emailConsent) filters.email_consent = emailConsent;
  if (doNotContact != null && doNotContact !== "") filters.do_not_contact = doNotContact;
  return filters;
}

export default function AseLeads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [apiWebhookOpen, setApiWebhookOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "");
    setSearchTerm(searchParams.get("q") || "");
    setCurrentPage(1);
    fetchLeads(1);
  }, [searchParams]);

  async function fetchLeads(page = currentPage) {
    setLoading(true);
    try {
      const data = await aseService.getLeads(
        listFiltersFromSearch(searchParams, {
          q: searchParams.get("q") || searchTerm,
          status: searchParams.get("status") || statusFilter,
          page,
          limit: pageSize,
        })
      );
      setLeads(data.items || []);
      setTotalCount(data.total ?? (data.items || []).length);
    } catch (err) {
      setLeads([]);
      setTotalCount(0);
      toastError("Error", err.message || "Could not load leads");
    } finally {
      setLoading(false);
    }
  }


  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchLeads(newPage);
  };

  const calculatedPages = Math.ceil(totalCount / pageSize);
  const totalPages = Math.max(calculatedPages, 1);

  const handleSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchTerm) next.set("q", searchTerm);
    else next.delete("q");
    setSearchParams(next);
  };

  const handleStatusChange = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("status", value);
    else next.delete("status");
    setSearchParams(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDnc = async () => {
    if (!window.confirm(`Suppress ${selectedIds.size} selected leads under DNC policy?`)) return;
    try {
      for (const id of selectedIds) {
        await aseService.updateLead(id, { do_not_contact: 1, status: "SUPPRESSED_DNC" });
      }
      success("DNC Applied", `Updated ${selectedIds.size} leads to DNC`);
      setSelectedIds(new Set());
      fetchLeads();
    } catch (err) {
      toastError("Error", err.message);
    }
  };

  const allSelected = leads.length > 0 && selectedIds.size === leads.length;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Lead Store</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Autonomous multi-channel lead records, intent tracking, and priority queues.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchLeads(currentPage)}
            disabled={loading}
            title="Refresh leads"
            aria-label="Refresh leads"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" onClick={() => setApiWebhookOpen(true)} aria-label="API / Webhook">
            <Webhook className="mr-0 h-4 w-4 text-purple-600 sm:mr-2" />
            <span className="hidden sm:inline">API / Webhook</span>
          </Button>
          <Button asChild variant="outline">
            <Link to="/ase/leads/import" aria-label="Import Leads">
              <Upload className="mr-0 h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Import Leads</span>
            </Link>
          </Button>
          <Button asChild>
            <Link to="/ase/team-console" aria-label="Team Console">
              <Phone className="mr-0 h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Team Console</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={handleSearch} className="flex w-full min-w-0 items-center gap-2 lg:max-w-md">
          <div className="relative w-full min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, company..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="shrink-0">Search</Button>
        </form>

        {(searchParams.get("source") || searchParams.get("health") || searchParams.get("min_priority") || searchParams.get("email_consent") || searchParams.get("do_not_contact")) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {searchParams.get("source") && <Badge variant="outline">Source {searchParams.get("source")}</Badge>}
            {searchParams.get("health") && <Badge variant="outline">Health {searchParams.get("health")}</Badge>}
            {searchParams.get("min_priority") && <Badge variant="outline">Priority ≥ {searchParams.get("min_priority")}</Badge>}
            {searchParams.get("email_consent") && <Badge variant="outline">Consent {searchParams.get("email_consent")}</Badge>}
            {searchParams.get("do_not_contact") && <Badge variant="outline">DNC {searchParams.get("do_not_contact")}</Badge>}
          </div>
        )}

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <select
            className="w-full min-w-0 rounded-md border bg-background px-3 py-2 text-sm sm:w-auto"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">All Lifecycle States</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="ENGAGED">ENGAGED</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="CALLBACK_SCHEDULED">CALLBACK_SCHEDULED</option>
            <option value="CLOSED_WON">CLOSED_WON</option>
            <option value="SUPPRESSED_DNC">SUPPRESSED_DNC</option>
          </select>

          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDnc} className="w-full sm:w-auto">
              <ShieldAlert className="mr-1.5 h-4 w-4" />
              Suppress Selected ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      <div className="lg:hidden">
        {leads.length > 0 && (
          <div className="mb-2 flex items-center gap-2 px-0.5">
            <SelectToggle checked={allSelected} onClick={toggleSelectAll} label="Select all leads on this page" />
            <span className="text-xs text-muted-foreground">Select page</span>
          </div>
        )}
        {loading ? (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            Loading Lead Store...
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
            No leads match your search criteria.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                selected={selectedIds.has(lead.id)}
                onToggle={toggleSelectOne}
              />
            ))}
          </div>
        )}
      </div>

      <Card className="hidden min-w-0 lg:block">
        <CardContent className="p-0">
          <div className="min-w-0 overflow-x-auto">
            <Table className="min-w-[1180px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 px-3">
                    <SelectToggle checked={allSelected} onClick={toggleSelectAll} label="Select all leads on this page" />
                  </TableHead>
                  <TableHead className="min-w-[200px] whitespace-nowrap px-3">Lead</TableHead>
                  <TableHead className="min-w-[180px] whitespace-nowrap px-3">Company & Industry</TableHead>
                  <TableHead className="whitespace-nowrap px-3">Priority</TableHead>
                  <TableHead className="whitespace-nowrap px-3">Lifecycle State</TableHead>
                  <TableHead className="min-w-[140px] whitespace-nowrap px-3">Next Best Action</TableHead>
                  <TableHead className="min-w-[220px] whitespace-nowrap px-3">Cadence</TableHead>
                  <TableHead className="min-w-[140px] whitespace-nowrap px-3">Assigned Rep</TableHead>
                  <TableHead className="w-16 px-3"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      Loading Lead Store...
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                      No leads match your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => {
                    const isSelected = selectedIds.has(lead.id);
                    const nba = listNextBestAction(lead);

                    return (
                      <TableRow key={lead.id} className={isSelected ? "bg-muted/40" : ""}>
                        <TableCell className="px-3 py-3">
                          <SelectToggle checked={isSelected} onClick={() => toggleSelectOne(lead.id)} label={`Select ${lead.name || "lead"}`} />
                        </TableCell>
                        <TableCell className="max-w-[260px] px-3 py-3">
                          <LeadIdentity lead={lead} />
                        </TableCell>
                        <TableCell className="max-w-[220px] px-3 py-3">
                          <div className="truncate text-sm font-medium">{lead.company || "—"}</div>
                          <div className="truncate text-xs text-muted-foreground">{lead.industry || lead.location || "—"}</div>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            P-{lead.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <StatusPill status={lead.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          <NbaLine nba={nba} />
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs">
                          <CadenceBlock cadence={lead.cadence} nowrap />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-3 text-xs">
                          {lead.assigned_rep_name ? (
                            <span className="font-medium text-foreground">{lead.assigned_rep_name}</span>
                          ) : (
                            <span className="italic text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {lead.phone && <AutonomousCallButton lead={lead} variant="icon" />}
                            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Link to={`/ase/leads/${lead.id}`} aria-label={`Open ${lead.name || "lead"}`}>
                                <ChevronRight className="h-4 w-4" />
                              </Link>
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

      <ApiWebhookCaptureDialog
        open={apiWebhookOpen}
        onOpenChange={setApiWebhookOpen}
        onSuccess={fetchLeads}
      />
    </div>
  );
}
