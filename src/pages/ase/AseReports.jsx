import React, { useState } from "react";
import {
  TrendingUp,
  BarChart3,
  Phone,
  Mail,
  Clock,
  Download,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

export default function AseReports() {
  const [activeTab, setActiveTab] = useState("overview");

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
          <Button variant="outline" size="sm">
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
            <div className="text-2xl font-bold">14.2 min</div>
            <p className="text-[11px] text-muted-foreground mt-1">Average time from ingestion to touch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Email Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">28.4%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Opens & Inbound Replies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">AI Voice Connect Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">61.5%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Outbound dials connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Callback SLA Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">92.8%</div>
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
                  <span className="font-bold">142</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Opened</span>
                  <span className="font-bold">89</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Replied</span>
                  <span className="font-bold text-emerald-600">32</span>
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
                  <span className="font-bold">64</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Connected</span>
                  <span className="font-bold">39</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Callbacks</span>
                  <span className="font-bold text-amber-600">18</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
