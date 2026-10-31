import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

export function useAseTransfer() {
  const { socket } = useSocket();
  const [incoming, setIncoming] = useState(null);
  const [missed, setMissed] = useState(null);

  useEffect(() => {
    if (!socket) return undefined;
    const onIncoming = (payload) => {
      setMissed(null);
      setIncoming(payload || null);
    };
    const onMissed = (payload) => {
      setIncoming(null);
      setMissed(payload || null);
    };
    socket.on("ase:transfer:incoming", onIncoming);
    socket.on("ase:transfer:missed", onMissed);
    return () => {
      socket.off("ase:transfer:incoming", onIncoming);
      socket.off("ase:transfer:missed", onMissed);
    };
  }, [socket]);

  return { incoming, missed, clear: () => { setIncoming(null); setMissed(null); } };
}
