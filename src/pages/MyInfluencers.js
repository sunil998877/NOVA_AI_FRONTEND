import React, { useEffect, useState } from "react";
import { Mail, Trash2, ExternalLink, Users, Send, Search, CheckCircle2, AlertCircle, Copy, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
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
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { influencerApi } from "../lib/api";
import { formatDate } from "../lib/auth";
import { useToast } from "../components/ui/toast";

function formatNumber(num) {
  if (num === null || num === undefined) return "N/A";
  const n = Number(num);
  if (Number.isNaN(n)) return "N/A";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

function MyInfluencers() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [outreachOpen, setOutreachOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [outreachEmail, setOutreachEmail] = useState("");
  const [outreachSubject, setOutreachSubject] = useState("");
  const [outreachMessage, setOutreachMessage] = useState("");
  const [sendingOutreach, setSendingOutreach] = useState(false);
  const [hasVerifiedEmail, setHasVerifiedEmail] = useState(false);
  const [saveEmailToProfile, setSaveEmailToProfile] = useState(true);

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || "").trim());

  const toast = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await influencerApi.list();
      if (result.error) {
        setError(result.error);
      }
      setInfluencers(result.data || []);
    } catch (err) {
      setError(err.message || "Could not load influencers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getStatusBadge = (status) => {
    if (status === "contacted") {
      return <Badge variant="outline" className="border-primary/40 text-primary">Contacted</Badge>;
    }
    if (status === "negotiating") {
      return <Badge>Negotiating</Badge>;
    }
    if (status === "collaborating") {
      return <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/20">Collaborating</Badge>;
    }
    return <Badge variant="outline">{status || "Saved"}</Badge>;
  };

  const getPlatformBadge = (platform) => {
    const p = String(platform || "").toLowerCase();
    if (p === "youtube") {
      return <Badge className="bg-red-600/15 text-red-600 border-red-600/30">YouTube</Badge>;
    }
    if (p === "instagram") {
      return <Badge className="bg-pink-600/15 text-pink-600 border-pink-600/30">Instagram</Badge>;
    }
    if (p === "twitter") {
      return <Badge className="bg-sky-600/15 text-sky-600 border-sky-600/30">Twitter/X</Badge>;
    }
    return <Badge variant="secondary">{platform}</Badge>;
  };

  const handleDelete = async (id) => {
    try {
      await influencerApi.remove(id);
      setInfluencers((prev) => prev.filter((inf) => inf.id !== id));
      toast.success("Influencer removed");
    } catch (err) {
      toast.error("Could not remove influencer", err.message);
    }
  };

  const cycleStatus = async (inf) => {
    const order = ["saved", "contacted", "negotiating", "collaborating"];
    const next = order[(Math.max(order.indexOf(inf.status), 0) + 1) % order.length];
    try {
      const updated = await influencerApi.update(inf.id, {
        status: next,
        lastContact: new Date().toISOString(),
      });
      setInfluencers((prev) => prev.map((item) => (item.id === inf.id ? updated : item)));
      toast.info("Status updated", `Moved to ${next}.`);
    } catch (err) {
      toast.error("Could not update status", err.message);
    }
  };

  const openOutreach = (inf) => {
    setSelectedInfluencer(inf);
    const hasVerified = Boolean(inf?.email && isValidEmail(inf.email));
    setHasVerifiedEmail(hasVerified);
    setOutreachEmail(hasVerified ? inf.email : "");
    setSaveEmailToProfile(true);
    setOutreachSubject(`Collaboration Opportunity: NOVA & ${inf.name}`);
    setOutreachMessage(
      `Hi ${inf.name},\n\nWe love your content on ${String(inf.platform || "").toUpperCase()} and would love to collaborate.\n\nBest regards,\nNOVA Partnerships Team`
    );
    setOutreachOpen(true);
  };

  const handleSendOutreach = async (e) => {
    e.preventDefault();
    const cleanEmail = outreachEmail.trim();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      toast.error("Please enter a valid recipient email");
      return;
    }
    if (!outreachSubject.trim() || !outreachMessage.trim()) {
      toast.error("Please complete subject and message fields");
      return;
    }

    setSendingOutreach(true);
    try {
      if (selectedInfluencer?.id && (saveEmailToProfile || !selectedInfluencer.email)) {
        try {
          await influencerApi.update(selectedInfluencer.id, { email: cleanEmail });
        } catch (_) {}
      }

      await influencerApi.outreach({
        influencerId: selectedInfluencer?.id,
        name: selectedInfluencer?.name,
        username: selectedInfluencer?.username,
        platform: selectedInfluencer?.platform,
        profileImage: selectedInfluencer?.profile_image || selectedInfluencer?.profileImage,
        profileUrl: selectedInfluencer?.profile_url || selectedInfluencer?.profileUrl,
        email: cleanEmail,
        subject: outreachSubject,
        message: outreachMessage,
      });

      toast.success("Outreach email sent successfully", `Delivered to ${cleanEmail}`);
      setOutreachOpen(false);
      await load();
    } catch (err) {
      toast.error("Outreach delivery failed", err.message);
    } finally {
      setSendingOutreach(false);
    }
  };

  const stats = [
    { label: "Total Saved", value: influencers.length },
    { label: "Contacted", value: influencers.filter((i) => i.status === "contacted").length },
    { label: "Negotiating", value: influencers.filter((i) => i.status === "negotiating").length },
    { label: "Collaborating", value: influencers.filter((i) => i.status === "collaborating").length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">My Influencers</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage your saved creator relationships and outreach collaborations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/find-influencers")}>
            <Search className="mr-1.5 size-4" /> Find Creators
          </Button>
          <div className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2">
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-sm font-semibold">{influencers.length} Saved</span>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 text-center">
              <div className="text-2xl font-bold tabular-nums text-primary md:text-3xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Influencer</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Email Status</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Videos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {influencers.map((inf) => (
              <TableRow key={inf.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 border">
                      {inf.profile_image && <AvatarImage src={inf.profile_image} alt={inf.name} />}
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {(inf.name || "C").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold truncate max-w-[180px] sm:max-w-xs">{inf.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {inf.username || "No handle"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getPlatformBadge(inf.platform)}</TableCell>
                <TableCell>
                  {inf.email ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-2.5" /> Verified
                      </span>
                      <span className="text-xs truncate max-w-[140px]" title={inf.email}>
                        {inf.email}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <AlertCircle className="size-2.5 text-amber-500" /> No email available
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium tabular-nums">{formatNumber(inf.subscribers)}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{formatNumber(inf.video_count)}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => cycleStatus(inf)}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    title="Click to cycle status"
                  >
                    {getStatusBadge(inf.status)}
                  </button>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {inf.lastContact ? formatDate(inf.lastContact) : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant={inf.email ? "default" : "outline"}
                      size="sm"
                      onClick={() => openOutreach(inf)}
                      className="h-8 gap-1.5 text-xs px-2.5"
                      title={inf.email ? "Send Outreach (Verified Email)" : "Outreach (No email available - manual entry or social contact)"}
                    >
                      <Mail className="size-3.5" />
                      <span>{inf.email ? "Outreach" : "Contact"}</span>
                    </Button>
                    {inf.profile_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(inf.profile_url, "_blank", "noopener,noreferrer")}
                        title="View Channel"
                      >
                        <ExternalLink className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(inf.id)}
                      title="Remove Influencer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {influencers.length === 0 && (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-6" />
            </div>
            <h3 className="text-base font-semibold">
              {loading ? "Loading saved influencers..." : "You haven't added any influencers yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Discover real creators on YouTube, Instagram, and X to add them to your audience.
            </p>
            {!loading && (
              <Button className="mt-5" onClick={() => navigate("/find-influencers")}>
                Find Influencers
              </Button>
            )}
          </div>
        )}
      </Card>

      <Dialog open={outreachOpen} onOpenChange={setOutreachOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSendOutreach}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar className="size-11 border">
                  {selectedInfluencer?.profile_image && (
                    <AvatarImage src={selectedInfluencer.profile_image} alt={selectedInfluencer?.name} />
                  )}
                  <AvatarFallback className="bg-primary/10 font-bold text-primary">
                    {(selectedInfluencer?.name || "C").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="truncate text-base font-semibold">
                    Send Outreach to {selectedInfluencer?.name}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="truncate">
                      {selectedInfluencer?.username || `@${selectedInfluencer?.name?.toLowerCase().replace(/\s+/g, "")}`}
                    </span>
                    <span>•</span>
                    <span className="uppercase font-medium">{selectedInfluencer?.platform}</span>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              {hasVerifiedEmail ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-emerald-500/20 p-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <div className="font-semibold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                        Verified Email Available
                        <span className="rounded-full bg-emerald-600/20 px-2 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          Auto-filled
                        </span>
                      </div>
                      <p className="mt-0.5 text-emerald-800/90 dark:text-emerald-300/90">
                        This creator's verified email was detected and populated automatically. You can review and send outreach right away.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3.5 text-amber-900 dark:text-amber-200">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-500/20 p-1 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="size-4" />
                      </div>
                      <div className="text-xs leading-relaxed">
                        <div className="font-semibold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                          No email available
                          <span className="rounded-full bg-amber-600/20 px-2 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                            Action required
                          </span>
                        </div>
                        <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/90">
                          This creator does not have a verified email on file. Add their email address manually below or use their available contact links.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Available Contact Methods
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedInfluencer?.profile_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-background"
                          onClick={() => window.open(selectedInfluencer.profile_url, "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="size-3 text-primary" />
                          Open {selectedInfluencer.platform ? selectedInfluencer.platform.charAt(0).toUpperCase() + selectedInfluencer.platform.slice(1) : "Platform"} Profile
                        </Button>
                      )}
                      {selectedInfluencer?.profile_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-background"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedInfluencer.profile_url);
                            toast.success("Profile URL copied to clipboard");
                          }}
                        >
                          <Copy className="size-3" />
                          Copy Link
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      💡 Tip: Visit their channel "About" tab or send a direct message on their social page to request their business email.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3.5 py-4">
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="my-outreach-to" className="text-xs font-semibold">
                    {hasVerifiedEmail ? "Recipient Email" : "Add Email Manually"}
                  </Label>
                  {hasVerifiedEmail ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" /> Auto-filled
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Enter email to enable send
                    </span>
                  )}
                </div>
                <Input
                  id="my-outreach-to"
                  type="email"
                  placeholder={hasVerifiedEmail ? "creator@channel.com" : "Enter creator's email (e.g. business@creator.com)"}
                  value={outreachEmail}
                  onChange={(e) => setOutreachEmail(e.target.value)}
                  required
                  className={!hasVerifiedEmail && !outreachEmail.trim() ? "border-amber-500/50 focus-visible:ring-amber-500/30" : ""}
                />
                {!hasVerifiedEmail && (
                  <label className="flex items-center gap-2 cursor-pointer mt-1 select-none">
                    <input
                      type="checkbox"
                      className="rounded border-input text-primary focus:ring-primary size-3.5"
                      checked={saveEmailToProfile}
                      onChange={(e) => setSaveEmailToProfile(e.target.checked)}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Save this email to creator's profile for future campaigns
                    </span>
                  </label>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="my-outreach-subj" className="text-xs font-semibold">Subject</Label>
                <Input
                  id="my-outreach-subj"
                  value={outreachSubject}
                  onChange={(e) => setOutreachSubject(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="my-outreach-msg" className="text-xs font-semibold">Message</Label>
                <Textarea
                  id="my-outreach-msg"
                  rows={5}
                  value={outreachMessage}
                  onChange={(e) => setOutreachMessage(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="secondary" onClick={() => setOutreachOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendingOutreach || !outreachEmail.trim() || !isValidEmail(outreachEmail)}
                title={!outreachEmail.trim() ? "Please add a recipient email to send" : ""}
              >
                {sendingOutreach ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Outreach
                    <Send className="ml-1.5 size-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MyInfluencers;
