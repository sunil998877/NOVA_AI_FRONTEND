import { io } from "socket.io-client";

let socketInstance = null;

export function getSocketUrl() {
  const envTarget =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_API_URL)) ||
    (typeof process !== "undefined" &&
      process.env &&
      (process.env.REACT_APP_API_URL || process.env.VITE_BACKEND_URL)) ||
    "https://nova-ai-backend-wo7q.onrender.com";

  if (envTarget && typeof envTarget === "string" && envTarget.trim()) {
    return envTarget.trim().replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocal) {
      return "http://localhost:3001";
    }
    return window.location.origin;
  }
  return "https://nova-ai-backend-wo7q.onrender.com";
}

/**
 * Get or initialize the singleton Socket.IO connection.
 * @param {Object} options
 * @param {string} [options.token] - JWT token for marketer or access token for influencer.
 * @param {boolean} [options.forceNew] - Force a new connection if token changed.
 */
export function initSocket({ token = "", forceNew = false } = {}) {
  const authToken =
    token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("nova_jwt_token") || localStorage.getItem("token") || ""
      : "");

  if (socketInstance && !forceNew) {
    // If token provided and socket disconnected, update auth and reconnect
    if (authToken && socketInstance.auth?.token !== authToken) {
      socketInstance.auth = { token: authToken };
      socketInstance.io.opts.query = { token: authToken };
      if (socketInstance.disconnected) {
        socketInstance.connect();
      }
    }
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  const socketUrl = getSocketUrl();

  socketInstance = io(socketUrl || undefined, {
    auth: { token: authToken },
    query: { token: authToken },
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 30,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    autoConnect: true,
  });

  socketInstance.on("connect", () => {
    console.log("[Socket.IO] Connected successfully with ID:", socketInstance.id);
  });

  socketInstance.on("connect_error", (err) => {
    console.warn("[Socket.IO] Connection error:", err.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("[Socket.IO] Disconnected:", reason);
  });

  return socketInstance;
}

export function getSocket() {
  return socketInstance || initSocket();
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
