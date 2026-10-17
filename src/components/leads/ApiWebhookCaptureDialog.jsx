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
  ShieldCheck,
  AlertCircle,
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
import { Card, CardContent } from "../ui/card";
import { useToast } from "../ui/toast";
import { leadApi } from "../../lib/api";

const EMPTY_CONFIG = {
  apiKey: "",
  apiKeyMasked: "",
  apiKeyConfigured: false,
  keyStoredAsHash: false,
  endpoint: "/api/leads",
  webhookEndpoint: "/api/leads/webhook",
  organizationId: null,
  publicBaseUrl: "",
  deployedBaseUrl: "",
  maxBatch: 5000,
  devProxy: "",
};

export default function ApiWebhookCaptureDialog({ open, onOpenChange, onSuccess }) {
  const [activeTab, setActiveTab] = useState("endpoints");
  const [codeLang, setCodeLang] = useState("curl");
  const [copiedId, setCopiedId] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [apiConfig, setApiConfig] = useState(EMPTY_CONFIG);
  const [health, setHealth] = useState({ state: "checking", detail: "" });
  const [rotating, setRotating] = useState(false);
  const [testPayload, setTestPayload] = useState({
    email: "claire.redfield@capture-sim.example",
    name: "Claire Redfield",
    company: "Terrasave Global",
    phone: "+14155550192",
    priority: 85,
    tags: "inbound_api, enterprise_tier",
    updateExisting: true,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { success, error: toastError } = useToast();

  const restUrl = apiConfig.publicBaseUrl
    ? `${apiConfig.publicBaseUrl}${apiConfig.endpoint || "/api/leads"}`
    : "";
  const webhookUrl = apiConfig.publicBaseUrl
    ? `${apiConfig.publicBaseUrl}${apiConfig.webhookEndpoint || "/api/leads/webhook"}`
    : "";
  const secretForCopy = apiConfig.apiKey || "";
  const maskedKey = apiConfig.apiKeyMasked || (secretForCopy ? "••••••••••••" : "Not configured");

  useEffect(() => {
    if (!open) return;
    loadConfig();
  }, [open]);

  const loadConfig = async () => {
    setHealth({ state: "checking", detail: "Checking ingestion health" });
    try {
      const res = await leadApi.getApiConfig();
      const config = { ...EMPTY_CONFIG, ...(res.data || {}) };
      setApiConfig(config);
      await checkHealth(config.publicBaseUrl);
    } catch (err) {
      setHealth({ state: "offline", detail: err.message || "Could not load capture configuration" });
    }
  };

  const checkHealth = async (baseUrl) => {
    if (!baseUrl) {
      setHealth({ state: "offline", detail: "Public API URL is not configured" });
      return;
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (!response.ok) {
        setHealth({ state: "offline", detail: `Health check returned HTTP ${response.status}` });
        return;
      }
      setHealth({ state: "live", detail: "Backend ingestion endpoint is reachable" });
    } catch {
      setHealth({ state: "offline", detail: "Backend health check failed" });
    }
  };

  const copyToClipboard = async (text, id) => {
    if (!text) {
      toastError("Nothing to copy", "The value is not available yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? "" : current)), 2000);
      success("Copied", "Copied to clipboard");
    } catch {
      toastError("Copy failed", "Clipboard access was denied");
    }
  };

  const rotateKey = async () => {
    if (!window.confirm("Rotate the lead API key? Existing webhook integrations must switch to the new key.")) return;
    setRotating(true);
    try {
      const res = await leadApi.rotateApiKey();
      const next = res.data || {};
      setApiConfig((current) => ({
        ...current,
        apiKey: next.apiKey || "",
        apiKeyMasked: next.apiKeyMasked || next.apiKeyPrefix || "",
        apiKeyPrefix: next.apiKeyPrefix,
        keyStoredAsHash: true,
        apiKeyConfigured: true,
        rotatedAt: next.rotatedAt,
      }));
      setShowKey(true);
      success("API key rotated", "Copy the new key now. It is stored as a hash and will not be shown again.");
    } catch (err) {
      toastError("Rotation failed", err.message);
    } finally {
      setRotating(false);
    }
  };

  const postIngest = async (url, body, headers = {}) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  };

  const handleTestIngest = async (event) => {
    event.preventDefault();
    if (!restUrl || !secretForCopy) {
      toastError("Missing credentials", "Load a public URL and an API key before sending a test lead");
      return;
    }
    setTesting(true);
    setTestResult(null);
    const checks = [];
    try {
      const missing = await postIngest(restUrl, { email: `missing-key-${Date.now()}@capture-sim.example` });
      checks.push({
        name: "Missing API key",
        pass: missing.response.status === 401,
        detail: `HTTP ${missing.response.status}`,
      });

      const invalid = await postIngest(
        restUrl,
        { email: "not-an-email", name: "Invalid" },
        { "x-api-key": secretForCopy }
      );
      checks.push({
        name: "Invalid email",
        pass: invalid.response.status === 400,
        detail: invalid.payload.error || `HTTP ${invalid.response.status}`,
      });

      const payload = {
        email: testPayload.email,
        name: testPayload.name,
        company: testPayload.company,
        phone: testPayload.phone,
        priority: Number(testPayload.priority) || 50,
        tags: String(testPayload.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
        updateExisting: false,
        consentEmail: true,
      };
      const created = await postIngest(restUrl, payload, { "x-api-key": secretForCopy });
      checks.push({
        name: "Authenticated ingestion",
        pass: created.response.status === 201 || created.response.status === 200,
        detail: created.payload.data?.status || created.payload.error || `HTTP ${created.response.status}`,
      });

      const duplicate = await postIngest(restUrl, payload, { "x-api-key": secretForCopy });
      checks.push({
        name: "Duplicate email",
        pass: duplicate.response.status === 200 && duplicate.payload.data?.status === "skipped",
        detail: duplicate.payload.data?.status || duplicate.payload.error || `HTTP ${duplicate.response.status}`,
      });

      setTestResult({
        status: checks.every((check) => check.pass) ? "success" : "error",
        httpStatus: created.response.status,
        data: created.payload.data || created.payload,
        checks,
      });
      if (created.response.ok && onSuccess) onSuccess();
      if (checks.every((check) => check.pass)) {
        success("Checks passed", "Authentication, validation, deduplication, and ingestion responded as expected");
      } else {
        toastError("Some checks failed", "Review the response panel for the failing step");
      }
    } catch (err) {
      setTestResult({ status: "error", error: err.message || "Failed to reach the ingestion endpoint", checks });
      toastError("Ingestion failed", err.message);
    } finally {
      setTesting(false);
    }
  };

  const sampleLead = `{
    "email": "sarah.connor@cyberdyne.example",
    "name": "Sarah Connor",
    "company": "Cyberdyne Systems",
    "phone": "+14155550144",
    "priority": 85,
    "tags": ["inbound_web", "enterprise"],
    "consentEmail": true,
    "updateExisting": true
  }`;

  const keyHeader = secretForCopy || "YOUR_API_KEY";
  const curlSnippet = `curl -X POST "${restUrl || "https://your-api-host/api/leads"}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${keyHeader}" \\
  -d '${sampleLead.replace(/\n/g, "\n  ")}'`;

  const batchSnippet = `{
  "updateExisting": false,
  "leads": [
    { "email": "ada@acme.example", "name": "Ada Lovelace", "consentEmail": true },
    { "email": "grace@acme.example", "name": "Grace Hopper", "phone": "+14155550100" }
  ]
}`;

  const jsSnippet = `const response = await fetch("${restUrl || "https://your-api-host/api/leads"}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${keyHeader}",
  },
  body: JSON.stringify({
    email: "sarah.connor@cyberdyne.example",
    name: "Sarah Connor",
    company: "Cyberdyne Systems",
    phone: "+14155550144",
    priority: 85,
    tags: ["inbound_web", "enterprise"],
    consentEmail: true,
    updateExisting: true,
  }),
});`;

  const pythonSnippet = `import requests

requests.post(
    "${restUrl || "https://your-api-host/api/leads"}",
    headers={"Content-Type": "application/json", "x-api-key": "${keyHeader}"},
    json={
        "email": "sarah.connor@cyberdyne.example",
        "name": "Sarah Connor",
        "company": "Cyberdyne Systems",
        "phone": "+14155550144",
        "priority": 85,
        "consentEmail": True,
        "updateExisting": True,
    },
)`;

  const snippetFor = (lang) => {
    if (lang === "curl") return curlSnippet;
    if (lang === "js") return jsSnippet;
    if (lang === "python") return pythonSnippet;
    return `${sampleLead}\n\nBatch:\n${batchSnippet}`;
  };

  const healthBadge = health.state === "live"
    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
    : health.state === "checking"
    ? "bg-slate-50 text-slate-600 border-slate-300"
    : "bg-rose-50 text-rose-700 border-rose-300";

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
                <Badge variant="outline" className={`text-[10px] ${healthBadge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1 ${health.state === "live" ? "bg-emerald-500 animate-pulse" : health.state === "checking" ? "bg-slate-400" : "bg-rose-500"}`} />
                  {health.state === "live" ? "Ingestion reachable" : health.state === "checking" ? "Checking" : "Ingestion offline"}
                </Badge>
              </div>
              <DialogDescription>
                {health.detail || "Capture leads from forms and backend services with an API key bound to this organization."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b pb-2 text-xs">
          <Button size="sm" variant={activeTab === "endpoints" ? "default" : "ghost"} onClick={() => setActiveTab("endpoints")} className="h-8">
            <Key className="w-3.5 h-3.5 mr-1.5" /> Endpoints & Auth
          </Button>
          <Button size="sm" variant={activeTab === "snippets" ? "default" : "ghost"} onClick={() => setActiveTab("snippets")} className="h-8">
            <Code className="w-3.5 h-3.5 mr-1.5" /> Code Samples
          </Button>
          <Button size="sm" variant={activeTab === "tester" ? "default" : "ghost"} onClick={() => setActiveTab("tester")} className="h-8">
            <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Live Webhook Simulator
          </Button>
        </div>

        {activeTab === "endpoints" && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-semibold">REST Ingestion Endpoint (POST)</Label>
                <Badge variant="outline" className="text-[10px]">JSON Payload</Badge>
              </div>
              <div className="flex gap-2">
                <Input readOnly value={restUrl || "Loading public endpoint…"} className="font-mono text-xs bg-muted/50" />
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(restUrl, "rest")} aria-label="Copy REST endpoint">
                  {copiedId === "rest" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Accepts one lead object or a batch of up to {apiConfig.maxBatch || 5000} leads.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-semibold">Webhook Ingestion Endpoint (POST)</Label>
                <Badge variant="outline" className="text-[10px]">Zapier / Make / Form Hook</Badge>
              </div>
              <div className="flex gap-2">
                <Input readOnly value={webhookUrl || "Loading public endpoint…"} className="font-mono text-xs bg-muted/50" />
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(webhookUrl, "webhook")} aria-label="Copy webhook endpoint">
                  {copiedId === "webhook" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-semibold">Authentication Header (x-api-key)</Label>
                <Badge variant="outline" className="text-[10px] text-purple-700 bg-purple-50 border-purple-200">Header Auth</Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  type={showKey && secretForCopy ? "text" : "password"}
                  value={showKey && secretForCopy ? secretForCopy : maskedKey}
                  className="font-mono text-xs bg-muted/50"
                />
                <Button variant="outline" size="sm" onClick={() => setShowKey((current) => !current)} disabled={!secretForCopy} aria-label="Show API key">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(secretForCopy, "key")} disabled={!secretForCopy} aria-label="Copy API key">
                  {copiedId === "key" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={rotateKey} disabled={rotating} aria-label="Rotate API key">
                  <RefreshCw className={`w-4 h-4 ${rotating ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Send <code>x-api-key</code> on every POST. The key is checked on the server and is not placed in the query string.
                {apiConfig.keyStoredAsHash && !secretForCopy ? " The current key is stored as a hash. Rotate it to reveal a new one." : ""}
              </p>
            </div>

            <div className="p-3 rounded-lg border bg-muted/30 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold">Organization</span>
                <p className="text-muted-foreground text-[11px]">
                  This key writes leads to organization #{apiConfig.organizationId ?? "—"}. A different <code>x-organization-id</code> is rejected.
                </p>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                Org #{apiConfig.organizationId ?? "—"}
              </Badge>
            </div>

            <Card className="border border-purple-500/30 bg-purple-50/10">
              <CardContent className="p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-purple-900 dark:text-purple-300">
                    Deduplication, consent, and suppression
                  </span>
                  <p className="text-muted-foreground">
                    Leads are matched by email, phone, and company domain. <code>updateExisting: true</code> refreshes profile fields and leaves lifecycle, consent, DNC, and cadence in place. Ingestion does not grant permission to email or call. Suppressed leads are stored as do-not-contact.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "snippets" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg text-xs">
                {["curl", "js", "python", "json"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                      codeLang === lang ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "js" ? "JavaScript" : lang === "json" ? "Examples" : lang}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(snippetFor(codeLang), "snippet")}>
                {copiedId === "snippet" ? <><Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Copied</> : <><Copy className="w-3.5 h-3.5 mr-1" /> Copy Code</>}
              </Button>
            </div>
            <div className="relative rounded-lg bg-slate-950 p-4 text-slate-100 font-mono text-xs overflow-x-auto max-h-80 border border-slate-800">
              <pre>{snippetFor(codeLang)}</pre>
            </div>
          </div>
        )}

        {activeTab === "tester" && (
          <form onSubmit={handleTestIngest} className="space-y-4 py-2">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-300 block mb-0.5">Connection checks</span>
              <p className="text-muted-foreground">
                Sends a missing key, an invalid email, one consented lead, and a duplicate to {restUrl || "the public endpoint"}.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <Label>Email (Required)</Label>
                <Input required type="email" value={testPayload.email} onChange={(e) => setTestPayload({ ...testPayload, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input value={testPayload.name} onChange={(e) => setTestPayload({ ...testPayload, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Company Name</Label>
                <Input value={testPayload.company} onChange={(e) => setTestPayload({ ...testPayload, company: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Phone Number</Label>
                <Input value={testPayload.phone} onChange={(e) => setTestPayload({ ...testPayload, phone: e.target.value })} />
              </div>
            </div>
            <Button type="submit" disabled={testing || !secretForCopy} className="bg-purple-600 hover:bg-purple-700 text-white" size="sm">
              {testing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running checks...</> : <><Send className="w-4 h-4 mr-2" /> Run ingestion checks</>}
            </Button>
            {!secretForCopy && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Rotate the API key on the Endpoints tab to reveal a secret for this test.
              </p>
            )}
            {testResult && (
              <div className={`p-3 rounded-lg border text-xs font-mono overflow-x-auto max-h-48 ${testResult.status === "success" ? "bg-emerald-50/50 border-emerald-300" : "bg-rose-50/50 border-rose-300"}`}>
                <div className="font-bold pb-1 mb-1 border-b border-current/20">
                  {testResult.status === "success" ? "Checks passed" : "Check failure"}
                </div>
                {Array.isArray(testResult.checks) && (
                  <ul className="mb-2 space-y-1">
                    {testResult.checks.map((check) => (
                      <li key={check.name}>{check.pass ? "pass" : "fail"} — {check.name}: {check.detail}</li>
                    ))}
                  </ul>
                )}
                <pre>{JSON.stringify(testResult.data || testResult.error, null, 2)}</pre>
              </div>
            )}
          </form>
        )}

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
