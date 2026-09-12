import React, { useMemo, useState } from "react";
import { Search, Eye, MailCheck, Clock, AlertCircle, X, Users, MousePointerClick } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { formatDate } from "../lib/auth";

export function CampaignRecipientsDialog({ open, onOpenChange, campaign, mails = [] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const campaignMails = useMemo(() => {
    if (!campaign?.id) return [];
    return mails.filter((m) => String(m.campaign_id) === String(campaign.id));
  }, [campaign?.id, mails]);

  const stats = useMemo(() => {
    const total = campaignMails.length;
    const opened = campaignMails.filter(
      (m) => (Number(m.open_count) || 0) > 0 || m.delivery_status === "opened"
    ).length;
    const clicked = campaignMails.filter((m) => (Number(m.click_count) || 0) > 0).length;
    const failed = campaignMails.filter((m) => m.delivery_status === "failed").length;
    const sent = campaignMails.filter(
      (m) => m.delivery_status === "sent" || m.delivery_status === "opened" || m.status || m.sent_at
    ).length;
    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : "0.0";

    return { total, opened, clicked, failed, sent, openRate };
  }, [campaignMails]);

  const filteredMails = useMemo(() => {
    const query = search.trim().toLowerCase();
    return campaignMails.filter((mail) => {
      const email = String(mail.email || "").toLowerCase();
      const name = String(mail.full_name || "").toLowerCase();
      const matchesQuery = !query || email.includes(query) || name.includes(query);

      const isOpened = (Number(mail.open_count) || 0) > 0 || mail.delivery_status === "opened";
      const isFailed = mail.delivery_status === "failed";
      const isSent = mail.delivery_status === "sent" || mail.status || mail.sent_at;
      const isPending = !isOpened && !isSent && !isFailed;

      let matchesStatus = true;
      if (statusFilter === "opened") matchesStatus = isOpened;
      else if (statusFilter === "sent") matchesStatus = isSent && !isOpened;
      else if (statusFilter === "pending") matchesStatus = isPending;
      else if (statusFilter === "failed") matchesStatus = isFailed;

      return matchesQuery && matchesStatus;
    });
  }, [campaignMails, search, statusFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {campaign?.name || campaign?.title || "Campaign"} Recipients & Tracking
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Real-time open status and engagement per recipient
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Top metric counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
          <div className="rounded-xl border bg-card/60 p-3 flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">Recipients</span>
            <span className="text-2xl font-bold tabular-nums mt-1">{stats.total}</span>
          </div>
          <div className="rounded-xl border bg-card/60 p-3 flex flex-col">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Eye className="size-3.5 text-primary" /> Opened
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tabular-nums text-primary">{stats.opened}</span>
              <span className="text-xs font-semibold text-muted-foreground">({stats.openRate}%)</span>
            </div>
          </div>
          <div className="rounded-xl border bg-card/60 p-3 flex flex-col">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <MailCheck className="size-3.5 text-blue-500" /> Delivered
            </span>
            <span className="text-2xl font-bold tabular-nums mt-1">{stats.sent}</span>
          </div>
          <div className="rounded-xl border bg-card/60 p-3 flex flex-col">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <MousePointerClick className="size-3.5 text-emerald-500" /> Clicked
            </span>
            <span className="text-2xl font-bold tabular-nums mt-1">{stats.clicked}</span>
          </div>
        </div>

        {/* Search and filter bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between my-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipient name or email..."
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "All" },
              { id: "opened", label: `Opened (${stats.opened})` },
              { id: "sent", label: "Sent" },
              { id: "pending", label: "Pending" },
              { id: "failed", label: `Failed (${stats.failed})` },
            ].map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={statusFilter === f.id ? "default" : "outline"}
                className="h-8 text-xs px-2.5"
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Recipients Table */}
        <div className="flex-1 overflow-auto border rounded-xl mt-2">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary/80 backdrop-blur z-10">
              <TableRow>
                <TableHead className="w-[30%]">Recipient</TableHead>
                <TableHead className="w-[20%]">Status</TableHead>
                <TableHead className="w-[20%]">Opens Count</TableHead>
                <TableHead className="w-[30%]">Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMails.map((mail) => {
                const openCount = Number(mail.open_count) || (mail.delivery_status === "opened" ? 1 : 0);
                const isOpened = openCount > 0 || mail.delivery_status === "opened";
                const isFailed = mail.delivery_status === "failed";
                const isSent = mail.delivery_status === "sent" || mail.status || mail.sent_at;

                return (
                  <TableRow key={mail.id} className={isOpened ? "bg-primary/[0.03]" : ""}>
                    <TableCell>
                      <div className="font-medium text-foreground">{mail.email}</div>
                      {mail.full_name ? (
                        <div className="text-xs text-muted-foreground">{mail.full_name}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {isOpened ? (
                        <Badge variant="success" className="gap-1">
                          <Eye className="size-3" /> Opened
                        </Badge>
                      ) : isFailed ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="size-3" /> Failed
                        </Badge>
                      ) : isSent ? (
                        <Badge variant="outline" className="border-blue-500/40 text-blue-600 gap-1">
                          <MailCheck className="size-3" /> Delivered
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="size-3" /> Queued
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isOpened ? (
                        <span className="font-semibold text-primary tabular-nums">
                          {openCount} {openCount === 1 ? "open" : "opens"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {isOpened && (mail.last_opened_at || mail.first_opened_at) ? (
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">
                            Opened: {formatDate(mail.last_opened_at || mail.first_opened_at)}
                          </span>
                          {mail.sent_at ? <span>Sent: {formatDate(mail.sent_at)}</span> : null}
                        </div>
                      ) : mail.sent_at ? (
                        <span>Sent: {formatDate(mail.sent_at)}</span>
                      ) : (
                        <span>—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredMails.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {campaignMails.length === 0
                ? "No recipients added to this campaign yet."
                : "No recipients match your search or filter."}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
