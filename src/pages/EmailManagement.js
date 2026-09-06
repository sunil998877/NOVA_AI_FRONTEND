import React, { useMemo, useState } from "react";
import { Plus, Search, Users, FileText, AtSign } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
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
import { CampaignFormDialog } from "../components/CampaignFormDialog";
import { useAuth } from "../lib/AuthContext";
import { campaignApi, mailApi } from "../lib/api";
import { useWorkspaceData } from "../hooks/useWorkspaceData";
import { campaignMetrics } from "../lib/campaigns";
import { formatDate as formatStamp } from "../lib/auth";
import { useToast } from "../components/ui/toast";

const templates = [
  { name: "Welcome Series", type: "Automation" },
  { name: "Product Announcement", type: "Broadcast" },
  { name: "Weekly Newsletter", type: "Newsletter" },
  { name: "Abandoned Cart", type: "Automation" },
];

const tabs = [
  { id: "lists", label: "Lists", icon: Users },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "senders", label: "Senders", icon: AtSign },
];

function EmailManagement() {
  const { user } = useAuth();
  const { campaigns, mails, loading, error, reload } = useWorkspaceData();
  const toast = useToast();
  const [tab, setTab] = useState("lists");
  const [query, setQuery] = useState("");
  const [showCampaign, setShowCampaign] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [recipient, setRecipient] = useState({ email: "", fullName: "" });
  const [recipientError, setRecipientError] = useState("");
  const [formError, setFormError] = useState("");

  const lists = useMemo(
    () =>
      campaigns.map((campaign) => {
        const metrics = campaignMetrics(campaign, mails);
        return {
          id: campaign.id,
          name: campaign.title,
          contacts: metrics.recipients,
          status: campaign.status === "sent" ? "Active" : campaign.status || "Draft",
          updated: formatStamp(campaign.updatedAt || campaign.createdAt),
          workMail: campaign.workMail,
        };
      }),
    [campaigns, mails]
  );

  const senders = useMemo(() => {
    const fromCampaigns = campaigns
      .filter((campaign) => campaign.workMail)
      .map((campaign) => ({
        name: campaign.title,
        email: campaign.workMail,
        domain: "Connected",
      }));
    const unique = [];
    const seen = new Set();
    if (user?.email) {
      unique.push({ name: user.fullName || "You", email: user.email, domain: "Account" });
      seen.add(user.email.toLowerCase());
    }
    fromCampaigns.forEach((item) => {
      const key = String(item.email).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });
    return unique;
  }, [campaigns, user]);

  const handleCreateList = async (payload) => {
    setSaving(true);
    try {
      await campaignApi.create(payload);
      setShowCampaign(false);
      await reload();
      toast.success("List created", "Your new email list is ready.");
    } catch (err) {
      toast.error("Could not create list", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRecipient = async (event) => {
    event.preventDefault();
    if (!selectedCampaign || !recipient.email) return;
    setRecipientError("");
    setSaving(true);
    try {
      await mailApi.batchCreate(selectedCampaign, [
        { email: recipient.email, full_name: recipient.fullName },
      ]);
      setRecipientOpen(false);
      setRecipient({ email: "", fullName: "" });
      await reload();
      toast.success("Recipient added", `${recipient.email} added successfully.`);
    } catch (err) {
      setRecipientError(err.message || "Could not add recipient");
      toast.error("Could not add recipient", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Email management</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Lists, templates, and sender identities used across campaigns.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={() => setRecipientOpen(true)}>
            Add recipient
          </Button>
          <Button onClick={() => setShowCampaign(true)}>
            <Plus />
            New list
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button key={item.id} variant={tab === item.id ? "default" : "secondary"} size="sm" onClick={() => setTab(item.id)}>
            <item.icon />
            {item.label}
          </Button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="pl-8"
        />
      </div>

      {tab === "lists" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscriber lists</CardTitle>
            <CardDescription>Each campaign is a recipient list in NOVA</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>List</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists
                  .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.contacts.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "sent" || item.status === "Active" ? "success" : "secondary"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.updated}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {lists.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {loading ? "Loading lists..." : "Create a campaign to start a list."}
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {tab === "templates" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {templates
            .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
            .map((item) => (
              <Card key={item.name}>
                <CardHeader>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <CardDescription>Use this brief in Message Crafting</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">{item.type}</Badge>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {tab === "senders" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sender identities</CardTitle>
            <CardDescription>From names and Gmail addresses used in outbound mail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {senders
              .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.email.toLowerCase().includes(query.toLowerCase()))
              .map((item) => (
                <div key={item.email} className="flex items-center justify-between rounded-lg border px-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.email}</p>
                  </div>
                  <Badge variant="success">{item.domain}</Badge>
                </div>
              ))}
            {senders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add a workMail when you create a campaign.</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      <CampaignFormDialog
        open={showCampaign}
        onOpenChange={setShowCampaign}
        onSubmit={handleCreateList}
        submitting={saving}
        error={formError}
        title="New list / campaign"
        submitLabel="Create list"
      />

      <Dialog open={recipientOpen} onOpenChange={setRecipientOpen}>
        <DialogContent>
          <form onSubmit={handleAddRecipient}>
            <DialogHeader>
              <DialogTitle>Add recipient</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="recipient-campaign">Campaign</Label>
                <select
                  id="recipient-campaign"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select a campaign...</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recipient-name">Name</Label>
                <Input
                  id="recipient-name"
                  value={recipient.fullName}
                  onChange={(e) => setRecipient({ ...recipient, fullName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recipient-email">Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  value={recipient.email}
                  onChange={(e) => setRecipient({ ...recipient, email: e.target.value })}
                  required
                />
              </div>
              {recipientError ? <p className="text-sm text-destructive">{recipientError}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setRecipientOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EmailManagement;
