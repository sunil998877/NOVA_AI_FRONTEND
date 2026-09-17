import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import AnimatedParticles from "../components/AnimatedParticles";
import { AuthDivider, GoogleSignInButton } from "../components/GoogleSignInButton";
import { Recaptcha } from "../components/Recaptcha";
import { authApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useToast } from "../components/ui/toast";
import { Eye, EyeOff, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const { authed, applySession } = useAuth();
  const recaptchaRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [dots, setDots] = useState("");
  const toast = useToast();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const credentialsReady = emailValid && password.length > 0;

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    return () => clearInterval(id);
  }, [busy]);

  useEffect(() => {
    if (!credentialsReady) {
      setCaptchaToken("");
    }
  }, [credentialsReady]);

  if (authed) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const token = captchaToken || recaptchaRef.current?.getToken() || "";
    if (!token) {
      setError("Please tick I'm not a robot");
      return;
    }
    setBusy(true);
    try {
      const result = await authApi.signin({ email, password, captchaToken: token });
      applySession(result.token, result.user);
      toast.success("Welcome back!", "Signed in successfully.");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Sign in failed", err.message || "Could not sign in");
      setError(err.message || "Could not sign in");
      recaptchaRef.current?.reset();
      setCaptchaToken("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-x-hidden bg-background p-4">
      <AnimatedParticles />

      <div className="relative z-10 w-full max-w-md">
        {/* Ambient Glow Backdrop */}
        <div
          className={`absolute -inset-px rounded-2xl transition-all duration-700 pointer-events-none ${
            inputFocused
              ? "bg-gradient-to-br from-primary/30 via-primary/10 to-primary/20 opacity-100 blur-sm"
              : "opacity-0"
          }`}
        />

        <Card className="relative border-primary/20 overflow-hidden shadow-xl">
          {/* Top Shimmer Progress Bar */}
          <div
            className={`absolute top-0 left-0 right-0 h-0.5 transition-all duration-500 ${
              busy
                ? "bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse opacity-100"
                : "opacity-0"
            }`}
          />

          <CardHeader className="space-y-3 text-center pb-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform duration-300 hover:scale-105">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription>Sign in to your NOVA Email Marketer account</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 pt-2">
            <GoogleSignInButton disabled={busy} />
            <AuthDivider />

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    required
                    autoComplete="email"
                    className={`pr-10 transition-all duration-200 ${
                      emailValid && email.length > 0
                        ? "border-emerald-500/50 focus-visible:ring-emerald-500/20"
                        : ""
                    }`}
                  />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200">
                    {emailValid && email.length > 0 && (
                      <CheckCircle2 className="size-4 text-emerald-500 animate-in zoom-in-50 duration-200" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  required
                  autoComplete="current-password"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  }
                />
              </div>

              {credentialsReady ? (
                <div className="animate-in fade-in-50 slide-in-from-top-1 duration-200">
                  <Recaptcha ref={recaptchaRef} onToken={setCaptchaToken} />
                </div>
              ) : null}

              {error ? (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                  <span className="shrink-0 size-1.5 rounded-full bg-destructive" />
                  <p className="flex-1">{error}</p>
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all cursor-pointer"
                disabled={busy}
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span>Signing in{dots}</span>
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground/80">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span>Enterprise 256-bit SSL encrypted</span>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link to="/signup" className="text-primary font-medium hover:underline">
                  Create an account
                </Link>
              </p>

              <p className="text-center text-xs text-muted-foreground">
                <Link to="/" className="hover:text-foreground transition-colors">
                  Back to home
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;
