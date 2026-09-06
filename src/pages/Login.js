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
import { Eye, EyeOff } from "lucide-react";

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
  const toast = useToast();
  const credentialsReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length > 0;

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
      <Card className="relative z-10 w-full max-w-md border-primary/20">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to NOVA Email Marketer</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <GoogleSignInButton disabled={busy} />
          <AuthDivider />
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" >Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>
            {credentialsReady ? <Recaptcha ref={recaptchaRef} onToken={setCaptchaToken} /> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Create an account
              </Link>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                Back to home
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
