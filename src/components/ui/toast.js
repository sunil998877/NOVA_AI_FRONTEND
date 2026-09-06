import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: {
    bar: "bg-emerald-500",
    icon: "text-emerald-500",
    border: "border-emerald-500/20",
  },
  error: {
    bar: "bg-red-500",
    icon: "text-red-500",
    border: "border-red-500/20",
  },
  info: {
    bar: "bg-blue-500",
    icon: "text-blue-500",
    border: "border-blue-500/20",
  },
  warning: {
    bar: "bg-amber-500",
    icon: "text-amber-500",
    border: "border-amber-500/20",
  },
};

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);
  const style = STYLES[toast.type] || STYLES.info;
  const Icon = ICONS[toast.type] || Info;
  const duration = toast.duration ?? 4500;

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 320);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (duration > 0) {
      timerRef.current = setTimeout(dismiss, duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [dismiss, duration]);

  return (
    <div
      style={{
        transform: visible && !leaving ? "translateX(0) scale(1)" : "translateX(110%) scale(0.95)",
        opacity: visible && !leaving ? 1 : 0,
        transition: "transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease",
        marginBottom: 10,
        pointerEvents: "auto",
      }}
    >
      <div
        className={`relative flex w-[340px] max-w-[90vw] items-start gap-3 overflow-hidden rounded-xl border ${style.border} backdrop-blur-xl shadow-2xl p-4 pr-10`}
        style={{ background: "hsl(var(--card) / 0.96)" }}
      >
        <div className={`absolute left-0 top-0 h-full w-[3px] rounded-l-xl ${style.bar}`} />
        <div className={`mt-0.5 shrink-0 ${style.icon}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          {toast.title && (
            <p className="text-sm font-semibold leading-snug text-foreground">{toast.title}</p>
          )}
          {toast.message && (
            <p className={`text-xs leading-relaxed ${toast.title ? "mt-0.5 text-muted-foreground" : "text-sm font-medium text-foreground"}`}>
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={14} />
        </button>
        {duration > 0 && (
          <div
            className={`absolute bottom-0 left-0 h-[2px] ${style.bar} opacity-30`}
            style={{
              animation: `nova-toast-shrink ${duration}ms linear forwards`,
            }}
          />
        )}
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type, title, message, opts = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message, ...opts }].slice(-6));
    return id;
  }, []);

  const api = {
    success: (title, message, opts) => show("success", title, message, opts),
    error: (title, message, opts) => show("error", title, message, opts),
    info: (title, message, opts) => show("info", title, message, opts),
    warning: (title, message, opts) => show("warning", title, message, opts),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <style>{`@keyframes nova-toast-shrink { from { width: 100%; } to { width: 0%; } }`}</style>
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 0,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
