import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Edit2,
  Activity,
  Calendar,
  Building,
  MapPin,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../components/ui/toast";
import { aseService } from "../../services/ase.service";

export default function AseLeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [id]);

  async function fetchLead() {
    setLoading(true);
    try {
      const res = await aseService.getLead(id);
      setData(res);
    } catch (err) {
      toastError("Error", "Could not load lead detail");
    } finally {
      setLoading(false);
    }
  }

  const handleStateChange = async (newStatus) => {
    try {
      setUpdating(true);
      await aseService.updateLead(id, { status: newStatus });
      success("State Updated", `Lead transitioned to ${newStatus}`);
      fetchLead();
    } catch (err) {
      toastError("Error", err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDncToggle = async () => {
    if (!data?.lead) return;
    const nextVal = !data.lead.do_not_contact;
    try {
      setUpdating(true);
      await aseService.updateLead(id, {
        do_not_contact: nextVal ? 1 : 0,
        status: nextVal ? "SUPPRESSED_DNC" : "CONTACTED",
      });
      success("Updated", nextVal ? "Lead marked DNC" : "Lead removed from DNC");
      fetchLead();
    } catch (err) {
      toastError("Error", err.message);
    } finally {
      setUpdating(false);
    }
  };


  if (loading || !data?.lead) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const { lead, timeline = [] } = data;
  const counters = lead.attempt_counters || { email: 0, voice: 0, total: 0 };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Back button & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/ase/leads">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Leads
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">P-{lead.priority}</Badge>
              <Badge variant="secondary">{lead.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lead.company} • {lead.email} • {lead.phone || "No phone"}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">

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
            <ShieldAlert className="w-4 h-4 mr-1.5" />
            {lead.do_not_contact ? "Remove DNC" : "Suppress DNC"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT / MAIN: Overview & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Email</span>
                  <span className="font-medium">{lead.email}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Phone</span>
                  <span className="font-medium">{lead.phone || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Company</span>
                  <span className="font-medium">{lead.company || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Source</span>
                  <Badge variant="outline">{lead.source}</Badge>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Assigned Rep</span>
                  <span className="font-medium">{lead.assigned_rep_name || "Unassigned"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Attempts</span>
                  <span className="font-medium">✉ {counters.email} • 📞 {counters.voice}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unified Chronological Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Unified Interaction Timeline ({timeline.length} events)
              </CardTitle>
              <CardDescription>
                Chronological audit record of every email, voice call, outcome, and rep action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">No events logged yet.</p>
                ) : (
                  timeline.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3 border-l-2 border-primary/30 pl-4 py-1">
                      <div className="min-w-[130px] text-xs text-muted-foreground">
                        {new Date(ev.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs">{ev.event_type}</span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {ev.channel}
                          </Badge>
                        </div>
                        {ev.payload && (
                          <pre className="mt-1 p-2 bg-muted rounded text-[11px] font-mono overflow-x-auto max-w-lg">
                            {JSON.stringify(ev.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Next Best Action & Governance */}
        <div className="space-y-6">
          {/* Prominent Next Best Action Card */}
          <Card className="border-primary/50 shadow-sm bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="default" className="text-[10px]">RECOMMENDED NEXT ACTION</Badge>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <CardTitle className="text-lg mt-2">
                {lead.next_action || "Awaiting Outcome Evaluation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Determined by the 24/7 Rule-Based Orchestrator based on cadence, working hours, and previous responses.
              </p>
              {lead.next_action_time && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Clock className="w-3.5 h-3.5" />
                  Scheduled: {new Date(lead.next_action_time).toLocaleString()}
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" className="w-full">
                  Execute Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Consents & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channel Consents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span>Email Outreach:</span>
                <Badge variant={lead.email_consent?.status === "DENIED" ? "destructive" : "secondary"}>
                  {lead.email_consent?.status || "GRANTED"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>AI Voice Bot:</span>
                <Badge variant={lead.voice_consent?.status === "DENIED" ? "destructive" : "secondary"}>
                  {lead.voice_consent?.status || "GRANTED"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Do Not Contact (DNC):</span>
                <Badge variant={lead.do_not_contact ? "destructive" : "outline"}>
                  {lead.do_not_contact ? "BLOCKED" : "CLEAR"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
