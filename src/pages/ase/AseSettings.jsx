import React, { useState, useEffect } from "react";
import {
  Key,
  Webhook,
  Radio,
  Sliders,
  CheckCircle2,
  Copy,
  RefreshCw,
  Mail,
  Phone,
  Brain,
  Cpu,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { useToast } from "../../components/ui/toast";
import { aseService } from "../../services/ase.service";
import { leadApi } from "../../lib/api";
import OperatingModePicker from "../../components/ase/OperatingModePicker";

export default function AseSettings() {
  const [apiKey, setApiKey] = useState("");
  const [apiKeyMasked, setApiKeyMasked] = useState("");
  const [captureBaseUrl, setCaptureBaseUrl] = useState("");
  const [operatingMode, setOperatingMode] = useState("FULLY_AUTOMATED");
  const [modeLoading, setModeLoading] = useState(false);
  const [brainStatus, setBrainStatus] = useState(null);
  const [brainLoading, setBrainLoading] = useState(false);
  const { success, error: toastError } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SALESPERSON");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState("");

  useEffect(() => {
    fetchBrainStatus();
    fetchOperatingMode();
    leadApi.getApiConfig().then((res) => {
      const config = res?.data || {};
      setCaptureBaseUrl(config.publicBaseUrl || "");
      setApiKey(config.apiKey || "");
      setApiKeyMasked(config.apiKeyMasked || config.apiKeyPrefix || "");
    }).catch(() => {});
  }, []);

  async function fetchBrainStatus() {
    try {
      const res = await aseService.getBrainStatus();
      if (res?.status) {
        setBrainStatus(res.status);
      }
    } catch (_) {}
  }

  async function fetchOperatingMode() {
    try {
      const res = await aseService.getOperatingMode();
      if (res?.mode) setOperatingMode(res.mode);
    } catch (_) {}
  }

  const handleOperatingModeChange = async (mode) => {
    if (mode === operatingMode || modeLoading) return;
    try {
      setModeLoading(true);
      const res = await aseService.setOperatingMode(mode);
      if (res?.success || res?.mode) {
        setOperatingMode(res.mode || mode);
        success("Operating mode updated", `Outreach now runs as ${res.mode || mode}`);
      }
    } catch (err) {
      toastError("Error", err.message || "Failed to update operating mode");
    } finally {
      setModeLoading(false);
    }
  };

  const handleBrainModeChange = async (mode) => {
    try {
      setBrainLoading(true);
      const res = await aseService.setBrainMode(mode);
      if (res?.success) {
        setBrainStatus((prev) => ({ ...prev, mode }));
        success("NOVA Brain Updated", `Operating mode changed to ${mode}`);
      }
    } catch (err) {
      toastError("Error", err.message || "Failed to update brain mode");
    } finally {
      setBrainLoading(false);
    }
  };

  const handleCopyEndpoint = (text) => {
    navigator.clipboard.writeText(text);
    success("Copied", "Copied to clipboard");
  };

  const handleRegenerate = async () => {
    if (!window.confirm("Rotate API key? Existing integrations must switch to the new key.")) return;
    try {
      const res = await leadApi.rotateApiKey();
      const next = res?.data || {};
      setApiKey(next.apiKey || "");
      setApiKeyMasked(next.apiKeyMasked || next.apiKeyPrefix || "");
      success("API key rotated", "Copy the new key now. It will not be shown again.");
    } catch (err) {
      toastError("Rotation failed", err.message);
    }
  };

  const captureEndpoint = captureBaseUrl ? `${captureBaseUrl}/api/leads` : "";

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteBusy(true);
    try {
      const data = await aseService.createInvite({ email: inviteEmail, role: inviteRole });
      setLastInviteUrl(data.inviteUrl || "");
      setInviteEmail("");
      success("Invite created", `Role ${data.role}. Copy the link before it expires.`);
    } catch (err) {
      toastError("Invite failed", err.message);
    } finally {
      setInviteBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ASE System Settings</h1>
        <p className="text-muted-foreground mt-1">
          Execution channel connectors, API lead capture credentials, and automation operating modes.
        </p>
      </div>

      <Card className="border-primary/40 bg-gradient-to-r from-primary/5 via-background to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>NOVA Brain — ML & ONNX Decision Engine</CardTitle>
                <CardDescription>
                  FastAPI serves the ONNX action model, with scikit-learn delay and conversion heads.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono border-primary/50 text-primary">
              v{brainStatus?.version || "1.2.0"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div
              onClick={() => !brainLoading && handleBrainModeChange("ACTIVE")}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                brainStatus?.mode === "ACTIVE"
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">ACTIVE</span>
                {brainStatus?.mode === "ACTIVE" && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ML-assisted decision making with deterministic safety, fatigue, and consent guardrails.
              </p>
            </div>

            <div
              onClick={() => !brainLoading && handleBrainModeChange("SHADOW")}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                brainStatus?.mode === "SHADOW"
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">SHADOW</span>
                {brainStatus?.mode === "SHADOW" && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Executes rule-based baseline while evaluating ML predictions silently for concurrence.
              </p>
            </div>

            <div
              onClick={() => !brainLoading && handleBrainModeChange("RULES_ONLY")}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                brainStatus?.mode === "RULES_ONLY"
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">RULES_ONLY</span>
                {brainStatus?.mode === "RULES_ONLY" && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pure deterministic business rules engine; ML inference is completely bypassed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-lg text-xs">
            <div>
              <span className="text-muted-foreground block">Inference Engine:</span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <Cpu className="w-3.5 h-3.5 text-primary" /> FastAPI + ONNX
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Model Accuracy:</span>
              <span className="font-semibold text-foreground block mt-0.5 font-mono">
                {brainStatus?.accuracy != null ? `${(brainStatus.accuracy * 100).toFixed(1)}%` : "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Total Samples:</span>
              <span className="font-semibold text-foreground block mt-0.5 font-mono">
                {brainStatus?.totalSamples ? brainStatus.totalSamples.toLocaleString() : "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Compliance Policy:</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Enforced
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autonomous Engine Operating Mode</CardTitle>
          <CardDescription>
            Controls the autonomy level of outbound executions across Email and Voice channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <OperatingModePicker
            value={operatingMode}
            disabled={modeLoading}
            onChange={handleOperatingModeChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Execution Channels</CardTitle>
          <CardDescription>
            Autonomous Sales Engine dispatches through existing communication adapters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded text-blue-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">NOVA Email Engine Adapter</h4>
                <p className="text-xs text-muted-foreground">Active via SMTP and n8n webhook routing</p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-600 border-emerald-300">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
            </Badge>
          </div>

          <div className="p-4 border rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded text-purple-600">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Calling Bots Autonomous Voice Adapter</h4>
                <p className="text-xs text-muted-foreground">Pluggable voice provider endpoint with disposition capture</p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-600 border-emerald-300">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inbound Lead Capture API</CardTitle>
          <CardDescription>
            Programmatically ingest leads into the Autonomous Sales Engine from your web forms or apps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground block">Public Ingestion Endpoint</span>
            <div className="flex gap-2">
              <Input
                readOnly
                value={captureEndpoint || "Loading public endpoint…"}
                className="font-mono text-xs bg-muted"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => captureEndpoint && handleCopyEndpoint(captureEndpoint)}
              >
                <Copy className="w-4 h-4 mr-1.5" /> Copy
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground block">API Key (x-api-key)</span>
            <div className="flex gap-2">
              <Input
                readOnly
                type="password"
                value={apiKey || apiKeyMasked}
                className="font-mono text-xs bg-muted"
              />
              <Button variant="outline" size="sm" onClick={() => apiKey && handleCopyEndpoint(apiKey)} disabled={!apiKey}>
                <Copy className="w-4 h-4 mr-1.5" /> Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRegenerate}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pass as header <code>x-api-key</code>. The organization is bound to this key on the server.
              {apiKey ? " Copy the key before leaving this page if you just rotated it." : " Rotate the key to reveal a new secret."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Invite teammate</CardTitle>
              <CardDescription>
                Teammates join this organization with a role. Salespeople cannot open Settings or Admin.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2 flex-1">
              <span className="text-xs font-medium text-muted-foreground block">Email</span>
              <Input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="rep@company.com"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground block">Role</span>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background min-w-[180px]"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="SALESPERSON">Salesperson</option>
                <option value="SALES_MANAGER">Sales Manager</option>
                <option value="CAMPAIGN_OPERATOR">Campaign Operator</option>
                <option value="ORG_ADMIN">Org Admin</option>
              </select>
            </div>
            <Button type="submit" disabled={inviteBusy}>
              {inviteBusy ? "Creating…" : "Create invite"}
            </Button>
          </form>
          {lastInviteUrl ? (
            <div className="mt-3 flex gap-2">
              <Input readOnly value={lastInviteUrl} className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => handleCopyEndpoint(lastInviteUrl)}>
                <Copy className="w-4 h-4 mr-1.5" /> Copy
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
