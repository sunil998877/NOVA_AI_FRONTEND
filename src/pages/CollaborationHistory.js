import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  History,
  Search,
  Mail,
  ExternalLink,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
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
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { influencerApi } from "../lib/api";
import { formatDate } from "../lib/auth";
import { useToast } from "../components/ui/toast";

function CollaborationHistory() {
  const navigate = useNavigate();
  const toast = useToast();

  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [detailItem, setDetailItem] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [followupOpen, setFollowupOpen] = useState(false);
  const [followupInfluencer, setFollowupInfluencer] = useState(null);
  const [followupEmail, setFollowupEmail] = useState("");
  const [followupSubject, setFollowupSubject] = useState("");
  const [followupMessage, setFollowupMessage] = useState("");
  const [sendingFollowup, setSendingFollowup] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await influencerApi.collaborations({ limit: 100 });
      setCollaborations(res.data || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load collaboration history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return collaborations.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        (item.influencer_name || item.influencerName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.recipient_email || item.recipientEmail || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.subject || "").toLowerCase().includes(searchQuery.toLowerCase());

      const platformVal = String(item.platform || "youtube").toLowerCase();
      const matchesPlatform =
        selectedPlatform === "all" || platformVal === selectedPlatform;

      const statusVal = String(item.status || "sent").toLowerCase();
      const matchesStatus =
        selectedStatus === "all" || statusVal === selectedStatus;

      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [collaborations, searchQuery, selectedPlatform, selectedStatus]);

  const stats = useMemo(() => {
    const total = collaborations.length;
    const platforms = new Set(
      collaborations.map((c) => String(c.platform || "youtube").toLowerCase())
    ).size;
    const uniqueCreators = new Set(
      collaborations.map(
        (c) => c.influencer_id || c.influencer_name || c.influencerName
      )
    ).size;
    const replied = collaborations.filter((c) =>
      ["replied", "negotiating", "collaborating"].includes(
        String(c.status).toLowerCase()
      )
    ).length;

    return { total, platforms, uniqueCreators, replied };
  }, [collaborations]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this outreach record from collaboration history?")) {
      return;
    }
    try {
      await influencerApi.deleteCollaboration(id);
      setCollaborations((prev) => prev.filter((item) => item.id !== id));
      toast.success("Outreach record removed");
    } catch (err) {
      toast.error("Could not delete record", err.message);
    }
  };

  const openDetails = (item) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const openFollowup = (item) => {
    const creatorName = item.influencer_name || item.influencerName || "Creator";
    const creatorEmail = item.recipient_email || item.recipientEmail || "";
    setFollowupInfluencer(item);
    setFollowupEmail(creatorEmail);
    setFollowupSubject(`Following up: ${item.subject || "Our Collaboration"}`);
    setFollowupMessage(
      `Hi ${creatorName},\n\nI wanted to follow up on my previous note regarding partnering with NOVA. We're eager to collaborate and would love to hear your thoughts.\n\nBest regards,\nNOVA Partnerships Team`
    );
    setFollowupOpen(true);
  };

  const handleSendFollowup = async (e) => {
    e.preventDefault();
    if (!followupEmail.trim() || !followupSubject.trim() || !followupMessage.trim()) {
      toast.error("Please complete all required fields");
      return;
    }

    setSendingFollowup(true);
    try {
      await influencerApi.outreach({
        influencerId: followupInfluencer?.influencer_id || followupInfluencer?.influencerId || undefined,
        name: followupInfluencer?.influencer_name || followupInfluencer?.influencerName,
        username: followupInfluencer?.influencer_username || followupInfluencer?.influencerUsername,
        platform: followupInfluencer?.platform || "youtube",
        profileImage: followupInfluencer?.profile_image || followupInfluencer?.profileImage,
        profileUrl: followupInfluencer?.profile_url || followupInfluencer?.profileUrl,
        email: followupEmail.trim(),
        subject: followupSubject.trim(),
        message: followupMessage.trim(),
      });

      toast.success("Follow-up outreach sent successfully", `Delivered to ${followupEmail}`);
      setFollowupOpen(false);
      await loadData();
    } catch (err) {
      toast.error("Outreach delivery failed", err.message);
    } finally {
      setSendingFollowup(false);
    }
  };

  const handleUpdateStatus = async (id, nextStatus) => {
    try {
      const updated = await influencerApi.updateCollaboration(id, { status: nextStatus });
      setCollaborations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: updated.status || nextStatus } : c))
      );
      toast.success("Status updated", `Moved to ${nextStatus}`);
    } catch (err) {
      toast.error("Could not update status", err.message);
    }
  };

  const getPlatformBadge = (platform) => {
    const p = String(platform || "").toLowerCase();
    if (p === "youtube") {
      return (
        <Badge className="bg-red-600/15 text-red-600 hover:bg-red-600/20 border-red-600/30">
          YouTube
        </Badge>
      );
    }
    if (p === "instagram") {
      return (
        <Badge className="bg-pink-600/15 text-pink-600 hover:bg-pink-600/20 border-pink-600/30">
          Instagram
        </Badge>
      );
    }
    if (p === "twitter" || p === "x") {
      return (
        <Badge className="bg-sky-600/15 text-sky-600 hover:bg-sky-600/20 border-sky-600/30">
          Twitter/X
        </Badge>
      );
    }
    return <Badge variant="outline">{platform || "Unknown"}</Badge>;
  };

  const getStatusBadge = (status) => {
    const s = String(status || "sent").toLowerCase();
    if (s === "sent" || s === "delivered") {
      return (
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
          <CheckCircle2 className="size-3 mr-1 inline" /> Sent
        </Badge>
      );
    }
    if (s === "replied") {
      return (
        <Badge variant="outline" className="border-sky-500/30 text-sky-600 bg-sky-500/10">
          <MessageSquare className="size-3 mr-1 inline" /> Replied
        </Badge>
      );
    }
    if (s === "negotiating") {
      return (
        <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10">
          <Clock className="size-3 mr-1 inline" /> Negotiating
        </Badge>
      );
    }
    if (s === "collaborating") {
      return (
        <Badge className="bg-primary text-primary-foreground">
          Collaborating
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Collaboration History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage all direct outreach pitches sent to creators across YouTube, Instagram, and X.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => navigate("/find-influencers")} className="gap-1.5">
            <Users className="size-4" />
            Find New Influencers
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">Total Outreaches</div>
            <div className="mt-2 text-2xl font-bold tabular-nums">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">Creators Contacted</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-primary">{stats.uniqueCreators}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">Active Platforms</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-emerald-600">{stats.platforms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">Responses / In Progress</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-amber-600">{stats.replied}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search creator, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border bg-muted/40 p-0.5 text-xs">
            {["all", "youtube", "instagram", "twitter"].map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => setSelectedPlatform(plat)}
                className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                  selectedPlatform === plat
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {plat === "all" ? "All Platforms" : plat === "twitter" ? "Twitter/X" : plat}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg border bg-muted/40 p-0.5 text-xs">
            {["all", "sent", "replied", "negotiating"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                  selectedStatus === st
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "all" ? "All Status" : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Influencer</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Recipient Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Sent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const name = item.influencer_name || item.influencerName || "Creator";
              const username = item.influencer_username || item.influencerUsername;
              const email = item.recipient_email || item.recipientEmail;
              const img = item.profile_image || item.profileImage;
              const profileUrl = item.profile_url || item.profileUrl;

              return (
                <TableRow key={item.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border">
                        {img && <AvatarImage src={img} alt={name} />}
                        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                          {name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-semibold truncate max-w-[160px] sm:max-w-xs">{name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {username || `@${name.toLowerCase().replace(/\s+/g, "")}`}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPlatformBadge(item.platform)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Mail className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[160px]" title={email}>
                        {email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-xs font-medium text-foreground" title={item.subject}>
                      {item.subject}
                    </div>
                    <div className="max-w-[200px] truncate text-[11px] text-muted-foreground" title={item.message}>
                      {item.message}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.createdAt ? formatDate(item.createdAt) : "Just now"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetails(item)}
                        title="View Outreach Message"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openFollowup(item)}
                        title="Send Follow-up Email"
                      >
                        <Send className="size-4" />
                      </Button>
                      {profileUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(profileUrl, "_blank", "noopener,noreferrer")}
                          title="Open Channel / Profile"
                        >
                          <ExternalLink className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                        title="Remove Record"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {!loading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <History className="size-6" />
            </div>
            <h3 className="text-base font-semibold">
              {collaborations.length === 0 ? "No collaboration outreach sent yet" : "No matches found"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {collaborations.length === 0
                ? "When you send outreach pitches to influencers from Find Influencers or My Influencers, your communication history will appear here."
                : "Try adjusting your search query, platform filter, or status filter."}
            </p>
            {collaborations.length === 0 && (
              <Button className="mt-5" onClick={() => navigate("/find-influencers")}>
                Find Influencers to Contact
              </Button>
            )}
          </div>
        )}
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {detailItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-11 border">
                    {(detailItem.profile_image || detailItem.profileImage) && (
                      <AvatarImage
                        src={detailItem.profile_image || detailItem.profileImage}
                        alt={detailItem.influencer_name || detailItem.influencerName}
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 font-bold text-primary">
                      {(detailItem.influencer_name || detailItem.influencerName || "C").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="truncate text-base font-semibold">
                      Outreach to {detailItem.influencer_name || detailItem.influencerName}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="uppercase font-medium">{detailItem.platform}</span>
                      <span>•</span>
                      <span>{detailItem.createdAt ? formatDate(detailItem.createdAt) : "Recently"}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-3 text-sm">
                <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Recipient</span>
                    <div className="font-medium text-xs truncate mt-0.5">
                      {detailItem.recipient_email || detailItem.recipientEmail}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Delivery</span>
                    <div className="font-medium text-xs mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-emerald-500" />
                      <span>{String(detailItem.delivery_method || "N8N").toUpperCase()} Verified</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Subject</span>
                  <div className="mt-1 font-semibold text-sm rounded-md border bg-background px-3 py-2">
                    {detailItem.subject}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Message Body</span>
                  <div className="mt-1 whitespace-pre-wrap text-xs rounded-md border bg-muted/20 p-3 leading-relaxed max-h-60 overflow-y-auto">
                    {detailItem.message}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-1.5">
                    {["sent", "replied", "negotiating", "collaborating"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateStatus(detailItem.id, st)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                          detailItem.status === st
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDetailOpen(false);
                    openFollowup(detailItem);
                  }}
                  className="gap-1.5"
                >
                  <Send className="size-3.5" />
                  Follow-up
                </Button>
                <Button type="button" variant="secondary" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={followupOpen} onOpenChange={setFollowupOpen}>
        <DialogContent className="max-w-lg">
          {followupInfluencer && (
            <form onSubmit={handleSendFollowup}>
              <DialogHeader>
                <DialogTitle>
                  Send Follow-up to {followupInfluencer.influencer_name || followupInfluencer.influencerName}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-3.5 py-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="followup-to" className="text-xs font-semibold">Recipient Email</Label>
                  <Input
                    id="followup-to"
                    type="email"
                    value={followupEmail}
                    onChange={(e) => setFollowupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="followup-subj" className="text-xs font-semibold">Subject</Label>
                  <Input
                    id="followup-subj"
                    value={followupSubject}
                    onChange={(e) => setFollowupSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="followup-msg" className="text-xs font-semibold">Message</Label>
                  <Textarea
                    id="followup-msg"
                    rows={5}
                    value={followupMessage}
                    onChange={(e) => setFollowupMessage(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="secondary" onClick={() => setFollowupOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sendingFollowup || !followupEmail.trim()}>
                  {sendingFollowup ? (
                    <>
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Follow-up
                      <Send className="ml-1.5 size-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CollaborationHistory;
