import React, { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { useToast } from "../../components/ui/toast";

export default function AseSettings() {
  const [apiKey, setApiKey] = useState("nova_live_ase_984f7a213e8d910");
  const [operatingMode, setOperatingMode] = useState("FULLY_AUTOMATED");
  const { success } = useToast();

  const handleCopyEndpoint = (text) => {
    navigator.clipboard.writeText(text);
    success("Copied", "Copied to clipboard");
  };

  const handleRegenerate = () => {
    if (!window.confirm("Regenerate API Key? Existing integrations will need updating.")) return;
    setApiKey(`nova_live_ase_${Math.random().toString(36).substring(2, 12)}`);
    success("Regenerated", "New API key generated.");
  };

  const origin = window.location.origin;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ASE System Settings</h1>
        <p className="text-muted-foreground mt-1">
          Execution channel connectors, API lead capture credentials, and automation operating modes.
        </p>
      </div>

      {/* Operating Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Autonomous Engine Operating Mode</CardTitle>
          <CardDescription>
            Controls the autonomy level of outbound executions across Email and Voice channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div
              onClick={() => setOperatingMode("FULLY_AUTOMATED")}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                operatingMode === "FULLY_AUTOMATED"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="font-semibold text-sm">FULLY_AUTOMATED</div>
              <p className="text-xs text-muted-foreground mt-1">
                Engine automatically executes allowed actions per cadence rules without manual intervention.
              </p>
            </div>

            <div
              onClick={() => setOperatingMode("AI_RECOMMENDED")}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                operatingMode === "AI_RECOMMENDED"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="font-semibold text-sm">AI_RECOMMENDED</div>
              <p className="text-xs text-muted-foreground mt-1">
                Engine evaluates cadence and queues actions for human sales rep approval.
              </p>
            </div>

            <div
              onClick={() => setOperatingMode("HUMAN_ESCALATION")}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                operatingMode === "HUMAN_ESCALATION"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="font-semibold text-sm">HUMAN_ESCALATION</div>
              <p className="text-xs text-muted-foreground mt-1">
                Outbound pauses; all interested prospects immediately routed to human callback queues.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Adapters Status */}
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

      {/* Inbound API & Webhook Integration */}
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
                value={`${origin}/api/leads`}
                className="font-mono text-xs bg-muted"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyEndpoint(`${origin}/api/leads`)}
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
                value={apiKey}
                className="font-mono text-xs bg-muted"
              />
              <Button variant="outline" size="sm" onClick={() => handleCopyEndpoint(apiKey)}>
                <Copy className="w-4 h-4 mr-1.5" /> Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRegenerate}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pass as header <code>x-api-key: {apiKey.slice(0, 10)}...</code> with POST requests.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
