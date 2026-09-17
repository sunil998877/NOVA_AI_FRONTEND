import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { initSocket, disconnectSocket, getSocket } from "../services/socket";
import { useAuth } from "../lib/AuthContext";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  onlineUserIds: [],
  isUserOnline: () => false,
  connectWithToken: () => {},
  disconnect: () => {},
});

export function SocketProvider({ children }) {
  const { authed, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  useEffect(() => {
    // Determine token from AuthContext or localStorage
    const effectiveToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("nova_jwt_token") || localStorage.getItem("token") : "");

    const s = initSocket({ token: effectiveToken });
    setSocket(s);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onPresenceState = ({ onlineUserIds }) => {
      if (Array.isArray(onlineUserIds)) setOnlineUserIds(onlineUserIds);
    };
    const onUserOnline = ({ userId }) => {
      setOnlineUserIds((prev) => (prev.includes(String(userId)) ? prev : [...prev, String(userId)]));
    };
    const onUserOffline = ({ userId }) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== String(userId)));
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("presence:state", onPresenceState);
    s.on("user:online", onUserOnline);
    s.on("user:offline", onUserOffline);

    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("presence:state", onPresenceState);
      s.off("user:online", onUserOnline);
      s.off("user:offline", onUserOffline);
    };
  }, [authed, token]);

  const connectWithToken = (customToken) => {
    const s = initSocket({ token: customToken, forceNew: true });
    setSocket(s);
    if (s.disconnected) {
      s.connect();
    }
    return s;
  };

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUserIds.includes(String(userId));
  };

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      onlineUserIds,
      isUserOnline,
      connectWithToken,
      disconnect: disconnectSocket,
    }),
    [socket, isConnected, onlineUserIds]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
