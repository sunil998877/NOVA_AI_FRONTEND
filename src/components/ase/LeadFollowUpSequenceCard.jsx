import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  Pause,
  StopCircle,
  Eye,
  RotateCcw,
  Video,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Send,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { useToast } from "../ui/toast";
import { followUpService } from "../../services/followUp.service";

const STEP_DEFINITIONS = [
  {
    step: 1,
    offset: "Day 2",
    title: "Helpful in-thread follow-up",
    description: "Reply in existing thread with thoughtful problem inquiry. No calendar link.",
    mode: "REPLY_THREAD",
    icon: MessageSquare,
  },
  {
    step: 2,
    offset: "Day 7",
    title: "Insight & practical benchmark",
    description: "New thread sharing a relevant case study or practical recommendation.",
    mode: "NEW_THREAD",
    icon: Sparkles,
  },
  {
    step: 3,
    offset: "Day 14",
    title: "Addressing objections",
    description: "Address bandwidth & implementation questions with helpful resources.",
    mode: "NEW_THREAD",
    icon: ShieldCheck,
  },
  {
    step: 4,
    offset: "Day 28",
    title: "Personalized video concept",
    description: "Custom video concept with observation, recommendation, and script.",
    mode: "NEW_THREAD",
    icon: Video,
  },
  {
    step: 5,
    offset: "Day 42",
    title: "Polite final check-in",
    description: "Courteous breakup note asking to revisit later, then conclude sequence.",
    mode: "REPLY_THREAD",
    icon: Send,
  },
];

