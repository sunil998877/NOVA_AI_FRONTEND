import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { authApi } from "../lib/api";
import { loadGoogleIdentity } from "../lib/google";
import { useAuth } from "../lib/AuthContext";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function localAppUrl() {
  const { protocol, port, pathname, search, hash } = window.location;
  const suffix = port ? `:${port}` : "";
  return `${protocol}//localhost${suffix}${pathname}${search}${hash}`;
}

function currentOriginPort() {
  return window.location.port || (window.location.protocol === "https:" ? "443" : "80");
}


function clientIdForCurrentOrigin() {
  const port = currentOriginPort();
  const alt = String(process.env.REACT_APP_GOOGLE_CLIENT_ID_ALT || "").trim();
  if (port === "5173" && alt) return alt;
  return String(process.env.REACT_APP_GOOGLE_CLIENT_ID || "").trim();
}

async function resolveGoogleClientId() {
  const fromEnv = clientIdForCurrentOrigin();
  if (fromEnv) return fromEnv;

  const readId = async (loader) => {
    try {
      const config = await loader();
      return String(config?.googleClientId || "").trim();
    } catch {
      return "";
    }
  };

  const fromApi = await readId(() => authApi.config());
  if (fromApi) return fromApi;

  return readId(async () => {
    const response = await fetch("/api/auth/config");
    if (!response.ok) throw new Error("config unavailable");
    return response.json();
  });
}

function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function GoogleSignInButton({ disabled }) {
  const navigate = useNavigate();
  const { applySession } = useAuth();
  const officialRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const finishGoogleSignIn = useCallback(
    async (credential) => {
      if (!credential) {
        setError("Google did not return a sign-in token");
        return;
      }
      setBusy(true);
      setError("");
      try {
        const result = await authApi.google(credential);
        applySession(result.token, result.user);
        navigate("/dashboard");
      } catch (err) {
        setError(err.message || "Google sign-in failed");
      } finally {
        setBusy(false);
      }
    },
    [applySession, navigate]
  );

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!LOCAL_HOSTS.has(window.location.hostname)) {
        if (!cancelled) {
          setError(`Google Sign-In requires http://localhost:${window.location.port || "80"}. Open ${localAppUrl()}`);
        }
        return;
      }

      if (window.location.hostname === "127.0.0.1") {
        window.location.replace(localAppUrl());
        return;
      }

      try {
        const clientId = await resolveGoogleClientId();
        if (!clientId) {
          if (!cancelled) setError("Google Sign-In is not configured");
          return;
        }

        await loadGoogleIdentity();
        if (cancelled) return;
        if (!officialRef.current) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        if (cancelled || !officialRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          cancel_on_tap_outside: true,
          callback: (response) => {
            finishGoogleSignIn(response?.credential);
          },
        });

        officialRef.current.innerHTML = "";
        const width = Math.max(
          250,
          Math.min(400, Math.floor(officialRef.current.parentElement?.clientWidth || 336))
        );
        window.google.accounts.id.renderButton(officialRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width,
          logo_alignment: "left",
        });

        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not start Google Sign-In");
      }
    };

    start();
    return () => {
      cancelled = true;
    };
  }, [finishGoogleSignIn]);

  return (
    <div className="grid gap-2">
      {!ready ? (
        <Button type="button" variant="outline" className="w-full" disabled>
          <GoogleMark />
          Continue with Google
        </Button>
      ) : null}
      <div
        ref={officialRef}
        className={ready && !disabled && !busy ? "flex w-full justify-center" : "h-0 overflow-hidden"}
      />
      {busy ? <p className="text-center text-sm text-muted-foreground">Signing in with Google...</p> : null}
      {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
