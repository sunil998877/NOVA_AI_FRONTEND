import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  MailCheck,
  Clock,
  AlertCircle,
  Users,
  MousePointerClick,
  RefreshCw,
  Loader2,
  UserPlus,
} from "lucide-react";
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
import { recipientApi, mailApi } from "../lib/api";

export function CampaignRecipientsDialog({
  open,
  onOpenChange,
  campaign,
  mails = [],
  onAddRecipients,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const campaignId = campaign?.id || campaign?.raw?.id;

  const loadRecipients = useCallback(async (silent = false) => {
    if (!campaignId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      // 1. Fetch both campaign_recipients (from contacts) and mails (tracking/deliveries) in parallel
      const [crRes, mailsRes] = await Promise.allSettled([
        recipientApi.list(campaignId),
        mailApi.list(campaignId, { limit: 500 }),
      ]);

      const crList =
        crRes.status === "fulfilled" && crRes.value?.data
          ? Array.isArray(crRes.value.data)
            ? crRes.value.data
            : []
          : [];

      let mList =
        mailsRes.status === "fulfilled" && mailsRes.value?.data
          ? Array.isArray(mailsRes.value.data)
            ? mailsRes.value.data
            : []
          : [];

      // Fallback: if mailApi list for campaignId didn't return any, check passed `mails` prop
      if (mList.length === 0 && Array.isArray(mails)) {
        mList = mails.filter((m) => String(m.campaign_id) === String(campaignId));
      }

      // Map mails by lowercase email for fast lookup
      const mailByEmail = new Map();
      mList.forEach((m) => {
        const key = String(m.email || "").trim().toLowerCase();
        if (key) mailByEmail.set(key, m);
      });

      const unified = [];
      const seenEmails = new Set();

      // Priority 1: Add all assigned campaign recipients (from contacts)
      crList.forEach((cr) => {
        const emailKey = String(cr.email || "").trim().toLowerCase();
        if (emailKey) seenEmails.add(emailKey);
        const matchedMail = emailKey ? mailByEmail.get(emailKey) : null;

        const openCount =
          Number(matchedMail?.open_count) ||
          (matchedMail?.delivery_status === "opened" ? 1 : 0);
        const clickCount = Number(matchedMail?.click_count) || 0;
        const deliveryStatus =
          matchedMail?.delivery_status ||
          (matchedMail?.status ? "sent" : (cr.status || "pending"));
        const sentAt = matchedMail?.sent_at || cr.sent_at || null;
        const lastOpenedAt =
          matchedMail?.last_opened_at || matchedMail?.first_opened_at || null;

        unified.push({
          id: cr.id || matchedMail?.id || `cr-${cr.contact_id || Math.random()}`,
          contactId: cr.contact_id,
          email: cr.email || matchedMail?.email || "",
          name: cr.name || matchedMail?.full_name || "",
          company: cr.company || "",
          delivery_status: deliveryStatus,
          open_count: openCount,
          click_count: clickCount,
          sent_at: sentAt,
          last_opened_at: lastOpenedAt,
          status: matchedMail?.status ?? cr.status ?? "pending",
        });
      });

      // Priority 2: Add any mails table entries not covered in campaign_recipients
      mList.forEach((m) => {
        const emailKey = String(m.email || "").trim().toLowerCase();
        if (emailKey && !seenEmails.has(emailKey)) {
          seenEmails.add(emailKey);
          const openCount =
            Number(m.open_count) || (m.delivery_status === "opened" ? 1 : 0);
          unified.push({
            id: m.id || `mail-${Math.random()}`,
            contactId: null,
            email: m.email,
            name: m.full_name || "",
            company: "",
            delivery_status: m.delivery_status || (m.status ? "sent" : "pending"),
            open_count: openCount,
            click_count: Number(m.click_count) || 0,
            sent_at: m.sent_at || null,
            last_opened_at: m.last_opened_at || m.first_opened_at || null,
            status: m.status || (m.delivery_status === "opened" ? 1 : 0),
          });
        }
      });

      setRecipients(unified);
    } catch (err) {
      console.warn("[CampaignRecipientsDialog] loadRecipients error:", err.message);
      setError(err.message || "Failed to load recipients");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [campaignId, mails]);

  useEffect(() => {
    if (open && campaignId) {
      setSearch("");
      setStatusFilter("all");
      loadRecipients(false);
    }
  }, [open, campaignId, loadRecipients]);

  const stats = useMemo(() => {
    const total = recipients.length;
    const opened = recipients.filter(
      (m) => (Number(m.open_count) || 0) > 0 || m.delivery_status === "opened"
    ).length;
    const clicked = recipients.filter((m) => (Number(m.click_count) || 0) > 0).length;
    const failed = recipients.filter((m) => m.delivery_status === "failed").length;
    const sent = recipients.filter(
      (m) =>
        m.delivery_status === "sent" ||
        m.delivery_status === "opened" ||
        Boolean(m.status) ||
        Boolean(m.sent_at)
    ).length;
    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : "0.0";

    return { total, opened, clicked, failed, sent, openRate };
  }, [recipients]);

  const filteredRecipients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return recipients.filter((item) => {
      const email = String(item.email || "").toLowerCase();
      const name = String(item.name || "").toLowerCase();
      const company = String(item.company || "").toLowerCase();
      const matchesQuery =
        !query ||
        email.includes(query) ||
        name.includes(query) ||
        company.includes(query);

      const isOpened =
        (Number(item.open_count) || 0) > 0 || item.delivery_status === "opened";
      const isFailed = item.delivery_status === "failed";
      const isSent =
        item.delivery_status === "sent" ||
        Boolean(item.status) ||
        Boolean(item.sent_at);
      const isPending = !isOpened && !isSent && !isFailed;

      let matchesStatus = true;
      if (statusFilter === "opened") matchesStatus = isOpened;
      else if (statusFilter === "sent") matchesStatus = isSent && !isOpened;
      else if (statusFilter === "pending") matchesStatus = isPending;
      else if (statusFilter === "failed") matchesStatus = isFailed;

      return matchesQuery && matchesStatus;
    });
  }, [recipients, search, statusFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0">
                <Users className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {campaign?.name || campaign?.title || "Campaign"} Recipients & Tracking
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Real-time open status and recipient engagement tracking
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => loadRecipients(true)}
                disabled={loading || refreshing}
                title="Refresh real-time tracking"
              >
                <RefreshCw
                  className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              {onAddRecipients && (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => onAddRecipients(campaign)}
                >
                  <UserPlus className="size-3.5" />
                  Add Recipients
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {error ? (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Metric counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
          <div className="rounded-xl border bg-card/60 p-3 flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">
              Total Recipients
            </span>
            <span className="text-2xl font-bold tabular-nums mt-1">
              {stats.total}
            </span>
          </div>
          <div className="rounded-xl border bg-card/60 p-3 flex flex-col">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Eye className="size-3.5 text-primary" /> Opened
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tabular-nums text-primary">
                {stats.opened}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                ({stats.openRate}%)
              </span>
            </div>
          </div>
          <div className="rounded-xl border bg-card/60 p-3 flex flex-col">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <MailCheck className="size-3.5 text-blue-500" /> Delivered
            </span>
            <span className="text-2xl font-bold tabular-nums mt-1">
              {stats.sent}
            </span>
          </div>
          <div className="rounded-xl border bg-card/60 p-3 flex flex-col">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <MousePointerClick className="size-3.5 text-emerald-500" /> Clicked
            </span>
            <span className="text-2xl font-bold tabular-nums mt-1">
              {stats.clicked}
            </span>
          </div>
        </div>

        {/* Search and filter bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between my-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipient name, email or company..."
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: `All (${stats.total})` },
              { id: "opened", label: `Opened (${stats.opened})` },
              { id: "sent", label: `Delivered (${stats.sent})` },
              {
                id: "pending",
                label: `Queued (${Math.max(stats.total - stats.sent, 0)})`,
              },
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

        {/* Table Content */}
        <div className="flex-1 overflow-auto border rounded-xl mt-2 min-h-[220px]">
          {loading && recipients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm">Loading recipients & tracking data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-secondary/80 backdrop-blur z-10">
                <TableRow>
                  <TableHead className="w-[30%]">Recipient</TableHead>
                  <TableHead className="w-[20%]">Status</TableHead>
                  <TableHead className="w-[20%]">Opens Count</TableHead>
                  <TableHead className="w-[30%]">Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecipients.map((item) => {
                  const openCount =
                    Number(item.open_count) ||
                    (item.delivery_status === "opened" ? 1 : 0);
                  const isOpened =
                    openCount > 0 || item.delivery_status === "opened";
                  const isFailed = item.delivery_status === "failed";
                  const isSent =
                    item.delivery_status === "sent" ||
                    Boolean(item.status) ||
                    Boolean(item.sent_at);

                  return (
                    <TableRow
                      key={item.id}
                      className={isOpened ? "bg-primary/[0.03]" : ""}
                    >
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {item.email}
                        </div>
                        {item.name ? (
                          <div className="text-xs text-muted-foreground">
                            {item.name}
                            {item.company ? ` • ${item.company}` : ""}
                          </div>
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
                          <Badge
                            variant="outline"
                            className="border-blue-500/40 text-blue-600 gap-1"
                          >
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
                        {isOpened && item.last_opened_at ? (
                          <div className="flex flex-col">
                            <span className="text-foreground font-medium">
                              Opened: {formatDate(item.last_opened_at)}
                            </span>
                            {item.sent_at ? (
                              <span>Sent: {formatDate(item.sent_at)}</span>
                            ) : null}
                          </div>
                        ) : item.sent_at ? (
                          <span>Sent: {formatDate(item.sent_at)}</span>
                        ) : (
                          <span className="text-muted-foreground">Not sent yet</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!loading && filteredRecipients.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                <Users className="size-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {recipients.length === 0
                  ? "No recipients added to this campaign yet"
                  : "No recipients match your search or filter"}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {recipients.length === 0
                  ? "Add contacts to this campaign to begin sending emails and tracking open rates."
                  : "Try clearing your search query or selecting a different status filter."}
              </p>
              {recipients.length === 0 && onAddRecipients && (
                <Button
                  size="sm"
                  className="mt-2 gap-1.5"
                  onClick={() => onAddRecipients(campaign)}
                >
                  <UserPlus className="size-4" />
                  Add Recipients Now
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