export default function LeadFollowUpSequenceCard({ lead, onUpdated }) {
  const { success, error: toastError } = useToast();
  const [journey, setJourney] = useState({ enrollments: [], tasks: [] });
  const [loading, setLoading] = useState(true);
  const [previewTask, setPreviewTask] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [stopReason, setStopReason] = useState("");

  useEffect(() => {
    if (lead?.id) {
      loadJourney();
    }
  }, [lead?.id]);

  const loadJourney = async () => {
    try {
      setLoading(true);
      const data = await followUpService.getLeadJourney(lead.id);
      setJourney(data || { enrollments: [], tasks: [] });
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const activeEnrollment = journey.enrollments?.find((e) => e.status === "ACTIVE" || e.status === "active") || journey.enrollments?.[0] || null;
  const tasks = journey.tasks || [];

  const completedStepsCount = tasks.filter((t) => t.status === "SENT").length;
  const remainingStepsCount = Math.max(0, 5 - completedStepsCount);
  const nextScheduledTask = tasks.find((t) => t.status === "SCHEDULED" || t.status === "PENDING" || t.step_number === activeEnrollment?.current_step);
  const lastExecutedTask = [...tasks].filter((t) => t.sent_at).sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))[0];

  const handleEnroll = async () => {
    if (!lead?.id) return;
    try {
      setActionLoading(true);
      await followUpService.enrollLead(lead.id, {
        subject: lead.metadata?.outreach_email?.subject,
        research: lead.metadata?.company_research,
      });
      success("Lead Enrolled", "5-step date-wise follow-up sequence activated.");
      await loadJourney();
      if (onUpdated) onUpdated();
    } catch (err) {
      toastError("Enrollment Error", err.message || "Failed to enroll lead");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    if (!activeEnrollment) return;
    try {
      setActionLoading(true);
      await followUpService.pauseAutomation({
        scope: "lead",
        id: activeEnrollment.id,
        reason: "Manually paused via lead card",
      });
      success("Sequence Paused", "Future scheduled touches safely deferred.");
      await loadJourney();
      if (onUpdated) onUpdated();
    } catch (err) {
      toastError("Pause Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!activeEnrollment) return;
    try {
      setActionLoading(true);
      await followUpService.resumeAutomation({
        scope: "lead",
        id: activeEnrollment.id,
      });
      success("Sequence Resumed", "Automated sequence is now active.");
      await loadJourney();
      if (onUpdated) onUpdated();
    } catch (err) {
      toastError("Resume Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmStop = async () => {
    if (!activeEnrollment) return;
    try {
      setActionLoading(true);
      await followUpService.stopAutomation({
        scope: "lead",
        id: activeEnrollment.id,
        reason: stopReason || "Stopped by user via lead card",
      });
      setStopModalOpen(false);
      success("Sequence Stopped", "Follow-up sequence stopped. Audit records preserved.");
      await loadJourney();
      if (onUpdated) onUpdated();
    } catch (err) {
      toastError("Stop Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPreview = async (task) => {
    setPreviewTask(task);
    if (!task.body_text) {
      try {
        setPreviewLoading(true);
        const preview = await followUpService.previewTask(task.id);
        setPreviewTask({ ...task, ...preview });
      } catch (_) {
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const handleRetry = async (taskId) => {
    try {
      setActionLoading(true);
      await followUpService.retryTask(taskId);
      success("Task Queued", "Follow-up touch queued for immediate dispatch.");
      await loadJourney();
    } catch (err) {
      toastError("Retry Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isDncOrSuppressed = lead?.status === "dnc" || lead?.status === "unsubscribed" || lead?.do_not_contact === true || lead?.is_unsubscribed === true;

  const getComputedStatus = () => {
    if (isDncOrSuppressed) return "Suppressed";
    if (!activeEnrollment) return "Pending Enrollment";
    const st = activeEnrollment.status?.toLowerCase() || "";
    if (st === "active") return "Active";
    if (st.includes("paused") || st === "replied") return "Paused";
    if (st === "completed") return "Completed";
    if (st.includes("stopped") || st === "cancelled") return "Stopped";
    if (st === "failed") return "Failed";
    return activeEnrollment.status;
  };

  const computedStatus = getComputedStatus();

  const getStatusBadge = () => {
    switch (computedStatus) {
      case "Active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]/60">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shrink-0" />
            Active
          </span>
        );
      case "Pending Enrollment":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block shrink-0" />
            Pending Enrollment
          </span>
        );
      case "Paused":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" />
            Paused
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
            Completed
          </span>
        );
      case "Stopped":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />
            Stopped
          </span>
        );
      case "Suppressed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />
            Suppressed (DNC)
          </span>
        );
      case "Failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {computedStatus}
          </span>
        );
    }
  };

  const getTaskStatusBadge = (taskStatus) => {
    switch (taskStatus) {
      case "SENT":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px]">Delivered</Badge>;
      case "SCHEDULED":
        return <Badge variant="outline" className="text-blue-500 border-blue-500/30 text-[9px]">Scheduled</Badge>;
      case "PROCESSING":
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[9px]">Sending...</Badge>;
      case "BLOCKED_REPLY":
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[9px]">Blocked (Reply)</Badge>;
      case "BLOCKED_COMPLIANCE":
        return <Badge variant="destructive" className="text-[9px]">Blocked (DNC)</Badge>;
      case "FAILED":
        return <Badge variant="destructive" className="text-[9px]">Failed</Badge>;
      case "SKIPPED":
        return <Badge variant="outline" className="text-slate-400 border-slate-500/30 text-[9px]">Skipped</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="text-slate-400 text-[9px]">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px]">{taskStatus}</Badge>;
    }
  };

  const isPausedState = computedStatus === "Paused";
  const isActiveState = computedStatus === "Active";

  return (
    <>
      <div className="bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF2EB] text-[#EA580C] flex items-center justify-center shrink-0">
              <CalendarClock className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-[17px] sm:text-lg font-bold text-slate-900 dark:text-foreground tracking-tight">
                  Automated Cold Email Follow-Up
                </h2>
                {getStatusBadge()}
              </div>
              <p className="text-slate-500 dark:text-muted-foreground text-xs sm:text-[13px] mt-1 font-normal leading-normal">
                5-step date-wise progression calculated from initial send timestamp (Day 2, 7, 14, 28, 42)
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            {isActiveState && (
              <button
                type="button"
                onClick={handlePause}
                disabled={actionLoading}
                className="bg-[#FFF2EB] hover:bg-[#FFE6D8] text-[#EA580C] border border-[#FDBA74]/70 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Pause className="w-4 h-4 fill-[#EA580C] text-[#EA580C]" />
                <span>Pause</span>
              </button>
            )}

            {isPausedState && (
              <button
                type="button"
                onClick={handleResume}
                disabled={actionLoading}
                className="bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-[#059669] text-[#059669]" />
                <span>Resume</span>
              </button>
            )}

            {!activeEnrollment && !isDncOrSuppressed && (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={actionLoading}
                className="bg-[#FFF2EB] hover:bg-[#FFE6D8] text-[#EA580C] border border-[#FDBA74]/70 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-[#EA580C] text-[#EA580C]" />
                <span>Enroll in Follow-Up</span>
              </button>
            )}

            {activeEnrollment && (isActiveState || isPausedState) && (
              <button
                type="button"
                onClick={() => {
                  setStopReason("");
                  setStopModalOpen(true);
                }}
                disabled={actionLoading}
                className="bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-border rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="w-4 h-4 rounded-full border-2 border-slate-700 dark:border-slate-300 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-[1px] bg-slate-700 dark:bg-slate-300" />
                </span>
                <span>Stop Sequence</span>
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-border/60 p-5 sm:p-6 bg-slate-50/30 dark:bg-muted/10 space-y-4">

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-muted/20 p-2.5 rounded-lg border border-border/50">
            <div>
              <span className="text-[11px] text-muted-foreground block">Sequence Step</span>
              <span className="font-semibold text-foreground">
                Step {activeEnrollment?.current_step || 1} of 5
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Steps Progress</span>
              <span className="font-semibold text-emerald-600">
                {completedStepsCount} done / {remainingStepsCount} remaining
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Next Due Action</span>
              <span className="font-semibold text-foreground flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3 h-3 text-primary inline" />
                {nextScheduledTask?.scheduled_at ? new Date(nextScheduledTask.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : (activeEnrollment?.status === "COMPLETED" ? "Concluded" : "None")}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Last Successful Execution</span>
              <span className="font-semibold text-foreground font-mono text-[11px]">
                {lastExecutedTask?.sent_at ? new Date(lastExecutedTask.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "None"}
              </span>
            </div>
          </div>

          {isDncOrSuppressed && (
            <div className="rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span><strong>Skipped from follow-ups:</strong> Lead is marked as Do Not Contact (DNC) or Unsubscribed. Compliance engine prevents all dispatches.</span>
            </div>
          )}

          {!activeEnrollment && !isDncOrSuppressed && (
            <div className="rounded-md bg-blue-500/10 border border-blue-500/30 p-2.5 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span><strong>Automatic Enrollment:</strong> Lead is eligible. Sequence activates automatically once the initial campaign cold email is dispatched.</span>
            </div>
          )}

          {activeEnrollment?.paused_reason && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
              <span><strong>Notice:</strong> {activeEnrollment.paused_reason}</span>
              <Badge variant="outline" className="text-[9px]">Reply Guard Active</Badge>
            </div>
          )}

          {activeEnrollment?.stopped_reason && (
            <div className="rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
              <span><strong>Stopped Reason:</strong> {activeEnrollment.stopped_reason}</span>
              <Badge variant="outline" className="text-[9px]">Inactive</Badge>
            </div>
          )}

          <div className="space-y-2">
            {STEP_DEFINITIONS.map((def) => {
              const task = tasks.find((t) => t.step_number === def.step);
              const isDone = task?.status === "SENT";
              const isCurrent = activeEnrollment?.current_step === def.step && activeEnrollment?.status === "ACTIVE";
              const scheduledFormatted = task?.scheduled_at ? new Date(task.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
              const sentFormatted = task?.sent_at ? new Date(task.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;

              return (
                <div
                  key={def.step}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isDone
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : isCurrent
                      ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
                      : "bg-background border-border/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : def.step}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">
                          {def.offset}: {def.title}
                        </span>
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {def.mode === "REPLY_THREAD" ? "In-Thread" : "New Thread"}
                        </Badge>
                        {task && getTaskStatusBadge(task.status)}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {def.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      {isDone ? (
                        <div className="text-emerald-600 font-medium text-[11px]">
                          Sent {sentFormatted}
                        </div>
                      ) : scheduledFormatted ? (
                        <div className="text-muted-foreground text-[11px] flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3 text-primary" />
                          <span>Due {scheduledFormatted}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Unscheduled</span>
                      )}
                    </div>

                    {task && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenPreview(task)}
                          className="h-7 px-2 text-xs gap-1"
                          title="Preview Email Content"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </Button>
                        {task.status === "FAILED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(task.id)}
                            className="h-7 px-2 text-xs gap-1 text-primary"
                            title="Retry dispatch"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retry</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={stopModalOpen} onOpenChange={setStopModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Stop Follow-Up Sequence
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to stop follow-ups for {lead?.name || lead?.email || "this prospect"}? Pending tasks will be cancelled, but all historical sent records are kept.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Reason for Stopping</label>
              <Input
                value={stopReason}
                onChange={(e) => setStopReason(e.target.value)}
                placeholder="e.g., Lead requested phone call, deal closed elsewhere"
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button size="sm" variant="outline" onClick={() => setStopModalOpen(false)} className="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleConfirmStop} disabled={actionLoading} className="text-xs h-8">
              Stop Sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewTask)} onOpenChange={(open) => !open && setPreviewTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              Follow-Up Step {previewTask?.step_number} Preview
            </DialogTitle>
            <DialogDescription className="text-xs">
              Personalized cold email content generated for {lead?.company || "lead"}
            </DialogDescription>
          </DialogHeader>

          {previewLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Generating preview content...</div>
          ) : previewTask ? (
            <div className="space-y-3 pt-2">
              <div className="rounded-md bg-muted/40 border border-border/70 p-2 text-xs">
                <span className="font-semibold text-muted-foreground mr-1.5">Subject:</span>
                <span className="font-medium text-foreground">{previewTask.subject || "Subject line..."}</span>
              </div>

              {previewTask.video_concept && (
                <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-xs space-y-1.5">
                  <span className="font-semibold text-primary flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    Video Script Outline (For Human Review)
                  </span>
                  <p><strong>Hook:</strong> {previewTask.video_concept.openingHook}</p>
                  <p><strong>Observation:</strong> {previewTask.video_concept.observation}</p>
                  <p><strong>Recommendation:</strong> {previewTask.video_concept.recommendation}</p>
                  <p><strong>Call to Action:</strong> {previewTask.video_concept.cta}</p>
                </div>
              )}

              <div className="rounded-md border border-border/80 p-3 text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/90 bg-background max-h-60 overflow-y-auto">
                {previewTask.body_text || "No body drafted yet."}
              </div>

              {previewTask.last_error && (
                <div className="rounded-md bg-rose-500/10 border border-rose-500/30 p-2 text-xs text-rose-600">
                  <strong>Last Error:</strong> {previewTask.last_error}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
