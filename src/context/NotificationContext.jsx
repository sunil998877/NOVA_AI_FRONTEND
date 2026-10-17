import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../lib/AuthContext";
import { getSocket } from "../services/socket";

const NotificationContext = createContext(null);

const STORAGE_KEY_PREFIX = "nova_notifications_v1_";
const DELETED_KEY_PREFIX = "nova_notifications_deleted_v1_";
const CLEARED_KEY_PREFIX = "nova_notifications_cleared_v1_";

export function inferCategoryAndLink(title = "", message = "") {
  const text = `${title} ${message}`.toLowerCase();

  if (text.includes("campaign created") || text.includes("new campaign") || text.includes("save to campaign") || text.includes("duplicate campaign") || text.includes("camping")) {
    return { category: "campaign", link: "/campaigns" };
  }
  if (text.includes("sending") || text.includes("sent") || text.includes("delivered") || text.includes("outreach email") || text.includes("campaign completed")) {
    return { category: "send", link: "/campaigns" };
  }
  if (text.includes("open") || text.includes("click") || text.includes("tracking") || text.includes("unopened")) {
    return { category: "tracking", link: "/email-tracking" };
  }
  if (text.includes("influencer") || text.includes("collab")) {
    return { category: "influencer", link: "/my-influencers" };
  }
  if (text.includes("recipient") || text.includes("list")) {
    return { category: "email", link: "/email-management" };
  }
  if (text.includes("chat") || text.includes("message")) {
    return { category: "chat", link: "/chat" };
  }
  return { category: "system", link: "/dashboard" };
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || user?.email || "guest";
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
  const deletedKey = `${DELETED_KEY_PREFIX}${userId}`;
  const clearedKey = `${CLEARED_KEY_PREFIX}${userId}`;

  const [deletedIds, setDeletedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(deletedKey);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) { }
    return new Set();
  });

  const [clearedAt, setClearedAt] = useState(() => {
    try {
      const stored = localStorage.getItem(clearedKey);
      if (stored) return Number(stored);
    } catch (e) { }
    return 0;
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const delStored = localStorage.getItem(deletedKey);
      const delSet = delStored ? new Set(JSON.parse(delStored)) : new Set();
      const clrAt = Number(localStorage.getItem(clearedKey) || 0);

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((n) => {
            if (!n || !n.id) return false;
            const strId = String(n.id);
            if (delSet.has(strId)) return false;
            if (clrAt && Number(n.timestamp || 0) <= clrAt) return false;
            const isSynthetic =
              strId.startsWith("camp_create_") ||
              strId.startsWith("camp_send_") ||
              strId.startsWith("mail_delivered_") ||
              strId.startsWith("mail_opened_");
            return !isSynthetic;
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load notifications from localStorage", e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, 100)));
    } catch (e) {
      console.warn("Failed to save notifications to localStorage", e);
    }
  }, [notifications, storageKey]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const delStored = localStorage.getItem(deletedKey);
      const delSet = delStored ? new Set(JSON.parse(delStored)) : new Set();
      const clrAt = Number(localStorage.getItem(clearedKey) || 0);

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setNotifications(
            parsed.filter((n) => {
              if (!n || !n.id) return false;
              const strId = String(n.id);
              if (delSet.has(strId)) return false;
              if (clrAt && Number(n.timestamp || 0) <= clrAt) return false;
              const isSynthetic =
                strId.startsWith("camp_create_") ||
                strId.startsWith("camp_send_") ||
                strId.startsWith("mail_delivered_") ||
                strId.startsWith("mail_opened_");
              return !isSynthetic;
            })
          );
          return;
        }
      }
      setNotifications([]);
    } catch (e) {
      setNotifications([]);
    }
  }, [storageKey, deletedKey, clearedKey]);

  const addNotification = useCallback(
    (item) => {
      if (!item) return;
      const now = item.timestamp ? new Date(item.timestamp).getTime() : Date.now();
      if (clearedAt && now <= clearedAt) return;
      const id = String(item.id || `notif_${now}_${Math.random().toString(36).slice(2, 7)}`);
      if (deletedIds.has(id)) return;

      const isSynthetic =
        id.startsWith("camp_create_") ||
        id.startsWith("camp_send_") ||
        id.startsWith("mail_delivered_") ||
        id.startsWith("mail_opened_");
      if (isSynthetic) return;

      const inferred = inferCategoryAndLink(item.title, item.message);

      const newNotification = {
        id,
        type: item.type || "info",
        category: item.category || inferred.category,
        title: item.title || "Notification",
        message: item.message || "",
        link: item.link !== undefined ? item.link : inferred.link,
        timestamp: now,
        read: item.read ?? false,
        meta: item.meta || null,
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotification.id)) return prev;
        const recentDup = prev.find(
          (n) => n.title === newNotification.title && Math.abs(n.timestamp - newNotification.timestamp) < 2000
        );
        if (recentDup) return prev;
        return [newNotification, ...prev].slice(0, 100);
      });

      return id;
    },
    [clearedAt, deletedIds]
  );

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === String(id) ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback(
    (id) => {
      const strId = String(id);
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(strId);
        try {
          localStorage.setItem(deletedKey, JSON.stringify(Array.from(next).slice(-500)));
        } catch (e) { }
        return next;
      });
      setNotifications((prev) => prev.filter((n) => n.id !== strId));
    },
    [deletedKey]
  );

  const clearAll = useCallback(() => {
    const now = Date.now();
    setClearedAt(now);
    try {
      localStorage.setItem(clearedKey, String(now));
    } catch (e) { }
    setDeletedIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(String(n.id)));
      try {
        localStorage.setItem(deletedKey, JSON.stringify(Array.from(next).slice(-500)));
      } catch (e) { }
      return next;
    });
    setNotifications([]);
  }, [notifications, deletedKey, clearedKey]);

  useEffect(() => {
    if (!user) return;
    let s = null;
    try {
      s = getSocket();
    } catch (e) { }
    if (!s) return;

    const handleAseEvent = (env) => {
      if (!env) return;
      const eventType = env.event_type || env.eventType;
      const payload = env.payload || {};
      const leadName = payload.lead_name || payload.contact_name || payload.email || "Lead";

      let title = "Sales Engine Event";
      let message = `Activity recorded for ${leadName}`;
      let type = "info";
      let category = "send";

      if (eventType === "ActionScheduled") {
        title = `Outreach Scheduled (${env.channel || payload.action || "EMAIL"})`;
        message = `Autonomous outreach scheduled for ${leadName}.`;
        type = "info";
        category = "send";
      } else if (eventType === "OutreachExecuted" || eventType === "EmailSent") {
        title = `Outreach Dispatched (${env.channel || "EMAIL"})`;
        message = `Autonomous outreach sent to ${leadName}.`;
        type = "success";
        category = "send";
      } else if (eventType === "LeadReplied" || eventType === "LeadResponded") {
        title = "Lead Responded";
        message = `${leadName} replied to your outreach.`;
        type = "success";
        category = "campaign";
      } else if (eventType === "LeadConverted" || eventType === "DealWon") {
        title = "Deal Won";
        message = `${leadName} has been converted successfully.`;
        type = "success";
        category = "campaign";
      } else if (eventType === "VoiceCallInitiated") {
        title = "AI Call Initiated";
        message = `AI Voice Bot connected with ${leadName}.`;
        type = "info";
        category = "send";
      }

      addNotification({
        id: `ase_${env.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        category,
        title,
        message,
        link: env.lead_id ? `/ase/leads/${env.lead_id}` : "/ase/leads",
        timestamp: Date.now(),
      });
    };

    const handleNewMessage = (msg) => {
      if (!msg) return;
      const senderName = msg.sender_name || msg.senderName || "New message";
      addNotification({
        id: `chat_msg_${msg.id || Date.now()}`,
        type: "info",
        category: "chat",
        title: `Message from ${senderName}`,
        message: msg.content || msg.text || "You received a new message.",
        link: "/chat",
        timestamp: Date.now(),
      });
    };

    s.on("ase:lead_event", handleAseEvent);
    s.on("newMessage", handleNewMessage);

    return () => {
      s.off("ase:lead_event", handleAseEvent);
      s.off("newMessage", handleNewMessage);
    };
  }, [user, addNotification]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
      syncWorkspaceActivity: () => { },
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
