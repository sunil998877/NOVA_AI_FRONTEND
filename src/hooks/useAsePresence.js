import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { aseOperatingApi } from "../lib/api";
import { useSocket } from "../context/SocketContext";

const EMPTY = {
  available: 0,
  onCall: 0,
  away: 0,
  offline: 0,
  freeNow: 0,
  freeWithin: 0,
  transferWindowSeconds: 12,
  reps: [],
  self: null,
};

export function useAsePresence() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [summary, setSummary] = useState(EMPTY);

  useEffect(() => {
    let cancelled = false;
    aseOperatingApi
      .getPresence()
      .then((res) => {
        if (!cancelled && res?.data) setSummary({ ...EMPTY, ...res.data });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onState = (payload) => {
      if (!payload) return;
      setSummary((prev) => ({ ...EMPTY, ...prev, ...payload }));
    };
    socket.on("ase:presence:state", onState);
    const beat = setInterval(() => {
      if (socket.connected) socket.emit("ase:presence:heartbeat");
    }, 30000);
    return () => {
      socket.off("ase:presence:state", onState);
      clearInterval(beat);
    };
  }, [socket]);

  const setPresence = useCallback(
    (state, freeWithinSeconds) => {
      const payload = { state, freeWithinSeconds };
      if (socket?.connected) {
        socket.emit("ase:presence:set", payload);
        return;
      }
      aseOperatingApi.setPresence(payload).catch(() => {});
    },
    [socket]
  );

  const self = useMemo(() => {
    const id = String(user?.id || "");
    return summary.reps.find((row) => String(row.userId) === id) || summary.self || null;
  }, [summary, user]);

  return { summary, self, isConnected, setPresence };
}
