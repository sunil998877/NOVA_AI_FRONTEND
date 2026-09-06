import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
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

function Signup() {
  const navigate = useNavigate();
  const { authed, applySession } = useAuth();
  const recaptchaRef = useRef(null);
  const [form, setForm] = useState({
    fullName: "",
    organization: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toast = useToast();
  const credentialsReady =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.password.length >= 8 &&
    form.confirmPassword.length > 0;

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
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const token = captchaToken || recaptchaRef.current?.getToken() || "";
    if (!token) {
      setError("Please tick I'm not a robot");
      return;
    }
    setBusy(true);
    try {
      const result = await authApi.signup({
        fullName: form.fullName,
        organization: form.organization,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        captchaToken: token,
      });
      applySession(result.token, result.user);
      toast.success("Account created!", "Welcome to NOVA Email Marketer.");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Sign up failed", err.message || "Could not create account");
      setError(err.message || "Could not create account");
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
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start sending campaigns with NOVA</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <GoogleSignInButton disabled={busy} />
          <AuthDivider />
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Sunil Kumar"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                placeholder="EvokeAI"
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
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
            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>
            {credentialsReady ? <Recaptcha ref={recaptchaRef} onToken={setCaptchaToken} /> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
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

export default Signup;
