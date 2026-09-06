import React, { useMemo, useState } from "react";
import { Search, MousePointerClick, Eye, AlertTriangle, MailOpen } from "lucide-react";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useWorkspaceData } from "../hooks/useWorkspaceData";
import { mailEvent } from "../lib/campaigns";

function eventBadge(event) {
  if (event === "Opened") return <Badge variant="success">Opened</Badge>;
  if (event === "Clicked") return <Badge>Clicked</Badge>;
  if (event === "Sent") return <Badge>Sent</Badge>;
  if (event === "Bounced") return <Badge variant="destructive">Bounced</Badge>;
  return <Badge variant="outline">{event}</Badge>;
}

function EmailTracking() {
  const { campaigns, mails, stats, loading, error } = useWorkspaceData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const campaignsById = useMemo(
    () => Object.fromEntries(campaigns.map((campaign) => [String(campaign.id), campaign])),
    [campaigns]
  );

  const events = useMemo(
    () => mails.map((mail) => mailEvent(mail, campaignsById)),
    [mails, campaignsById]
  );

  const filtered = events.filter((row) => {
    const matchesQuery =
      row.email.toLowerCase().includes(query.toLowerCase()) ||
      row.campaign.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || row.event.toLowerCase() === filter;
    return matchesQuery && matchesFilter;
  });

  const openedCount = events.filter((row) => row.event === "Opened").length;

  const statsCards = [
    { label: "Opens", value: String(stats.opened || openedCount), icon: Eye },
    { label: "Clicks", value: "0", icon: MousePointerClick },
    { label: "Recipients", value: String(stats.total || events.length), icon: MailOpen },
    { label: "Bounces", value: String(events.filter((row) => row.event === "Bounced").length), icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Email tracking</h2>
        <p className="text-sm text-muted-foreground md:text-base">
          Opens, clicks, and delivery events as they come in.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
              <item.icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email or campaign..." className="pl-8" />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "opened", "sent", "queued", "bounced"].map((item) => (
            <Button key={item} size="sm" variant={filter === item ? "default" : "secondary"} onClick={() => setFilter(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
          <CardDescription>Latest engagement from delivered campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.email}</TableCell>
                  <TableCell>{row.campaign}</TableCell>
                  <TableCell>{eventBadge(row.event)}</TableCell>
                  <TableCell className="text-muted-foreground">{row.device}</TableCell>
                  <TableCell className="text-muted-foreground">{row.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {loading ? "Loading events..." : "No tracking events yet. Add recipients to a campaign."}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default EmailTracking;
