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
  ChevronDown,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { collabApi, influencerApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useToast } from "../components/ui/toast";
import { useSocket } from "../context/SocketContext";
import { getTheme, toggleTheme } from "../lib/theme";

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
      badgeClass: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    };
  }
  if (p === "instagram") {
    return {
      label: "Instagram",
      badgeClass: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
    };
  }
  if (p === "twitter" || p === "x") {
    return {
      label: "X",
      badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    };
  }
  return {
    label: platform ? platform.toUpperCase() : "CREATOR",
    badgeClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  };
}

function getStatusBadge(status) {
  const s = String(status || "sent").toLowerCase();
  switch (s) {
    case "agreed":
      return { label: "Agreed", class: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40" };
    case "negotiating":
      return { label: "Negotiating", class: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40" };
    case "completed":
      return { label: "Completed", class: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40" };
    case "declined":
      return { label: "Declined", class: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40" };
    default:
      return { label: "Sent", class: "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/40" };
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

export default function Chat() {
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
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

  const [notifPermission, setNotifPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("nova_chat_sound") !== "false";
  });

  const { socket, isConnected, isUserOnline } = useSocket();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimerRef = useRef(null);
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
    const dismissed = localStorage.getItem("nova_notif_prompt_dismissed");
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
          localStorage.setItem("nova_chat_notifications", "granted");
          playMessageChime();
          toast.success(
            "Real-Time Notifications Allowed!",
            "You will receive sound chimes and desktop alerts for new messages."
          );
          try {
            new Notification("NOVA Real-Time Messaging", {
              body: "Real-time alerts active! You will be notified instantly when creators reply.",
              icon: "/favicon.ico",
            });
          } catch (_) { }
        } else {
          localStorage.setItem("nova_chat_notifications", "denied");
          toast.info("Notifications muted", "You can re-enable alerts from the bell icon anytime.");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const dismissNotificationPrompt = () => {
    setShowNotifPrompt(false);
    localStorage.setItem("nova_notif_prompt_dismissed", "true");
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("nova_chat_sound", String(next));
    if (next) {
      playMessageChime();
      toast.success("Sound enabled", "Chime will play when new messages arrive.");
    } else {
      toast.info("Sound muted", "Incoming message sound chime is now muted.");
    }
  };

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

  const loadActiveMessages = async (collabId, quiet = false) => {
    if (!collabId) return;
    if (!quiet) setLoadingMessages(true);
    try {
      const res = await collabApi.getMessages(collabId);
      if (res?.collaboration) {
        setActiveCollab(res.collaboration);
      }
      const incomingList = res?.messages || [];
      setMessages(incomingList);

      if (incomingList.length > 0) {
        const latestMsg = incomingList[incomingList.length - 1];
        const isIncoming = latestMsg.sender_type === "influencer" || latestMsg.senderType === "influencer";

        if (
          lastMessageIdRef.current &&
          String(latestMsg.id) !== String(lastMessageIdRef.current) &&
          incomingList.length > prevMessagesCountRef.current &&
          isIncoming
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
              new Notification(`${latestMsg.sender_name || "Creator"} sent a message`, {
                body: latestMsg.content,
                icon: res?.collaboration?.profile_image || "/favicon.ico",
                tag: `msg-${latestMsg.id}`,
              });
            } catch (_) { }
          }

          toast.info(
            `New message from ${latestMsg.sender_name || "Creator"}`,
            latestMsg.content?.slice(0, 80)
          );

          document.title = `💬 (1) New message • ${latestMsg.sender_name || "Creator"}`;
        }

        lastMessageIdRef.current = latestMsg.id;
        prevMessagesCountRef.current = incomingList.length;
      }

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
      try {
        window.dispatchEvent(new Event("nova-chat-updated"));
      } catch (_) { }
    } else {
      setActiveCollab(null);
      setMessages([]);
    }
  }, [selectedCollabId]);

  useEffect(() => {
    if (!socket || !selectedCollabId) return;

    socket.emit("joinConversation", { conversationId: selectedCollabId });
    socket.emit("message:read", { conversationId: selectedCollabId });

    const handleNewMessage = (newMsg) => {
      if (!newMsg) return;
      const msgCollabId = String(newMsg.conversationId || newMsg.collaboration_id || "");
      const currentId = String(selectedCollabId);

      if (msgCollabId === currentId) {
        setMessages((prev) => {
          if (newMsg.tempId) {
            const hasTemp = prev.some((m) => m.id === newMsg.tempId || m.tempId === newMsg.tempId);
            if (hasTemp) {
              return prev.map((m) =>
                m.id === newMsg.tempId || m.tempId === newMsg.tempId ? newMsg : m
              );
            }
          }
          const exists = prev.some((m) => String(m.id) === String(newMsg.id));
          if (exists) return prev;
          return [...prev, newMsg];
        });

        const isIncoming =
          newMsg.senderType === "influencer" || newMsg.sender_type === "influencer";
        if (isIncoming) {
          if (soundEnabled) playMessageChime();
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(`${newMsg.sender_name || newMsg.senderName || "Creator"} sent a message`, {
                body: newMsg.message || newMsg.content,
                icon: activeCollab?.profile_image || "/favicon.ico",
                tag: `msg-${newMsg.id}`,
              });
            } catch (_) { }
          }
          toast.info(
            `New message from ${newMsg.sender_name || newMsg.senderName || "Creator"}`,
            (newMsg.message || newMsg.content)?.slice(0, 80)
          );
          document.title = `💬 (1) New message • ${newMsg.sender_name || newMsg.senderName || "Creator"}`;
          socket.emit("message:read", { conversationId: selectedCollabId });
        }

        setTimeout(() => scrollToBottom("smooth"), 50);
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (String(c.id) === msgCollabId) {
            return {
              ...c,
              lastMessage: newMsg.message || newMsg.content || c.lastMessage,
              lastMessageAt: newMsg.createdAt || new Date().toISOString(),
              lastSender: newMsg.senderType || newMsg.sender_type,
              unreadCount: msgCollabId === currentId ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    };

    const handleTypingStart = (data) => {
      if (String(data.conversationId) === String(selectedCollabId)) {
        setIsOtherTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsOtherTyping(false), 3500);
      }
    };

    const handleTypingStop = (data) => {
      if (String(data.conversationId) === String(selectedCollabId)) {
        setIsOtherTyping(false);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      }
    };

    const handleMessagesRead = (data) => {
      if (String(data.conversationId) === String(selectedCollabId)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_type === "marketer" || m.senderType === "user" ? { ...m, isRead: true } : m
          )
        );
      }
    };

    const handleConversationUpdated = (data) => {
      if (!data?.conversationId) return;
      setConversations((prev) =>
        prev.map((c) =>
          String(c.id) === String(data.conversationId)
            ? { ...c, lastMessage: data.lastMessage, lastMessageAt: data.lastMessageAt }
            : c
        )
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("messages:read", handleMessagesRead);
    socket.on("conversation:updated", handleConversationUpdated);

    const onReconnect = () => {
      socket.emit("joinConversation", { conversationId: selectedCollabId });
      loadActiveMessages(selectedCollabId, true);
    };
    socket.on("connect", onReconnect);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("messages:read", handleMessagesRead);
      socket.off("conversation:updated", handleConversationUpdated);
      socket.off("connect", onReconnect);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [socket, selectedCollabId, soundEnabled, activeCollab]);

  const handleLocalTyping = () => {
    if (!socket || !selectedCollabId) return;
    if (!isTypingLocalRef.current) {
      isTypingLocalRef.current = true;
      socket.emit("typing:start", { conversationId: selectedCollabId });
    }
    if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
    localTypingTimeoutRef.current = setTimeout(() => {
      isTypingLocalRef.current = false;
      socket.emit("typing:stop", { conversationId: selectedCollabId });
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!selectedCollabId || !newMessage.trim()) return;

    if (notifPermission === "default") {
      setShowNotifPrompt(true);
    }

    const content = newMessage.trim();

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      tempId,
      conversationId: Number(selectedCollabId),
      sender_type: "marketer",
      senderType: "user",
      sender_name: user?.fullName || "You",
      senderName: user?.fullName || "You",
      content,
      message: content,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setTimeout(() => scrollToBottom("smooth"), 40);

    if (socket && selectedCollabId) {
      socket.emit("typing:stop", { conversationId: selectedCollabId });
      isTypingLocalRef.current = false;
    }

    let socketHandled = false;
    if (socket && socket.connected) {
      socket.emit(
        "sendMessage",
        {
          conversationId: selectedCollabId,
          message: content,
          tempId,
        },
        (err, res) => {
          if (!err && res?.message) {
            setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)));
          }
        }
      );
      socketHandled = true;
    }

    if (!socketHandled) {
      try {
        const res = await collabApi.sendMessage(selectedCollabId, content);
        if (res?.message) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)));
        }
      } catch (err) {
        console.error("Failed to send message via REST fallback", err);
      }
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
    setSending(false);
    setTimeout(() => scrollToBottom("smooth"), 80);
  };

  const PORTAL_BASE = "https://nova-ai-frontend-nu.vercel.app";

  const handleCopyCreatorLink = () => {
    const token = activeCollab?.access_token || activeCollab?.portal_token;
    if (!token) return;
    const url = `${PORTAL_BASE}/collab/${token}`;
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
  const activePortalUrl = activeToken ? `${PORTAL_BASE}/collab/${activeToken}` : "";
  const whatsappNumber = activeCollab?.whatsapp_number || activeCollab?.whatsappNumber;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`
    : "https://web.whatsapp.com";
  const channelUrl = activeCollab?.profile_url || (activeCollab?.influencer_username ? `https://youtube.com/@${activeCollab.influencer_username.replace(/^@/, "")}` : (activeCollab?.influencer_name ? `https://youtube.com/results?search_query=${encodeURIComponent(activeCollab.influencer_name)}` : "#"));

  return (
    <div className="flex w-screen h-screen max-h-screen bg-background dark:bg-[#0b141a] text-foreground dark:text-slate-100 overflow-hidden select-none">
      <aside
        className={`${mobileChatView ? "hidden md:flex" : "flex"
          } w-full md:w-80 lg:w-[380px] flex-col h-full bg-card dark:bg-[#111b21] border-r border-border dark:border-[#202c33] shrink-0 min-h-0 select-text`}
      >
        <div className="h-16 bg-card dark:bg-[#111b21] px-4 flex items-center justify-between shrink-0 border-b border-border dark:border-[#1f2c34]">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#202c33] cursor-pointer text-xs font-medium"
              title="Back to Dashboard"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div className="w-px h-5 bg-border dark:bg-[#2a3942]" />
            <h2 className="text-xl font-bold text-foreground dark:text-[#e9edef] tracking-tight">Chats</h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => loadConversations(true)}
              disabled={refreshing}
              className="size-9 rounded-full hover:bg-muted dark:hover:bg-[#202c33] flex items-center justify-center text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors"
              title="Refresh chats"
            >
              <RefreshCw className={`size-4.5 ${refreshing ? "animate-spin text-orange-500" : ""}`} />
            </button>
          </div>
        </div>

        <div className="px-3 pb-2.5 bg-card dark:bg-[#111b21] shrink-0">
          <div className="relative">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400" />
            <Input
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 text-xs bg-muted/60 dark:bg-[#202c33] border border-border/50 dark:border-0 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 dark:focus-visible:ring-orange-500 rounded-xl"
            />
          </div>
        </div>

        <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none text-[11px] bg-card dark:bg-[#111b21] border-b border-border/60 dark:border-[#202c33]/70 shrink-0">
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
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${statusFilter === pill.id
                ? "bg-orange-500 text-white font-semibold shadow-xs shadow-orange-500/25 dark:bg-orange-500 dark:text-white"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-[#202c33] dark:text-slate-300 dark:hover:bg-[#2a3942]"
                }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 bg-card dark:bg-[#111b21] p-2 space-y-1.5">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center text-center text-muted-foreground dark:text-slate-400 gap-2">
              <Loader2 className="size-6 animate-spin text-orange-500" />
              <p className="text-xs">Loading chats...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center text-muted-foreground dark:text-slate-400 gap-3">
              <MessageSquare className="size-8 opacity-40 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground dark:text-slate-200">No chats found</p>
                <p className="text-[11px] text-muted-foreground dark:text-slate-400 max-w-[200px]">
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
                  className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all duration-150 cursor-pointer relative group border ${isSelected
                    ? "bg-orange-500/10 border-orange-500/40 dark:bg-orange-500/15 dark:border-orange-500/40 shadow-xs ring-1 ring-orange-500/20 dark:ring-orange-500/30"
                    : "bg-card hover:bg-muted/60 dark:bg-[#182229]/80 dark:hover:bg-[#202c33] border-border/50 dark:border-transparent hover:border-border dark:hover:border-[#2a3942]/60"
                    }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="size-11 rounded-full border border-border dark:border-[#2a3942] bg-muted dark:bg-[#331c27] shrink-0">
                      <AvatarImage
                        src={collab.profile_image || collab.profileImage}
                        alt={collab.influencer_name}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-sm font-semibold bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                        {collab.influencer_name ? (
                          collab.influencer_name.slice(0, 2).toUpperCase()
                        ) : (
                          <Users className="size-5 text-orange-600 dark:text-orange-400" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card dark:ring-[#182229]" />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[13.5px] font-semibold text-foreground dark:text-[#e9edef] truncate tracking-tight group-hover:text-primary dark:group-hover:text-white transition-colors">
                        {collab.influencer_name || collab.influencerName || "Creator"}
                      </h3>
                      <span
                        className={`text-xs shrink-0 font-medium ${unread > 0 ? "text-orange-600 dark:text-orange-400 font-semibold" : "text-muted-foreground dark:text-[#8696a0]"
                          }`}
                      >
                        {formatTime(collab.lastMessageAt || collab.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate flex-1 min-w-0 ${unread > 0 ? "text-foreground font-medium dark:text-slate-200" : "text-muted-foreground dark:text-[#8696a0]"
                          }`}
                      >
                        {collab.lastSender === "marketer" ? (
                          <span className="inline-flex items-center gap-0.5 text-orange-500 mr-1">
                            <CheckCheck className="size-3.5 inline" />
                          </span>
                        ) : null}
                        {collab.lastMessage || collab.subject || `@${username}`}
                      </p>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {unread > 0 ? (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                            {unread}
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${statusBadge.class}`}
                          >
                            {statusBadge.label}
                          </span>
                        )}
                        <ChevronDown className="size-3.5 text-muted-foreground dark:text-[#8696a0] opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className={`flex-1 flex flex-col h-full bg-background dark:bg-[#0b141a] relative overflow-hidden min-h-0 ${!mobileChatView ? "hidden md:flex" : "flex"}`}>
        {loading && !activeCollab ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground dark:text-slate-400 gap-2">
            <Loader2 className="size-8 animate-spin text-orange-500" />
            <p className="text-xs">Connecting to negotiation room...</p>
          </div>
        ) : !activeCollab ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground dark:text-slate-400 gap-3">
            <div className="size-16 rounded-full bg-muted/60 dark:bg-[#182229] border border-border dark:border-[#202c33] flex items-center justify-center text-muted-foreground dark:text-slate-500">
              <MessageSquare className="size-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-semibold text-foreground dark:text-white">Select a Chat</h3>
              <p className="text-xs text-muted-foreground dark:text-slate-400">
                Choose an influencer conversation from the list to view negotiation history and send live messages.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-16 bg-card dark:bg-[#202c33] px-2.5 sm:px-4 flex items-center justify-between border-b border-border dark:border-[#2a3942] shrink-0 z-10 gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden size-8 text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-white shrink-0 cursor-pointer p-0"
                  onClick={() => setMobileChatView(false)}
                  title="Back to chats"
                >
                  <ChevronLeft className="size-5" />
                </Button>

                <div className="relative shrink-0">
                  <Avatar className="size-9 sm:size-10 rounded-full border-2 border-orange-500/60 bg-muted dark:bg-slate-800 ring-2 ring-orange-500/20">
                    <AvatarImage
                      src={activeCollab.profile_image || activeCollab.profileImage}
                      alt={activeInfluencerName}
                    />
                    <AvatarFallback className="font-bold bg-muted dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-sm">
                      {activeInfluencerName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="absolute bottom-0 right-0 size-2 sm:size-2.5 rounded-full ring-2 ring-card dark:ring-[#202c33] bg-emerald-500 animate-pulse"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-white truncate flex items-center gap-1 min-w-0">
                      <span className="truncate">{activeInfluencerName}</span>
                      <CheckCircle2 className="size-3.5 text-orange-500 dark:text-orange-400 shrink-0" />
                    </h4>
                    <span
                      className={`text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded uppercase border shrink-0 ${getPlatformBadge(activePlatform).badgeClass
                        }`}
                    >
                      {getPlatformBadge(activePlatform).label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground dark:text-slate-400 min-w-0">
                    <span className="truncate max-w-[85px] sm:max-w-none">@{activeInfluencerUsername}</span>
                    <span className="text-[10px] flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex size-8 rounded-xl items-center justify-center text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-[#202c33] dark:hover:bg-[#2a3942] transition-colors"
                  title="Visit channel"
                >
                  <ExternalLink className="size-4" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyCreatorLink}
                  className="hidden md:flex size-8 rounded-xl items-center justify-center text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-[#202c33] dark:hover:bg-[#2a3942] transition-colors cursor-pointer"
                  title={copiedLink ? "Link copied!" : "Copy creator deal link"}
                >
                  {copiedLink ? <Check className="size-4 text-orange-500" /> : <Share2 className="size-4" />}
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
                    : "text-orange-600 dark:text-orange-400 bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/15 dark:hover:bg-orange-500/25"
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

                <button
                  type="button"
                  onClick={() => setDealInfoOpen(!dealInfoOpen)}
                  className="h-8 px-2 sm:px-3.5 rounded-full flex items-center gap-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 hover:bg-orange-100/80 border border-orange-300/80 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 dark:border-orange-500/30 transition-colors cursor-pointer shrink-0"
                  title="Deal Info"
                >
                  <Info className="size-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                  <span className="hidden sm:inline">Deal Info</span>
                </button>

              </div>
            </div>

            {showNotifPrompt && (
              <div className="bg-card dark:bg-[#182229] border-b border-border dark:border-[#2a3942] px-4 py-2.5 flex items-center justify-between gap-3 text-xs z-20 animate-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                    <BellRing className="size-4 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground dark:text-white truncate">Allow real-time message notifications?</p>
                    <p className="text-[11px] text-muted-foreground dark:text-slate-400 truncate">
                      Receive instant audio chimes and desktop alerts when creators reply to your messages.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={requestNotificationPermission}
                    className="h-7 px-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-lg cursor-pointer transition-all shadow-xs"
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

            {dealInfoOpen && (
              <div className="p-3.5 bg-muted/30 dark:bg-[#182229] border-b border-border dark:border-[#202c33] shrink-0 text-xs space-y-2 text-foreground dark:text-slate-300 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground dark:text-slate-400">Campaign Subject:</span>
                    <p className="font-semibold text-foreground dark:text-white text-xs mt-0.5">{activeCollab.subject || "Collaboration Proposal"}</p>
                  </div>
                  {activePortalUrl && (
                    <a
                      href={activePortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>Open Public Portal</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                {activeCollab.message && (
                  <div className="rounded-lg bg-card dark:bg-[#111b21] border border-border dark:border-[#202c33] p-2.5 max-h-28 overflow-y-auto text-[11px] text-foreground dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {activeCollab.message}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground dark:text-slate-400 pt-0.5">
                  {activeCollab.recipient_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="size-3 text-orange-500 dark:text-orange-400" />
                      <span>{activeCollab.recipient_email}</span>
                    </span>
                  )}
                  {activeCollab.subscribers && (
                    <span className="flex items-center gap-1">
                      <Users className="size-3 text-orange-500 dark:text-orange-400" />
                      <span>{formatNumber(activeCollab.subscribers)} subscribers</span>
                    </span>
                  )}
                  {activeCollab.category && (
                    <span className="flex items-center gap-1">
                      <Tag className="size-3 text-orange-500 dark:text-orange-400" />
                      <span>{activeCollab.category}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            <div
              className="flex-1 p-3 sm:p-5 overflow-y-auto overflow-x-hidden space-y-3 bg-muted/20 dark:bg-[#0b141a] min-h-0 select-text"
              style={{
                backgroundImage: isDark
                  ? "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)"
                  : "radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <div className="flex justify-center my-1">
                <span className="rounded-lg bg-card dark:bg-[#182229] border border-border dark:border-[#202c33] px-3 py-1 text-[11px] text-amber-800 dark:text-[#ffd279] shadow-xs text-center max-w-md">
                  🔒 Direct creator negotiation room. All messages are synced live with the brand.
                </span>
              </div>

              {activeCollab.message && (
                <div className="my-3 mx-auto max-w-xl rounded-xl border border-border dark:border-[#202c33] bg-card dark:bg-[#182229] p-3.5 text-xs shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-orange-600 dark:text-orange-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5" />
                      <span>Initial Collaboration Proposal Sent</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground dark:text-slate-400 font-normal">
                      {formatTime(activeCollab.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-foreground dark:text-white">
                    Subject: {activeCollab.subject}
                  </p>
                  <p className="text-[11px] text-muted-foreground dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {activeCollab.message}
                  </p>
                </div>
              )}

              {loadingMessages ? (
                <div className="py-8 flex items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-orange-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground dark:text-slate-400 gap-2">
                  <MessageSquare className="size-8 opacity-40 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground dark:text-slate-200">No replies yet</p>
                  <p className="text-[11px] max-w-xs text-muted-foreground dark:text-slate-400">
                    Send a message below to negotiate deliverables, rates, or request a media kit.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMarketer =
                    m.isMarketer === true ||
                    Boolean(m.tempId) ||
                    m.sender_type === "marketer" ||
                    m.senderType === "marketer" ||
                    m.senderType === "user" ||
                    (m.sender_type !== "influencer" && m.senderType !== "influencer");
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMarketer ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed shadow-xs relative select-text ${isMarketer
                          ? "bg-teal-600 text-white dark:bg-teal-600 dark:text-white rounded-tr-xs shadow-sm shadow-teal-600/20"
                          : "bg-card text-foreground border border-border/80 dark:bg-[#202c33] dark:text-slate-100 rounded-tl-xs dark:border-[#2a3942]/60"
                          }`}
                      >
                        {!isMarketer && (
                          <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400 mb-1">
                            {m.sender_name || m.senderName || activeInfluencerName}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{m.content || m.message}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMarketer ? "text-white/85 dark:text-white/90" : "text-muted-foreground dark:text-slate-400"
                          }`}>
                          <span>{formatTime(m.createdAt || m.created_at)}</span>
                          {isMarketer && (
                            <CheckCheck
                              className={`size-3.5 ${m.isRead || m.is_read ? "text-white/50" : "text-white/70 dark:text-white/60"
                                }`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isOtherTyping && (
                <div className="flex flex-col items-start animate-in fade-in duration-200">
                  <div className="bg-card dark:bg-[#202c33] text-muted-foreground dark:text-slate-300 rounded-2xl px-3.5 py-2 text-xs rounded-tl-xs border border-border dark:border-[#2a3942]/60 flex items-center gap-1.5 shadow-xs">
                    <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400">
                      {activeInfluencerName} is typing
                    </span>
                    <span className="flex items-center gap-0.5 ml-1">
                      <span className="size-1.5 rounded-full bg-teal-500 animate-bounce" />
                      <span className="size-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:150ms]" />
                      <span className="size-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-2.5 sm:p-3 bg-card dark:bg-[#202c33] border-t border-border dark:border-[#2a3942] flex items-center gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <Input
                placeholder="Type a message or rate proposal... (Press Enter to send)"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleLocalTyping();
                }}
                className="h-10 bg-muted/60 dark:bg-[#2a3942] border border-border/60 dark:border-0 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-400 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-teal-500 dark:focus-visible:ring-teal-400 rounded-lg flex-1 min-w-0"
              />
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                className="size-10 rounded-full bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-600 dark:hover:bg-teal-700 font-bold p-0 flex items-center justify-center shrink-0 transition-all shadow-md shadow-teal-600/25 cursor-pointer"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
