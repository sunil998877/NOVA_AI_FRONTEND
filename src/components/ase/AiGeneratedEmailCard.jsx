import React, { useState, useEffect } from "react";
import { Mail, Edit3, Copy, Check, RotateCcw, Save, X, Loader2, Send, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/toast";
import { aseService } from "../../services/ase.service";

function formatFirstName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "there";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function sanitizeOutreachBody(text, senderName = "NOVA AI") {
  if (!text) return "";
  let out = String(text)
    .replace(/\[Your Name\]/gi, "")
    .replace(/\[Name\]/gi, "")
    .replace(/Your Name/g, "")
    .replace(/NOVVA AI/gi, senderName)
    .replace(/\r\n/g, "\n");

  out = out.replace(/^(Dear|Hi|Hello)\s+([A-Za-z]+)/i, (_, greeting, name) => {
    const g = greeting.charAt(0).toUpperCase() + greeting.slice(1).toLowerCase();
    return `${g} ${formatFirstName(name)}`;
  });

  if (/Best regards/i.test(out)) {
    out = out.replace(/\s*Best regards[\s\S]*$/i, `\n\nBest regards,\n${senderName}`);
  } else {
    out = `${out.trim()}\n\nBest regards,\n${senderName}`;
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

function isDraftPreparing(lead) {
  const meta = lead?.metadata || {};
  if (meta.outreach_email?.subject && meta.outreach_email?.text) return false;
  if (meta.outreach_status === "failed" || meta.outreach_status === "blocked") return false;
  if (meta.company_research_status === "failed" && meta.outreach_status !== "writing") return false;
  if (meta.outreach_status === "writing") return true;
  if (meta.company_research_status === "pending") return true;
  if (lead?.company && !meta.company_research?.summary && meta.company_research_status !== "failed") return true;
  if (meta.company_research?.summary && !meta.outreach_email?.subject) return true;
  return false;
}

function preparingLabel(lead) {
  const meta = lead?.metadata || {};
  if (meta.company_research_status === "pending" || (lead?.company && !meta.company_research?.summary)) {
    return "Researching company and drafting a personalized email…";
  }
  if (meta.outreach_status === "writing" || meta.company_research?.summary) {
    return "Writing a personalized email from company research…";
  }
  return "Preparing personalized email…";
}

function computeInitialDraft(lead) {
  const meta = lead?.metadata || {};
  const email = meta.outreach_email || {};
  const research = meta.company_research || {};
  const rawCompany = research.company || lead?.company || (lead?.email ? lead.email.split("@")[1].split(".")[0] : "your company");
  const company = rawCompany ? rawCompany.charAt(0).toUpperCase() + rawCompany.slice(1) : "Company";
  const firstName = formatFirstName(lead?.first_name || (lead?.name ? lead.name.split(" ")[0] : "there"));
  const senderName = "NOVA AI";

  if (email.subject && email.text) {
    return {
      subject: email.subject,
      text: sanitizeOutreachBody(email.text, senderName),
      isEdited: Boolean(email.is_edited),
      ready: true,
    };
  }

  return { subject: "", text: "", isEdited: false, ready: false };
}

function scoreColor(score) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-destructive";
}

function statusBadge(email) {
  if (email?.sent_at) return { label: "Sent", variant: "success" };
  if (email?.approvalStatus === "approved") return { label: "Approved", variant: "success" };
  if (email?.generation_status === "READY") return { label: "Ready to review", variant: "success" };
  if (email?.generation_status === "NEEDS_REVIEW") return { label: "Needs review", variant: "outline" };
  if (email?.generation_status === "FAILED_VALIDATION") return { label: "Failed validation", variant: "destructive" };
  if (email?.is_edited) return { label: "Customized draft", variant: "outline" };
  return { label: "Written from company research", variant: "outline" };
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function QualityMeter({ score, band }) {
  if (score == null) return null;
  const width = Math.max(0, Math.min(100, Number(score)));
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${width >= 85 ? "bg-emerald-500" : width >= 70 ? "bg-amber-500" : "bg-destructive"}`} style={{ width: `${width}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${scoreColor(score)}`}>
        {score}/100{band ? ` · ${band}` : ""}
      </span>
    </div>
  );
}

export default function AiGeneratedEmailCard({ lead, onLeadUpdated }) {
  const { success, error: toastError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const email = lead?.metadata?.outreach_email || {};
  const preparing = isDraftPreparing(lead) && !isGenerating;
  const initialDraft = computeInitialDraft(lead);
  const [subject, setSubject] = useState(initialDraft.subject);
  const [bodyText, setBodyText] = useState(initialDraft.text);
  const [isEdited, setIsEdited] = useState(initialDraft.isEdited);

  useEffect(() => {
    const draft = computeInitialDraft(lead);
    setSubject(draft.subject);
    setBodyText(draft.text);
    setIsEdited(draft.isEdited);
  }, [lead?.id, lead?.metadata?.outreach_email?.subject, lead?.metadata?.outreach_email?.text, lead?.metadata?.outreach_email?.updated_at]);

  const handleGenerate = async () => {
    if (!lead?.id) return;
    setIsGenerating(true);
    try {
      const res = await aseService.draftLeadEmail(lead.id);
      if (res?.email) {
        setSubject(res.email.subject || "");
        setBodyText(res.email.text || "");
        setIsEdited(false);
        success("Email Regenerated", "A fresh, research-backed draft is ready for review.");
        if (onLeadUpdated) onLeadUpdated();
      } else {
        toastError("Blocked", res?.reason || "Email generation is blocked for this lead.");
      }
    } catch (err) {
      toastError("Error", err.message || "Failed to regenerate outreach email");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!lead?.id) return;
    if (!subject.trim() || !bodyText.trim()) {
      toastError("Validation", "Subject and body cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await aseService.saveLeadEmailDraft(lead.id, { subject: subject.trim(), text: bodyText.trim() });
      if (res?.email) {
        setSubject(res.email.subject);
        setBodyText(res.email.text);
      }
      setIsEdited(true);
      success("Draft Saved", "Edits saved and re-scored against research and compliance checks.");
      setIsEditing(false);
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      toastError("Save Error", err.message || "Failed to save email draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveAndSend = async () => {
    if (!lead?.id) return;
    setIsSending(true);
    try {
      await aseService.approveAndSendLeadEmail(lead.id);
      success("Sent", "The email was approved and queued for delivery.");
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      toastError("Send Error", err.message || "Could not approve and send");
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    const draft = computeInitialDraft(lead);
    setSubject(draft.subject);
    setBodyText(draft.text);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${bodyText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    success("Copied", "Email copied to clipboard");
  };

  const badge = preparing || isGenerating
    ? { label: preparing ? "Preparing…" : "Regenerating…", variant: "outline" }
    : statusBadge(email);
  const greeting = bodyText.split("\n")[0] || "";
  const hardFailed = email.hard_gate?.passed === false;
  const alreadySent = Boolean(email.sent_at);
  const canSend = Boolean(email.subject && email.text) && !alreadySent && !hardFailed && !lead?.do_not_contact && !preparing;
  const warnings = email.validation_warnings || [];
  const evidence = email.research_fact_references?.length ? email.research_fact_references : email.research_evidence || [];
  const inferred = email.inferred_personalization || [];
  const breakdown = email.quality_breakdown || {};
  const industry = email.industry_context;
  const role = email.contact_role_context;
  const reason = email.personalization_context?.reason;
  const sources = email.research_sources || [];
  const busy = preparing || isGenerating;

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Mail className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-semibold">
              {isEditing ? "Edit Professional Email" : "Professional email"}
            </CardTitle>
            <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
            {isEdited && !email.generation_status && !busy && (
              <Badge variant="outline" className="text-[10px]">Customized draft</Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {!isEditing && !busy && (
              <>
                <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 px-2 text-xs gap-1" title="Copy email to clipboard" disabled={!bodyText}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </Button>
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isGenerating || alreadySent} className="h-7 px-2 text-xs gap-1" title="Regenerate with AI">
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Regenerate</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} disabled={alreadySent || !bodyText} className="h-7 px-2.5 text-xs gap-1 text-primary hover:text-primary">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Email</span>
                </Button>
              </>
            )}
          </div>
        </div>
        {!isEditing && !busy && subject && (
          <CardDescription className="text-sm font-medium text-foreground mt-1">{subject}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {busy ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">{isGenerating ? "Regenerating personalized email…" : preparingLabel(lead)}</p>
              <p className="text-xs text-muted-foreground mt-1">This can take a little while. The draft will appear here when ready.</p>
            </div>
          </div>
        ) : !bodyText ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">No personalized draft yet.</p>
            <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isGenerating} className="gap-1.5">
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Generate email
            </Button>
          </div>
        ) : isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line..." className="text-sm font-medium" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Email Body</label>
              <Textarea rows={9} value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Write your email message..." className="text-sm leading-relaxed font-sans" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {greeting && /^(hi|hello|dear)\b/i.test(greeting) && (
              <p className="text-xs text-muted-foreground">Personalized greeting: <span className="text-foreground font-medium">{greeting.replace(/,$/, "")}</span></p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-sans">{bodyText}</p>

            {(industry || role) && (
              <div className="flex flex-wrap gap-1.5">
                {industry?.label && (
                  <Badge variant="outline" className="text-[10px]">
                    {industry.verified ? "Verified industry" : "Detected industry"}: {industry.label}
                    {industry.subIndustry && industry.subIndustry !== industry.label ? ` · ${industry.subIndustry}` : ""}
                  </Badge>
                )}
                {role?.label && (
                  <Badge variant="outline" className="text-[10px]">
                    {role.titleKnown ? role.title : "Role not on record"} · {role.label}
                  </Badge>
                )}
                {email.personalization_context?.stage && (
                  <Badge variant="muted" className="text-[10px]">{String(email.personalization_context.stage).replace(/_/g, " ").toLowerCase()}</Badge>
                )}
              </div>
            )}

            {reason && (
              <div className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-2">
                <span className="text-[11px] font-semibold text-muted-foreground block">Personalization</span>
                <p className="text-xs text-foreground/90 mt-0.5">{reason}</p>
              </div>
            )}

            {(evidence.length > 0 || inferred.length > 0 || sources.length > 0) && (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-emerald-200/70 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900 px-2.5 py-2">
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">Verified research used</span>
                  {evidence.length ? (
                    <ul className="mt-1 space-y-1">
                      {evidence.slice(0, 4).map((item) => (
                        <li key={item.id || item.value} className="text-[11px] text-foreground/90">
                          {item.value}
                          {item.sourceUrl && (
                            <>
                              {" "}
                              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">{hostOf(item.sourceUrl)}</a>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-1">No company-specific claims were made from research.</p>
                  )}
                  {sources.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Sources: {sources.slice(0, 3).map((source) => hostOf(source.url)).join(", ")}
                    </p>
                  )}
                </div>
                <div className="rounded-md border border-amber-200/70 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 px-2.5 py-2">
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">Inferred (not treated as fact)</span>
                  {inferred.filter((item) => item.promptSafe !== false).length ? (
                    <ul className="mt-1 space-y-1">
                      {inferred.filter((item) => item.promptSafe !== false).slice(0, 3).map((item) => (
                        <li key={item.value} className="text-[11px] text-foreground/90">{item.value}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-1">No inferred personalization was used.</p>
                  )}
                </div>
              </div>
            )}

            {(email.quality_score != null || warnings.length > 0) && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-[11px] font-semibold text-muted-foreground">Quality score</span>
                  <QualityMeter score={email.quality_score} band={email.quality_band} />
                </div>
                {Object.keys(breakdown).length > 0 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                    {Object.entries(breakdown).map(([key, value]) => (
                      <span key={key}>{key.replace(/([A-Z])/g, " $1").trim()}: {value.score}/{value.max}</span>
                    ))}
                  </div>
                )}
                {warnings.length > 0 && (
                  <div className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <p>Warnings: {warnings.slice(0, 6).join(", ")}</p>
                  </div>
                )}
                {hardFailed && (
                  <p className="text-[11px] text-destructive">Failed validation: {(email.hard_gate.failures || []).join(", ")}. Edit or regenerate before sending.</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      {isEditing ? (
        <CardFooter className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
          <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving} className="gap-1">
            <X className="w-3.5 h-3.5" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      ) : (
        <CardFooter className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
          <Button size="sm" onClick={handleApproveAndSend} disabled={!canSend || isSending || isGenerating} className="gap-1.5">
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {alreadySent ? "Already sent" : isSending ? "Sending..." : "Approve and Send"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
