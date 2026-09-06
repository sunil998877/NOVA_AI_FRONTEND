import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Mail,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useWorkspaceData } from "../hooks/useWorkspaceData";
import { formatDate, relativeTime } from "../lib/auth";
import { campaignMetrics, normalizeCampaignStatus } from "../lib/campaigns";

function DashboardView() {
  const { campaigns, mails, stats, loading, error } = useWorkspaceData();

  const scheduled = campaigns.filter((item) => normalizeCampaignStatus(item) === "scheduled");
  const drafts = campaigns.filter((item) => normalizeCampaignStatus(item) === "draft");
  const sentToday = mails.filter((mail) => {
    const stamp = mail.sent_at || mail.createdAt;
    if (!stamp) return false;
    const date = new Date(stamp);
    const now = new Date();
    return date.toDateString() === now.toDateString();
  });

  const kpis = [
    { label: "In send queue", value: String(drafts.length), hint: "Draft campaigns ready", icon: Clock },
    {
      label: "Scheduled",
      value: String(scheduled.length),
      hint: scheduled[0] ? `Next: ${formatDate(scheduled[0].scheduledDate)}` : "Nothing queued",
      icon: CalendarClock,
    },
    { label: "Delivered", value: String(stats.delivered || 0), hint: `${sentToday.length} logged today`, icon: Send },
    { label: "Recipients", value: String(stats.total || 0), hint: "Saved across campaigns", icon: Users },
  ];

  const activity = useMemo(() => {
    return [...campaigns]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 4)
      .map((campaign) => {
        const metrics = campaignMetrics(campaign, mails);
        const status = normalizeCampaignStatus(campaign);
        return {
          title: `${campaign.title} ${status}`,
          detail: `${metrics.recipients} recipients · ${campaign.workMail || "No sender"}`,
          time: relativeTime(campaign.updatedAt || campaign.createdAt),
          status: status === "sent" ? "done" : status,
        };
      });
  }, [campaigns, mails]);

  const tasks = [
    { title: "Draft copy in Message Crafting", href: "/message-crafting" },
    { title: "Review recipient lists", href: "/email-management" },
    { title: "Check opens in Email Tracking", href: "/email-tracking" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard view</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Today&apos;s queue, activity, and the next actions that keep campaigns moving.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/campaigns">
            <Mail />
            Open campaigns
          </Link>
        </Button>
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
              <div className="text-2xl font-bold tabular-nums">{loading ? "…" : item.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>Live workspace events from your last campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading activity..." : "Create a campaign to see activity here."}
              </p>
            ) : (
              activity.map((item) => (
                <div key={`${item.title}-${item.time}`} className="flex items-start justify-between gap-3 border-b border-border/70 pb-4 last:border-0 last:pb-0">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      {item.status === "done" ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next actions</CardTitle>
            <CardDescription>What to finish before the next send</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <Link
                key={task.title}
                to={task.href}
                className="flex items-center justify-between rounded-lg border bg-secondary/40 px-3 py-3 text-sm hover:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  {task.title}
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link to="/campaign-analytics">View campaign analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardView;
