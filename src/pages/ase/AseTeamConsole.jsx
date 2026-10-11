import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  Clock,
  Flame,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Calendar,
  User,
  Activity,
  Send,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { useToast } from "../../components/ui/toast";
import { aseService } from "../../services/ase.service";

export default function AseTeamConsole() {
  const [callbacks, setCallbacks] = useState([]);
  const [selectedCallback, setSelectedCallback] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState("");
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    setLoading(true);
    try {
      const res = await aseService.getCallbacks();
      const items = res.items || [];
      setCallbacks(items);
      if (items.length > 0) {
        selectCallbackItem(items[0]);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }

  async function selectCallbackItem(cb) {
    setSelectedCallback(cb);
    try {
      const l = await aseService.getLead(cb.lead_id);
      setLeadDetail(l);
    } catch (_) {}
  }

  const handleDisposition = async (disposition, status) => {
    if (!selectedCallback) return;
    try {
      await aseService.updateCallback(selectedCallback.id, {
        status: "COMPLETED",
        notes: actionNotes,
        leadDisposition: disposition,
        leadStatus: status,
      });
      success("Logged", `Lead disposition saved as ${disposition}`);
      setActionNotes("");
      fetchQueue();
    } catch (err) {
      toastError("Error", err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full h-[calc(100vh-120px)] min-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salesperson Team Console</h1>
          <p className="text-xs text-muted-foreground">
            Unified human rep cockpit: full lead context, timeline, and recommended next action in one view.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/ase/callbacks">View All Callbacks</Link>
        </Button>
      </div>

      {/* Three Panel Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* LEFT PANEL: Queue (3 cols) */}
        <Card className="md:col-span-3 flex flex-col min-h-0">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Handoff Queue</span>
              <Badge variant="outline">{callbacks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-y-auto space-y-2">
            {callbacks.map((cb) => {
              const isSelected = selectedCallback?.id === cb.id;
              const isOverdue = cb.status === "OVERDUE";
              return (
                <div
                  key={cb.id}
                  onClick={() => selectCallbackItem(cb)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : isOverdue
                      ? "border-rose-300 bg-rose-50/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate">{cb.lead_name}</span>
                    {isOverdue && (
                      <span className="text-[10px] text-rose-600 font-bold">OVERDUE</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{cb.lead_company}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due: {new Date(cb.due_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* CENTER PANEL: Lead Profile & Conversation Timeline (6 cols) */}
        <Card className="md:col-span-6 flex flex-col min-h-0">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {selectedCallback?.lead_name || "Select a Lead"}
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedCallback?.lead_company} • {selectedCallback?.lead_phone}
              </CardDescription>
            </div>
            {leadDetail?.lead && (
              <Badge variant="secondary">{leadDetail.lead.status}</Badge>
            )}
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
            {selectedCallback?.notes && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                  Reason for Handoff:
                </span>
                {selectedCallback.notes}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Timeline & Past Touches
              </h4>
              <div className="space-y-3">
                {leadDetail?.timeline?.map((ev) => (
                  <div key={ev.id} className="text-xs border-l-2 border-primary/40 pl-3 py-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{ev.event_type}</span>
                      <span>{new Date(ev.created_at).toLocaleTimeString()}</span>
                    </div>
                    {ev.payload && (
                      <p className="mt-1 text-[11px] text-muted-foreground bg-muted p-1.5 rounded font-mono">
                        {JSON.stringify(ev.payload)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT PANEL: Context & Recommended Actions (3 cols) */}
        <Card className="md:col-span-3 flex flex-col min-h-0">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold">Rep Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
            {/* Recommended Action */}
            <div className="p-3 rounded-lg border bg-primary/5 border-primary/30">
              <span className="text-[10px] font-bold text-primary block mb-1">
                RECOMMENDED ACTION
              </span>
              <p className="text-xs font-semibold">
                {leadDetail?.lead?.next_action || "Call Prospect"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Hot prospect requested phone callback. Aim to qualify within 30 minutes.
              </p>
            </div>

            {/* Rep Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Call Notes</label>
              <Input
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Log notes from conversation..."
                className="text-xs"
              />
            </div>

            {/* Quick Disposition Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => handleDisposition("interested", "INTERESTED")}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Mark Qualified / Interested
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs"
                onClick={() => handleDisposition("closed_won", "CLOSED_WON")}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-600" /> Mark Deal Won
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs"
                onClick={() => handleDisposition("not_interested", "CLOSED_LOST")}
              >
                <XCircle className="w-3.5 h-3.5 mr-2 text-slate-500" /> Mark Not Interested
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="w-full justify-start text-xs"
                onClick={() => handleDisposition("dnc", "SUPPRESSED_DNC")}
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-2" /> Mark DNC / Suppress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
