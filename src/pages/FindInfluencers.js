import React, { useEffect, useRef, useState } from "react";
import { Search, Star, ExternalLink, Mail, Check, AlertCircle, ChevronLeft, ChevronRight, SlidersHorizontal, Send, Loader2, CheckCircle2, Copy, UserPlus, Pencil, Sparkles, Wand2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { generateEmail } from "../lib/novaChat";
import { parseDraft } from "../lib/draft";
import { influencerApi } from "../lib/api";
import { useToast } from "../components/ui/toast";
import { SegmentedPagination } from "../components/ui/pagination";

const platforms = [
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "Twitter/X" },
  { id: "all", label: "All Platforms" },
];

const categories = [
  "Fitness",
  "Technology",
  "Travel",
  "Food",
  "Fashion",
  "Gaming",
  "Business",
  "AI & SaaS",
];

function formatNumber(num) {
  if (num === null || num === undefined) return "N/A";
  const n = Number(num);
  if (Number.isNaN(n)) return "N/A";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

function FindInfluencers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [minSubscribers, setMinSubscribers] = useState("");
  const [maxSubscribers, setMaxSubscribers] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [influencers, setInfluencers] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savedMap, setSavedMap] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [nextPageToken, setNextPageToken] = useState(null);
  const [prevPageToken, setPrevPageToken] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1023);
  const [pageTokens, setPageTokens] = useState({ 1: null });
  const [pageHistory, setPageHistory] = useState([]);

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

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("Friendly");
  const [aiGoal, setAiGoal] = useState("Sponsorship Offer");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    try {
      return localStorage.getItem("nova_whatsapp_number") || "";
    } catch (_) {
      return "";
    }
  });

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

  const loadSaved = async () => {
    try {
      const res = await influencerApi.list();
      const list = res.data || [];
      const idSet = new Set();
      const map = new Map();
      list.forEach((item) => {
        const key = `${item.platform}:${item.platform_user_id || item.platformUserId || item.id}`;
        idSet.add(key);
        map.set(key, item.id);
      });
      setSavedIds(idSet);
      setSavedMap(map);
    } catch (_) { }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const handleSearch = async (token = null, targetPage = 1) => {
    const q = searchQuery.trim();
    if (!q) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await influencerApi.search({
        q,
        platform: selectedPlatform,
        pageToken: token || undefined,
        minSubscribers: minSubscribers || undefined,
        maxSubscribers: maxSubscribers || undefined,
        maxResults: 12,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setError("");
      }
      setInfluencers(res.data || []);
      setNextPageToken(res.nextPageToken || null);
      setPrevPageToken(res.prevPageToken || null);
      setCurrentPage(targetPage);

      if (res.totalResults) {
        const calculated = Math.max(1, Math.ceil(res.totalResults / 12));
        setTotalPages(calculated);
      } else {
        setTotalPages(1023);
      }

      setPageTokens((prev) => {
        const next = { ...prev, [targetPage]: token };
        if (res.nextPageToken) {
          next[targetPage + 1] = res.nextPageToken;
        }
        return next;
      });
    } catch (err) {
      setError(err.message || "Failed to discover influencers");
      setInfluencers([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page === currentPage) return;
    if (pageTokens[page] !== undefined) {
      handleSearch(pageTokens[page], page);
    } else if (page === currentPage + 1 && nextPageToken) {
      handleSearch(nextPageToken, page);
    } else if (page > currentPage && nextPageToken) {
      handleSearch(nextPageToken, currentPage + 1);
    } else if (page < currentPage) {
      handleSearch(pageTokens[page] ?? null, page);
    }
  };

  const handleNextPage = () => {
    if (nextPageToken) {
      handleSearch(nextPageToken, currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      handleSearch(pageTokens[prevPage] ?? null, prevPage);
    }
  };

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
      const key = `${payload.platform}:${payload.username || payload.name}`;
      setSavedIds((prev) => new Set(prev).add(key));
      if (result?.id) {
        setSavedMap((prev) => new Map(prev).set(key, result.id));
      }
      setInfluencers((prev) => [
        {
          id: result?.id,
          platformUserId: payload.username || payload.name,
          platform: payload.platform,
          name: payload.name,
          username: payload.username,
          email: payload.email,
          profileUrl: payload.profileUrl,
          subscribers: payload.subscribers,
          videoCount: payload.videoCount,
          description: payload.notes,
        },
        ...prev,
      ]);
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
        notes: "",
      });
    } catch (err) {
      toast.error("Could not add influencer", err.message);
    } finally {
      setAddingInfluencer(false);
    }
  };

  const onSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    setPageTokens({ 1: null });
    handleSearch(null, 1);
  };

  const handleCategoryClick = (cat) => {
    setSearchQuery(cat);
    setCurrentPage(1);
    setPageTokens({ 1: null });
    setTimeout(() => {
      setLoading(true);
      setHasSearched(true);
      influencerApi
        .search({
          q: cat,
          platform: selectedPlatform,
          minSubscribers: minSubscribers || undefined,
          maxSubscribers: maxSubscribers || undefined,
          maxResults: 12,
        })
        .then((res) => {
          if (res.error) {
            setError(res.error);
          } else {
            setError("");
          }
          setInfluencers(res.data || []);
          setNextPageToken(res.nextPageToken || null);
          setPrevPageToken(res.prevPageToken || null);
          setCurrentPage(1);
          setPageTokens({
            1: null,
            ...(res.nextPageToken ? { 2: res.nextPageToken } : {}),
          });
          if (res.totalResults) {
            setTotalPages(Math.max(1, Math.ceil(res.totalResults / 12)));
          } else {
            setTotalPages(1023);
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to discover influencers");
          setInfluencers([]);
        })
        .finally(() => setLoading(false));
    }, 50);
  };

  const handleToggleSave = async (inf) => {
    const key = `${inf.platform}:${inf.platformUserId}`;
    const isSaved = savedIds.has(key);

    try {
      if (isSaved) {
        const savedId = savedMap.get(key);
        if (savedId) {
          await influencerApi.remove(savedId);
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          setSavedMap((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
          toast.success("Removed from My Influencers");
        }
      } else {
        const res = await influencerApi.create({
          platform: inf.platform,
          platformUserId: inf.platformUserId,
          name: inf.name,
          username: inf.username,
          email: inf.email || undefined,
          description: inf.description,
          profileImage: inf.profileImage,
          profileUrl: inf.profileUrl,
          subscribers: inf.subscribers,
          videoCount: inf.videoCount,
          viewCount: inf.viewCount,
          location: inf.location,
          status: "saved",
          category: inf.category || (searchQuery && searchQuery.trim()) || "General",
        });
        setSavedIds((prev) => new Set(prev).add(key));
        if (res?.id) {
          setSavedMap((prev) => new Map(prev).set(key, res.id));
        }
        toast.success("Added to My Influencers", inf.name);
      }
    } catch (err) {
      toast.error("Could not update influencer", err.message);
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
      `Hi ${inf.name},\n\nWe love your content on ${String(inf.platform || "").toUpperCase()} and would love to discuss a potential collaboration with our brand.\n\nBest regards,\nNOVA Partnerships Team`
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
      const key = selectedInfluencer ? `${selectedInfluencer.platform}:${selectedInfluencer.platformUserId}` : "";
      let savedId = savedMap.get(key);

      if (saveEmailToProfile && selectedInfluencer) {
        if (!savedId) {
          try {
            const res = await influencerApi.create({
              platform: selectedInfluencer.platform,
              platformUserId: selectedInfluencer.platformUserId,
              name: selectedInfluencer.name,
              username: selectedInfluencer.username,
              email: cleanEmail,
              description: selectedInfluencer.description,
              profileImage: selectedInfluencer.profileImage,
              profileUrl: selectedInfluencer.profileUrl,
              subscribers: selectedInfluencer.subscribers,
              videoCount: selectedInfluencer.videoCount,
              viewCount: selectedInfluencer.viewCount,
              location: selectedInfluencer.location,
              status: "saved",
            });
            if (res?.id) {
              savedId = res.id;
              setSavedIds((prev) => new Set(prev).add(key));
              setSavedMap((prev) => new Map(prev).set(key, res.id));
            }
          } catch (_) { }
        } else {
          try {
            await influencerApi.update(savedId, { email: cleanEmail });
          } catch (_) { }
        }
      }

      if (whatsappNumber.trim()) {
        try {
          localStorage.setItem("nova_whatsapp_number", whatsappNumber.trim());
        } catch (_) {}
      }

      await influencerApi.outreach({
        influencerId: savedId || undefined,
        name: selectedInfluencer?.name,
        username: selectedInfluencer?.username,
        platform: selectedInfluencer?.platform,
        profileImage: selectedInfluencer?.profileImage,
        profileUrl: selectedInfluencer?.profileUrl,
        email: cleanEmail,
        subject: outreachSubject,
        message: outreachMessage,
        whatsappNumber: whatsappNumber.trim() || undefined,
      });

      toast.success("Outreach email sent successfully", `Delivered to ${cleanEmail}`);
      setInfluencers((prev) =>
        prev.map((i) =>
          i.platform === selectedInfluencer.platform && i.platformUserId === selectedInfluencer.platformUserId
            ? { ...i, email: cleanEmail }
            : i
        )
      );
      setOutreachOpen(false);
      await loadSaved();
    } catch (err) {
      toast.error("Outreach delivery failed", err.message);
    } finally {
      setSendingOutreach(false);
    }
  };

  const getPlatformBadge = (platform) => {
    const p = String(platform || "").toLowerCase();
    if (p === "youtube") {
      return <Badge className="bg-red-600/15 text-red-600 hover:bg-red-600/20 border-red-600/30">YouTube</Badge>;
    }
    if (p === "instagram") {
      return <Badge className="bg-pink-600/15 text-pink-600 hover:bg-pink-600/20 border-pink-600/30">Instagram</Badge>;
    }
    if (p === "twitter") {
      return <Badge className="bg-sky-600/15 text-sky-600 hover:bg-sky-600/20 border-sky-600/30">Twitter/X</Badge>;
    }
    return <Badge variant="secondary">{platform}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Find Influencers</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Discover real YouTube, Instagram, and X creators with live subscriber metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAddModalOpen(true)}
            className="gap-1.5"
          >
            <UserPlus className="size-4" /> Add Influencer
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "border-primary text-primary" : ""}
          >
            <SlidersHorizontal className="mr-1.5 size-4" /> Filters
          </Button>
        </div>
      </div>

      <form onSubmit={onSearchSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search creators, topics, or channel names (e.g. fitness, tech reviews, vloggers)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="h-11 min-w-[125px] px-6 font-semibold shrink-0"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Searching...</span>
              </span>
            ) : (
              "Search"
            )}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Platform:</span>
            {platforms.map((p) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={selectedPlatform === p.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedPlatform(p.id);
                  if (hasSearched && searchQuery.trim()) {
                    setTimeout(() => handleSearch(null), 50);
                  }
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleCategoryClick(cat)}
                className="h-7 text-xs px-2.5 rounded-full hover:bg-primary/10 hover:text-primary"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {showFilters && (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="min-subs" className="text-xs">Minimum Subscribers / Followers</Label>
                <Input
                  id="min-subs"
                  type="number"
                  placeholder="e.g. 10000"
                  value={minSubscribers}
                  onChange={(e) => setMinSubscribers(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-subs" className="text-xs">Maximum Subscribers / Followers</Label>
                <Input
                  id="max-subs"
                  type="number"
                  placeholder="e.g. 1000000"
                  value={maxSubscribers}
                  onChange={(e) => setMaxSubscribers(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {hasSearched && !loading && !error && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing <span className="font-semibold text-foreground">{influencers.length}</span> live creators
          </div>
          <div>{savedIds.size} saved to My Influencers</div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-y py-3">
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && influencers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {influencers.map((inf) => {
            const key = `${inf.platform}:${inf.platformUserId}`;
            const isSaved = savedIds.has(key);
            return (
              <Card key={key} className="flex flex-col overflow-hidden transition-all hover:border-primary/50">
                <div className="h-1 bg-gradient-to-r from-primary/60 to-primary" />
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start gap-3">
                      {inf.profileUrl ? (
                        <a
                          href={inf.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 transition-opacity hover:opacity-85"
                          title="View channel"
                        >
                          <Avatar className="size-12 border">
                            {inf.profileImage && <AvatarImage src={inf.profileImage} alt={inf.name} />}
                            <AvatarFallback className="bg-primary/10 font-bold text-primary">
                              {(inf.name || "Y").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </a>
                      ) : (
                        <Avatar className="size-12 border">
                          {inf.profileImage && <AvatarImage src={inf.profileImage} alt={inf.name} />}
                          <AvatarFallback className="bg-primary/10 font-bold text-primary">
                            {(inf.name || "Y").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="min-w-0 flex-1">
                        {inf.profileUrl ? (
                          <a
                            href={inf.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate block text-base font-semibold hover:text-primary hover:underline"
                            title={inf.name}
                          >
                            {inf.name}
                          </a>
                        ) : (
                          <h3 className="truncate text-base font-semibold" title={inf.name}>
                            {inf.name}
                          </h3>
                        )}
                        <p className="truncate text-xs text-muted-foreground">
                          {inf.username || `@${inf.name.toLowerCase().replace(/\s+/g, "")}`}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {getPlatformBadge(inf.platform)}
                          {inf.location && (
                            <span className="text-[11px] text-muted-foreground">{inf.location}</span>
                          )}
                          {inf.email ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-2.5" /> Verified Email
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              <AlertCircle className="size-2.5 text-amber-500" /> No Email
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={isSaved ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground"}
                        onClick={() => handleToggleSave(inf)}
                        title={isSaved ? "Remove from saved" : "Save to My Influencers"}
                      >
                        <Star className={`size-5 ${isSaved ? "fill-amber-500" : ""}`} />
                      </Button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border bg-muted/20 p-2.5 text-center">
                      <div>
                        <div className="text-base font-bold tabular-nums text-foreground">
                          {formatNumber(inf.subscribers)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {inf.platform === "youtube" ? "Subscribers" : "Followers"}
                        </div>
                      </div>
                      <div>
                        <div className="text-base font-bold tabular-nums text-foreground">
                          {inf.videoCount !== null ? formatNumber(inf.videoCount) : "N/A"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {inf.platform === "youtube" ? "Videos" : "Posts"}
                        </div>
                      </div>
                    </div>

                    {inf.description && (
                      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground" title={inf.description}>
                        {inf.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        variant={isSaved ? "secondary" : "default"}
                        onClick={() => handleToggleSave(inf)}
                      >
                        {isSaved ? (
                          <>
                            <Check className="mr-1 size-3.5" /> Saved
                          </>
                        ) : (
                          <>
                            <Star className="mr-1 size-3.5" /> Save
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={inf.email ? "default" : "outline"}
                        onClick={() => openOutreach(inf)}
                        className="gap-1.5"
                        title={inf.email ? "Send outreach (Verified Email)" : "Outreach (No email available - manual entry or social contact)"}
                      >
                        <Mail className="size-3.5" />
                        <span className="text-xs">{inf.email ? "Outreach" : "Contact"}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && hasSearched && !error && influencers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
            <Search className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">No creators found</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try adjusting your search terms or subscriber filter ranges.
          </p>
        </div>
      )}

      {!loading && !hasSearched && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Search className="size-8" />
          </div>
          <h3 className="text-lg font-semibold">Search Real Creators</h3>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            Search live YouTube creators, discover their real subscriber stats, and bookmark them for your outreach campaigns.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.slice(0, 5).map((cat) => (
              <Button key={cat} variant="outline" size="sm" onClick={() => handleCategoryClick(cat)}>
                {cat}
              </Button>
            ))}
          </div>
        </div>
      )}

      {(prevPageToken || nextPageToken || influencers.length > 0) && (
        <SegmentedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={Boolean(nextPageToken)}
          hasPrev={currentPage > 1}
          onPageChange={handlePageChange}
          onNext={handleNextPage}
          onPrev={handlePrevPage}
        />
      )}

      <Dialog open={outreachOpen} onOpenChange={setOutreachOpen}>
        <DialogContent className="max-w-2xl sm:max-w-[680px] w-[95vw] sm:w-full bg-[#0e131f] border border-border/80 shadow-2xl">
          <form onSubmit={handleSendOutreach} className="space-y-4">
            <DialogHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-10 border border-border/80 shrink-0">
                    {selectedInfluencer?.profileImage && (
                      <AvatarImage src={selectedInfluencer.profileImage} alt={selectedInfluencer?.name} />
                    )}
                    <AvatarFallback className="bg-primary/10 font-bold text-primary text-xs">
                      {(selectedInfluencer?.name || "Y").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <DialogTitle className="truncate text-base font-semibold leading-tight">
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
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {selectedInfluencer?.platform || "YouTube"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedInfluencer?.profileUrl && (
                  <div className="flex items-center gap-1.5 shrink-0 mr-8">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 px-2.5"
                      onClick={() => window.open(selectedInfluencer.profileUrl, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink className="size-3 text-primary" />
                      <span>Profile</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Copy profile link"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInfluencer.profileUrl);
                        toast.success("Profile URL copied to clipboard");
                      }}
                    >
                      <Copy className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>

            {hasVerifiedEmail ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                <span>Verified business email loaded automatically.</span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 text-xs text-amber-300">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="size-4 shrink-0 text-amber-400" />
                  <span className="truncate">No public email detected. Add email manually below.</span>
                </div>
                {selectedInfluencer?.profileUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(selectedInfluencer.profileUrl, "_blank", "noopener,noreferrer")}
                    className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-200 font-medium underline underline-offset-2 shrink-0 text-xs"
                  >
                    Channel About <ExternalLink className="size-3" />
                  </button>
                )}
              </div>
            )}

            <div className="space-y-3.5 py-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="outreach-to" className="text-xs font-semibold">
                    Recipient Email
                  </Label>
                  {hasVerifiedEmail ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 className="size-3" /> Auto-filled
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-400 font-medium">
                      Required
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="outreach-to"
                    type="email"
                    placeholder="creator@business.com"
                    value={outreachEmail}
                    onChange={(e) => setOutreachEmail(e.target.value)}
                    required
                    className={`pl-9 ${!hasVerifiedEmail && !outreachEmail.trim() ? "border-amber-500/40 focus-visible:ring-amber-500/20" : ""}`}
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

              {/* WhatsApp Contact Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="find-outreach-wa" className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="text-[#25D366] font-bold">💬</span>
                    <span>Your WhatsApp Number (Optional)</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Adds a 1-click WhatsApp button to email
                  </span>
                </div>
                <Input
                  id="find-outreach-wa"
                  placeholder="e.g. +1 555 123 4567 or +91 98765 43210"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="mb-0 text-sm font-semibold">Email content</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-auto h-7 gap-1 text-xs"
                  onClick={() => setAiOpen((prev) => !prev)}
                >
                  <Sparkles className="size-3.5" />
                  Write with NOVA
                  {aiOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </Button>
              </div>

              {aiOpen ? (
                <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
                  <div className="grid gap-2">
                    <Label htmlFor="find-craft-prompt" className="text-xs">What should this email say?</Label>
                    <Textarea
                      id="find-craft-prompt"
                      rows={3}
                      placeholder={`e.g., Pitch a collaboration for ${selectedInfluencer?.name || "creator"} with free product and sponsorship fee`}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Professional", "Friendly", "Urgent", "Casual", "Promotional"].map((item) => (
                      <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant={aiTone === item ? "default" : "outline"}
                        className="h-7 px-2.5 text-xs"
                        onClick={() => setAiTone(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                  {aiError ? <p className="text-sm text-destructive">{aiError}</p> : null}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleGenerateWithAi}
                      disabled={aiGenerating}
                      className="gap-1.5"
                    >
                      {aiGenerating ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                      {aiGenerating ? "Writing…" : "Generate subject & body"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-1.5">
                <Label htmlFor="outreach-subj" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Subject
                </Label>
                {isEditingSubject ? (
                  <div className="flex items-center gap-2 rounded-xl border border-primary/60 bg-slate-900/40 p-2.5 ring-1 ring-primary/40">
                    <Input
                      ref={subjectInputRef}
                      id="outreach-subj"
                      placeholder="Subject line..."
                      value={outreachSubject}
                      onChange={(e) => setOutreachSubject(e.target.value)}
                      className="h-8 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-slate-100 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
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
                  <div className="group flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-2.5 shadow-sm transition-all hover:border-slate-600/80">
                    <button
                      type="button"
                      onClick={() => setIsEditingSubject(true)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white shadow-xs transition-all cursor-pointer"
                      title="Click to edit subject"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <p className="flex-1 text-sm font-semibold text-slate-100 select-text truncate">
                      {outreachSubject || <span className="text-muted-foreground italic font-normal">No subject</span>}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="outreach-msg" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Body
                </Label>
                {isEditingMessage ? (
                  <div className="space-y-2 rounded-xl border border-primary/60 bg-slate-900/40 p-3 ring-1 ring-primary/40">
                    <Textarea
                      ref={messageInputRef}
                      id="outreach-msg"
                      rows={5}
                      placeholder="Write your pitch..."
                      value={outreachMessage}
                      onChange={(e) => setOutreachMessage(e.target.value)}
                      className="min-h-[120px] resize-y border-0 bg-transparent p-0 text-sm leading-relaxed text-slate-200 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                      autoFocus
                    />
                    <div className="flex justify-end pt-2 border-t border-slate-700/40">
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
                  <div className="group flex items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-3.5 shadow-sm transition-all hover:border-slate-600/80">
                    <button
                      type="button"
                      onClick={() => setIsEditingMessage(true)}
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white shadow-xs transition-all cursor-pointer"
                      title="Click to edit message"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <div className="flex-1 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap select-text max-h-[220px] overflow-y-auto">
                      {outreachMessage || <span className="text-muted-foreground italic">No message written</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-border/60 gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setOutreachOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendingOutreach || !outreachEmail.trim() || !isValidEmail(outreachEmail)}
                className="gap-1.5"
              >
                {sendingOutreach ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
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
                <Label htmlFor="find-manual-name" className="text-xs font-semibold">
                  Name / Channel Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="find-manual-name"
                  placeholder="e.g. Marques Brownlee"
                  value={newInfluencer.name}
                  onChange={(e) => setNewInfluencer((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="find-manual-platform" className="text-xs font-semibold">Platform</Label>
                  <select
                    id="find-manual-platform"
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
                  <Label htmlFor="find-manual-username" className="text-xs font-semibold">Handle / Username</Label>
                  <Input
                    id="find-manual-username"
                    placeholder="e.g. @mkbhd"
                    value={newInfluencer.username}
                    onChange={(e) => setNewInfluencer((prev) => ({ ...prev, username: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="find-manual-email" className="text-xs font-semibold">Email Address</Label>
                    {newInfluencer.email && isValidEmail(newInfluencer.email) && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                        <CheckCircle2 className="size-2.5" /> Valid
                      </span>
                    )}
                  </div>
                  <Input
                    id="find-manual-email"
                    type="email"
                    placeholder="e.g. business@mkbhd.com"
                    value={newInfluencer.email}
                    onChange={(e) => setNewInfluencer((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="find-manual-category" className="text-xs font-semibold">Category</Label>
                  <select
                    id="find-manual-category"
                    value={newInfluencer.category || "General"}
                    onChange={(e) => setNewInfluencer((prev) => ({ ...prev, category: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                  <Label htmlFor="find-manual-status" className="text-xs font-semibold">Initial Status</Label>
                  <select
                    id="find-manual-status"
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
                  <Label htmlFor="find-manual-subs" className="text-xs font-semibold">Followers / Subscribers</Label>
                  <Input
                    id="find-manual-subs"
                    type="number"
                    placeholder="e.g. 50000"
                    value={newInfluencer.subscribers}
                    onChange={(e) => setNewInfluencer((prev) => ({ ...prev, subscribers: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="find-manual-videos" className="text-xs font-semibold">Video / Post Count</Label>
                <Input
                  id="find-manual-videos"
                  type="number"
                  placeholder="e.g. 150"
                  value={newInfluencer.videoCount}
                  onChange={(e) => setNewInfluencer((prev) => ({ ...prev, videoCount: e.target.value }))}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="find-manual-url" className="text-xs font-semibold">Channel / Profile URL</Label>
                <Input
                  id="find-manual-url"
                  placeholder="https://youtube.com/@channel"
                  value={newInfluencer.profileUrl}
                  onChange={(e) => setNewInfluencer((prev) => ({ ...prev, profileUrl: e.target.value }))}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="find-manual-notes" className="text-xs font-semibold">Notes / Collaboration Pitch</Label>
                <Textarea
                  id="find-manual-notes"
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

export default FindInfluencers;
