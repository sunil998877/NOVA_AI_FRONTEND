import React, { useState, useEffect, useRef } from "react";
import { Mail, Edit3, Copy, Check, RotateCcw, Save, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/toast";
import { aseService } from "../../services/ase.service";

function computeInitialDraft(lead) {
  const meta = lead?.metadata || {};
  const research = meta.company_research || {};
  const rawCompany = research.company || lead?.company || (lead?.email ? lead.email.split("@")[1].split(".")[0] : "your company");
  const company = rawCompany ? rawCompany.charAt(0).toUpperCase() + rawCompany.slice(1) : "Company";
  const firstName = lead?.first_name || (lead?.name ? lead.name.split(" ")[0] : "there");
  const senderName = "NOVA Sales";

  if (meta.outreach_email?.subject && meta.outreach_email?.text) {
    return {
      subject: meta.outreach_email.subject,
      text: meta.outreach_email.text,
      isEdited: Boolean(meta.outreach_email.is_edited),
    };
  }

  if (research.summary) {
    const offering = research.coreServices || research.summary;
    const subject = `${company}: a note on ${research.industry || "your work"}`;
    const text = `Hi ${firstName},\n\nI spent some time looking at ${company}. ${research.summary}\n\nThat focus on ${offering} is why I am writing. I would like to share one practical idea for how ${company} reaches ${research.targetAudience || "the customers you already serve"}, and hear whether it is relevant.\n\nWould you be open to a short conversation this week?\n\nBest regards,\n${senderName}`;
    return { subject, text, isEdited: false };
  }

  const subject = `${company}: Quick inquiry regarding growth`;
  const text = `Hi ${firstName},\n\nI was reviewing ${company} and was impressed by your offerings. We help organizations scale and automate outbound sales.\n\nWould you have 10 minutes for a brief conversation this week?\n\nBest regards,\n${senderName}`;
  return { subject, text, isEdited: false };
}

export default function AiGeneratedEmailCard({ lead, onLeadUpdated }) {
  const { success, error: toastError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const initialDraft = computeInitialDraft(lead);
  const [subject, setSubject] = useState(initialDraft.subject);
  const [bodyText, setBodyText] = useState(initialDraft.text);
  const [isEdited, setIsEdited] = useState(initialDraft.isEdited);

  const persistedRef = useRef(false);

  useEffect(() => {
    const draft = computeInitialDraft(lead);
    setSubject(draft.subject);
    setBodyText(draft.text);
    setIsEdited(draft.isEdited);

    if (lead?.id && !lead.metadata?.outreach_email?.subject && !persistedRef.current) {
      persistedRef.current = true;
      const htmlContent = `<p>${draft.text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
      const updatedMetadata = {
        ...(lead.metadata || {}),
        outreach_status: "ready",
        outreach_email: {
          subject: draft.subject,
          text: draft.text,
          html: htmlContent,
          written_at: new Date().toISOString(),
          is_edited: false,
        },
      };
      aseService.updateLead(lead.id, { metadata: updatedMetadata }).then(() => {
        if (onLeadUpdated) onLeadUpdated();
      }).catch(() => { });
    }
  }, [lead?.id, lead?.metadata?.outreach_email?.subject, lead?.metadata?.outreach_email?.text]);

  const handleGenerate = async () => {
    if (!lead?.id) return;
    setIsGenerating(true);
    try {
      const res = await aseService.draftLeadEmail(lead.id);
      if (res?.email) {
        setSubject(res.email.subject || "");
        setBodyText(res.email.text || "");
        setIsEdited(false);
        success("Email Regenerated", "AI drafted a fresh cold outreach email.");
        if (onLeadUpdated) onLeadUpdated();
      } else {
        const fresh = computeInitialDraft(lead);
        setSubject(fresh.subject);
        setBodyText(fresh.text);
        setIsEdited(false);
        success("Email Drafted", "Outreach email updated from company intelligence.");
      }
    } catch (err) {
      toastError("Error", err.message || "Failed to regenerate outreach email");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!lead?.id) return;
    if (!subject.trim()) {
      toastError("Validation", "Subject cannot be empty.");
      return;
    }
    if (!bodyText.trim()) {
      toastError("Validation", "Email body cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const htmlContent = `<p>${bodyText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
      const updatedMetadata = {
        ...(lead.metadata || {}),
        outreach_status: "ready",
        outreach_email: {
          subject: subject.trim(),
          text: bodyText.trim(),
          html: htmlContent,
          updated_at: new Date().toISOString(),
          is_edited: true,
        },
      };

      await aseService.updateLead(lead.id, { metadata: updatedMetadata });
      setIsEdited(true);
      success("Draft Saved", "Outreach email updated successfully.");
      setIsEditing(false);
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      toastError("Save Error", err.message || "Failed to save email draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const draft = computeInitialDraft(lead);
    setSubject(draft.subject);
    setBodyText(draft.text);
    setIsEditing(false);
  };

  const handleCopy = () => {
    const textToCopy = `Subject: ${subject}\n\n${bodyText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    success("Copied", "Email copied to clipboard");
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-semibold">
              {isEditing ? "Edit Professional Email" : "Professional email"}
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {isEdited ? "Customized draft" : "Written from company research"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {!isEditing && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-7 px-2 text-xs gap-1"
                  title="Copy email to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="h-7 px-2 text-xs gap-1"
                  title="Regenerate with AI"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Regenerate</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="h-7 px-2.5 text-xs gap-1 text-primary hover:text-primary"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Email</span>
                </Button>
              </>
            )}
          </div>
        </div>
        {!isEditing && (
          <CardDescription className="text-sm font-medium text-foreground mt-1">
            {subject}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Subject
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject line..."
                className="text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Email Body
              </label>
              <Textarea
                rows={9}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Write your email message..."
                className="text-sm leading-relaxed font-sans"
              />
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-sans">
            {bodyText}
          </p>
        )}
      </CardContent>
      {isEditing && (
        <CardFooter className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
