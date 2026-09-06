import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import AnimatedParticles from "../components/AnimatedParticles";
import { authApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { getToken } from "../lib/auth";

function UpdatePassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { authed, applySession, user } = useAuth();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return;
    setError("");
    setBusy(true);
    try {
      if (token && email) {
        await authApi.completeReset({
          email,
          token,
          password,
          confirmPassword: confirm,
        });
      } else if (authed) {
        const result = await authApi.updateUser({ password });
        applySession(getToken(), result.user || user);
      } else {
        setError("Open the reset link from your email, or sign in first.");
        setBusy(false);
        return;
      }
      navigate("/login");
    } catch (err) {
      setError(err.message || "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      <AnimatedParticles />
      <Card className="relative z-10 w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Choose a strong password for your NOVA account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {password && confirm && password !== confirm && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={!password || password !== confirm || busy}>
              {busy ? "Updating..." : "Update password"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default UpdatePassword;
