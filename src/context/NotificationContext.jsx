import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../lib/AuthContext";
import { campaignApi, mailApi } from "../lib/api";

const NotificationContext = createContext(null);

const STORAGE_KEY_PREFIX = "nova_notifications_v1_";

// Helper to infer notification category and routing link from title/message
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
  const storageKey = `${STORAGE_KEY_PREFIX}${user?.id || user?.email || "guest"}`;

  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load notifications from localStorage", e);
    }
    return [];
  });

  // Persist to localStorage whenever notifications change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, 100)));
    } catch (e) {
      console.warn("Failed to save notifications to localStorage", e);
    }
  }, [notifications, storageKey]);

  // When user changes, reload from user's storage key
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications([]);
      }
    } catch (e) {
      setNotifications([]);
    }
  }, [storageKey]);

  const addNotification = useCallback((item) => {
    if (!item) return;
    const now = item.timestamp ? new Date(item.timestamp).getTime() : Date.now();
    const id = item.id || `notif_${now}_${Math.random().toString(36).slice(2, 7)}`;
    const inferred = inferCategoryAndLink(item.title, item.message);

    const newNotification = {
      id: String(id),
      type: item.type || "info", // "success" | "error" | "info" | "warning"
      category: item.category || inferred.category, // "campaign" | "send" | "tracking" | "email" | "influencer" | "chat" | "system"
      title: item.title || "Notification",
      message: item.message || "",
      link: item.link !== undefined ? item.link : inferred.link,
      timestamp: now,
      read: item.read ?? false,
      meta: item.meta || null,
    };

    setNotifications((prev) => {
      // Prevent exact duplicates with same id or very close title+timestamp
      if (prev.some((n) => n.id === newNotification.id)) return prev;
      const recentDup = prev.find(
        (n) => n.title === newNotification.title && Math.abs(n.timestamp - newNotification.timestamp) < 2000
      );
      if (recentDup) return prev;
      return [newNotification, ...prev].slice(0, 100);
    });

    return id;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === String(id) ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== String(id)));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Synchronize campaign creation, send, and tracking events from workspace data
  const syncWorkspaceActivity = useCallback((campaigns = [], mails = []) => {
    if (!Array.isArray(campaigns)) return;

    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const additions = [];

      // 1. Sync Campaigns Created
      campaigns.forEach((camp) => {
        if (!camp) return;
        const cId = `camp_create_${camp.id || camp._id}`;
        if (!existingIds.has(cId)) {
          const campTitle = camp.title || camp.name || "Untitled Campaign";
          const createdAt = camp.createdAt ? new Date(camp.createdAt).getTime() : Date.now() - 3600000;
          additions.push({
            id: cId,
            type: "success",
            category: "campaign",
            title: "Campaign Created",
            message: `"${campTitle}" is ready in your workspace.`,
            link: "/campaigns",
            timestamp: createdAt,
            read: false,
          });
        }

        // 2. Sync Campaigns Sent / In-Flight
        const status = String(camp.status || "").toLowerCase();
        if (["sent", "completed", "sending", "processing"].includes(status)) {
          const sId = `camp_send_${camp.id || camp._id}`;
          if (!existingIds.has(sId)) {
            const campTitle = camp.title || camp.name || "Untitled Campaign";
            const sentAt = camp.updatedAt || camp.createdAt ? new Date(camp.updatedAt || camp.createdAt).getTime() : Date.now();
            const recipientCount = camp.recipient_count || camp.recipientsCount || (Array.isArray(camp.recipients) ? camp.recipients.length : null);
            const countText = recipientCount ? ` to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"}` : "";

            additions.push({
              id: sId,
              type: "success",
              category: "send",
              title: status === "sending" || status === "processing" ? "Campaign Sending" : "Campaign Sent",
              message: `"${campTitle}" was dispatched${countText}.`,
              link: "/campaigns",
              timestamp: sentAt,
              read: false,
            });
          }
        }
      });

      // 3. Sync Mails Delivered / Opened / Clicked
      if (Array.isArray(mails)) {
        mails.forEach((mail) => {
          if (!mail) return;
          const recipientEmail = mail.recipient_email || mail.email || mail.to || "Recipient";

          if (
            (Number(mail.open_count) || 0) > 0 ||
            mail.delivery_status === "opened" ||
            mail.first_opened_at ||
            mail.last_opened_at
          ) {
            const oId = `mail_opened_${mail.id || mail._id}`;
            if (!existingIds.has(oId)) {
              const openTime = mail.last_opened_at || mail.first_opened_at
                ? new Date(mail.last_opened_at || mail.first_opened_at).getTime()
                : Date.now() - 1800000;
              additions.push({
                id: oId,
                type: "info",
                category: "tracking",
                title: "Email Opened",
                message: `${recipientEmail} opened your campaign email.`,
                link: "/email-tracking",
                timestamp: openTime,
                read: false,
              });
            }
          } else if (
            mail.delivery_status === "sent" ||
            mail.sent_at ||
            Boolean(mail.status)
          ) {
            const dId = `mail_delivered_${mail.id || mail._id}`;
            if (!existingIds.has(dId)) {
              const delTime = mail.sent_at ? new Date(mail.sent_at).getTime() : (mail.createdAt ? new Date(mail.createdAt).getTime() : Date.now() - 7200000);
              additions.push({
                id: dId,
                type: "info",
                category: "send",
                title: "Email Delivered",
                message: `Delivered successfully to ${recipientEmail}.`,
                link: "/email-tracking",
                timestamp: delTime,
                read: false,
              });
            }
          }
        });
      }

      if (additions.length === 0) return prev;

      // Merge additions and sort by timestamp descending
      const combined = [...additions, ...prev];
      combined.sort((a, b) => b.timestamp - a.timestamp);
      return combined.slice(0, 100);
    });
  }, []);

  // Automatically sync existing campaigns & deliveries once user is authenticated
  useEffect(() => {
    if (!user) return;
    let isCancelled = false;

    async function loadActivity() {
      try {
        const [cRes, mRes] = await Promise.allSettled([
          campaignApi.list({ limit: 50 }),
          mailApi.list(undefined, { limit: 100 }),
        ]);
        if (isCancelled) return;
        const cList = cRes.status === "fulfilled" ? cRes.value?.data || [] : [];
        const mList = mRes.status === "fulfilled" ? mRes.value?.data || [] : [];
        if (cList.length || mList.length) {
          syncWorkspaceActivity(cList, mList);
        }
      } catch (e) {
        // silent
      }
    }

    loadActivity();
    return () => {
      isCancelled = true;
    };
  }, [user, syncWorkspaceActivity]);

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
      syncWorkspaceActivity,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
      syncWorkspaceActivity,
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
