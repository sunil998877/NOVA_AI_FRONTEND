import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Flame,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { aseService } from "../../services/ase.service";

export default function AseDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [callbacks, setCallbacks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [m, cb, l] = await Promise.all([
          aseService.getDashboardMetrics(),
          aseService.getCallbacks({ overdue: true }).catch(() => ({ items: [] })),
          aseService.getLeads({ limit: 50 }).catch(() => ({ items: [] })),
        ]);
        setMetrics(m);
        setFailed(false);
        setCallbacks(cb.items || []);
        setLeads(
          [...(l.items || [])]
            .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
            .slice(0, 5)
        );
      } catch (err) {
        setMetrics(null);
        setFailed(true);
        setCallbacks([]);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Activity className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Sales Workspace...</p>
        </div>
      </div>
    );
  }

  if (failed || !metrics) {
    return (
      <div className="flex flex-col gap-3 min-h-[400px] justify-center items-center">
        <AlertCircle className="h-6 w-6 text-rose-500" />
        <p className="text-sm text-muted-foreground">Dashboard metrics unavailable. No placeholder zeros are shown.</p>
      </div>
    );
  }

  const pipelineStages = [
    { label: "New", count: metrics.newLeads, color: "bg-blue-500" },
    { label: "Contacted", count: metrics.contacted, color: "bg-cyan-500" },
    { label: "Engaged", count: metrics.engaged, color: "bg-indigo-500" },
    { label: "Interested", count: metrics.interested, color: "bg-emerald-500" },
    { label: "Callback", count: metrics.callbacksRequired, color: "bg-amber-500" },
    { label: "Won", count: metrics.won, color: "bg-green-600" },
    { label: "Lost", count: metrics.lost, color: "bg-slate-400" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Sales Operations Overview</h1>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
              Autonomous Engine 24/7
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Real-time pipeline health, SLA callback adherence, and multi-channel conversion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/ase/callbacks">
              <Clock className="w-4 h-4 mr-2" /> Callbacks Queue
            </Link>
          </Button>
          <Button asChild>
            <Link to="/ase/team-console">
              <Activity className="w-4 h-4 mr-2" /> Team Console
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ingested Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active across CSV / Excel & API Webhook Intake
            </p>
          </CardContent>
        </Card>

        <Card className={metrics.overdueCallbacks > 0 ? "border-rose-400 bg-rose-50/15" : ""}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hot Callbacks Required</CardTitle>
            <Flame className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-600">{metrics.callbacksRequired}</span>
              {metrics.overdueCallbacks > 0 && (
                <span className="text-xs font-semibold text-rose-600">
                  ({metrics.overdueCallbacks} SLA Breached)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Target human response: ≤ 30m</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{metrics.conversionRate}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.won} Closed Won Deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Voice Connection Rate</CardTitle>
            <Phone className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.callConnectionRate || "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">Autonomous First Calls</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Autonomous Pipeline Funnel</CardTitle>
              <CardDescription>Live distribution of active leads across lifecycle states</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/ase/pipeline">
                Open Kanban <ArrowUpRight className="ml-1 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {pipelineStages.map((stage) => (
              <div key={stage.label} className="p-3 border rounded-lg bg-card text-card-foreground">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">{stage.label}</span>
                </div>
                <div className="text-2xl font-bold">{stage.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={callbacks.length > 0 ? "border-amber-300 dark:border-amber-800" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-base">Hot Callback Action Queue</CardTitle>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/ase/callbacks">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {callbacks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                All callbacks are within SLA deadlines.
              </div>
            ) : (
              <div className="space-y-3">
                {callbacks.slice(0, 4).map((cb) => (
                  <div key={cb.id} className="flex items-start justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <div className="font-semibold text-sm">{cb.lead_name}</div>
                      <div className="text-xs text-muted-foreground">{cb.lead_company} • {cb.lead_phone}</div>
                      <div className="text-xs text-rose-600 font-semibold mt-1">
                        Overdue: {new Date(cb.due_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/ase/leads/${cb.lead_id}`}>Call Now</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">High-Priority Leads In Flight</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to="/ase/leads">Lead Store</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leads.map((lead) => (
                <Link
                  key={lead.id}
                  to={`/ase/leads/${lead.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {lead.name}
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        P-{lead.priority}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{lead.company} • {lead.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {lead.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
