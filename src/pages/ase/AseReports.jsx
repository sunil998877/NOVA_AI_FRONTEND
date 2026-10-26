import React, { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { aseService } from "../../services/ase.service";
import { useToast } from "../../components/ui/toast";

function formatRate(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)}%`;
}

function formatMinutes(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)} min`;
}

function toCsv(report) {
  const rows = [
    ["metric", "value"],
    ["speed_to_lead_minutes", report.speedToLeadMinutes ?? ""],
    ["contacted_count", report.contactedCount ?? 0],
    ["email_sent", report.email?.sent ?? 0],
    ["email_opened", report.email?.opened ?? 0],
    ["email_replied", report.email?.replied ?? 0],
    ["email_response_rate", report.email?.responseRate ?? 0],
    ["voice_dials", report.voice?.dials ?? 0],
    ["voice_connected", report.voice?.connected ?? 0],
    ["voice_callbacks", report.voice?.callbacks ?? 0],
    ["voice_connect_rate", report.voice?.connectRate ?? 0],
    ["callback_total", report.callbacks?.total ?? 0],
    ["callback_completed", report.callbacks?.completed ?? 0],
    ["callback_sla_met", report.callbacks?.met ?? 0],
    ["callback_sla_rate", report.callbacks?.slaRate ?? 0],
  ];
  return rows.map((row) => row.join(",")).join("\n");
}

export default function AseReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error: toastError, success } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await aseService.getReports();
        if (!cancelled) setReport(data || {});
      } catch (err) {
        if (!cancelled) {
          setReport({});
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
    const blob = new Blob([toCsv(report)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ase-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    success("Export started", "Live org metrics downloaded as CSV");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ASE Performance Reports</h1>
          <p className="text-muted-foreground mt-1">
            Conversion analytics, channel throughput, and callback SLA adherence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!report || loading}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Speed to Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "…" : formatMinutes(report?.speedToLeadMinutes)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Average time from ingestion to first touch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Email Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{loading ? "…" : formatRate(report?.email?.responseRate)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Opens & inbound replies vs emails sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">AI Voice Connect Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{loading ? "…" : formatRate(report?.voice?.connectRate)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Outbound dials connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Callback SLA Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{loading ? "…" : formatRate(report?.callbacks?.slaRate)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Completed within 30 minutes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channel Performance Summary</CardTitle>
          <CardDescription>Outcome breakdowns across NOVA Email and Autonomous Voice Bots.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">NOVA Email Engine</h4>
                  <p className="text-xs text-muted-foreground">Delivered via SMTP & n8n webhooks</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Sent</span>
                  <span className="font-bold">{loading ? "…" : (report?.email?.sent || 0)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Opened</span>
                  <span className="font-bold">{loading ? "…" : (report?.email?.opened || 0)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Replied</span>
                  <span className="font-bold text-emerald-600">{loading ? "…" : (report?.email?.replied || 0)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-purple-600">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Calling Bots Autonomous Voice</h4>
                  <p className="text-xs text-muted-foreground">Autonomous first outreach & objection handling</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Dials</span>
                  <span className="font-bold">{loading ? "…" : (report?.voice?.dials || 0)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Connected</span>
                  <span className="font-bold">{loading ? "…" : (report?.voice?.connected || 0)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Callbacks</span>
                  <span className="font-bold text-amber-600">{loading ? "…" : (report?.voice?.callbacks || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
