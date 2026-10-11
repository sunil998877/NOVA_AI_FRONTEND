import React, { useState, useEffect } from "react";
import {
  Webhook,
  Key,
  Copy,
  Check,
  Code,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "../ui/toast";
import { leadApi } from "../../lib/api";

export default function ApiWebhookCaptureDialog({ open, onOpenChange, onSuccess }) {
  const [activeTab, setActiveTab] = useState("endpoints"); // 'endpoints' | 'snippets' | 'tester'
  const [codeLang, setCodeLang] = useState("curl"); // 'curl' | 'js' | 'python' | 'json'
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiConfig, setApiConfig] = useState({
    apiKey: "ase-lead-key-nova-2026",
    endpoint: "/api/leads",
    webhookEndpoint: "/api/leads/webhook",
    organizationId: 1,
  });

  // Simulator state
  const [testPayload, setTestPayload] = useState({
    email: "claire.redfield@umbrella-corp.com",
    name: "Claire Redfield",
    company: "Terrasave Global",
    phone: "+1-415-555-0192",
    priority: 85,
    tags: "inbound_api, enterprise_tier",
    updateExisting: true,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const { success, error: toastError } = useToast();
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
  const apiEndpointUrl = `${origin}${apiConfig.endpoint || "/api/leads"}`;
  const webhookUrl = `${origin}${apiConfig.webhookEndpoint || "/api/leads/webhook"}`;

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = async () => {
    try {
      const res = await leadApi.getApiConfig();
      if (res.data) setApiConfig(res.data);
    } catch (_) {
      // Fallback defaults
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === "snippet") {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
    success("Copied", "Copied to clipboard");
  };

  const handleTestIngest = async (e) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    try {
      const payload = {
        ...testPayload,
        tags: typeof testPayload.tags === "string"
          ? testPayload.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : testPayload.tags,
        priority: Number(testPayload.priority) || 50,
      };

      const res = await leadApi.create(payload);
      setTestResult({
        status: "success",
        httpStatus: 201,
        data: res.data,
      });
      success("Lead Ingested", `Successfully captured lead: ${payload.email}`);
      if (onSuccess) onSuccess();
    } catch (err) {
      setTestResult({
        status: "error",
        error: err.message || "Failed to ingest lead",
      });
      toastError("Ingestion Failed", err.message);
    } finally {
      setTesting(false);
    }
  };

  const curlSnippet = `curl -X POST "${apiEndpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiConfig.apiKey}" \\
  -H "x-organization-id: ${apiConfig.organizationId}" \\
  -d '{
    "email": "sarah.connor@cyberdyne.io",
    "name": "Sarah Connor",
    "company": "Cyberdyne Systems",
    "phone": "+1-415-555-0144",
    "priority": 85,
    "tags": ["inbound_web", "enterprise"],
    "updateExisting": true
  }'`;

  const jsSnippet = `// Node.js (fetch or axios) or Browser
const response = await fetch("${apiEndpointUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${apiConfig.apiKey}",
    "x-organization-id": "${apiConfig.organizationId}",
  },
  body: JSON.stringify({
    email: "sarah.connor@cyberdyne.io",
    name: "Sarah Connor",
    company: "Cyberdyne Systems",
    phone: "+1-415-555-0144",
    priority: 85,
    tags: ["inbound_web", "enterprise"],
    updateExisting: true,
  }),
});

const data = await response.json();
console.log("Ingested lead:", data);`;

  const pythonSnippet = `import requests

url = "${apiEndpointUrl}"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${apiConfig.apiKey}",
    "x-organization-id": "${apiConfig.organizationId}",
}
payload = {
    "email": "sarah.connor@cyberdyne.io",
    "name": "Sarah Connor",
    "company": "Cyberdyne Systems",
    "phone": "+1-415-555-0144",
    "priority": 85,
    "tags": ["inbound_web", "enterprise"],
    "updateExisting": True,
}

res = requests.post(url, json=payload, headers=headers)
print("Status:", res.status_code, res.json())`;

  const jsonSchemaSnippet = `{
  "email": "string (required, e.g. 'lead@acme.com')",
  "name": "string (optional, e.g. 'Jane Doe')",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "company": "string (optional, e.g. 'Acme Corp')",
  "phone": "string (optional, e.g. '+14155550199')",
  "whatsapp_number": "string (optional)",
  "priority": "number (optional, 1-100, default: 50)",
  "tags": ["array of strings", "e.g. ['inbound', 'demo']"],
  "source": "string (default: 'API')",
  "updateExisting": "boolean (default: false — set true to update on match)",
  "segment_attributes": { "industry": "SaaS", "budget": "50k" },
  "metadata": { "formId": "landing_page_hero" }
}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
              <Webhook className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle>Real-Time API & Webhook Lead Capture</DialogTitle>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Live Ingestion
                </Badge>
              </div>
              <DialogDescription>
                Capture leads in real-time from web forms, landing pages, or backend services via authenticated REST API.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b pb-2 text-xs">
          <Button
            size="sm"
            variant={activeTab === "endpoints" ? "default" : "ghost"}
            onClick={() => setActiveTab("endpoints")}
            className="h-8"
          >
            <Key className="w-3.5 h-3.5 mr-1.5" /> Endpoints & Auth
          </Button>
          <Button
            size="sm"
            variant={activeTab === "snippets" ? "default" : "ghost"}
            onClick={() => setActiveTab("snippets")}
            className="h-8"
          >
            <Code className="w-3.5 h-3.5 mr-1.5" /> Code Samples
          </Button>
          <Button
            size="sm"
            variant={activeTab === "tester" ? "default" : "ghost"}
            onClick={() => setActiveTab("tester")}
            className="h-8"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Live Webhook Simulator
          </Button>
        </div>

        {/* TAB 1: ENDPOINTS & AUTH */}
        {activeTab === "endpoints" && (
          <div className="space-y-4 py-2">
            {/* Primary Endpoint */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-semibold">REST Ingestion Endpoint (POST)</Label>
                <Badge variant="outline" className="text-[10px]">JSON Payload</Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={apiEndpointUrl}
                  className="font-mono text-xs bg-muted/50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(apiEndpointUrl, "url")}
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Accepts a single lead object or a batch array of leads (up to 5,000 leads per request).
              </p>
            </div>

            {/* Webhook Endpoint */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-semibold">Webhook Ingestion Endpoint (POST)</Label>
                <Badge variant="outline" className="text-[10px]">Zapier / Make / Form Hook</Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={webhookUrl}
                  className="font-mono text-xs bg-muted/50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(webhookUrl, "url")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-semibold">Authentication Header (x-api-key)</Label>
                <Badge variant="outline" className="text-[10px] text-purple-700 bg-purple-50 border-purple-200">
                  Header Auth
                </Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  type={showKey ? "text" : "password"}
                  value={apiConfig.apiKey}
                  className="font-mono text-xs bg-muted/50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(apiConfig.apiKey, "key")}
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Pass as header: <code>x-api-key: {showKey ? apiConfig.apiKey : "••••••••••••"}</code> with all POST requests.
              </p>
            </div>

            {/* Organization Header */}
            <div className="p-3 rounded-lg border bg-muted/30 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold">Tenant Isolation Header</span>
                <p className="text-muted-foreground text-[11px]">
                  Send <code>x-organization-id: {apiConfig.organizationId}</code> to scope leads to this workspace.
                </p>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                Org #{apiConfig.organizationId}
              </Badge>
            </div>

            <Card className="border border-purple-500/30 bg-purple-50/10">
              <CardContent className="p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-purple-900 dark:text-purple-300">
                    Real-time Deduplication & Suppression Pipeline
                  </span>
                  <p className="text-muted-foreground">
                    Incoming leads are immediately deduplicated against existing records (by email, phone, and company domain). If a match is found and <code>updateExisting: true</code> is passed, attributes are refreshed without breaking active multi-channel cadences.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: CODE SAMPLES */}
        {activeTab === "snippets" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg text-xs">
                {["curl", "js", "python", "json"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                      codeLang === lang
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "js" ? "JavaScript" : lang === "json" ? "Schema JSON" : lang}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const content =
                    codeLang === "curl"
                      ? curlSnippet
                      : codeLang === "js"
                      ? jsSnippet
                      : codeLang === "python"
                      ? pythonSnippet
                      : jsonSchemaSnippet;
                  copyToClipboard(content, "snippet");
                }}
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Code
                  </>
                )}
              </Button>
            </div>

            <div className="relative rounded-lg bg-slate-950 p-4 text-slate-100 font-mono text-xs overflow-x-auto max-h-80 border border-slate-800">
              <pre>
                {codeLang === "curl" && curlSnippet}
                {codeLang === "js" && jsSnippet}
                {codeLang === "python" && pythonSnippet}
                {codeLang === "json" && jsonSchemaSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE SIMULATOR */}
        {activeTab === "tester" && (
          <form onSubmit={handleTestIngest} className="space-y-4 py-2">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-300 block mb-0.5">
                Interactive API Simulator
              </span>
              <p className="text-muted-foreground">
                Send a real test payload to verify live ingestion into the database right now.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <Label>Email (Required)</Label>
                <Input
                  required
                  type="email"
                  value={testPayload.email}
                  onChange={(e) => setTestPayload({ ...testPayload, email: e.target.value })}
                  placeholder="jane.doe@company.com"
                />
              </div>

              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input
                  value={testPayload.name}
                  onChange={(e) => setTestPayload({ ...testPayload, name: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-1">
                <Label>Company Name</Label>
                <Input
                  value={testPayload.company}
                  onChange={(e) => setTestPayload({ ...testPayload, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-1">
                <Label>Phone Number</Label>
                <Input
                  value={testPayload.phone}
                  onChange={(e) => setTestPayload({ ...testPayload, phone: e.target.value })}
                  placeholder="+1-555-0199"
                />
              </div>

              <div className="space-y-1">
                <Label>Priority (1 - 100)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={testPayload.priority}
                  onChange={(e) => setTestPayload({ ...testPayload, priority: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={testPayload.tags}
                  onChange={(e) => setTestPayload({ ...testPayload, tags: e.target.value })}
                  placeholder="inbound_api, enterprise"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="submit"
                disabled={testing}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Ingesting Lead...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Ingest Test Lead Now
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono overflow-x-auto max-h-48 ${
                  testResult.status === "success"
                    ? "bg-emerald-50/50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "bg-rose-50/50 border-rose-300 text-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                }`}
              >
                <div className="flex items-center justify-between font-bold pb-1 mb-1 border-b border-current/20">
                  <span>
                    {testResult.status === "success" ? "✓ HTTP 201 Created / Updated" : "✕ Ingestion Error"}
                  </span>
                  <span>Response Payload</span>
                </div>
                <pre>{JSON.stringify(testResult.data || testResult.error, null, 2)}</pre>
              </div>
            )}
          </form>
        )}

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
