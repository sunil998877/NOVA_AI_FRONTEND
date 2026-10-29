import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Upload,
  Phone,
  Mail,
  ShieldAlert,
  ChevronRight,
  CheckSquare,
  Square,
  Webhook,
  RefreshCw,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { useToast } from "../../components/ui/toast";
import { aseService } from "../../services/ase.service";
import { ClickToCallButton } from "../../components/ase/ClickToCallButton";
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

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Store</h1>
          <p className="text-muted-foreground mt-1">
            Autonomous multi-channel lead records, intent tracking, and priority queues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchLeads(currentPage)}
            disabled={loading}
            title="Refresh leads"
            aria-label="Refresh leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" onClick={() => setApiWebhookOpen(true)}>
            <Webhook className="w-4 h-4 mr-2 text-purple-600" /> API / Webhook
          </Button>
          <Button asChild variant="outline">
            <Link to="/ase/leads/import">
              <Upload className="w-4 h-4 mr-2" /> Import Leads
            </Link>
          </Button>
          <Button asChild>
            <Link to="/ase/team-console">
              <Phone className="w-4 h-4 mr-2" /> Team Console
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, company..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">Search</Button>
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

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
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
            <Button variant="destructive" size="sm" onClick={handleBulkDnc}>
              <ShieldAlert className="w-4 h-4 mr-1.5" />
              Suppress Selected ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <button onClick={toggleSelectAll} className="p-1">
                      {selectedIds.size > 0 && selectedIds.size === leads.length ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Company & Industry</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Lifecycle State</TableHead>
                  <TableHead>Next Best Action</TableHead>
                  <TableHead>Assigned Rep</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Loading Lead Store...
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No leads match your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => {
                    const isSelected = selectedIds.has(lead.id);
                    const healthDot = HEALTH_COLORS[lead.health] || HEALTH_COLORS.GREEN;
                    const statusClass = STATUS_BADGES[lead.status] || "bg-secondary text-secondary-foreground";

                    return (
                      <TableRow key={lead.id} className={isSelected ? "bg-muted/40" : ""}>
                        <TableCell>
                          <button onClick={() => toggleSelectOne(lead.id)} className="p-1">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${healthDot}`} title={`Health: ${lead.health}`} />
                            <div>
                              <Link
                                to={`/ase/leads/${lead.id}`}
                                className="font-semibold text-sm hover:underline text-primary"
                              >
                                {lead.name}
                              </Link>
                              <div className="text-xs text-muted-foreground">{lead.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{lead.company || "-"}</div>
                          <div className="text-xs text-muted-foreground">{lead.industry || lead.location || "-"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            P-{lead.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${statusClass}`}>
                            {lead.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {(lead.next_action || ((lead.status === "QUEUED" || lead.status === "NEW") && !lead.do_not_contact ? "EMAIL" : null)) ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                              {(lead.next_action || "EMAIL") === "EMAIL" && <Mail className="w-3.5 h-3.5 text-blue-500" />}
                              {lead.next_action === "CALL" && <Phone className="w-3.5 h-3.5 text-green-500" />}
                              <span>{lead.next_action || "EMAIL"}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {lead.assigned_rep_name ? (
                            <span className="font-medium text-foreground">{lead.assigned_rep_name}</span>
                          ) : (
                            <span className="text-muted-foreground italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            {lead.phone && (
                              <ClickToCallButton lead={lead} variant="icon" />
                            )}
                            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Link to={`/ase/leads/${lead.id}`}>
                                <ChevronRight className="w-4 h-4" />
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
