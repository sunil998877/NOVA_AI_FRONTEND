import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Send,
  Loader2,
  RefreshCw,
  ExternalLink,
  CheckCheck,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ArrowLeft,
  Info,
  Users,
  Mail,
  Share2,
  Check,
  Tag,
  SquarePen,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { collabApi, influencerApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

function formatNumber(num) {
  if (num === null || num === undefined || num === "") return null;
  const n = Number(num);
  if (Number.isNaN(n) || n === 0) return null;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function cleanUsername(raw) {
  if (!raw) return "creator";
  return String(raw).replace(/^@+/, "");
}

function getPlatformBadge(platform) {
  const p = String(platform || "youtube").toLowerCase();
  if (p === "youtube") {
    return {
      label: "YouTube",
      badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
    };
  }
  if (p === "instagram") {
    return {
      label: "Instagram",
      badgeClass: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    };
  }
  if (p === "twitter" || p === "x") {
    return {
      label: "X",
      badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    };
  }
  return {
    label: platform ? platform.toUpperCase() : "CREATOR",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
}

function getStatusBadge(status) {
  const s = String(status || "sent").toLowerCase();
  switch (s) {
    case "agreed":
      return { label: "Agreed", class: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
    case "negotiating":
      return { label: "Negotiating", class: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
    case "completed":
      return { label: "Completed", class: "bg-blue-500/20 text-blue-300 border-blue-500/40" };
    case "declined":
      return { label: "Declined", class: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
    default:
      return { label: "Sent", class: "bg-slate-500/20 text-slate-300 border-slate-500/40" };
  }
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userInitials = user?.fullName ? user.fullName[0].toUpperCase() : "M";

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedCollabId, setSelectedCollabId] = useState(searchParams.get("id") || null);
  const [activeCollab, setActiveCollab] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [dealInfoOpen, setDealInfoOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mobileChatView, setMobileChatView] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Fetch conversations list
  const loadConversations = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      let data = [];
      try {
        const res = await collabApi.getConversations();
        data = res?.data || [];
      } catch (_) {
        const res = await influencerApi.collaborations({ limit: 100 });
        data = res?.data || [];
      }
      setConversations(data);

      const requestedId = searchParams.get("id");
      if (requestedId) {
        setSelectedCollabId(requestedId);
      } else if (!selectedCollabId && data.length > 0) {
        setSelectedCollabId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 2. Fetch messages for active conversation
  const loadActiveMessages = async (collabId, quiet = false) => {
    if (!collabId) return;
    if (!quiet) setLoadingMessages(true);
    try {
      const res = await collabApi.getMessages(collabId);
      if (res?.collaboration) {
        setActiveCollab(res.collaboration);
      }
      setMessages(res?.messages || []);
      if (!quiet) {
        setTimeout(() => scrollToBottom("auto"), 60);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      if (!quiet) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedCollabId) {
      loadActiveMessages(selectedCollabId);
      setSearchParams({ id: selectedCollabId });
      setConversations((prev) =>
        prev.map((c) => (String(c.id) === String(selectedCollabId) ? { ...c, unreadCount: 0 } : c))
      );
    } else {
      setActiveCollab(null);
      setMessages([]);
    }
  }, [selectedCollabId]);

  // 3. WhatsApp-like Polling every 3.5s
  useEffect(() => {
    if (!selectedCollabId) return;
    const interval = setInterval(() => {
      loadActiveMessages(selectedCollabId, true);
    }, 3500);
    return () => clearInterval(interval);
  }, [selectedCollabId]);

  // 4. Send Message Handler
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!selectedCollabId || !newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setSending(true);

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender_type: "marketer",
      senderType: "marketer",
      sender_name: "You",
      senderName: "You",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setTimeout(() => scrollToBottom("smooth"), 40);

    try {
      const res = await collabApi.sendMessage(selectedCollabId, content);
      if (res?.message) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? res.message : m)));
      }
      setConversations((prev) =>
        prev.map((c) =>
          String(c.id) === String(selectedCollabId)
            ? {
                ...c,
                lastMessage: content,
                lastMessageAt: new Date().toISOString(),
                lastSender: "marketer",
              }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom("smooth"), 80);
    }
  };

  const handleCopyCreatorLink = () => {
    const token = activeCollab?.access_token || activeCollab?.portal_token;
    if (!token) return;
    const url = `${window.location.origin}/collab/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((item) => {
      const name = (item.influencer_name || item.influencerName || "").toLowerCase();
      const username = cleanUsername(item.influencer_username || item.influencerUsername).toLowerCase();
      const email = (item.recipient_email || item.recipientEmail || "").toLowerCase();
      const subject = (item.subject || "").toLowerCase();
      const lastMsg = (item.lastMessage || "").toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        username.includes(q) ||
        email.includes(q) ||
        subject.includes(q) ||
        lastMsg.includes(q);

      const status = (item.status || "sent").toLowerCase();
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "unread"
          ? (item.unreadCount || 0) > 0
          : status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [conversations, searchQuery, statusFilter]);

  const activeInfluencerName =
    activeCollab?.influencer_name || activeCollab?.influencerName || "Creator";
  const activeInfluencerUsername = cleanUsername(
    activeCollab?.influencer_username || activeCollab?.influencerUsername
  );
  const activePlatform = activeCollab?.platform || "youtube";
  const activeToken = activeCollab?.access_token || activeCollab?.portal_token;
  const activePortalUrl = activeToken ? `${window.location.origin}/collab/${activeToken}` : null;
  const whatsappNumber = activeCollab?.whatsapp_number || activeCollab?.whatsappNumber;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div className="flex w-screen h-screen max-h-screen bg-[#0b141a] text-slate-100 overflow-hidden select-none">
      {/* ─── WHATSAPP CONTACT LIST / CONVERSATION PANEL ───────────────── */}
      <aside
        className={`${
          mobileChatView ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-[380px] flex-col h-full bg-[#111b21] border-r border-[#202c33] shrink-0 min-h-0 select-text`}
      >
        {/* WhatsApp Top Header Bar */}
        <div className="h-16 bg-[#111b21] px-4 flex items-center justify-between shrink-0 border-b border-[#1f2c34]">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="h-8 px-2.5 gap-1.5 text-slate-300 hover:text-white hover:bg-[#202c33] cursor-pointer text-xs font-medium"
              title="Back to Dashboard"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div className="w-px h-5 bg-[#2a3942]" />
            <h2 className="text-xl font-bold text-[#e9edef] tracking-tight">Chats</h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate("/find-influencers")}
              className="size-9 rounded-full hover:bg-[#202c33] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Outreach new creator"
            >
              <SquarePen className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => loadConversations(true)}
              disabled={refreshing}
              className="size-9 rounded-full hover:bg-[#202c33] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Refresh chats"
            >
              <RefreshCw className={`size-4.5 ${refreshing ? "animate-spin text-[#00a884]" : ""}`} />
            </button>
          </div>
        </div>

        {/* WhatsApp Search Box */}
        <div className="px-3 pb-2.5 bg-[#111b21] shrink-0">
          <div className="relative">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 text-xs bg-[#202c33] border-0 text-white placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00a884] rounded-xl"
            />
          </div>
        </div>

        {/* WhatsApp Pill Tabs */}
        <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none text-[11px] bg-[#111b21] border-b border-[#202c33]/70 shrink-0">
          {[
            { id: "all", label: "All" },
            { id: "unread", label: "Unread" },
            { id: "negotiating", label: "Negotiating" },
            { id: "agreed", label: "Agreed" },
            { id: "sent", label: "Sent" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                statusFilter === pill.id
                  ? "bg-[#00a884] text-white font-semibold shadow-xs"
                  : "bg-[#202c33] text-slate-300 hover:bg-[#2a3942]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Scrollable Chat Threads List */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-[#111b21] p-2 space-y-1.5">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
              <Loader2 className="size-6 animate-spin text-[#00a884]" />
              <p className="text-xs">Loading chats...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center text-slate-400 gap-3">
              <MessageSquare className="size-8 opacity-40 text-slate-500" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-200">No chats found</p>
                <p className="text-[11px] text-slate-400 max-w-[200px]">
                  {searchQuery || statusFilter !== "all"
                    ? "No matching conversations"
                    : "Outreach to creators to start negotiations"}
                </p>
              </div>
            </div>
          ) : (
            filteredConversations.map((collab) => {
              const isSelected = String(collab.id) === String(selectedCollabId);
              const platformBadge = getPlatformBadge(collab.platform);
              const statusBadge = getStatusBadge(collab.status);
              const unread = Number(collab.unreadCount || 0);
              const username = cleanUsername(collab.influencer_username || collab.influencerUsername);

              return (
                <button
                  key={collab.id}
                  type="button"
                  onClick={() => {
                    setSelectedCollabId(collab.id);
                    setMobileChatView(true);
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all duration-150 cursor-pointer relative group border ${
                    isSelected
                      ? "bg-[#232d36] border-[#374955] shadow-sm ring-1 ring-[#00a884]/30"
                      : "bg-[#182229]/80 hover:bg-[#202c33] border-transparent hover:border-[#2a3942]/60"
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="size-11 rounded-full border border-[#2a3942] bg-[#331c27] shrink-0">
                      <AvatarImage
                        src={collab.profile_image || collab.profileImage}
                        alt={collab.influencer_name}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-sm font-semibold bg-[#331c27] text-[#f87171] flex items-center justify-center">
                        {collab.influencer_name ? (
                          collab.influencer_name.slice(0, 2).toUpperCase()
                        ) : (
                          <Users className="size-5 text-[#f87171]" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-[#25D366] ring-2 ring-[#182229]" />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[13.5px] font-semibold text-[#e9edef] truncate tracking-tight group-hover:text-white transition-colors">
                        {collab.influencer_name || collab.influencerName || "Creator"}
                      </h3>
                      <span
                        className={`text-xs shrink-0 font-medium ${
                          unread > 0 ? "text-[#25D366] font-semibold" : "text-[#8696a0]"
                        }`}
                      >
                        {formatTime(collab.lastMessageAt || collab.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate flex-1 min-w-0 ${
                          unread > 0 ? "text-slate-200 font-medium" : "text-[#8696a0]"
                        }`}
                      >
                        {collab.lastSender === "marketer" ? (
                          <span className="inline-flex items-center gap-0.5 text-[#53bdeb] mr-1">
                            <CheckCheck className="size-3.5 inline" />
                          </span>
                        ) : null}
                        {collab.lastMessage || collab.subject || `@${username}`}
                      </p>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {unread > 0 ? (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#25D366] text-[#0b141a] text-[11px] font-bold flex items-center justify-center shadow-xs">
                            {unread}
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${statusBadge.class}`}
                          >
                            {statusBadge.label}
                          </span>
                        )}
                        <ChevronDown className="size-3.5 text-[#8696a0] opacity-60 group-hover:opacity-100 group-hover:text-slate-200 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ─── RIGHT CHAT ROOM ──────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col h-full bg-[#0b141a] relative overflow-hidden min-h-0">
        {loading && !activeCollab ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="size-8 animate-spin text-[#00a884]" />
            <p className="text-xs">Connecting to negotiation room...</p>
          </div>
        ) : !activeCollab ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3">
            <div className="size-16 rounded-full bg-[#182229] border border-[#202c33] flex items-center justify-center text-slate-500">
              <MessageSquare className="size-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-semibold text-white">Select a Chat</h3>
              <p className="text-xs text-slate-400">
                Choose an influencer conversation from the list to view negotiation history and send live messages.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* WhatsApp Chat Top Header */}
            <div className="h-16 bg-[#202c33] px-4 flex items-center justify-between border-b border-[#2a3942] shrink-0 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden size-8 text-slate-300 hover:text-white shrink-0 cursor-pointer"
                  onClick={() => setMobileChatView(false)}
                >
                  <ChevronLeft className="size-5" />
                </Button>

                <div className="relative shrink-0">
                  <Avatar className="size-10 rounded-full border-2 border-emerald-500/60 bg-slate-800 ring-2 ring-emerald-500/20">
                    <AvatarImage
                      src={activeCollab.profile_image || activeCollab.profileImage}
                      alt={activeInfluencerName}
                    />
                    <AvatarFallback className="font-bold bg-emerald-950 text-emerald-300 text-sm">
                      {activeInfluencerName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#202c33] animate-pulse" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                      <span>{activeInfluencerName}</span>
                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    </h4>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border shrink-0 ${
                        getPlatformBadge(activePlatform).badgeClass
                      }`}
                    >
                      {getPlatformBadge(activePlatform).label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="truncate">@{activeInfluencerUsername}</span>
                    <span>•</span>
                    <span
                      className={`text-[9px] px-1 rounded border font-medium ${
                        getStatusBadge(activeCollab.status).class
                      }`}
                    >
                      {getStatusBadge(activeCollab.status).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeCollab.profile_url && (
                  <a
                    href={activeCollab.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-[#2a3942] hover:bg-[#374248] px-3 py-1.5 rounded-lg transition-colors"
                    title="Visit creator channel"
                  >
                    <ExternalLink className="size-3 text-emerald-400" />
                    <span>Channel</span>
                  </a>
                )}

                {activePortalUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCreatorLink}
                    className="h-8 px-2.5 text-xs gap-1.5 bg-[#2a3942] hover:bg-[#374248] text-slate-200 border-[#2a3942] cursor-pointer hidden md:flex"
                    title="Copy public link sent to creator"
                  >
                    {copiedLink ? <Check className="size-3 text-emerald-400" /> : <Share2 className="size-3" />}
                    <span>{copiedLink ? "Copied Link" : "Creator Link"}</span>
                  </Button>
                )}

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-lg shadow-xs transition-all"
                    title="Open WhatsApp chat"
                  >
                    <ExternalLink className="size-3" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setDealInfoOpen(!dealInfoOpen)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors font-medium"
                >
                  <Info className="size-3.5" />
                  <span>Deal Info</span>
                </button>
              </div>
            </div>

            {/* Collapsible Deal Proposal Header Drawer */}
            {dealInfoOpen && (
              <div className="p-3.5 bg-[#182229] border-b border-[#202c33] shrink-0 text-xs space-y-2 text-slate-300 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Campaign Subject:</span>
                    <p className="font-semibold text-white text-xs mt-0.5">{activeCollab.subject || "Collaboration Proposal"}</p>
                  </div>
                  {activePortalUrl && (
                    <a
                      href={activePortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>Open Public Portal</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                {activeCollab.message && (
                  <div className="rounded-lg bg-[#111b21] border border-[#202c33] p-2.5 max-h-28 overflow-y-auto text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {activeCollab.message}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                  {activeCollab.recipient_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="size-3 text-emerald-400" />
                      <span>{activeCollab.recipient_email}</span>
                    </span>
                  )}
                  {activeCollab.subscribers && (
                    <span className="flex items-center gap-1">
                      <Users className="size-3 text-emerald-400" />
                      <span>{formatNumber(activeCollab.subscribers)} subscribers</span>
                    </span>
                  )}
                  {activeCollab.category && (
                    <span className="flex items-center gap-1">
                      <Tag className="size-3 text-emerald-400" />
                      <span>{activeCollab.category}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp Messages Feed */}
            <div
              className="flex-1 p-3 sm:p-5 overflow-y-auto overflow-x-hidden space-y-3 bg-[#0b141a] min-h-0 select-text"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              {/* WhatsApp Notice Banner */}
              <div className="flex justify-center my-1">
                <span className="rounded-lg bg-[#182229] border border-[#202c33] px-3 py-1 text-[11px] text-[#ffd279] shadow-xs text-center max-w-md">
                  🔒 Direct creator negotiation room. All messages are synced live with the brand.
                </span>
              </div>

              {/* Initial Outreach Proposal Anchor */}
              {activeCollab.message && (
                <div className="my-3 mx-auto max-w-xl rounded-xl border border-[#202c33] bg-[#182229] p-3.5 text-xs shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5" />
                      <span>Initial Collaboration Proposal Sent</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {formatTime(activeCollab.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-white">
                    Subject: {activeCollab.subject}
                  </p>
                  <p className="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {activeCollab.message}
                  </p>
                </div>
              )}

              {/* Messages Thread */}
              {loadingMessages ? (
                <div className="py-8 flex items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-[#00a884]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                  <MessageSquare className="size-8 opacity-40 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-200">No replies yet</p>
                  <p className="text-[11px] max-w-xs text-slate-400">
                    Send a message below to negotiate deliverables, rates, or request a media kit.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMarketer = m.sender_type === "marketer" || m.senderType === "marketer";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMarketer ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed shadow-sm relative select-text ${
                          isMarketer
                            ? "bg-[#005c4b] text-white rounded-tr-xs"
                            : "bg-[#202c33] text-slate-100 rounded-tl-xs border border-[#2a3942]/60"
                        }`}
                      >
                        {!isMarketer && (
                          <p className="text-[11px] font-bold text-emerald-400 mb-1">
                            {m.sender_name || m.senderName || activeInfluencerName}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-300/80">
                          <span>{formatTime(m.createdAt || m.created_at)}</span>
                          {isMarketer && <CheckCheck className="size-3.5 text-[#53bdeb]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp Fixed Bottom Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-2.5 sm:p-3 bg-[#202c33] border-t border-[#2a3942] flex items-center gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <Input
                placeholder="Type a message or rate proposal... (Press Enter to send)"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                className="h-10 bg-[#2a3942] border-0 text-white placeholder:text-slate-400 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-[#00a884] rounded-lg flex-1 min-w-0"
              />
              <Button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="size-10 rounded-full bg-[#00a884] hover:bg-[#029072] text-white font-bold p-0 flex items-center justify-center shrink-0 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
