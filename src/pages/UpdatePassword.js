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
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);


  const canReset = !!(token && email) || authed;

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
          {!canReset ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                This link is invalid or has expired. Request a new reset link from the forgot password page.
              </p>
              <Button asChild className="w-full">
                <Link to="/forgot-password">Request new link</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  suffix={
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="p-1 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  suffix={
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="p-1 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default UpdatePassword;
