import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import AnimatedParticles from "../components/AnimatedParticles";
import { authApi } from "../lib/api";

function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      <AnimatedParticles />
      <Card className="relative z-10 w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <CardTitle>Reset password</CardTitle>
          <CardDescription>We will email you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="text-foreground">{email}</span>, a reset link is on its way.
              </p>
              {resetUrl ? (
                <Button asChild className="w-full">
                  <a href={resetUrl}>Continue to new password</a>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to="/update-password">Continue to new password</Link>
                </Button>
              )}
            </div>
          ) : (
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
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ForgotPassword;
