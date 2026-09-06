import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Mail,
  EllipsisVertical,
  Eye,
  ChartBar,
  Pencil,
  Copy,
  Trash2,
  Send,
  Loader2,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { CampaignFormDialog } from "../components/CampaignFormDialog";
import { campaignApi, mailApi } from "../lib/api";
import { useWorkspaceData } from "../hooks/useWorkspaceData";
import { toCampaignRow } from "../lib/campaigns";
import { useToast } from "../components/ui/toast";

function parseRecipientEmails(raw) {
  return String(raw || "")
    .split(/[\n,;]+/)
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}

function Campaigns() {
  const navigate = useNavigate();
  const { campaigns, mails, loading, error, reload } = useWorkspaceData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [recipientCampaign, setRecipientCampaign] = useState(null);
  const [recipientEmails, setRecipientEmails] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientError, setRecipientError] = useState("");
  const [savingRecipients, setSavingRecipients] = useState(false);
  const [formError, setFormError] = useState("");

  const rows = useMemo(
    () => campaigns.map((campaign) => toCampaignRow(campaign, mails)),
    [campaigns, mails]
  );

  const hasProcessing = rows.some((row) => row.status === "processing");

  useEffect(() => {
    if (!hasProcessing) return undefined;
    const id = window.setInterval(() => {
      reload();
    }, 5000);
    return () => window.clearInterval(id);
  }, [hasProcessing, reload]);

  const filtered = rows.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    if (status === "completed" || status === "sent") return <Badge>Completed</Badge>;
    if (status === "processing") {
      return (
        <Badge variant="outline" className="border-amber-500/50 text-amber-600">
          Processing
        </Badge>
      );
    }
    if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
    if (status === "draft") return <Badge variant="secondary">Draft</Badge>;
    if (status === "scheduled") {
      return <Badge variant="outline" className="border-primary/40 text-primary">Scheduled</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getRate = (num, den) => (den > 0 ? `${((num / den) * 100).toFixed(1)}%` : "0%");

  const openAddRecipients = (row) => {
    setRecipientCampaign(row);
    setRecipientEmails("");
    setRecipientName("");
    setRecipientError("");
    setRecipientOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await campaignApi.update(editing.id, payload);
        toast.success("Campaign updated", "Your changes have been saved.");
      } else {
        await campaignApi.create(payload);
        toast.success("Campaign created", "Your new campaign is ready.");
      }
      setShowModal(false);
      setEditing(null);
      await reload();
    } catch (err) {
      toast.error("Could not save campaign", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await campaignApi.remove(id);
      await reload();
      toast.success("Campaign deleted");
    } catch (err) {
      toast.error("Could not delete campaign", err.message);
    }
  };

  const handleDuplicate = async (row) => {
    try {
      await campaignApi.create({
        title: `${row.name} copy`,
        workMail: row.workMail || null,
        status: "draft",
      });
      await reload();
      toast.success("Campaign duplicated", `"${row.name} copy" is ready.`);
    } catch (err) {
      toast.error("Could not duplicate campaign", err.message);
    }
  };

  const handleAddRecipients = async (event) => {
    event.preventDefault();
    if (!recipientCampaign?.id) return;
    const parsed = parseRecipientEmails(recipientEmails);
    if (parsed.length === 0) {
      setRecipientError("Enter at least one email address");
      return;
    }
    setSavingRecipients(true);
    setRecipientError("");
    try {
      const mails = parsed.map((item, index) => ({
        email: item.email,
        full_name: index === 0 && recipientName ? recipientName : undefined,
      }));
      await mailApi.batchCreate(recipientCampaign.id, mails);
      setRecipientOpen(false);
      toast.success(
        "Recipients added",
        `Added ${mails.length} recipient${mails.length === 1 ? "" : "s"} to "${recipientCampaign.name}". You can Send now.`
      );
      await reload();
    } catch (err) {
      setRecipientError(err.message || "Could not add recipients");
    } finally {
      setSavingRecipients(false);
    }
  };

  const handleStart = async (row) => {
    if (!row.recipients || row.recipients < 1) {
      toast.warning("No recipients", `"${row.name}" has 0 recipients. Add emails first.`);
      openAddRecipients(row);
      return;
    }
    setSendingId(row.id);
    try {
      const result = await campaignApi.send(row.id);
      toast.success(
        "Campaign sending!",
        `${result.totalRecipients} recipient${result.totalRecipients === 1 ? "" : "s"} queued · Status: ${result.status}`
      );
      await reload();
    } catch (err) {
      const message = err.message || "Could not start campaign";
      toast.error("Send failed", message);
      if (/no recipients/i.test(message)) openAddRecipients(row);
    } finally {
      setSendingId(null);
    }
  };

  const handleComplete = async (row) => {
    setCompletingId(row.id);
    try {
      const result = await campaignApi.complete(row.id, { markMails: true });
      toast.success(
        "Campaign completed",
        `Sent: ${result.sent} · Failed: ${result.failed}`
      );
      await reload();
    } catch (err) {
      toast.error("Could not complete campaign", err.message);
    } finally {
      setCompletingId(null);
    }
  };

  const canSend = (row) =>
    (row.status === "draft" || row.status === "scheduled" || row.status === "failed") &&
    row.recipients > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Your Campaigns</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage and track all your email campaigns in one place.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormError(null);
            setShowModal(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus />
          New Campaign
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "draft", "processing", "completed", "failed", "scheduled"].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status ? "default" : "outline"}
              className="capitalize"
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>Open Rate</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>From</TableHead>
              <TableHead className="w-[180px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Mail className="size-4" />
                    </div>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground">{campaign.subject}</div>
                      {campaign.body ? (
                        <div className="mt-0.5 line-clamp-1 max-w-[340px] text-xs text-muted-foreground/70">
                          {campaign.body}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                <TableCell className="tabular-nums">
                  <span className={campaign.recipients === 0 ? "text-destructive" : ""}>
                    {campaign.recipients.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">{campaign.sent.toLocaleString()}</TableCell>
                <TableCell className="tabular-nums">{campaign.failed.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary"
                        style={{ width: getRate(campaign.opened, campaign.sent) }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      {getRate(campaign.opened, campaign.sent)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{campaign.date}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {campaign.list}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    {campaign.recipients === 0 &&
                      (campaign.status === "draft" ||
                        campaign.status === "scheduled" ||
                        campaign.status === "failed") ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5"
                        onClick={() => openAddRecipients(campaign)}
                      >
                        <UserPlus className="size-3.5" />
                        Add recipients
                      </Button>
                    ) : null}
                    {canSend(campaign) ? (
                      <Button
                        size="sm"
                        className="h-8 gap-1.5"
                        disabled={sendingId === campaign.id}
                        onClick={() => handleStart(campaign)}
                      >
                        {sendingId === campaign.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        {sendingId === campaign.id ? "Sending..." : "Send"}
                      </Button>
                    ) : null}
                    {campaign.status === "processing" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 border-amber-500/40 text-amber-600"
                        disabled={completingId === campaign.id}
                        onClick={() => handleComplete(campaign)}
                        title="Emails already sent? Mark this campaign completed"
                      >
                        {completingId === campaign.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {completingId === campaign.id ? "Updating..." : "Mark completed"}
                      </Button>
                    ) : null}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <EllipsisVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAddRecipients(campaign)}>
                          <UserPlus /> Add recipients
                        </DropdownMenuItem>
                        {campaign.status === "processing" ? (
                          <DropdownMenuItem onClick={() => handleComplete(campaign)}>
                            <CheckCircle2 /> Mark completed
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem onClick={() => navigate("/email-management")}>
                          <Mail /> Email management
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/email-tracking")}>
                          <Eye /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/campaign-analytics")}>
                          <ChartBar /> Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(campaign.raw);
                            setFormError("");
                            setShowModal(true);
                          }}
                        >
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(campaign)}>
                          <Copy /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(campaign.id)}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Search className="size-7" />
            </div>
            <h3 className="text-base font-semibold">
              {loading ? "Loading campaigns..." : "No campaigns found"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {loading
                ? "Fetching your campaigns from NOVA."
                : "Create a campaign, add recipients, then click Send."}
            </p>
          </div>
        )}
      </Card>

      <CampaignFormDialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleSave}
        submitting={saving}
        error={""}
        initial={editing}
        title={editing ? "Edit Campaign" : "Create New Campaign"}
        submitLabel={editing ? "Save changes" : "Create Campaign"}
      />

      <Dialog open={recipientOpen} onOpenChange={setRecipientOpen}>
        <DialogContent>
          <form onSubmit={handleAddRecipients}>
            <DialogHeader>
              <DialogTitle>
                Add recipients
                {recipientCampaign ? ` — ${recipientCampaign.name}` : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                This campaign has no emails yet. Add at least one recipient before sending.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="recipient-name">Name (optional)</Label>
                <Input
                  id="recipient-name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="First recipient name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recipient-emails">Email(s)</Label>
                <textarea
                  id="recipient-emails"
                  value={recipientEmails}
                  onChange={(e) => setRecipientEmails(e.target.value)}
                  placeholder={"one@example.com\ntwo@example.com"}
                  required
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple emails with commas or new lines.
                </p>
              </div>
              {recipientError ? <p className="text-sm text-destructive">{recipientError}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setRecipientOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingRecipients}>
                {savingRecipients ? "Saving..." : "Add recipients"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Campaigns;
