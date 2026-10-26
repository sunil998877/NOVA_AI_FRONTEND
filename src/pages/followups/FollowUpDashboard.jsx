import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  StopCircle,
  Eye,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  ShieldAlert,
  Send,
  RefreshCw,
  AlertTriangle,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { useToast } from "../../components/ui/toast";
import { followUpService } from "../../services/followUp.service";

export default function FollowUpDashboard() {
  const { success, error: toastError } = useToast();
  const [enrollments, setEnrollments] = useState([]);
  const [automationSettings, setAutomationSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState("");

  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [stopScope, setStopScope] = useState("organization");
  const [stopTargetId, setStopTargetId] = useState(null);
  const [stopTargetName, setStopTargetName] = useState("");
  const [stopReason, setStopReason] = useState("");

  useEffect(() => {
    loadAllData();
  }, [statusFilter]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [enrData, settings] = await Promise.all([
        followUpService.getEnrollments(statusFilter ? { status: statusFilter } : {}),
        followUpService.getAutomationStatus(),
      ]);
      setEnrollments(enrData || []);
      setAutomationSettings(settings || null);
    } catch (err) {
      toastError("Error", "Could not load follow-up dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAutomation = async () => {
    try {
      setActionLoading(true);
      await followUpService.startAutomation();
      success("Automation Started", "Automatic lead enrollment and dispatch are now active.");
      await loadAllData();
    } catch (err) {
      toastError("Start Error", err.message || "Failed to start automation");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseAutomation = async () => {
    try {
      setActionLoading(true);
      await followUpService.pauseAutomation({
        scope: "organization",
        reason: pauseReason || "Paused by admin",
      });
      setPauseModalOpen(false);
      setPauseReason("");
      success("Automation Paused", "Automatic enrollment stopped and scheduled jobs safely deferred.");
      await loadAllData();
    } catch (err) {
      toastError("Pause Error", err.message || "Failed to pause automation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeAutomation = async () => {
    try {
      setActionLoading(true);
      await followUpService.resumeAutomation({ scope: "organization" });
      success("Automation Resumed", "Processing resumed. Overdue touches are staggered safely.");
      await loadAllData();
    } catch (err) {
      toastError("Resume Error", err.message || "Failed to resume automation");
    } finally {
      setActionLoading(false);
    }
  };

  const openStopModal = (scope = "organization", id = null, name = "") => {
    setStopScope(scope);
    setStopTargetId(id);
    setStopTargetName(name);
    setStopReason("");
    setStopModalOpen(true);
  };

  const handleConfirmStop = async () => {
    try {
      setActionLoading(true);
      await followUpService.stopAutomation({
        scope: stopScope,
        id: stopTargetId,
        reason: stopReason || "Stopped by user",
      });
      setStopModalOpen(false);
      success("Automation Stopped", `Successfully stopped automation for ${stopScope}. Historical logs preserved.`);
      await loadAllData();
    } catch (err) {
      toastError("Stop Error", err.message || "Failed to stop automation");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseLead = async (id) => {
    try {
      setActionLoading(true);
      await followUpService.pauseAutomation({ scope: "lead", id, reason: "Manually paused from dashboard" });
      success("Sequence Paused", "Lead follow-up paused.");
      await loadAllData();
    } catch (err) {
      toastError("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeLead = async (id) => {
    try {
      setActionLoading(true);
      await followUpService.resumeAutomation({ scope: "lead", id });
      success("Sequence Resumed", "Lead follow-up resumed.");
      await loadAllData();
    } catch (err) {
      toastError("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const leadName = e.lead?.name || "";
    const company = e.lead?.company || "";
    const email = e.lead?.email || "";
    return leadName.toLowerCase().includes(q) || company.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  const activeCount = enrollments.filter((e) => e.computed_status === "Active" || e.status === "ACTIVE" || e.status === "active").length;
  const pausedCount = enrollments.filter((e) => e.computed_status === "Paused" || e.status?.toLowerCase().includes("paused") || e.status === "REPLIED").length;
  const stoppedCount = enrollments.filter((e) => e.computed_status === "Stopped" || e.status?.toLowerCase().includes("stopped") || e.status === "CANCELLED").length;
  const completedCount = enrollments.filter((e) => e.computed_status === "Completed" || e.status === "COMPLETED" || e.status === "completed").length;

  const isOrgActive = automationSettings?.status === "active";
  const isOrgPaused = automationSettings?.status === "paused";
  const isOrgStopped = automationSettings?.status === "stopped";

  const getStatusBadge = (item) => {
    const st = item.computed_status || item.status;
    switch (st) {
      case "Active":
      case "active":
      case "ACTIVE":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">Active</Badge>;
      case "Pending Enrollment":
      case "pending":
      case "PENDING":
        return <Badge className="bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 text-[10px]">Pending Enrollment</Badge>;
      case "Paused":
      case "paused_manual":
      case "PAUSED":
        return <Badge variant="outline" className="text-amber-500 border-amber-500/40 text-[10px]">Paused</Badge>;
      case "paused_reply_received":
      case "REPLIED":
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">Paused (Reply)</Badge>;
      case "paused_out_of_office":
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]">Paused (OOO)</Badge>;
      case "Stopped":
      case "stopped_manual":
      case "STOPPED":
        return <Badge variant="outline" className="text-rose-500 border-rose-500/40 text-[10px]">Stopped</Badge>;
      case "stopped_meeting_booked":
      case "MEETING_BOOKED":
        return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px]">Meeting Booked</Badge>;
      case "Suppressed":
      case "stopped_unsubscribed":
      case "stopped_do_not_contact":
      case "CANCELLED":
        return <Badge variant="destructive" className="text-[10px]">Suppressed</Badge>;
      case "Completed":
      case "completed":
      case "COMPLETED":
        return <Badge variant="outline" className="text-emerald-500 border-emerald-500/40 text-[10px]">Completed</Badge>;
      case "Failed":
      case "failed":
      case "FAILED":
        return <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{st}</Badge>;
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-primary" />
            Automated Cold Email Follow-Up
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            End-to-end automated sequence with Start, Pause, Resume, and Stop controls across organizations, campaigns, and leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadAllData}
            disabled={loading}
            className="gap-1.5 h-9 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link to="/ase/leads">
            <Button size="sm" className="gap-1.5 h-9 text-xs">
              <Users className="w-3.5 h-3.5" />
              View Leads
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-2 border-primary/20 bg-card shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Automation Master Control</span>
              {isOrgActive && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Auto-Enrolling
                </span>
              )}
              {isOrgPaused && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Pause className="w-3 h-3" />
                  Paused ({automationSettings?.paused_reason || "Scheduled jobs deferred"})
                </span>
              )}
              {isOrgStopped && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  <StopCircle className="w-3 h-3" />
                  Stopped
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              When Active, all leads imported through CSV, Excel, API, or webhook are automatically verified and enrolled into the 5-touch sequence. Pausing defers due tasks safely without blasting sends on resume.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {(isOrgStopped || !isOrgActive && !isOrgPaused) && (
              <Button
                size="sm"
                onClick={handleStartAutomation}
                disabled={actionLoading}
                className="gap-1.5 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Automation
              </Button>
            )}

            {isOrgActive && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPauseModalOpen(true)}
                disabled={actionLoading}
                className="gap-1.5 h-9 text-xs text-amber-600 hover:text-amber-700 border-amber-500/30"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause Automation
              </Button>
            )}

            {isOrgPaused && (
              <Button
                size="sm"
                onClick={handleResumeAutomation}
                disabled={actionLoading}
                className="gap-1.5 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume Automation
              </Button>
            )}

            {!isOrgStopped && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => openStopModal("organization", null, "Entire Organization")}
                disabled={actionLoading}
                className="gap-1.5 h-9 text-xs"
              >
                <StopCircle className="w-3.5 h-3.5" />
                Stop Automation
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground">Active Sequences</div>
            <div className="text-2xl font-bold text-foreground mt-1">{activeCount}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Automated cadence</div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground">Paused Sequences</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pausedCount}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Replies or manual pause</div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground">Stopped / Suppressed</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">{stoppedCount}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">DNC, opt-out, or manual stop</div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground">Completed Sequences</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Full 5 touches sent</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: "All", val: "" },
                { label: "Active", val: "ACTIVE" },
                { label: "Paused", val: "PAUSED" },
                { label: "Completed", val: "COMPLETED" },
                { label: "Stopped", val: "STOPPED" },
                { label: "Suppressed", val: "CANCELLED" },
              ].map((tab) => (
                <Button
                  key={tab.label}
                  size="sm"
                  variant={statusFilter === tab.val ? "default" : "outline"}
                  onClick={() => setStatusFilter(tab.val)}
                  className="h-8 text-xs px-2.5"
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prospect or company..."
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading follow-up sequences...</div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CalendarClock className="w-8 h-8 text-muted-foreground/60 mx-auto" />
              <p className="text-sm font-medium text-foreground">No follow-up sequences found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Eligible leads imported via CSV, Excel, API, or Webhook are automatically enrolled when automation is active.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Prospect & Company</th>
                    <th className="p-3">Current Step</th>
                    <th className="p-3">Completed / Remaining</th>
                    <th className="p-3">Next Action & Due</th>
                    <th className="p-3">Last Executed</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredEnrollments.map((enr) => {
                    const nextActionText = enr.next_action?.name || (enr.next_action ? `Step ${enr.next_action.step_number}` : "None");
                    const nextDueDate = enr.next_due_at ? new Date(enr.next_due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : (enr.status === "COMPLETED" ? "Concluded" : "None");
                    const lastExecDate = enr.last_executed_at ? new Date(enr.last_executed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "None";
                    const isLeadPaused = enr.computed_status === "Paused" || enr.status === "PAUSED" || enr.status?.startsWith("paused");
                    const isLeadActive = enr.computed_status === "Active" || enr.status === "ACTIVE";

                    return (
                      <tr key={enr.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <Link to={`/ase/leads/${enr.lead_id}`} className="font-semibold text-primary hover:underline">
                            {enr.lead?.name || "Prospect"}
                          </Link>
                          <div className="text-[11px] text-muted-foreground">{enr.lead?.company || "Company"} • {enr.lead?.email}</div>
                          {enr.last_failure_reason && (
                            <div className="text-[10px] text-rose-500 mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {enr.last_failure_reason}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-foreground">Step {enr.current_step}</span>
                          <span className="text-muted-foreground"> of {enr.total_steps || 5}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-emerald-600 font-semibold">{enr.completed_steps ?? 0}</span>
                          <span className="text-muted-foreground"> done / </span>
                          <span className="font-mono text-muted-foreground">{enr.remaining_steps ?? 0} left</span>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-foreground">{nextActionText}</div>
                          <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                            <Clock className="w-3 h-3 text-primary" />
                            {nextDueDate}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground font-mono text-[11px]">
                          {lastExecDate}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(enr)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedEnrollment(enr)}
                              className="h-7 px-2 text-xs gap-1"
                              title="View Steps"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Steps
                            </Button>

                            {isLeadActive && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePauseLead(enr.id)}
                                disabled={actionLoading}
                                className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700"
                                title="Pause lead sequence"
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {isLeadPaused && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResumeLead(enr.id)}
                                disabled={actionLoading}
                                className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700"
                                title="Resume lead sequence"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {(isLeadActive || isLeadPaused) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openStopModal("lead", enr.id, enr.lead?.name || "This Lead")}
                                disabled={actionLoading}
                                className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                                title="Stop lead sequence"
                              >
                                <StopCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            <Link to={`/ase/leads/${enr.lead_id}`}>
                              <Button size="sm" variant="ghost" className="h-7 px-1.5" title="Open lead profile">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={pauseModalOpen} onOpenChange={setPauseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Pause className="w-4 h-4 text-amber-600" />
              Pause Automation
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will temporarily stop automated enrollment and defer due touches safely without dropping them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Pause Reason</label>
              <Input
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g., Holiday pause, deliverability review, team meeting"
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button size="sm" variant="outline" onClick={() => setPauseModalOpen(false)} className="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" onClick={handlePauseAutomation} disabled={actionLoading} className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white">
              Confirm Pause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stopModalOpen} onOpenChange={setStopModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Confirm Stop Automation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Stopping cancels pending actions for the selected scope. Historical logs, sent emails, and timeline audit records will remain preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
              <strong>Scope:</strong> {stopTargetName || stopScope.toUpperCase()}
              {stopScope === "organization" && (
                <div className="mt-1 text-[11px]">
                  Warning: This will disable automatic lead enrollment and cancel all pending follow-up dispatches across the entire organization!
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Reason for Stopping</label>
              <Input
                value={stopReason}
                onChange={(e) => setStopReason(e.target.value)}
                placeholder="e.g., Campaign retired, outreach paused indefinitely"
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button size="sm" variant="outline" onClick={() => setStopModalOpen(false)} className="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleConfirmStop} disabled={actionLoading} className="text-xs h-8">
              Yes, Stop Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedEnrollment)} onOpenChange={(open) => !open && setSelectedEnrollment(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              Follow-Up Journey: {selectedEnrollment?.lead?.company || selectedEnrollment?.lead?.name || "Prospect"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Initial outreach sent on {selectedEnrollment?.initial_sent_at ? new Date(selectedEnrollment.initial_sent_at).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {selectedEnrollment?.tasks?.map((t) => (
              <div key={t.id} className="p-3 rounded-lg border border-border/80 bg-background space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Step {t.step_number} (Day {t.day_offset})
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]">
                      {t.thread_mode === "REPLY_THREAD" ? "In-Thread Reply" : "New Thread"}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">
                      {t.status}
                    </Badge>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold mr-1">Subject:</span>
                  <span className="text-foreground">{t.subject || "Not drafted"}</span>
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
                  <span>Scheduled: {t.scheduled_at ? new Date(t.scheduled_at).toLocaleString() : "N/A"}</span>
                  {t.sent_at && <span className="text-emerald-600">Delivered: {new Date(t.sent_at).toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
