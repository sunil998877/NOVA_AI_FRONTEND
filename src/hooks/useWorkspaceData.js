import { useCallback, useEffect, useState } from "react";
import { campaignApi, mailApi, statsApi } from "../lib/api";

export function useWorkspaceData() {
  const [campaigns, setCampaigns] = useState([]);
  const [mails, setMails] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    opened: 0,
    unopened: 0,
    clicked: 0,
    openRate: 0,
    clickRate: 0,
    campaigns: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const [campaignRes, mailRes, statsRes] = await Promise.all([
        campaignApi.list({ limit: 100 }),
        mailApi.list(undefined, { limit: 500 }),
        statsApi.performance(),
      ]);
      setCampaigns(campaignRes.data || []);
      setMails(mailRes.data || []);
      setStats(statsRes || {});
    } catch (err) {
      if (!silent) {
        setError(err.message || "Failed to load workspace data");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    reload(false);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        reload(true);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [reload]);

  return { campaigns, mails, stats, loading, error, reload, setCampaigns, setMails };
}
