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
    setTimeout(() => onDismiss(toast.id), 300);
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
        transform: visible && !leaving ? "translateY(0) scale(1)" : "translateY(-130%) scale(0.92)",
        opacity: visible && !leaving ? 1 : 0,
        transition: "transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.26s ease",
        marginBottom: 8,
        pointerEvents: "auto",
      }}
    >
      <div
        className={`relative flex w-[400px] max-w-[94vw] items-start gap-3 overflow-hidden rounded-2xl border ${style.border} backdrop-blur-2xl p-3.5 sm:p-4 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_45px_-8px_rgba(0,0,0,0.6)] cursor-pointer select-none transition-transform active:scale-[0.98]`}
        style={{ background: "hsl(var(--card) / 0.96)" }}
        onClick={dismiss}
      >
        <div className={`mt-0.5 size-8 shrink-0 rounded-xl flex items-center justify-center ${style.icon} bg-muted/80 dark:bg-slate-800/80 ring-1 ring-border/50`}>
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1 pr-6">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 dark:text-slate-400">
              NOVA
            </span>
            <span className="size-1 rounded-full bg-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/70 dark:text-slate-400">
              now
            </span>
          </div>

          {toast.title && (
            <p className="text-[13px] font-bold leading-tight text-foreground dark:text-white truncate">
              {toast.title}
            </p>
          )}
          {toast.message && (
            <p className={`text-xs leading-snug text-muted-foreground dark:text-slate-300 ${toast.title ? "mt-1 line-clamp-2" : "font-medium"}`}>
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground/70 hover:text-foreground dark:text-slate-400 dark:hover:text-white hover:bg-muted/70 transition-colors"
          title="Dismiss"
        >
          <X size={14} />
        </button>

        {duration > 0 && (
          <div
            className={`absolute bottom-0 left-0 h-[2.5px] ${style.bar} opacity-40`}
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
    setToasts((prev) => [...prev, { id, type, title, message, ...opts }].slice(-4));
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
        className="fixed z-[99999] pointer-events-none flex flex-col gap-2 top-4 left-1/2 -translate-x-1/2 items-center w-[94vw] max-w-[420px] px-3 md:top-5 md:right-6 md:left-auto md:translate-x-0 md:items-end md:w-auto md:max-w-none md:p-0 transition-all duration-300"
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
