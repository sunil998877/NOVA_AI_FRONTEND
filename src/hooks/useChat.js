import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext";

export function useChat({
  conversationId,
  initialMessages = [],
  senderType = "user",
  senderName = "You",
  onNewMessage = null,
  onSyncNeeded = null,
} = {}) {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState(initialMessages);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const isTypingLocalRef = useRef(false);
  const localStopTimeoutRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [conversationId, initialMessages]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("joinConversation", { conversationId });

    const handleNewMessage = (newMsg) => {
      if (!newMsg || String(newMsg.conversationId) !== String(conversationId)) return;

      setMessages((prev) => {
        if (newMsg.tempId) {
          const existsByTemp = prev.some((m) => m.tempId === newMsg.tempId || m.id === newMsg.tempId);
          if (existsByTemp) {
            return prev.map((m) =>
              m.tempId === newMsg.tempId || m.id === newMsg.tempId ? newMsg : m
            );
          }
        }

        const existsById = prev.some((m) => String(m.id) === String(newMsg.id));
        if (existsById) return prev;

        return [...prev, newMsg];
      });

      if (typeof onNewMessage === "function") {
        onNewMessage(newMsg);
      }
    };

    const handleTypingStart = (data) => {
      if (String(data.conversationId) !== String(conversationId)) return;
      setIsOtherTyping(true);
      setTypingUser(data.userName || "Participant");

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsOtherTyping(false);
        setTypingUser(null);
      }, 3500);
    };

    const handleTypingStop = (data) => {
      if (String(data.conversationId) !== String(conversationId)) return;
      setIsOtherTyping(false);
      setTypingUser(null);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const handleMessagesRead = (data) => {
      if (String(data.conversationId) !== String(conversationId)) return;
      setMessages((prev) =>
        prev.map((m) => (m.senderType === senderType ? { ...m, isRead: true } : m))
      );
    };

    const handleReconnect = () => {
      socket.emit("joinConversation", { conversationId });
      if (typeof onSyncNeeded === "function") {
        onSyncNeeded(conversationId);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("messages:read", handleMessagesRead);
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("messages:read", handleMessagesRead);
      socket.off("connect", handleReconnect);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (localStopTimeoutRef.current) clearTimeout(localStopTimeoutRef.current);
    };
  }, [socket, conversationId, senderType, onNewMessage, onSyncNeeded]);

  const sendMessage = useCallback(
    (text, messageType = "text") => {
      if (!text || !String(text).trim()) return null;
      const cleanContent = String(text).trim();
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const optimisticMsg = {
        id: tempId,
        tempId,
        conversationId: Number(conversationId),
        senderId: null,
        senderType,
        senderName,
        message: cleanContent,
        content: cleanContent,
        messageType,
        isRead: false,
        createdAt: new Date().toISOString(),
        pending: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      if (socket && conversationId) {
        socket.emit("typing:stop", { conversationId });
        isTypingLocalRef.current = false;
      }

      if (socket && socket.connected) {
        socket.emit(
          "sendMessage",
          {
            conversationId,
            message: cleanContent,
            messageType,
            tempId,
          },
          (err, response) => {
            if (err) {
              console.error("[useChat] Error sending message via socket:", err);
              setMessages((prev) =>
                prev.map((m) => (m.tempId === tempId ? { ...m, failed: true, pending: false } : m))
              );
            } else if (response?.message) {
              setMessages((prev) =>
                prev.map((m) => (m.tempId === tempId ? response.message : m))
              );
            }
          }
        );
      }

      return optimisticMsg;
    },
    [socket, conversationId, senderType, senderName]
  );

  const handleTyping = useCallback(() => {
    if (!socket || !conversationId) return;

    if (!isTypingLocalRef.current) {
      isTypingLocalRef.current = true;
      socket.emit("typing:start", { conversationId });
    }

    if (localStopTimeoutRef.current) clearTimeout(localStopTimeoutRef.current);
    localStopTimeoutRef.current = setTimeout(() => {
      if (isTypingLocalRef.current) {
        isTypingLocalRef.current = false;
        socket.emit("typing:stop", { conversationId });
      }
    }, 2000);
  }, [socket, conversationId]);

  const markAsRead = useCallback(() => {
    if (!socket || !conversationId) return;
    socket.emit("message:read", { conversationId });
  }, [socket, conversationId]);

  return {
    messages,
    setMessages,
    sendMessage,
    handleTyping,
    markAsRead,
    isOtherTyping,
    typingUser,
    isConnected,
  };
}
