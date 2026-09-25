import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mail, Trash2, ExternalLink, Users, Send, Search, CheckCircle2, AlertCircle, Copy, Loader2, UserPlus, Pencil, Check, Tag, Sparkles, Wand2, ChevronDown, ChevronUp, MessageSquare, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { generateEmail } from "../lib/novaChat";
import { parseDraft } from "../lib/draft";
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
  DialogDescription,
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
import { SegmentedPagination } from "../components/ui/pagination";

function formatNumber(num) {
  if (num === null || num === undefined) return "N/A";
  const n = Number(num);
  if (Number.isNaN(n)) return "N/A";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

const STANDARD_CATEGORIES = [
  "All",
  "Fitness",
  "Technology",
  "Travel",
  "Food",
  "Fashion",
  "Gaming",
  "Business",
  "AI & SaaS",
];

function MyInfluencers() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [infPage, setInfPage] = useState(1);
  const INF_PAGE_SIZE = 10;

  const [outreachOpen, setOutreachOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [outreachEmail, setOutreachEmail] = useState("");
  const [outreachSubject, setOutreachSubject] = useState("");
  const [outreachMessage, setOutreachMessage] = useState("");
  const [sendingOutreach, setSendingOutreach] = useState(false);
  const [hasVerifiedEmail, setHasVerifiedEmail] = useState(false);
  const [saveEmailToProfile, setSaveEmailToProfile] = useState(true);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const subjectInputRef = useRef(null);
  const messageInputRef = useRef(null);

  const [whatsappNumber, setWhatsappNumber] = useState(
    () => localStorage.getItem("nova_whatsapp_number") || ""
  );
  const [influencerPhone, setInfluencerPhone] = useState("");

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("Friendly");
  const [aiGoal, setAiGoal] = useState("Sponsorship Offer");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newInfluencer, setNewInfluencer] = useState({
    name: "",
    platform: "youtube",
    username: "",
    email: "",
    profileUrl: "",
    subscribers: "",
    videoCount: "",
    status: "saved",
    category: "General",
    notes: "",
  });
  const [addingInfluencer, setAddingInfluencer] = useState(false);

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || "").trim());

  const toast = useToast();
  const navigate = useNavigate();

  const handleAddManualInfluencer = async (e) => {
    e.preventDefault();
    if (!newInfluencer.name.trim()) {
      toast.error("Influencer name is required");
      return;
    }
    if (newInfluencer.email && !isValidEmail(newInfluencer.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setAddingInfluencer(true);
    try {
      const payload = {
        name: newInfluencer.name.trim(),
        platform: newInfluencer.platform || "youtube",
        username: newInfluencer.username.trim() || null,
        email: newInfluencer.email.trim() || null,
        profileUrl: newInfluencer.profileUrl.trim() || null,
        subscribers: newInfluencer.subscribers ? Number(newInfluencer.subscribers) : 0,
        videoCount: newInfluencer.videoCount ? Number(newInfluencer.videoCount) : 0,
        status: newInfluencer.status || "saved",
        category: newInfluencer.category || "General",
        notes: newInfluencer.notes.trim() || null,
      };

      const result = await influencerApi.create(payload);
      if (result?.error) {
        throw new Error(result.error);
      }
      toast.success("Influencer added successfully", newInfluencer.name);
      setAddModalOpen(false);
      setNewInfluencer({
        name: "",
        platform: "youtube",
        username: "",
        email: "",
        profileUrl: "",
        subscribers: "",
        videoCount: "",
        status: "saved",
        category: "General",
        notes: "",
      });
      await load();
    } catch (err) {
      toast.error("Could not add influencer", err.message);
    } finally {
      setAddingInfluencer(false);
    }
  };

  const availableCategories = useMemo(() => {
    const list = [...STANDARD_CATEGORIES];
    influencers.forEach((inf) => {
      const cat = inf.category?.trim();
      if (cat && !list.some((c) => c.toLowerCase() === cat.toLowerCase())) {
        list.push(cat);
      }
    });
    return list;
  }, [influencers]);

  const filteredInfluencers = useMemo(() => {
    return influencers.filter((inf) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (inf.name && inf.name.toLowerCase().includes(q)) ||
        (inf.username && inf.username.toLowerCase().includes(q)) ||
        (inf.email && inf.email.toLowerCase().includes(q)) ||
        (inf.category && inf.category.toLowerCase().includes(q));

      const infCat = String(inf.category || "General").toLowerCase();
      const matchesCategory =
        selectedCategory === "all" ||
        infCat === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [influencers, searchQuery, selectedCategory]);

  const infTotalPages = Math.max(2, Math.ceil(filteredInfluencers.length / INF_PAGE_SIZE));
  const infSafePage = Math.min(infPage, infTotalPages);
  const paginatedInfluencers = filteredInfluencers.slice((infSafePage - 1) * INF_PAGE_SIZE, infSafePage * INF_PAGE_SIZE);
  useEffect(() => { setInfPage(1); }, [searchQuery, selectedCategory]);

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
    setInfluencerPhone(inf?.phone || "");
    setSaveEmailToProfile(true);
    setOutreachSubject(`Collaboration Opportunity: NOVA & ${inf.name}`);
    setOutreachMessage(
      `Hi ${inf.name},\n\nWe love your content on ${String(inf.platform || "").toUpperCase()} and would love to collaborate.\n\nBest regards,\nNOVA Partnerships Team`
    );
    setIsEditingSubject(false);
    setIsEditingMessage(false);
    setAiOpen(false);
    setAiPrompt("");
    setAiError("");
    setOutreachOpen(true);
  };

  const handleGenerateWithAi = async () => {
    if (!selectedInfluencer) return;
    setAiGenerating(true);
    setAiError("");
    try {
      const prompt = [
        `Write a complete, highly persuasive cold outreach email to collaborate with an influencer.`,
        `Influencer Name: ${selectedInfluencer.name || "Creator"}`,
        selectedInfluencer.username ? `Handle / Channel: ${selectedInfluencer.username}` : "",
        `Platform: ${selectedInfluencer.platform || "YouTube"}`,
        selectedInfluencer.category ? `Niche / Category: ${selectedInfluencer.category}` : "",
        selectedInfluencer.subscribers ? `Followers / Subscribers: ${formatNumber(selectedInfluencer.subscribers)}` : "",
        `Goal: ${aiGoal}`,
        `Tone: ${aiTone}`,
        aiPrompt.trim() ? `Specific details / Offer: ${aiPrompt.trim()}` : "",
        'Important formatting: Start the first line with "Subject: " followed by the email subject line. Then provide the full email body.',
      ]
        .filter(Boolean)
        .join("\n");

      const res = await generateEmail({
        prompt,
        context: false,
        conversationTitle: `Outreach to ${selectedInfluencer.name || "Creator"}`,
      });

      const raw = typeof res?.data === "string" ? res.data : JSON.stringify(res?.data, null, 2);
      const parsed = parseDraft(raw);

      if (parsed.subject) {
        setOutreachSubject(parsed.subject);
      }
      if (parsed.body) {
        setOutreachMessage(parsed.body);
      } else if (raw) {
        setOutreachMessage(raw);
      }
      setIsEditingSubject(false);
      setIsEditingMessage(false);
      setAiOpen(false);
      toast.success("AI Outreach Draft Generated!", "Subject and message updated.");
    } catch (err) {
      setAiError(err.message || "Failed to generate AI email. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSendOutreach = async (e) => {
    e.preventDefault();
    if (sendingOutreach) return;
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
        } catch (_) { }
      }

      if (whatsappNumber.trim()) {
        try {
          localStorage.setItem("nova_whatsapp_number", whatsappNumber.trim());
        } catch (_) { }
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
        whatsappNumber: whatsappNumber.trim() || undefined,
        influencerPhone: influencerPhone.trim() || undefined,
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
          <Button onClick={() => setAddModalOpen(true)} className="gap-1.5">
            <UserPlus className="size-4" /> Add Influencer
          </Button>
          <Button variant="outline" onClick={() => navigate("/find-influencers")}>
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

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search saved creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {availableCategories.map((cat) => {
            const isAll = cat.toLowerCase() === "all";
            const isActive = isAll
              ? selectedCategory === "all"
              : selectedCategory.toLowerCase() === cat.toLowerCase();

            return (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className={`h-8 text-xs transition-all ${isActive ? "" : "hover:border-primary/50 hover:text-primary"
                  }`}
                onClick={() => setSelectedCategory(isAll ? "all" : cat)}
              >
                {cat}
              </Button>
            );
          })}
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Influencer</TableHead>
              <TableHead>Category</TableHead>
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
            {paginatedInfluencers.map((inf, index) => (
              <TableRow key={inf.id}>
                <TableCell className="text-center text-xs font-semibold text-muted-foreground w-10">
                  {(infSafePage - 1) * INF_PAGE_SIZE + index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 border">
                      {inf.profile_image && <AvatarImage src={inf.profile_image} alt={inf.name} />}
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {(inf.name || "C").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      {inf.profile_url ? (
                        <a
                          href={inf.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold truncate block max-w-[180px] sm:max-w-xs hover:text-primary hover:underline"
                          title="Open channel / profile"
                        >
                          {inf.name}
                        </a>
                      ) : (
                        <div className="font-semibold truncate max-w-[180px] sm:max-w-xs">{inf.name}</div>
                      )}
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {inf.username || "No handle"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-medium text-xs">
                    {inf.category || "General"}
                  </Badge>
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
                    {(inf.whatsapp_number || inf.whatsappNumber) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`https://wa.me/${String(inf.whatsapp_number || inf.whatsappNumber).replace(/[^0-9]/g, "")}`, "_blank", "noopener,noreferrer")}
                        title="Open WhatsApp"
                        className="text-[#25D366] hover:text-[#20bd5a] hover:bg-[#25D366]/10"
                      >
                        <Phone className="size-4" />
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
            {filteredInfluencers.length > 0 && paginatedInfluencers.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                  No additional influencers on page {infSafePage}.
                </TableCell>
              </TableRow>
            )}
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
              <div className="mt-5 flex items-center gap-2.5">
                <Button onClick={() => setAddModalOpen(true)} className="gap-1.5">
                  <UserPlus className="size-4" /> Add Influencer
                </Button>
                <Button variant="outline" onClick={() => navigate("/find-influencers")}>
                  Find Influencers
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-center gap-1 flex-wrap">
        <SegmentedPagination
          currentPage={infSafePage}
          totalPages={infTotalPages}
          onPageChange={(p) => setInfPage(p)}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground -mt-3">
        Page {infSafePage} of {infTotalPages} &nbsp;·&nbsp; {filteredInfluencers.length} influencer{filteredInfluencers.length !== 1 ? "s" : ""}
      </p>

      <Dialog open={outreachOpen} onOpenChange={setOutreachOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl lg:max-w-4xl w-[96vw] bg-card text-card-foreground border border-border shadow-2xl rounded-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSendOutreach} className="space-y-4">
            <DialogHeader className="pb-3 border-b border-border/80">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-10 border border-border shrink-0">
                    {selectedInfluencer?.profile_image && (
                      <AvatarImage src={selectedInfluencer.profile_image} alt={selectedInfluencer?.name} />
                    )}
                    <AvatarFallback className="bg-primary/10 font-bold text-primary text-xs">
                      {(selectedInfluencer?.name || "C").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <DialogTitle className="truncate text-base sm:text-lg font-semibold leading-tight text-foreground">
                      Send Outreach
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="truncate font-medium text-foreground">
                        {selectedInfluencer?.name}
                      </span>
                      <span>•</span>
                      <span className="truncate">
                        {selectedInfluencer?.username || `@${selectedInfluencer?.name?.toLowerCase().replace(/\s+/g, "")}`}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border/60">
                        {selectedInfluencer?.platform || "Platform"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedInfluencer?.profile_url && (
                  <div className="flex items-center gap-1.5 shrink-0 mr-8">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 px-2.5 border-border bg-background hover:bg-muted text-foreground"
                      onClick={() => window.open(selectedInfluencer.profile_url, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink className="size-3 text-primary" />
                      <span>Profile</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Copy profile link"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInfluencer.profile_url);
                        toast.success("Profile URL copied to clipboard");
                      }}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>

            {hasVerifiedEmail ? (
              <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Verified business email loaded automatically.</span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 text-xs font-medium text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="truncate">No public email detected. Add email manually below.</span>
                </div>
                {selectedInfluencer?.profile_url && (
                  <button
                    type="button"
                    onClick={() => window.open(selectedInfluencer.profile_url, "_blank", "noopener,noreferrer")}
                    className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 hover:underline font-semibold shrink-0 text-xs"
                  >
                    View Profile <ExternalLink className="size-3" />
                  </button>
                )}
              </div>
            )}

            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="my-outreach-to" className="text-xs font-semibold text-foreground">
                    Recipient Email
                  </Label>
                  {hasVerifiedEmail ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="size-3" /> Auto-filled
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                      Required
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="my-outreach-to"
                    type="email"
                    placeholder="creator@business.com"
                    value={outreachEmail}
                    onChange={(e) => setOutreachEmail(e.target.value)}
                    required
                    className={`pl-9 bg-background dark:bg-muted/20 text-foreground border-input ${!hasVerifiedEmail && !outreachEmail.trim() ? "border-amber-500/60 focus-visible:ring-amber-500/30" : ""}`}
                  />
                </div>
                {!hasVerifiedEmail && (
                  <label className="flex items-center gap-2 cursor-pointer mt-1 text-xs text-muted-foreground select-none">
                    <input
                      type="checkbox"
                      className="rounded border-input text-primary focus:ring-primary size-3.5"
                      checked={saveEmailToProfile}
                      onChange={(e) => setSaveEmailToProfile(e.target.checked)}
                    />
                    <span>Save email to creator's profile for future campaigns</span>
                  </label>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="my-outreach-wa" className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <span className="text-primary font-bold">💬</span>
                    <span>Your WhatsApp Reply Number (Optional)</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Adds a 1-click WhatsApp button for creator to reply
                  </span>
                </div>
                <Input
                  id="my-outreach-wa"
                  placeholder="e.g. +1 555 123 4567 or +91 98765 43210"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="h-9 text-xs bg-background dark:bg-muted/20 text-foreground border-input"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Label className="mb-0 text-sm font-semibold text-foreground">Email content</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-auto h-7 gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => setAiOpen((prev) => !prev)}
                >
                  <Sparkles className="size-3.5" />
                  Write with NOVA
                  {aiOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </Button>
              </div>

              {aiOpen ? (
                <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3.5">
                  <div className="grid gap-2">
                    <Label htmlFor="my-craft-prompt" className="text-xs font-semibold text-foreground">What should this email say?</Label>
                    <Textarea
                      id="my-craft-prompt"
                      rows={3}
                      placeholder={`e.g., Pitch a collaboration for ${selectedInfluencer?.name || "creator"} with free product and sponsorship fee`}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="text-xs bg-background dark:bg-muted/20 text-foreground border-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label htmlFor="my-tone-select" className="text-xs font-medium text-foreground">Tone</Label>
                      <select
                        id="my-tone-select"
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        className="w-full h-8 text-xs rounded-md border border-input bg-background dark:bg-muted/30 px-2 text-foreground"
                      >
                        <option value="Friendly">Friendly</option>
                        <option value="Professional">Professional</option>
                        <option value="Casual">Casual</option>
                        <option value="Persuasive">Persuasive</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="my-goal-select" className="text-xs font-medium text-foreground">Goal</Label>
                      <select
                        id="my-goal-select"
                        value={aiGoal}
                        onChange={(e) => setAiGoal(e.target.value)}
                        className="w-full h-8 text-xs rounded-md border border-input bg-background dark:bg-muted/30 px-2 text-foreground"
                      >
                        <option value="Sponsorship Offer">Sponsorship Offer</option>
                        <option value="Product Review">Product Review</option>
                        <option value="Affiliate Partnership">Affiliate Partnership</option>
                        <option value="Brand Ambassador">Brand Ambassador</option>
                      </select>
                    </div>
                  </div>

                  {aiError ? <p className="text-xs text-destructive">{aiError}</p> : null}
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setAiOpen(false)}
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleGenerateWithAi}
                      disabled={aiGenerating}
                      className="gap-1.5 h-8 text-xs"
                    >
                      {aiGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                      {aiGenerating ? "Writing…" : "Generate subject & body"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-1.5">
                <Label htmlFor="my-outreach-subj" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Subject
                </Label>
                {isEditingSubject ? (
                  <div className="flex items-center gap-2 rounded-xl border border-primary/60 bg-background dark:bg-muted/20 p-2.5 ring-1 ring-primary/40">
                    <Input
                      ref={subjectInputRef}
                      id="my-outreach-subj"
                      placeholder="Subject line..."
                      value={outreachSubject}
                      onChange={(e) => setOutreachSubject(e.target.value)}
                      className="h-8 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-foreground shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1"
                      onClick={() => setIsEditingSubject(false)}
                    >
                      <Check className="size-3" /> Done
                    </Button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-3 rounded-xl border border-border bg-slate-100/70 dark:bg-slate-900/40 p-2.5 shadow-2xs transition-all hover:border-primary/40">
                    <button
                      type="button"
                      onClick={() => setIsEditingSubject(true)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:border-primary/50 shadow-2xs transition-all cursor-pointer"
                      title="Click to edit subject"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <p className="flex-1 text-sm font-semibold text-slate-900 dark:text-slate-100 select-text truncate">
                      {outreachSubject || <span className="text-muted-foreground italic font-normal">No subject</span>}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="my-outreach-msg" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Body
                </Label>
                {isEditingMessage ? (
                  <div className="space-y-2 rounded-xl border border-primary/60 bg-background dark:bg-muted/20 p-3 ring-1 ring-primary/40">
                    <Textarea
                      ref={messageInputRef}
                      id="my-outreach-msg"
                      rows={5}
                      placeholder="Write your pitch..."
                      value={outreachMessage}
                      onChange={(e) => setOutreachMessage(e.target.value)}
                      className="min-h-[120px] resize-y border-0 bg-transparent p-0 text-sm leading-relaxed text-foreground shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                      autoFocus
                    />
                    <div className="flex justify-end pt-2 border-t border-border">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => setIsEditingMessage(false)}
                      >
                        <Check className="size-3" /> Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group flex items-start gap-3 rounded-xl border border-border bg-slate-100/70 dark:bg-slate-900/40 p-3.5 shadow-2xs transition-all hover:border-primary/40">
                    <button
                      type="button"
                      onClick={() => setIsEditingMessage(true)}
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:border-primary/50 shadow-2xs transition-all cursor-pointer"
                      title="Click to edit message"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <div className="flex-1 text-sm leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap select-text max-h-[220px] overflow-y-auto">
                      {outreachMessage || <span className="text-muted-foreground italic">No message written</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border/80 flex items-center justify-end gap-2.5">
              <Button type="button" variant="outline" className="h-9 px-4 text-xs font-medium border-border text-foreground hover:bg-muted" onClick={() => setOutreachOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendingOutreach || !outreachEmail.trim() || !isValidEmail(outreachEmail)}
                className="h-9 px-5 text-xs font-semibold gap-2 shadow-xs"
              >
                {sendingOutreach ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Send Outreach</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleAddManualInfluencer}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <UserPlus className="size-5 text-primary" />
                Add Influencer Manually
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-3.5 py-4 text-sm">
              <div className="grid gap-1.5">
                <Label htmlFor="manual-name" className="text-xs font-semibold">
                  Name / Channel Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="manual-name"
                  placeholder="e.g. Marques Brownlee"
                  value={newInfluencer.name}
                  onChange={(e) => setNewInfluencer((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="manual-platform" className="text-xs font-semibold">Platform</Label>
                  <select
                    id="manual-platform"
                    value={newInfluencer.platform}
                    onChange={(e) => setNewInfluencer((prev) => ({ ...prev, platform: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="tiktok">TikTok</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="manual-username" className="text-xs font-semibold">Handle / Username</Label>
                  <Input
                    id="manual-username"
                    placeholder="e.g. @mkbhd"
                    value={newInfluencer.username}
                    onChange={(e) => setNewInfluencer((prev) => ({ ...prev, username: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manual-email" className="text-xs font-semibold">Email Address</Label>
                    {newInfluencer.email && isValidEmail(newInfluencer.email) && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                        <CheckCircle2 className="size-2.5" /> Valid
                      </span>
                    )}
                  </div>
                  <Input
                    id="manual-email"
                    type="email"
                    placeholder="e.g. business@mkbhd.com"
                    value={newInfluencer.email}
                    onChange={(e) => setNewInfluencer((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="manual-category" className="text-xs font-semibold">Category</Label>
                  <select
                    id="manual-category"
                    value={newInfluencer.category || "General"}
                    onChange={(e) => setNewInfluencer((prev) => ({ ...prev, category: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize"
                  >
                    <option value="General">General</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Technology">Technology</option>
                    <option value="Travel">Travel</option>
                    <option value="Food">Food</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Business">Business</option>
                    <option value="AI & SaaS">AI & SaaS</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Entertainment">Entertainment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="manual-status" className="text-xs font-semibold">Initial Status</Label>
                  <select
                    id="manual-status"
                    value={newInfluencer.status}
                    onChange={(e) => setNewInfluencer((prev) => ({ ...prev, status: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize"
                  >
                    <option value="saved">Saved</option>
                    <option value="contacted">Contacted</option>
                    <option value="negotiating">Negotiating</option>
                    <option value="collaborating">Collaborating</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="manual-subs" className="text-xs font-semibold">Followers / Subscribers</Label>
                  <Input
                    id="manual-subs"
                    type="number"
                    placeholder="e.g. 50000"
                    value={newInfluencer.subscribers}
                    onChange={(e) => setNewInfluencer((prev) => ({ ...prev, subscribers: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="manual-videos" className="text-xs font-semibold">Video / Post Count</Label>
                <Input
                  id="manual-videos"
                  type="number"
                  placeholder="e.g. 150"
                  value={newInfluencer.videoCount}
                  onChange={(e) => setNewInfluencer((prev) => ({ ...prev, videoCount: e.target.value }))}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="manual-url" className="text-xs font-semibold">Channel / Profile URL</Label>
                <Input
                  id="manual-url"
                  placeholder="https://youtube.com/@channel"
                  value={newInfluencer.profileUrl}
                  onChange={(e) => setNewInfluencer((prev) => ({ ...prev, profileUrl: e.target.value }))}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="manual-notes" className="text-xs font-semibold">Notes / Collaboration Pitch</Label>
                <Textarea
                  id="manual-notes"
                  rows={3}
                  placeholder="Optional notes about audience, niche, past collaborations..."
                  value={newInfluencer.notes}
                  onChange={(e) => setNewInfluencer((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="secondary" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addingInfluencer || !newInfluencer.name.trim()}>
                {addingInfluencer ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-1.5 size-4" />
                    Add Influencer
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
