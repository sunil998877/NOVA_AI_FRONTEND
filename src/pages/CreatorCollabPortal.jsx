import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Clock,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCheck,
  Info,
  X,
  ShieldCheck,
  Users,
  Mail,
  MapPin,
  Tag,
  Globe,
  Radio,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { collabApi } from "../lib/api";

function formatNumber(num) {
  if (num === null || num === undefined || num === "") return null;
  const n = Number(num);
  if (Number.isNaN(n) || n === 0) return null;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function getPlatformBadge(platform) {
  const p = String(platform || "youtube").toLowerCase();
  if (p === "youtube") {
    return {
      label: "YouTube",
      badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
      dotClass: "bg-red-500",
    };
  }
  if (p === "instagram") {
    return {
      label: "Instagram",
      badgeClass: "bg-pink-500/15 text-pink-400 border-pink-500/30",
      dotClass: "bg-pink-500",
    };
  }
  if (p === "twitter" || p === "x") {
    return {
      label: "X",
      badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      dotClass: "bg-sky-500",
    };
  }
  return {
    label: platform ? platform.toUpperCase() : "CREATOR",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  };
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function CreatorCollabPortal() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collab, setCollab] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showFullPitch, setShowFullPitch] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const loadPortalData = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await collabApi.getPortal(token);
      if (res?.error) {
        setError(res.error);
      } else {
        setCollab(res.collaboration);
        setMessages(res.messages || []);
        setError("");
      }
    } catch (err) {
      if (!quiet) {
        setError(err.message || "Failed to load collaboration portal");
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPortalData();
    }
  }, [token]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!token || error) return;
    const interval = setInterval(() => {
      loadPortalData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [token, error]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const cleanContent = newMessage.trim();
    if (!cleanContent || sending) return;

    // Optimistic message update
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender_type: "influencer",
      sender_name: collab?.influencerName || "You",
      content: cleanContent,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setSending(true);

    try {
      const res = await collabApi.sendPortalMessage(token, cleanContent);
      if (res?.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? res.message : m))
        );
      }
      if (collab && (collab.status === "sent" || collab.status === "contacted")) {
        setCollab((prev) => ({ ...prev, status: "negotiating" }));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      alert("Failed to send message: " + (err.message || "Network error"));
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4 animate-pulse">
          <Sparkles className="size-7" />
        </div>
        <p className="text-sm font-medium text-slate-300">Loading partnership portal...</p>
        <Loader2 className="mt-3 size-5 animate-spin text-teal-500" />
      </div>
    );
  }

  if (error || !collab) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
          <AlertCircle className="size-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Deal Link Not Found</h2>
        <p className="text-sm text-slate-400 max-w-sm text-center mb-6">
          {error || "This collaboration link may have expired or is invalid. Please check the link from your invitation email."}
        </p>
      </div>
    );
  }

  const cleanWhatsapp = collab.whatsappNumber ? collab.whatsappNumber.replace(/[^\d+]/g, "").replace(/^\+/, "") : null;
  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
      `Hi! I received your collaboration proposal regarding my channel ${collab.influencerUsername || collab.influencerName}. Let's chat!`
    )}`
    : null;

  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden bg-[#0c1317] text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-black">
      {/* ─── LEFT SIDEBAR: CREATOR & DEAL PROPOSAL (Desktop / Tablet) ─── */}
      <aside className="hidden lg:flex w-[380px] xl:w-[420px] bg-[#111b21] border-r border-[#202c33] flex-col shrink-0 h-full overflow-hidden">

        {/* Scrollable Creator Profile & Deal Details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Influencer Profile Card */}
          <div className="flex flex-col items-center text-center p-4 bg-[#182229] rounded-2xl border border-[#202c33] shadow-inner">
            <div className="relative mb-3">
              <Avatar className="size-20 rounded-full border-3 border-emerald-500 bg-slate-900 ring-4 ring-emerald-500/20 shadow-lg">
                <AvatarImage src={collab.profileImage} alt={collab.influencerName} />
                <AvatarFallback className="text-2xl font-black bg-emerald-950 text-emerald-300">
                  {collab.influencerName?.[0] || "C"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 size-5 rounded-full bg-emerald-500 ring-3 ring-[#182229] flex items-center justify-center shadow-xs">
                <CheckCircle2 className="size-3.5 text-slate-950" />
              </span>
            </div>

            <h3 className="font-bold text-base sm:text-lg text-white truncate max-w-full flex items-center justify-center gap-1.5">
              <span>{collab.influencerName}</span>
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            </h3>

            <div className="flex items-center justify-center gap-2 mt-1 text-xs">
              <span className="text-slate-400 font-medium">{collab.influencerUsername || "@creator"}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPlatformBadge(collab.platform).badgeClass}`}>
                {getPlatformBadge(collab.platform).label}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-4 text-left">
              <div className="bg-[#111b21] p-2.5 rounded-xl border border-[#202c33]">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                  <Users className="size-3 text-emerald-400" />
                  <span>{collab.platform?.toLowerCase() === "youtube" ? "Subscribers" : "Followers"}</span>
                </div>
                <p className="text-sm font-black text-white mt-1">
                  {formatNumber(collab.subscribers) || "Audience"}
                </p>
              </div>

              <div className="bg-[#111b21] p-2.5 rounded-xl border border-[#202c33]">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                  <Tag className="size-3 text-sky-400" />
                  <span>Category</span>
                </div>
                <p className="text-sm font-semibold text-white mt-1 truncate">
                  {collab.category || "General"}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-[#111b21] p-2.5 rounded-xl border border-[#202c33]">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                  <MapPin className="size-3 text-amber-400" />
                  <span>Location</span>
                </div>
                <p className="text-sm font-semibold text-white mt-1 truncate">
                  {collab.location || "Global"}
                </p>
              </div>
            </div>

            {/* Channel Profile Link & Email */}
            <div className="w-full mt-3 space-y-1.5 text-xs">
              {collab.recipientEmail && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#111b21] border border-[#202c33] text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400 text-[11px] shrink-0">
                    <Mail className="size-3.5 text-emerald-400" />
                    <span>Contact</span>
                  </span>
                  <span className="truncate font-mono text-[11px] text-slate-200">
                    {collab.recipientEmail}
                  </span>
                </div>
              )}

              {collab.profileUrl && (
                <a
                  href={collab.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Globe className="size-3.5" />
                  <span>Visit Channel Profile</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>


          <div className="rounded-xl border border-[#202c33] bg-[#182229] p-4 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Campaign Pitch</span>
              <p className="text-sm font-semibold text-white mt-0.5">{collab.subject}</p>
            </div>

            <div className="pt-2 border-t border-[#202c33]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Initial Proposal</span>
                <button
                  type="button"
                  onClick={() => setShowFullPitch((prev) => !prev)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  {showFullPitch ? (
                    <>
                      <span>Collapse</span>
                      <ChevronUp className="size-3" />
                    </>
                  ) : (
                    <>
                      <span>Read all</span>
                      <ChevronDown className="size-3" />
                    </>
                  )}
                </button>
              </div>
              <div
                className={`text-xs text-slate-300 leading-relaxed rounded-lg bg-[#111b21] p-3 border border-[#202c33] whitespace-pre-wrap select-text ${showFullPitch ? "" : "max-h-48 overflow-hidden relative"
                  }`}
              >
                {collab.message}
                {!showFullPitch && (
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#111b21] to-transparent pointer-events-none" />
                )}
              </div>
            </div>
          </div>

          {/* Verified Safe Deal Indicator */}
          <div className="rounded-xl border border-[#202c33] bg-[#182229]/60 p-3 flex items-center gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="size-5 text-emerald-400 shrink-0" />
            <span>Direct brand negotiations. Messages update deal status in real time.</span>
          </div>
        </div>
      </aside>

      {/* ─── RIGHT CHAT MESSENGER (Full Screen Like WhatsApp) ───── */}
      <section className="flex-1 flex flex-col h-full bg-[#0b141a] relative overflow-hidden">
        {/* WhatsApp Chat Top Header - Influencer Focus */}
        <div
          onClick={() => setInfoDrawerOpen(true)}
          className="h-14 bg-[#202c33] px-3 sm:px-4 flex items-center justify-between border-b border-[#2a3942] shrink-0 z-10 cursor-pointer hover:bg-[#233138] transition-colors"
          title="Click to view creator profile & deal proposal"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="size-10 rounded-full border-2 border-emerald-500/60 bg-slate-800 ring-2 ring-emerald-500/20">
                <AvatarImage src={collab.profileImage} alt={collab.influencerName} />
                <AvatarFallback className="font-bold bg-emerald-950 text-emerald-300 text-sm">
                  {collab.influencerName?.[0] || "C"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#202c33] animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                  <span>{collab.influencerName || "Creator"}</span>
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                </h4>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border shrink-0 ${getPlatformBadge(collab.platform).badgeClass}`}>
                  {getPlatformBadge(collab.platform).label}
                </span>
              </div>

            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {collab.profileUrl && (
              <a
                href={collab.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-[#2a3942] hover:bg-[#374248] px-3 py-1.5 rounded-lg transition-colors"
                title="Visit creator channel"
              >
                <ExternalLink className="size-3 text-emerald-400" />
                <span>Visit Channel</span>
              </a>
            )}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-lg shadow-xs transition-all"
                title="WhatsApp"
              >
                <ExternalLink className="size-3" />
                <span>WhatsApp</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setInfoDrawerOpen(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors font-medium"
            >
              <Info className="size-3.5" />
              <span>Profile & Deal</span>
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div
          className="flex-1 p-3 sm:p-5 overflow-y-auto overflow-x-hidden space-y-3 bg-[#0b141a]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        >
          {/* Encryption & Notice Banner */}
          <div className="flex justify-center my-1">
            <span className="rounded-lg bg-[#182229] border border-[#202c33] px-3 py-1 text-[11px] text-[#ffd279] shadow-xs text-center max-w-md">
              🔒 Direct creator negotiation room. All messages are synced live with the brand.
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <MessageSquare className="size-10 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No messages yet</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Send a message below to accept the proposal, discuss deliverables, or request your rate card.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isCreator = m.sender_type === "influencer";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isCreator ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm relative select-text ${isCreator
                        ? "bg-[#005c4b] text-white rounded-tr-xs"
                        : "bg-[#202c33] text-slate-100 rounded-tl-xs border border-[#2a3942]/60"
                      }`}
                  >
                    {!isCreator && (
                      <p className="text-[11px] font-bold text-emerald-400 mb-1">
                        {m.sender_name || "Brand Team"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-300/80">
                      <span>{formatTime(m.createdAt || m.created_at)}</span>
                      {isCreator && (
                        <CheckCheck className="size-3.5 text-[#53bdeb]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Creator Reply Chips */}
        <div
          className="px-3 py-2 bg-[#111b21] border-t border-[#202c33] flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none text-xs shrink-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Quick reply:</span>
          {[
            "Interested! Here is my media kit & rates",
            "What is your target campaign budget?",
            "I'd love to collaborate on this!",
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setNewMessage(chip)}
              className="shrink-0 rounded-full border border-[#2a3942] bg-[#202c33] hover:bg-[#2a3942] hover:border-emerald-500/50 px-3 py-1 text-[11px] text-slate-200 transition-all cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* WhatsApp Bottom Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-2.5 sm:p-3 bg-[#202c33] border-t border-[#2a3942] flex items-center gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <Input
            placeholder="Type a message or rate proposal..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="h-10 bg-[#2a3942] border-0 text-white placeholder:text-slate-400 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-lg flex-1 min-w-0"
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
      </section>

      {/* ─── MOBILE SLIDE-OVER DEAL INFO DRAWER ──────────────────── */}
      {infoDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-end animate-in fade-in-0 duration-200">
          <div className="w-[88vw] max-w-sm h-full bg-[#111b21] border-l border-[#202c33] p-4 flex flex-col overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#202c33]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Info className="size-4 text-emerald-400" />
                <span>Deal Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setInfoDrawerOpen(false)}
                className="size-8 rounded-full bg-[#202c33] flex items-center justify-center text-slate-300 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="py-3 space-y-4 flex-1">
              {/* Full Influencer Profile Card */}
              <div className="flex flex-col items-center text-center p-4 bg-[#182229] rounded-2xl border border-[#202c33] shadow-inner">
                <div className="relative mb-3">
                  <Avatar className="size-18 rounded-full border-3 border-emerald-500 bg-slate-900 ring-4 ring-emerald-500/20 shadow-lg">
                    <AvatarImage src={collab.profileImage} alt={collab.influencerName} />
                    <AvatarFallback className="text-xl font-black bg-emerald-950 text-emerald-300">
                      {collab.influencerName?.[0] || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 size-4.5 rounded-full bg-emerald-500 ring-2 ring-[#182229] flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="size-3 text-slate-950" />
                  </span>
                </div>

                <h3 className="font-bold text-base text-white truncate max-w-full flex items-center justify-center gap-1.5">
                  <span>{collab.influencerName}</span>
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                </h3>

                <div className="flex items-center justify-center gap-2 mt-1 text-xs">
                  <span className="text-slate-400 font-medium">{collab.influencerUsername || "@creator"}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPlatformBadge(collab.platform).badgeClass}`}>
                    {getPlatformBadge(collab.platform).label}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 w-full mt-3.5 text-left">
                  <div className="bg-[#111b21] p-2 rounded-xl border border-[#202c33]">
                    <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400">
                      <Users className="size-3 text-emerald-400" />
                      <span>{collab.platform?.toLowerCase() === "youtube" ? "Subscribers" : "Followers"}</span>
                    </div>
                    <p className="text-xs font-black text-white mt-0.5">
                      {formatNumber(collab.subscribers) || "Audience"}
                    </p>
                  </div>

                  <div className="bg-[#111b21] p-2 rounded-xl border border-[#202c33]">
                    <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400">
                      <Tag className="size-3 text-sky-400" />
                      <span>Category</span>
                    </div>
                    <p className="text-xs font-semibold text-white mt-0.5 truncate">
                      {collab.category || "General"}
                    </p>
                  </div>

                  <div className="col-span-2 bg-[#111b21] p-2 rounded-xl border border-[#202c33]">
                    <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400">
                      <MapPin className="size-3 text-amber-400" />
                      <span>Location</span>
                    </div>
                    <p className="text-xs font-semibold text-white mt-0.5 truncate">
                      {collab.location || "Global"}
                    </p>
                  </div>
                </div>

                {/* Email & Channel Link */}
                <div className="w-full mt-3 space-y-1.5 text-xs">
                  {collab.recipientEmail && (
                    <div className="flex items-center justify-between gap-1.5 p-2 rounded-lg bg-[#111b21] border border-[#202c33] text-slate-300">
                      <span className="flex items-center gap-1 text-slate-400 text-[10px] shrink-0">
                        <Mail className="size-3 text-emerald-400" />
                        <span>Contact</span>
                      </span>
                      <span className="truncate font-mono text-[10px] text-slate-200">
                        {collab.recipientEmail}
                      </span>
                    </div>
                  )}

                  {collab.profileUrl && (
                    <a
                      href={collab.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                    >
                      <Globe className="size-3" />
                      <span>Visit Channel Profile</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>


              {/* Pitch */}
              <div className="p-3.5 rounded-xl bg-[#182229] border border-[#202c33] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</span>
                <p className="text-xs font-semibold text-white">{collab.subject}</p>
                <div className="pt-2 border-t border-[#202c33]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Original Pitch</span>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1 whitespace-pre-wrap select-text">
                    {collab.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Close / Return to chat */}
            <Button
              type="button"
              onClick={() => setInfoDrawerOpen(false)}
              className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              Back to Chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
