import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Send,
  PlusCircle,
  Eye,
  Mail,
  Users,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ExternalLink,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

function formatRelativeTime(timestamp) {
  if (!timestamp) return "just now";
  const now = Date.now();
  const diff = Math.max(0, now - Number(timestamp));
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 45) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getCategoryMeta(category, type) {
  switch (category) {
    case "campaign":
      return {
        label: "Campaign",
        icon: PlusCircle,
        bg: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
        pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      };
    case "send":
      return {
        label: "Delivery",
        icon: Send,
        bg: "bg-cyan-500/15 text-cyan-500 border-cyan-500/20",
        pill: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      };
    case "tracking":
      return {
        label: "Tracking",
        icon: Eye,
        bg: "bg-violet-500/15 text-violet-500 border-violet-500/20",
        pill: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      };
    case "influencer":
      return {
        label: "Outreach",
        icon: Users,
        bg: "bg-amber-500/15 text-amber-500 border-amber-500/20",
        pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
    case "email":
      return {
        label: "Email List",
        icon: Mail,
        bg: "bg-blue-500/15 text-blue-500 border-blue-500/20",
        pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      };
    default:
      if (type === "error") {
        return {
          label: "Alert",
          icon: XCircle,
          bg: "bg-red-500/15 text-red-500 border-red-500/20",
          pill: "bg-red-500/10 text-red-600 dark:text-red-400",
        };
      }
      if (type === "warning") {
        return {
          label: "Warning",
          icon: AlertTriangle,
          bg: "bg-amber-500/15 text-amber-500 border-amber-500/20",
          pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        };
      }
      if (type === "success") {
        return {
          label: "Success",
          icon: CheckCircle2,
          bg: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
          pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        };
      }
      return {
        label: "System",
        icon: Sparkles,
        bg: "bg-primary/15 text-primary border-primary/20",
        pill: "bg-primary/10 text-primary",
      };
  }
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const containerRef = useRef(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Tab filtered items
  const filteredItems = useMemo(() => {
    if (activeTab === "all") return notifications;
    if (activeTab === "unread") return notifications.filter((n) => !n.read);
    if (activeTab === "campaigns")
      return notifications.filter((n) => n.category === "campaign");
    if (activeTab === "sends")
      return notifications.filter((n) => n.category === "send");
    if (activeTab === "tracking")
      return notifications.filter((n) => n.category === "tracking");
    return notifications;
  }, [notifications, activeTab]);

  const handleItemClick = (item) => {
    markAsRead(item.id);
    if (item.link) {
      setOpen(false);
      navigate(item.link);
    }
  };

  const tabs = [
    { id: "all", label: "All", count: notifications.length },
    { id: "unread", label: "Unread", count: unreadCount },
    {
      id: "campaigns",
      label: "Campaigns",
      count: notifications.filter((n) => n.category === "campaign").length,
    },
    {
      id: "sends",
      label: "Sent",
      count: notifications.filter((n) => n.category === "send").length,
    },
    {
      id: "tracking",
      label: "Tracking",
      count: notifications.filter((n) => n.category === "tracking").length,
    },
  ];

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        className={`relative transition-colors ${
          open ? "bg-accent text-accent-foreground" : ""
        }`}
        aria-label="Notifications"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className={`size-4.5 ${unreadCount > 0 ? "animate-pulse" : ""}`} />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm ring-2 ring-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 animate-ping rounded-full bg-primary/40" />
          </>
        )}
      </Button>

      {/* Floating Notification Panel */}
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[380px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border/80 bg-popover/95 p-0 text-popover-foreground shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-200 sm:w-[420px]"
          style={{
            boxShadow:
              "0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="size-4" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  title="Mark all as read"
                >
                  <CheckCheck className="mr-1 size-3.5" />
                  Read all
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  title="Clear all notifications"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="size-7 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border/40 px-3 py-1.5 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-secondary text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      activeTab === tab.id
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-[380px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground ring-1 ring-border/50">
                  <CheckCircle2 className="size-6 text-primary/70" />
                </div>
                <p className="text-sm font-semibold">You're all caught up!</p>
                <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
                  {activeTab === "all"
                    ? "No notifications yet. When you create campaigns or send emails, updates will appear here."
                    : `No ${activeTab} notifications found.`}
                </p>
                {activeTab !== "all" && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 text-xs text-primary"
                    onClick={() => setActiveTab("all")}
                  >
                    View all notifications
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredItems.map((item) => {
                  const meta = getCategoryMeta(item.category, item.type);
                  const Icon = meta.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer select-none hover:bg-secondary/40 ${
                        !item.read ? "bg-primary/[0.03]" : ""
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border ${meta.bg} shadow-xs`}
                      >
                        <Icon className="size-4" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 pr-6">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${meta.pill}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground/70">
                            · {formatRelativeTime(item.timestamp)}
                          </span>
                          {!item.read && (
                            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>

                        <h4
                          className={`text-xs font-semibold leading-snug truncate ${
                            !item.read ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {item.title}
                        </h4>

                        {item.message && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                            {item.message}
                          </p>
                        )}
                      </div>

                      {/* Right action icons */}
                      <div className="absolute right-2.5 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {item.link && (
                          <span
                            className="rounded p-1 text-muted-foreground hover:text-foreground"
                            title="Open link"
                          >
                            <ExternalLink className="size-3" />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(item.id);
                          }}
                          className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Dismiss"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-3.5 py-2 text-xs">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/campaigns");
              }}
              className="font-medium text-primary hover:underline"
            >
              Go to Campaigns →
            </button>
            <button
              onClick={() => {
                setOpen(false);
                navigate("/email-tracking");
              }}
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Email Tracking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
