import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { authApi } from "../lib/api";
import { loadRecaptcha, readRecaptchaResponse, resolveRecaptchaSiteKey } from "../lib/recaptcha";
import { getTheme } from "../lib/theme";

export const Recaptcha = forwardRef(function Recaptcha({ onToken, className = "" }, ref) {
  const hostRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenRef = useRef(onToken);
  const [error, setError] = useState("");

  onTokenRef.current = onToken;

  useImperativeHandle(ref, () => ({
    getToken() {
      return readRecaptchaResponse(widgetIdRef.current);
    },
    reset() {
      if (widgetIdRef.current == null || !window.grecaptcha) return;
      try {
        window.grecaptcha.reset(widgetIdRef.current);
      } catch {

      }
      onTokenRef.current?.("");
    },
  }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let cancelled = false;
    let widgetId = null;

    const timer = window.setTimeout(() => {
      const start = async () => {
        const siteKey = await resolveRecaptchaSiteKey(() => authApi.config());
        if (cancelled) return;
        if (!siteKey) {
          setError("reCAPTCHA site key is missing");
          return;
        }

        try {
          const grecaptcha = await loadRecaptcha();
          if (cancelled || !host.isConnected) return;

          host.replaceChildren();
          widgetId = grecaptcha.render(host, {
            sitekey: siteKey,
            theme: getTheme() === "light" ? "light" : "dark",
            callback: (token) => onTokenRef.current?.(token || ""),
            "expired-callback": () => onTokenRef.current?.(""),
            "error-callback": () => onTokenRef.current?.(""),
          });
          widgetIdRef.current = widgetId;
          setError("");
        } catch (err) {
          if (!cancelled) setError(err.message || "Could not load reCAPTCHA");
        }
      };

      start();
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (widgetId != null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetId);
        } catch {

        }
      }
      widgetIdRef.current = null;
    };
  }, []);

  return (
    <div className={`relative z-20 grid justify-center gap-2 overflow-visible ${className}`}>
      <div ref={hostRef} className="flex min-h-[78px] justify-center overflow-visible" />
      {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
    </div>
  );
});
