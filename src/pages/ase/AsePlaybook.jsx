import React, { useEffect, useState } from "react";
import { BookOpen, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { useToast } from "../../components/ui/toast";
import { aseService } from "../../services/ase.service";

const emptyContent = {
  brandName: "",
  companyName: "",
  companyDescription: "",
  productName: "",
  productDescription: "",
  features: "",
  targetIndustries: "",
  targetRoles: "",
  icp: "",
  painPoints: "",
  valuePropositions: "",
  pricing: "",
  offers: "",
  competitorPositioning: "",
  faqs: "",
  objections: "",
  demoLink: "",
  meetingLink: "",
  qualificationQuestions: "",
  preferredCta: "Would you be interested in learning more or arranging a brief conversation?",
  emailTone: "professional",
  language: "en",
  voicePersona: "",
  voiceIntroduction: "",
  voiceGuidelines: "Identify the company, ask if it is a good time, stay inside approved facts, and stop if the person declines.",
  senderName: "",
  contactEmail: "",
  contactPhone: "",
  neverClaim: "",
};

function listToText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return item;
      return item.q ? `${item.q} | ${item.a}` : `${item.objection || ""} | ${item.response || ""}`;
    }).filter((item) => String(item).replace("|", "").trim()).join("\n");
  }
  return value || "";
}

function toForm(content = {}) {
  return {
    ...emptyContent,
    ...content,
    features: listToText(content.features),
    targetIndustries: listToText(content.targetIndustries),
    targetRoles: listToText(content.targetRoles),
    painPoints: listToText(content.painPoints),
    valuePropositions: listToText(content.valuePropositions),
    qualificationQuestions: listToText(content.qualificationQuestions),
    neverClaim: listToText(content.neverClaim),
    faqs: listToText(content.faqs),
    objections: listToText(content.objections),
  };
}

