import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import AnimatedParticles from "../components/AnimatedParticles";
import { authApi } from "../lib/api";
import { Loader2, Mail, ArrowLeft, CheckCircle2, Send, RotateCcw, ShieldCheck } from "lucide-react";

const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || "").trim());

function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dots, setDots] = useState("");

  const valid = isValidEmail(email);
  const showEmailError = touched && !focused && email.length > 0 && !valid;

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    return () => clearInterval(id);
  }, [busy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setError("");
    setBusy(true);
    try {
      const result = await authApi.resetPassword({
        email,
        redirectTo: `${window.location.origin}/update-password`,
      });
      setResetUrl(result.resetUrl || "");
      setSent(true);
    } catch (err) {
      setError(err.message || "Could not start password reset");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setSent(false);
    setEmail("");
    setResetUrl("");
    setError("");
    setTouched(false);
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      <AnimatedParticles />

      <div className="relative z-10 w-full max-w-md">
        <div
          className={`absolute -inset-px rounded-2xl transition-all duration-700 ${
            sent
              ? "bg-gradient-to-br from-emerald-500/40 via-primary/20 to-emerald-400/30 opacity-100 blur-sm"
              : focused
              ? "bg-gradient-to-br from-primary/30 via-primary/10 to-primary/20 opacity-100 blur-sm"
              : "opacity-0"
          }`}
        />

        <Card className="relative border-primary/20 overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-0.5 transition-all duration-500 ${
              sent
                ? "bg-gradient-to-r from-emerald-400 via-primary to-emerald-400 opacity-100"
                : busy
                ? "bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse opacity-100"
                : "opacity-0"
            }`}
          />

          <CardHeader className="space-y-3 text-center pb-2">
            <div
              className={`mx-auto flex size-12 items-center justify-center rounded-xl transition-all duration-500 ${
                sent
                  ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {sent ? (
                <CheckCircle2 className="size-6 animate-in zoom-in-50 duration-300" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              )}
            </div>

            <div className="transition-all duration-300">
              <CardTitle className="text-2xl">
                {sent ? "Email sent!" : "Forgot password?"}
              </CardTitle>
              <CardDescription className="mt-1.5">
                {sent
                  ? `Reset link delivered to ${email}`
                  : "No worries — we'll send you reset instructions"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 pt-4">
            {!sent ? (
              <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
                <div className="grid gap-2">
                  <Label htmlFor="fp-email" className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    Email address
                  </Label>
                  <div className="relative">
                    <Input
                      id="fp-email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      onFocus={() => setFocused(true)}
                      onBlur={() => { setFocused(false); setTouched(true); }}
                      required
                      autoFocus
                      autoComplete="email"
                      className={`pr-10 transition-all duration-200 ${
                        showEmailError
                          ? "border-destructive/70 focus-visible:ring-destructive/30"
                          : valid && touched
                          ? "border-emerald-500/50 focus-visible:ring-emerald-500/20"
                          : ""
                      }`}
                    />
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200">
                      {valid && email.length > 0 && (
                        <CheckCircle2 className="size-4 text-emerald-500 animate-in zoom-in-50 duration-200" />
                      )}
                    </div>
                  </div>
                  <div className={`overflow-hidden transition-all duration-200 ${showEmailError ? "max-h-6 opacity-100" : "max-h-0 opacity-0"}`}>
                    <p className="text-xs text-destructive">Please enter a valid email address</p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-sm text-destructive animate-in slide-in-from-top-1 duration-200">
                    <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className={`w-full gap-2 transition-all duration-200 ${
                    valid && !busy ? "shadow-md shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01]" : ""
                  }`}
                  disabled={busy || !valid}
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Sending{dots}</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Send reset link
                    </>
                  )}
                </Button>

                <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  <span className="flex items-center gap-1 shrink-0">
                    <ShieldCheck className="size-3" />
                    Secure & encrypted
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </form>
            ) : (
              <div className="grid gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-400">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 text-center">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    If an account exists for{" "}
                    <span className="font-semibold text-foreground break-all">{email}</span>
                    , you'll receive the link shortly. Also check your spam folder.
                  </p>
                </div>

                {resetUrl ? (
                  <Button asChild className="w-full gap-2 shadow-md shadow-primary/20 hover:scale-[1.01] transition-transform">
                    <a href={resetUrl}>
                      <ShieldCheck className="size-4" />
                      Continue to new password
                    </a>
                  </Button>
                ) : (
                  <Button asChild className="w-full gap-2 shadow-md shadow-primary/20 hover:scale-[1.01] transition-transform">
                    <Link to="/update-password">
                      <ShieldCheck className="size-4" />
                      Continue to new password
                    </Link>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground hover:text-foreground"
                  onClick={handleReset}
                >
                  <RotateCcw className="size-3.5" />
                  Try a different email
                </Button>
              </div>
            )}

            <p className="flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
              <ArrowLeft className="size-3.5" />
              <Link to="/login" className="text-primary hover:underline transition-colors">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ForgotPassword;
