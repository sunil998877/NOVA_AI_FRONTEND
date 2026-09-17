import { io } from "socket.io-client";

let socketInstance = null;

export function getSocketUrl() {
  const backendTarget =
    process.env.REACT_APP_API_URL ||
    process.env.VITE_BACKEND_URL ||
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "");
  return (backendTarget || "").replace(/\/$/, "");
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
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: Boolean(authToken),
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
