import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { Eye, MousePointerClick, Send, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useChartColors } from "../lib/theme";
import { useWorkspaceData } from "../hooks/useWorkspaceData";
import { buildWeeklyPerformance, campaignMetrics } from "../lib/campaigns";

function CampaignAnalytics() {
  const chart = useChartColors();
  const { campaigns, mails, stats, loading, error } = useWorkspaceData();

  const trend = useMemo(() => buildWeeklyPerformance(mails), [mails]);
  const rows = useMemo(
    () =>
      campaigns.map((campaign) => {
        const metrics = campaignMetrics(campaign, mails);
        const open = metrics.sent ? Number(((metrics.opened / metrics.sent) * 100).toFixed(1)) : 0;
        return {
          name: campaign.title,
          sent: metrics.sent,
          open,
          click: 0,
          bounce: 0,
        };
      }),
    [campaigns, mails]
  );

  const avgOpen = rows.length
    ? rows.reduce((sum, row) => sum + row.open, 0) / rows.length
    : stats.total
      ? ((stats.opened || 0) / stats.total) * 100
      : 0;
  const best = rows.reduce((top, row) => (row.open > (top?.open || 0) ? row : top), null);
  const sources = [
    { name: "Broadcast", value: campaigns.filter((c) => !/news/i.test(c.title || "")).length },
    { name: "Automation", value: campaigns.filter((c) => /follow|auto/i.test(c.title || "")).length },
    { name: "Newsletter", value: campaigns.filter((c) => /news/i.test(c.title || "")).length },
  ];

  const kpis = [
    { label: "Avg. open rate", value: `${avgOpen.toFixed(1)}%`, change: loading ? "…" : "Live", icon: Eye },
    { label: "Avg. click rate", value: "0%", change: "Not tracked yet", icon: MousePointerClick },
    { label: "Emails analyzed", value: String(stats.total || 0), change: `${stats.campaigns || 0} campaigns`, icon: Send },
    { label: "Best campaign", value: best ? `${best.open}%` : "—", change: best?.name || "No sends yet", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Campaign analytics</h2>
        <p className="text-sm text-muted-foreground md:text-base">
          Compare opens, clicks, and send performance across recent campaigns.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
              <item.icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{item.value}</div>
              <p className="mt-1 text-xs text-primary">{item.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opens vs clicks</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="opensFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chart.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="day" stroke={chart.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={chart.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      background: chart.tooltipBg,
                      border: `1px solid ${chart.tooltipBorder}`,
                      borderRadius: 8,
                    }}
                  />
                  <Area type="monotone" dataKey="opens" stroke={chart.primary} fill="url(#opensFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="clicks" stroke={chart.accent} fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send mix</CardTitle>
            <CardDescription>Share of campaigns by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sources}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={chart.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={chart.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      background: chart.tooltipBg,
                      border: `1px solid ${chart.tooltipBorder}`,
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="value" fill={chart.primary} radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign performance</CardTitle>
          <CardDescription>Rates for your campaigns in NOVA</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {loading ? "Loading analytics..." : "No campaign data yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Open rate</TableHead>
                  <TableHead>Click rate</TableHead>
                  <TableHead>Bounce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.sent.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="success">{row.open}%</Badge>
                    </TableCell>
                    <TableCell>{row.click}%</TableCell>
                    <TableCell className="text-muted-foreground">{row.bounce}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CampaignAnalytics;
