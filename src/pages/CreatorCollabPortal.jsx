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
  Check,
  Share2,
  Info,
  X,
  ShieldCheck,
  Users,
  Mail,
  MapPin,
  Tag,
  Globe,
  Radio,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { collabApi } from "../lib/api";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../components/ui/toast";
import LoadingScreen from "../components/LoadingScreen";

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
      badgeClass: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
      dotClass: "bg-red-500",
    };
  }
  if (p === "instagram") {
    return {
      label: "Instagram",
      badgeClass: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
      dotClass: "bg-pink-500",
    };
  }
  if (p === "twitter" || p === "x") {
    return {
      label: "X",
      badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      dotClass: "bg-sky-500",
    };
  }
  return {
    label: platform ? platform.toUpperCase() : "CREATOR",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
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

function playMessageChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.1);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.22);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.1);
    osc1.stop(now + 0.1);
    osc2.stop(now + 0.35);
  } catch (_) { }
}

export default function CreatorCollabPortal() {
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const { token } = useParams();
  const toast = useToast();
  const cached = collabApi.getCachedPortal ? collabApi.getCachedPortal(token) : null;
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(cached?.error || "");
  const [collab, setCollab] = useState(cached?.collaboration || null);
  const [messages, setMessages] = useState(cached?.messages || []);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showFullPitch, setShowFullPitch] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("nova_portal_sound") !== "false";
  });

  const { socket, isConnected, connectWithToken } = useSocket();
  const [isBrandTyping, setIsBrandTyping] = useState(false);
  const brandTypingTimerRef = useRef(null);
  const localTypingTimeoutRef = useRef(null);
  const isTypingLocalRef = useRef(false);

  const lastMessageIdRef = useRef(null);
  const prevMessagesCountRef = useRef(0);
  const originalTitleRef = useRef(typeof document !== "undefined" ? document.title : "");
  const messagesEndRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    const dismissed = localStorage.getItem("nova_portal_notif_dismissed");
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default" &&
      !dismissed
    ) {
      setShowNotifPrompt(true);
    }
  }, []);

  useEffect(() => {
    const onFocus = () => {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        setShowNotifPrompt(false);
        if (perm === "granted") {
          localStorage.setItem("nova_portal_notifications", "granted");
          playMessageChime();
          try {
            new Notification("NOVA Creator Portal", {
              body: "Real-time alerts active! You will hear a chime and receive notifications when the brand messages you.",
              icon: "/favicon.ico",
            });
          } catch (_) { }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const dismissNotificationPrompt = () => {
    setShowNotifPrompt(false);
    localStorage.setItem("nova_portal_notif_dismissed", "true");
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("nova_portal_sound", String(next));
    if (next) playMessageChime();
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Link copied!", "Portal link copied to clipboard.");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_) { }
  };

  const loadPortalData = async (quiet = false) => {
    if (!quiet && !collab && !collabApi.getCachedPortal?.(token)) {
      setLoading(true);
    }
    try {
      const res = await collabApi.getPortal(token, quiet);
      if (res?.error) {
        setError(res.error);
      } else {
        setCollab(res.collaboration);
        const incoming = res.messages || [];
        setMessages(incoming);

        if (incoming.length > 0) {
          const latestMsg = incoming[incoming.length - 1];
          const isFromBrand = latestMsg.sender_type === "marketer" || latestMsg.senderType === "marketer";

          if (
            lastMessageIdRef.current &&
            String(latestMsg.id) !== String(lastMessageIdRef.current) &&
            incoming.length > prevMessagesCountRef.current &&
            isFromBrand
          ) {
            if (soundEnabled) {
              playMessageChime();
            }

            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                new Notification("New message from Brand", {
                  body: latestMsg.content,
                  icon: "/favicon.ico",
                  tag: `portal-${latestMsg.id}`,
                });
              } catch (_) { }
            }

            document.title = `💬 (1) New message from Brand`;
          }

          lastMessageIdRef.current = latestMsg.id;
          prevMessagesCountRef.current = incoming.length;
        }

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
      connectWithToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (!token || error) return;
    const interval = setInterval(() => {
      loadPortalData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [token, error, soundEnabled]);

  useEffect(() => {
    if (!socket || !collab?.id) return;

    socket.emit("joinConversation", { conversationId: collab.id });
    socket.emit("message:read", { conversationId: collab.id });

    const handleNewMessage = (newMsg) => {
      if (!newMsg) return;
      const msgCollabId = String(newMsg.conversationId || newMsg.collaboration_id || "");
      if (msgCollabId === String(collab.id)) {
        setMessages((prev) => {
          if (newMsg.tempId) {
            const hasTemp = prev.some((m) => m.id === newMsg.tempId || m.tempId === newMsg.tempId);
            if (hasTemp) {
              return prev.map((m) =>
                m.id === newMsg.tempId || m.tempId === newMsg.tempId
                  ? { ...newMsg, isCreator: true, sender_type: "influencer", senderType: "influencer" }
                  : m
              );
            }
          }
          const exists = prev.some((m) => String(m.id) === String(newMsg.id));
          if (exists) return prev;
          return [...prev, newMsg];
        });

        const isFromBrand =
          !newMsg.tempId &&
          newMsg.sender_type !== "influencer" &&
          newMsg.senderType !== "influencer" &&
          (newMsg.sender_type === "marketer" || newMsg.senderType === "marketer" || newMsg.senderType === "user");

        if (isFromBrand) {
          if (soundEnabled) playMessageChime();
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification("New message from Brand", {
                body: newMsg.message || newMsg.content,
                icon: "/favicon.ico",
                tag: `portal-${newMsg.id}`,
              });
            } catch (_) { }
          }
          toast.info("New message from Brand", (newMsg.message || newMsg.content)?.slice(0, 80));
          document.title = "💬 (1) New message from Brand";
          socket.emit("message:read", { conversationId: collab.id });
        }
        setTimeout(() => scrollToBottom("smooth"), 50);
      }
    };

    const handleTypingStart = (data) => {
      if (String(data.conversationId) === String(collab.id)) {
        setIsBrandTyping(true);
        if (brandTypingTimerRef.current) clearTimeout(brandTypingTimerRef.current);
        brandTypingTimerRef.current = setTimeout(() => setIsBrandTyping(false), 3500);
      }
    };

    const handleTypingStop = (data) => {
      if (String(data.conversationId) === String(collab.id)) {
        setIsBrandTyping(false);
        if (brandTypingTimerRef.current) clearTimeout(brandTypingTimerRef.current);
      }
    };

    const onReconnect = () => {
      socket.emit("joinConversation", { conversationId: collab.id });
      loadPortalData(true);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("connect", onReconnect);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("connect", onReconnect);
      if (brandTypingTimerRef.current) clearTimeout(brandTypingTimerRef.current);
    };
  }, [socket, collab?.id, soundEnabled]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleLocalTyping = () => {
    if (!socket || !collab?.id) return;
    if (!isTypingLocalRef.current) {
      isTypingLocalRef.current = true;
      socket.emit("typing:start", { conversationId: collab.id });
    }
    if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
    localTypingTimeoutRef.current = setTimeout(() => {
      isTypingLocalRef.current = false;
      socket.emit("typing:stop", { conversationId: collab.id });
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const cleanContent = newMessage.trim();
    if (!cleanContent) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      tempId,
      isCreator: true,
      sender_type: "influencer",
      senderType: "influencer",
      sender_name: collab?.influencerName || "You",
      senderName: collab?.influencerName || "You",
      content: cleanContent,
      message: cleanContent,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    scrollToBottom();

    if (collab && (collab.status === "sent" || collab.status === "contacted")) {
      setCollab((prev) => ({ ...prev, status: "negotiating" }));
    }

    if (socket && socket.connected && collab?.id) {
      socket.emit(
        "sendMessage",
        {
          conversationId: collab.id,
          message: cleanContent,
          messageType: "text",
          tempId,
          senderType: "influencer",
          sender_type: "influencer",
        },
        async (err, res) => {
          setSending(false);
          if (err || res?.error) {
            try {
              const restRes = await collabApi.sendPortalMessage(token, cleanContent);
              if (restRes?.message) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempId
                      ? { ...restRes.message, isCreator: true, sender_type: "influencer", senderType: "influencer" }
                      : m
                  )
                );
              }
            } catch (_) { }
          } else if (res?.message) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempId
                  ? { ...res.message, isCreator: true, sender_type: "influencer", senderType: "influencer" }
                  : m
              )
            );
          }
          scrollToBottom();
        }
      );
    } else {
      try {
        const res = await collabApi.sendPortalMessage(token, cleanContent);
        if (res?.message) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? { ...res.message, isCreator: true, sender_type: "influencer", senderType: "influencer" }
                : m
            )
          );
        }
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert("Failed to send message: " + (err.message || "Network error"));
      } finally {
        setSending(false);
        scrollToBottom();
      }
    }
  };

  if (loading) {
    return (
      <LoadingScreen
        fullScreen={true}
        duration={3000}
        subtitle="Opening collaboration portal..."
      />
    );
  }

  if (error || !collab) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background dark:bg-slate-950 px-4 text-foreground dark:text-slate-100">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 mb-4">
          <AlertCircle className="size-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground dark:text-white mb-1">Deal Link Not Found</h2>
        <p className="text-sm text-muted-foreground dark:text-slate-400 max-w-sm text-center mb-6">
          {error || "This collaboration link may have expired or is invalid. Please check the link from your invitation email."}
        </p>
      </div>
    );
  }

  const cleanUsername = (raw) => {
    if (!raw) return "";
    return String(raw).replace(/^@+/, "");
  };
  const portalUsername = cleanUsername(collab.influencerUsername || collab.handle) || (collab.influencerName ? collab.influencerName.toLowerCase().replace(/\s+/g, "") : "creator");
  const targetChannelUrl = collab.profileUrl || (collab.handle ? `https://youtube.com/@${collab.handle.replace(/^@/, "")}` : (collab.influencerUsername ? `https://youtube.com/@${collab.influencerUsername.replace(/^@/, "")}` : (collab.influencerName ? `https://youtube.com/results?search_query=${encodeURIComponent(collab.influencerName)}` : "#")));
  const cleanWhatsapp = collab.whatsappNumber ? collab.whatsappNumber.replace(/[^\d+]/g, "").replace(/^\+/, "") : null;
  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
      `Hi! I received your collaboration proposal regarding my channel ${portalUsername}. Let's chat!`
    )}`
    : (collab.whatsappNumber ? `https://wa.me/${collab.whatsappNumber.replace(/[^0-9]/g, "")}` : "https://web.whatsapp.com");

  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden bg-background dark:bg-[#0c1317] text-foreground dark:text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-black">
      <aside className="hidden lg:flex w-[380px] xl:w-[420px] bg-card dark:bg-[#111b21] border-r border-border dark:border-[#202c33] flex-col shrink-0 h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          <div className="flex flex-col items-center text-center p-4 bg-muted/40 dark:bg-[#182229] rounded-2xl border border-border dark:border-[#202c33] shadow-xs">
            <div className="relative mb-3">
              <Avatar className="size-20 rounded-full border-3 border-emerald-500 bg-muted dark:bg-slate-900 ring-4 ring-emerald-500/20 shadow-lg">
                <AvatarImage src={collab.profileImage} alt={collab.influencerName} />
                <AvatarFallback className="text-2xl font-black bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {collab.influencerName?.[0] || "C"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 size-5 rounded-full bg-emerald-500 ring-3 ring-card dark:ring-[#182229] flex items-center justify-center shadow-xs">
                <CheckCircle2 className="size-3.5 text-slate-950" />
              </span>
            </div>

            <h3 className="font-bold text-base sm:text-lg text-foreground dark:text-white truncate max-w-full flex items-center justify-center gap-1.5">
              <span>{collab.influencerName}</span>
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </h3>

            <div className="flex items-center justify-center gap-2 mt-1 text-xs">
              <span className="text-muted-foreground dark:text-slate-400 font-medium">@{portalUsername}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPlatformBadge(collab.platform).badgeClass}`}>
                {getPlatformBadge(collab.platform).label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-4 text-left">
              <div className="bg-card dark:bg-[#111b21] p-2.5 rounded-xl border border-border dark:border-[#202c33]">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground dark:text-slate-400">
                  <Users className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{collab.platform?.toLowerCase() === "youtube" ? "Subscribers" : "Followers"}</span>
                </div>
                <p className="text-sm font-black text-foreground dark:text-white mt-1">
                  {formatNumber(collab.subscribers) || "Audience"}
                </p>
              </div>

              <div className="bg-card dark:bg-[#111b21] p-2.5 rounded-xl border border-border dark:border-[#202c33]">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground dark:text-slate-400">
                  <Tag className="size-3 text-sky-600 dark:text-sky-400" />
                  <span>Category</span>
                </div>
                <p className="text-sm font-semibold text-foreground dark:text-white mt-1 truncate">
                  {collab.category || "General"}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-card dark:bg-[#111b21] p-2.5 rounded-xl border border-border dark:border-[#202c33]">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground dark:text-slate-400">
                  <MapPin className="size-3 text-amber-600 dark:text-amber-400" />
                  <span>Location</span>
                </div>
                <p className="text-sm font-semibold text-foreground dark:text-white mt-1 truncate">
                  {collab.location || "Global"}
                </p>
              </div>
            </div>

            <div className="w-full mt-3 space-y-1.5 text-xs">
              {collab.recipientEmail && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card dark:bg-[#111b21] border border-border dark:border-[#202c33] text-foreground dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-400 text-[11px] shrink-0">
                    <Mail className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Contact</span>
                  </span>
                  <span className="truncate font-mono text-[11px] text-foreground dark:text-slate-200">
                    {collab.recipientEmail}
                  </span>
                </div>
              )}

              {collab.profileUrl && (
                <a
                  href={collab.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Globe className="size-3.5" />
                  <span>Visit Channel Profile</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border dark:border-[#202c33] bg-muted/40 dark:bg-[#182229] p-4 space-y-3 shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Campaign Pitch</span>
              <p className="text-sm font-semibold text-foreground dark:text-white mt-0.5">{collab.subject}</p>
            </div>

            <div className="pt-2 border-t border-border dark:border-[#202c33]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Initial Proposal</span>
                <button
                  type="button"
                  onClick={() => setShowFullPitch((prev) => !prev)}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:opacity-80 font-medium inline-flex items-center gap-1 cursor-pointer"
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
                className={`text-xs text-foreground dark:text-slate-300 leading-relaxed rounded-lg bg-card dark:bg-[#111b21] p-3 border border-border dark:border-[#202c33] whitespace-pre-wrap select-text ${showFullPitch ? "" : "max-h-48 overflow-hidden relative"
                  }`}
              >
                {collab.message}
                {!showFullPitch && (
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card dark:from-[#111b21] to-transparent pointer-events-none" />
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border dark:border-[#202c33] bg-muted/40 dark:bg-[#182229]/60 p-3 flex items-center gap-2.5 text-xs text-muted-foreground dark:text-slate-400 shadow-xs">
            <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Direct brand negotiations. Messages update deal status in real time.</span>
          </div>
        </div>
      </aside>

      <section className="flex-1 flex flex-col h-full bg-background dark:bg-[#0b141a] relative overflow-hidden">
        <div
          onClick={() => setInfoDrawerOpen(true)}
          className="h-14 bg-card dark:bg-[#202c33] px-2.5 sm:px-4 flex items-center justify-between border-b border-border dark:border-[#2a3942] shrink-0 z-10 cursor-pointer hover:bg-muted/50 dark:hover:bg-[#233138] transition-colors gap-1.5 sm:gap-2"
          title="Click to view creator profile & deal proposal"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <Avatar className="size-9 sm:size-10 rounded-full border-2 border-emerald-500/60 bg-muted dark:bg-slate-800 ring-2 ring-emerald-500/20">
                <AvatarImage src={collab.profileImage} alt={collab.influencerName} />
                <AvatarFallback className="font-bold bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-sm">
                  {collab.influencerName?.[0] || "C"}
                </AvatarFallback>
              </Avatar>
              <span
                className="absolute bottom-0 right-0 size-2 sm:size-2.5 rounded-full ring-2 ring-card dark:ring-[#202c33] bg-emerald-500 animate-pulse"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-white truncate flex items-center gap-1 min-w-0">
                  <span className="truncate">{collab.influencerName || "Creator"}</span>
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </h4>
                <span className={`text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded uppercase border shrink-0 ${getPlatformBadge(collab.platform).badgeClass}`}>
                  {getPlatformBadge(collab.platform).label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground dark:text-slate-400 min-w-0">
                <span className="truncate max-w-[85px] sm:max-w-none">@{portalUsername}</span>
                <span className="text-[10px] flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <a
              href={targetChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex size-8 rounded-xl items-center justify-center text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-[#202c33] dark:hover:bg-[#2a3942] transition-colors"
              title="Visit channel"
            >
              <ExternalLink className="size-4" />
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="hidden md:flex size-8 rounded-xl items-center justify-center text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-[#202c33] dark:hover:bg-[#2a3942] transition-colors cursor-pointer"
              title={copiedLink ? "Link copied!" : "Share deal link"}
            >
              {copiedLink ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-2 sm:px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xs transition-all cursor-pointer shrink-0"
              title="Open WhatsApp chat"
            >
              <svg className="size-3.5 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.275-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.176.2-.351.226-.652.076-.301-.15-1.272-.469-2.424-1.497-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.63-.928-2.234-.244-.588-.493-.508-.677-.518-.175-.008-.376-.01-.577-.01s-.527.076-.803.376c-.276.301-1.053 1.028-1.053 2.508s1.079 2.909 1.229 3.109c.15.201 2.123 3.242 5.143 4.545.719.31 1.28.496 1.718.635.723.23 1.381.197 1.9.12.58-.087 1.78-.727 2.03-1.43.25-.702.25-1.304.176-1.43-.076-.126-.276-.201-.577-.351zM12.04 2C6.543 2 2.08 6.463 2.08 11.96c0 1.838.498 3.565 1.365 5.05L2 22l5.127-1.345a9.92 9.92 0 0 0 4.913 1.265c5.497 0 9.96-4.463 9.96-9.96C22 6.463 17.537 2 12.04 2z"/>
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => {
                if (notifPermission !== "granted") {
                  requestNotificationPermission();
                } else {
                  toggleSound();
                }
              }}
              className={`size-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${notifPermission === "granted" && !soundEnabled
                ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                : "text-emerald-600 dark:text-[#25D366] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25"
                }`}
              title={
                notifPermission === "granted"
                  ? soundEnabled
                    ? "Sound alerts active (Click to mute)"
                    : "Sound muted (Click to unmute)"
                  : "Enable notifications"
              }
            >
              {notifPermission === "granted" && !soundEnabled ? (
                <VolumeX className="size-4" />
              ) : notifPermission === "granted" && soundEnabled ? (
                <BellRing className="size-4" />
              ) : (
                <Bell className="size-4" />
              )}
            </button>

          </div>
        </div>

        {showNotifPrompt && (
          <div className="bg-card dark:bg-[#182229] border-b border-border dark:border-[#2a3942] px-4 py-2.5 flex items-center justify-between gap-3 text-xs z-20 animate-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-[#25D366] shrink-0">
                <BellRing className="size-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground dark:text-white truncate">Allow real-time message alerts?</p>
                <p className="text-[11px] text-muted-foreground dark:text-slate-400 truncate">
                  Hear an audio chime and get desktop notifications when the brand replies.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={requestNotificationPermission}
                className="h-7 px-3 bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-500 dark:hover:bg-orange-600 font-semibold text-xs rounded-lg cursor-pointer transition-all shadow-xs"
              >
                Allow
              </Button>
              <button
                type="button"
                onClick={dismissNotificationPrompt}
                className="text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white text-xs px-2 py-1 transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
        )}

        <div
          className="flex-1 p-3 sm:p-5 overflow-y-auto overflow-x-hidden space-y-3 bg-muted/20 dark:bg-[#0b141a] select-text"
          style={{
            backgroundImage: isDark
              ? "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)"
              : "radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        >
          <div className="flex justify-center my-1">
            <span className="rounded-lg bg-card dark:bg-[#182229] border border-border dark:border-[#202c33] px-3 py-1 text-[11px] text-amber-800 dark:text-[#ffd279] shadow-xs text-center max-w-md">
              🔒 Direct creator negotiation room. All messages are synced live with the brand.
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground dark:text-slate-400">
              <MessageSquare className="size-10 text-muted-foreground/60 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-foreground dark:text-slate-300">No messages yet</p>
              <p className="text-xs text-muted-foreground dark:text-slate-500 max-w-xs mt-1">
                Send a message below to accept the proposal, discuss deliverables, or request your rate card.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isCreator =
                m.isCreator === true ||
                Boolean(m.tempId) ||
                m.sender_type === "influencer" ||
                m.senderType === "influencer" ||
                m.sender_type === "creator" ||
                m.senderType === "creator" ||
                (m.sender_type !== "marketer" && m.senderType !== "marketer" && m.senderType !== "user");
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isCreator ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs relative select-text ${isCreator
                      ? "bg-orange-500 text-white dark:bg-orange-600 dark:text-white rounded-tr-xs shadow-sm shadow-orange-500/20"
                      : "bg-card text-foreground border border-border/80 dark:bg-[#202c33] dark:text-slate-100 rounded-tl-xs dark:border-[#2a3942]/60"
                      }`}
                  >
                    {!isCreator && (
                      <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 mb-1">
                        {m.sender_name || "Brand Team"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{m.content || m.message}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isCreator ? "text-white/85 dark:text-white/90" : "text-muted-foreground dark:text-slate-400"
                      }`}>
                      <span>{formatTime(m.createdAt || m.created_at)}</span>
                      {isCreator && (
                        <CheckCheck
                          className={`size-3.5 ${m.isRead || m.is_read ? "text-orange-200" : "text-white/70 dark:text-white/60"
                            }`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isBrandTyping && (
            <div className="flex flex-col items-start animate-in fade-in duration-200">
              <div className="bg-card dark:bg-[#202c33] text-muted-foreground dark:text-slate-300 rounded-2xl px-3.5 py-2 text-xs rounded-tl-xs border border-border dark:border-[#2a3942]/60 flex items-center gap-1.5 shadow-xs">
                <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
                  Brand team is typing
                </span>
                <span className="flex items-center gap-0.5 ml-1">
                  <span className="size-1.5 rounded-full bg-orange-500 animate-bounce" />
                  <span className="size-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div
          className="px-3 py-2 bg-card dark:bg-[#111b21] border-t border-border dark:border-[#202c33] flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none text-xs shrink-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <span className="text-[10px] uppercase font-bold text-muted-foreground dark:text-slate-400 shrink-0">Quick reply:</span>
          {[
            "Interested! Here is my media kit & rates",
            "What is your target campaign budget?",
            "I'd love to collaborate on this!",
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setNewMessage(chip)}
              className="shrink-0 rounded-full border border-border dark:border-[#2a3942] bg-muted/60 dark:bg-[#202c33] hover:bg-muted dark:hover:bg-[#2a3942] hover:border-orange-500/50 px-3 py-1 text-[11px] text-foreground dark:text-slate-200 transition-all cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-2.5 sm:p-3 bg-card dark:bg-[#202c33] border-t border-border dark:border-[#2a3942] flex items-center gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <Input
            placeholder="Type a message or rate proposal..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleLocalTyping();
            }}
            className="h-10 bg-muted/60 dark:bg-[#2a3942] border border-border/60 dark:border-0 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-400 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-orange-500 rounded-lg flex-1 min-w-0"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="size-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-500 dark:hover:bg-orange-600 font-bold p-0 flex items-center justify-center shrink-0 transition-all shadow-md shadow-orange-500/25 cursor-pointer"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </section>

      {infoDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-end animate-in fade-in-0 duration-200">
          <div className="w-[88vw] max-w-sm h-full bg-card dark:bg-[#111b21] border-l border-border dark:border-[#202c33] p-4 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-[#202c33]">
              <h3 className="font-bold text-sm text-foreground dark:text-white flex items-center gap-2">
                <Info className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Deal Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setInfoDrawerOpen(false)}
                className="size-8 rounded-full bg-muted hover:bg-muted/80 dark:bg-[#202c33] flex items-center justify-center text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="py-3 space-y-4 flex-1">
              <div className="flex flex-col items-center text-center p-4 bg-muted/40 dark:bg-[#182229] rounded-2xl border border-border dark:border-[#202c33] shadow-xs">
                <div className="relative mb-3">
                  <Avatar className="size-18 rounded-full border-3 border-emerald-500 bg-muted dark:bg-slate-900 ring-4 ring-emerald-500/20 shadow-lg">
                    <AvatarImage src={collab.profileImage} alt={collab.influencerName} />
                    <AvatarFallback className="text-xl font-black bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {collab.influencerName?.[0] || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 size-4.5 rounded-full bg-emerald-500 ring-2 ring-card dark:ring-[#182229] flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="size-3 text-slate-950" />
                  </span>
                </div>

                <h3 className="font-bold text-base text-foreground dark:text-white truncate max-w-full flex items-center justify-center gap-1.5">
                  <span>{collab.influencerName}</span>
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </h3>

                <div className="flex items-center justify-center gap-2 mt-1 text-xs">
                  <span className="text-muted-foreground dark:text-slate-400 font-medium">{collab.influencerUsername || "@creator"}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPlatformBadge(collab.platform).badgeClass}`}>
                    {getPlatformBadge(collab.platform).label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full mt-3.5 text-left">
                  <div className="bg-card dark:bg-[#111b21] p-2 rounded-xl border border-border dark:border-[#202c33]">
                    <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-muted-foreground dark:text-slate-400">
                      <Users className="size-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{collab.platform?.toLowerCase() === "youtube" ? "Subscribers" : "Followers"}</span>
                    </div>
                    <p className="text-xs font-black text-foreground dark:text-white mt-0.5">
                      {formatNumber(collab.subscribers) || "Audience"}
                    </p>
                  </div>

                  <div className="bg-card dark:bg-[#111b21] p-2 rounded-xl border border-border dark:border-[#202c33]">
                    <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-muted-foreground dark:text-slate-400">
                      <Tag className="size-3 text-sky-600 dark:text-sky-400" />
                      <span>Category</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground dark:text-white mt-0.5 truncate">
                      {collab.category || "General"}
                    </p>
                  </div>

                  <div className="col-span-2 bg-card dark:bg-[#111b21] p-2 rounded-xl border border-border dark:border-[#202c33]">
                    <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-muted-foreground dark:text-slate-400">
                      <MapPin className="size-3 text-amber-600 dark:text-amber-400" />
                      <span>Location</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground dark:text-white mt-0.5 truncate">
                      {collab.location || "Global"}
                    </p>
                  </div>
                </div>

                <div className="w-full mt-3 space-y-1.5 text-xs">
                  {collab.recipientEmail && (
                    <div className="flex items-center justify-between gap-1.5 p-2 rounded-lg bg-card dark:bg-[#111b21] border border-border dark:border-[#202c33] text-foreground dark:text-slate-300">
                      <span className="flex items-center gap-1 text-muted-foreground dark:text-slate-400 text-[10px] shrink-0">
                        <Mail className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Contact</span>
                      </span>
                      <span className="truncate font-mono text-[10px] text-foreground dark:text-slate-200">
                        {collab.recipientEmail}
                      </span>
                    </div>
                  )}

                  {collab.profileUrl && (
                    <a
                      href={collab.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                    >
                      <Globe className="size-3" />
                      <span>Visit Channel Profile</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 dark:bg-[#182229] border border-border dark:border-[#202c33] space-y-2 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Subject</span>
                <p className="text-xs font-semibold text-foreground dark:text-white">{collab.subject}</p>
                <div className="pt-2 border-t border-border dark:border-[#202c33]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">Original Pitch</span>
                  <p className="text-xs text-foreground dark:text-slate-300 leading-relaxed mt-1 whitespace-pre-wrap select-text">
                    {collab.message}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setInfoDrawerOpen(false)}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-bold text-xs cursor-pointer shadow-xs"
            >
              Back to Chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
