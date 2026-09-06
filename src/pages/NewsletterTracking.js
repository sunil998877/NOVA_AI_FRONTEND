import React, { useMemo } from "react";
import { Newspaper, Users, Eye, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
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
import { buildMonthlyData, campaignMetrics, normalizeCampaignStatus } from "../lib/campaigns";
import { formatDate } from "../lib/auth";

function NewsletterTracking() {
  const chart = useChartColors();
  const { campaigns, mails, stats, loading, error } = useWorkspaceData();

  const issues = useMemo(() => {
    const newsletters = campaigns.filter((campaign) => /news|digest|weekly/i.test(campaign.title || ""));
    const source = newsletters.length ? newsletters : campaigns;
    return source.map((campaign) => {
      const metrics = campaignMetrics(campaign, mails);
      const status = normalizeCampaignStatus(campaign);
      return {
        issue: campaign.title,
        date: formatDate(campaign.scheduledDate || campaign.createdAt),
        status: status === "sent" ? "Sent" : status === "scheduled" ? "Scheduled" : "Draft",
        sent: metrics.sent,
        open: metrics.sent ? `${((metrics.opened / metrics.sent) * 100).toFixed(1)}%` : "—",
        click: "—",
      };
    });
  }, [campaigns, mails]);

  const growth = useMemo(
    () =>
      buildMonthlyData(campaigns, mails).map((item) => ({
        week: item.month,
        subscribers: item.emails,
      })),
    [campaigns, mails]
  );

  const avgOpen = issues.filter((item) => item.open !== "—");
  const avgOpenValue = avgOpen.length
    ? (
        avgOpen.reduce((sum, item) => sum + Number(String(item.open).replace("%", "")), 0) / avgOpen.length
      ).toFixed(1)
    : "0.0";
  const best = issues.reduce((top, item) => {
    const value = item.open === "—" ? 0 : Number(String(item.open).replace("%", ""));
    const topValue = top?.open === "—" || !top ? 0 : Number(String(top.open).replace("%", ""));
    return value > topValue ? item : top;
  }, null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Newsletter tracking</h2>
        <p className="text-sm text-muted-foreground md:text-base">
          Issue performance and subscriber growth for your weekly newsletter.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscribers</CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stats.total || 0}</div>
            <p className="mt-1 text-xs text-primary">{loading ? "Loading" : "Saved recipients"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Issues sent</CardTitle>
            <Newspaper className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{issues.filter((item) => item.status === "Sent").length}</div>
            <p className="mt-1 text-xs text-muted-foreground">{campaigns.length} campaigns total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. open rate</CardTitle>
            <Eye className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{avgOpenValue}%</div>
            <p className="mt-1 text-xs text-primary">From campaign opens</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best issue</CardTitle>
            <TrendingUp className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-2xl font-bold">{best?.issue || "—"}</div>
            <p className="mt-1 text-xs text-muted-foreground">{best?.open || "No opens yet"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscriber growth</CardTitle>
          <CardDescription>Monthly recipients added</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth}>
                <defs>
                  <linearGradient id="subsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chart.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chart.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="week" stroke={chart.muted} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={chart.muted} fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    background: chart.tooltipBg,
                    border: `1px solid ${chart.tooltipBorder}`,
                    borderRadius: 8,
                  }}
                />
                <Area type="monotone" dataKey="subscribers" stroke={chart.primary} fill="url(#subsFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent issues</CardTitle>
          <CardDescription>Open and click rates by edition</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Open</TableHead>
                <TableHead>Click</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((row) => (
                <TableRow key={row.issue}>
                  <TableCell className="font-medium">{row.issue}</TableCell>
                  <TableCell className="text-muted-foreground">{row.date}</TableCell>
                  <TableCell>
                    {row.status === "Sent" ? (
                      <Badge>Sent</Badge>
                    ) : (
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        {row.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{row.sent ? row.sent.toLocaleString() : "—"}</TableCell>
                  <TableCell>{row.open}</TableCell>
                  <TableCell>{row.click}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {issues.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {loading ? "Loading issues..." : "No newsletter campaigns yet."}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default NewsletterTracking;
