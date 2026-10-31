import React, { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  Download,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { aseService } from "../../services/ase.service";
import { useToast } from "../../components/ui/toast";
import { downloadCsv, reportToCsv } from "../../lib/aseReports";

function formatRate(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)}%`;
}

function formatMinutes(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)} min`;
}

function display(loading, report, value, format) {
  if (loading) return "…";
  if (!report) return "—";
  if (value == null) return "—";
  return format ? format(value) : value;
}

export default function AseReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { error: toastError, success } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await aseService.getReports();
        if (!cancelled) {
          setReport(data || null);
          setFailed(!data);
        }
      } catch (err) {
        if (!cancelled) {
          setReport(null);
          setFailed(true);
          toastError("Reports unavailable", err.message || "Could not load live ASE metrics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleExport = () => {
    if (!report) return;
    downloadCsv(`ase-report-${new Date().toISOString().slice(0, 10)}.csv`, reportToCsv(report));
    success("Export started", "Live org metrics downloaded as CSV");
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ASE Performance Reports</h1>
          <p className="text-muted-foreground mt-1">
            First-touch speed, channel interest, meetings, and callback SLA from live org data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!report || loading || failed}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {failed && !loading && (
        <p className="text-sm text-rose-600">Live metrics could not be loaded. Empty values are shown — no placeholder numbers.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Speed to Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{display(loading, report, report?.speedToLeadMinutes, formatMinutes)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Created → first email sent or call, not last contact</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Email Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{display(loading, report, report?.email?.responseRate, formatRate)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Opens & inbound replies vs emails sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">AI Voice Connect Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{display(loading, report, report?.voice?.connectRate, formatRate)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Outbound dials connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Callback SLA Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{display(loading, report, report?.callbacks?.slaRate, formatRate)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Completed within 30 minutes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Interested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{display(loading, report, report?.outcomes?.interested)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">INTERESTED, callback, handoff, warm transfer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{display(loading, report, report?.outcomes?.meetings)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">CLOSED_WON, MEETING_BOOKED, booked follow-ups</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channel Performance Summary</CardTitle>
          <CardDescription>Sent/open/reply plus interested and meeting outcomes per channel.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">NOVA Email Engine</h4>
                  <p className="text-xs text-muted-foreground">Delivered via SMTP & n8n webhooks</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Sent</span>
                  <span className="font-bold">{display(loading, report, report?.email?.sent)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Opened</span>
                  <span className="font-bold">{display(loading, report, report?.email?.opened)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Replied</span>
                  <span className="font-bold text-emerald-600">{display(loading, report, report?.email?.replied)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Interested</span>
                  <span className="font-bold">{display(loading, report, report?.email?.interested)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Meetings</span>
                  <span className="font-bold">{display(loading, report, report?.email?.meetings)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-purple-600">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Calling Bots Autonomous Voice</h4>
                  <p className="text-xs text-muted-foreground">Autonomous first outreach & objection handling</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Dials</span>
                  <span className="font-bold">{display(loading, report, report?.voice?.dials)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Connected</span>
                  <span className="font-bold">{display(loading, report, report?.voice?.connected)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Callbacks</span>
                  <span className="font-bold text-amber-600">{display(loading, report, report?.voice?.callbacks)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Interested</span>
                  <span className="font-bold">{display(loading, report, report?.voice?.interested)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Meetings</span>
                  <span className="font-bold">{display(loading, report, report?.voice?.meetings)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