function toPayload(form) {
  return {
    ...form,
    features: form.features,
    targetIndustries: form.targetIndustries,
    targetRoles: form.targetRoles,
    painPoints: form.painPoints,
    valuePropositions: form.valuePropositions,
    qualificationQuestions: form.qualificationQuestions,
    neverClaim: form.neverClaim,
    faqs: form.faqs,
    objections: form.objections,
  };
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function AsePlaybook() {
  const [form, setForm] = useState(emptyContent);
  const [status, setStatus] = useState("DRAFT");
  const [version, setVersion] = useState(0);
  const [validation, setValidation] = useState({ missing: [], warnings: [], canSendEmail: false, canCall: false });
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    aseService.getPlaybook().then((data) => {
      setForm(toForm(data?.content));
      setStatus(data?.status || "DRAFT");
      setVersion(data?.version || 0);
      if (data?.validation) setValidation(data.validation);
    }).catch(() => {});
  }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function persist(nextStatus) {
    setSaving(true);
    try {
      const data = await aseService.savePlaybook({ content: toPayload(form), status: nextStatus || status });
      setForm(toForm(data?.content));
      setStatus(data?.status || "DRAFT");
      setVersion(data?.version || version);
      if (data?.validation) setValidation(data.validation);
      success("Playbook saved", data?.status === "ACTIVE" ? "Email and voice now use this approved content." : "Draft saved. Activate when required fields are complete.");
    } catch (err) {
      toastError("Save failed", err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    try {
      const data = await aseService.previewPlaybook({ content: toPayload(form), type: "INITIAL" });
      setPreview(data);
      if (data?.validation) setValidation(data.validation);
    } catch (err) {
      toastError("Preview failed", err.message);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product & Sales Playbook</h1>
          <p className="text-muted-foreground mt-1">
            Approved company facts for NOVA emails and the AI voice agent. Missing details are flagged, never invented.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{status}</Badge>
          <Badge variant="outline">v{version || 0}</Badge>
        </div>
      </div>

      {(validation.missing?.length > 0 || validation.warnings?.length > 0) && (
        <Card className="border-amber-300/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Required before activation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {validation.missing?.length > 0 && <p>Missing: {validation.missing.join(", ")}</p>}
            {validation.warnings?.length > 0 && <p>Optional: {validation.warnings.join(", ")}</p>}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Company and product</CardTitle>
            <CardDescription>Only facts your organization approves for outreach.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Brand name"><Input value={form.brandName} onChange={(e) => setField("brandName", e.target.value)} /></Field>
            <Field label="Company name"><Input value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} /></Field>
            <Field label="Company description"><Textarea value={form.companyDescription} onChange={(e) => setField("companyDescription", e.target.value)} /></Field>
            <Field label="Product or service name"><Input value={form.productName} onChange={(e) => setField("productName", e.target.value)} /></Field>
            <Field label="Product description"><Textarea value={form.productDescription} onChange={(e) => setField("productDescription", e.target.value)} /></Field>
            <Field label="Sender name"><Input value={form.senderName} onChange={(e) => setField("senderName", e.target.value)} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audience and value</CardTitle>
            <CardDescription>One item per line. These fill email and voice variables.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Pain points"><Textarea value={form.painPoints} onChange={(e) => setField("painPoints", e.target.value)} /></Field>
            <Field label="Approved value propositions"><Textarea value={form.valuePropositions} onChange={(e) => setField("valuePropositions", e.target.value)} /></Field>
            <Field label="Target industries"><Textarea value={form.targetIndustries} onChange={(e) => setField("targetIndustries", e.target.value)} /></Field>
            <Field label="Target roles"><Textarea value={form.targetRoles} onChange={(e) => setField("targetRoles", e.target.value)} /></Field>
            <Field label="Preferred call to action"><Input value={form.preferredCta} onChange={(e) => setField("preferredCta", e.target.value)} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing, claims, and objections</CardTitle>
            <CardDescription>Leave pricing blank to block pricing emails. Use Question | Answer format.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Approved pricing"><Textarea value={form.pricing} onChange={(e) => setField("pricing", e.target.value)} /></Field>
            <Field label="Never claim"><Textarea value={form.neverClaim} onChange={(e) => setField("neverClaim", e.target.value)} placeholder="guaranteed results" /></Field>
            <Field label="FAQs"><Textarea value={form.faqs} onChange={(e) => setField("faqs", e.target.value)} placeholder="What do you sell? | Approved answer" /></Field>
            <Field label="Objections"><Textarea value={form.objections} onChange={(e) => setField("objections", e.target.value)} placeholder="Too expensive | Approved response" /></Field>
            <Field label="Demo link"><Input value={form.demoLink} onChange={(e) => setField("demoLink", e.target.value)} /></Field>
            <Field label="Meeting link"><Input value={form.meetingLink} onChange={(e) => setField("meetingLink", e.target.value)} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI voice agent</CardTitle>
            <CardDescription>Used by the existing Plivo voice adapter. Empty fields keep the previous opening line.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Voice persona"><Input value={form.voicePersona} onChange={(e) => setField("voicePersona", e.target.value)} /></Field>
            <Field label="Introduction"><Textarea value={form.voiceIntroduction} onChange={(e) => setField("voiceIntroduction", e.target.value)} placeholder="Hello {{first_name}}, this is {{sender_name}} from {{brand_name}}." /></Field>
            <Field label="Conversation guidelines"><Textarea value={form.voiceGuidelines} onChange={(e) => setField("voiceGuidelines", e.target.value)} /></Field>
            <Field label="Qualification questions"><Textarea value={form.qualificationQuestions} onChange={(e) => setField("qualificationQuestions", e.target.value)} /></Field>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview and activation</CardTitle>
          <CardDescription>Email and voice stay on the current ASE path until this playbook is complete and Active.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handlePreview}><Eye className="w-4 h-4 mr-1.5" /> Preview</Button>
            <Button variant="outline" disabled={saving} onClick={() => persist("DRAFT")}>Save draft</Button>
            <Button disabled={saving || !validation.canSendEmail} onClick={() => persist("ACTIVE")}>
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Activate for email and voice
            </Button>
          </div>
          {preview?.email?.activated && (
            <div className="rounded-lg border p-3 text-sm space-y-1">
              <p className="font-medium">{preview.email.subject}</p>
              <pre className="whitespace-pre-wrap font-sans text-muted-foreground">{preview.email.text}</pre>
            </div>
          )}
          {preview?.email && !preview.email.activated && (
            <p className="text-sm text-amber-700">Email not activated. Missing: {(preview.email.missing || []).join(", ")}</p>
          )}
          {preview?.voice?.activated && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium mb-1">Voice opening</p>
              <p className="text-muted-foreground">{preview.voice.openingLine}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
