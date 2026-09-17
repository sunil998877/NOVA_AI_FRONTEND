import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Loader2,
  Smartphone,
  Monitor,
  Mail,
  User,
  Send,
  Copy,
  Check,
  FileText,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { campaignApi } from "../lib/api";

function buildFallbackHtml(campaign) {
  const subject = campaign?.subject || campaign?.title || "Campaign Preview";
  const senderName = campaign?.sender_name || campaign?.senderName || "Sunil Kumar";
  const senderEmail = campaign?.sender_email || campaign?.senderEmail || "skp66235@gmail.com";
  const recipientName = campaign?.isOutreach ? (campaign?.name?.replace(/^Outreach to\s*/i, "") || "Creator") : "Valued Customer";
  
  let rawBody = campaign?.body || `Hello ${recipientName},\n\nWe would love to discuss an exciting collaboration opportunity with you.\n\nBest regards,\n${senderName}`;
  
  // Format body paragraphs
  const formattedBody = rawBody
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n\n")
    .map((para) => `<p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; line-height: 1.65;">${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 28px auto; padding: 0 16px; }
    .card { background-color: #ffffff; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0d9488; background: #ccfbf1; padding: 4px 10px; border-radius: 9999px; }
    .subject { margin: 14px 0 6px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.35; }
    .meta { font-size: 13px; color: #64748b; margin-top: 4px; }
    .content { color: #334155; font-size: 15px; line-height: 1.65; margin: 24px 0; }
    .cta-box { background: linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%); border: 1px solid #99f6e4; border-radius: 12px; padding: 20px; margin: 28px 0; text-align: left; }
    .btn { display: inline-block; background: #0d9488; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 10px; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 28px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div>
          <span class="badge">${campaign?.isOutreach ? "Partnership Outreach" : "Campaign Broadcast"}</span>
          <h1 class="subject">${subject}</h1>
          <div class="meta">From: <strong>${senderName}</strong> &lt;${senderEmail}&gt;</div>
        </div>
      </div>
      <div class="content">
        ${formattedBody}
      </div>
      ${
        campaign?.isOutreach
          ? `<div class="cta-box">
              <div style="font-weight: 700; color: #0f766e; font-size: 15px; margin-bottom: 6px;">🤝 Creator Deal Portal</div>
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569;">Collaborate directly with our marketing team, review deliverables, and chat in real-time.</p>
              <a href="#" class="btn">Open Deal Portal & Chat &rarr;</a>
            </div>`
          : ""
      }
      <div class="footer">
        <p style="margin: 0 0 4px 0;">Sent via NOVA AI Marketing Platform</p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} NOVA AI. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function CampaignPreviewDialog({ open, onOpenChange, campaign, onSend }) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [viewMode, setViewMode] = useState("desktop"); // 'desktop' | 'mobile' | 'text'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !campaign?.id) {
      setPreviewData(null);
      return;
    }

    let active = true;
    setLoading(true);

    campaignApi
      .preview(campaign.id)
      .then((data) => {
        if (active && data) {
          setPreviewData(data);
        }
      })
      .catch((err) => {
        console.warn("[CampaignPreview] API preview fallback active:", err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, campaign?.id]);

  const effectiveSubject =
    previewData?.subject || campaign?.subject || campaign?.name || campaign?.title || "Campaign Preview";

  const effectiveHtml = useMemo(() => {
    if (previewData?.html && previewData.html.trim().length > 0) {
      return previewData.html;
    }
    return buildFallbackHtml(campaign);
  }, [previewData, campaign]);

  const effectivePlainText = useMemo(() => {
    if (previewData?.text) return previewData.text;
    if (campaign?.body) return campaign.body;
    return `Subject: ${effectiveSubject}\n\nHello,\n\nThis is your preview for ${campaign?.name || campaign?.title || "Campaign"}.\n\nBest regards,\n${campaign?.sender_name || "NOVA AI"}`;
  }, [previewData, campaign, effectiveSubject]);

  const handleCopySubject = () => {
    navigator.clipboard.writeText(effectiveSubject);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenRaw = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(effectiveHtml);
      win.document.close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border-border/80 shadow-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-4 md:p-5 pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pr-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg md:text-xl font-bold">
                  {campaign?.name || campaign?.title || "Campaign"} Preview
                </DialogTitle>
                <Badge
                  variant={campaign?.isOutreach ? "secondary" : "outline"}
                  className="text-xs gap-1 border-primary/30"
                >
                  <Sparkles className="size-3 text-primary" />
                  {campaign?.isOutreach ? "Influencer Outreach" : "Live Email"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Visualizing exact email design as delivered to recipient inboxes.
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-muted/80 border p-1 rounded-lg self-start md:self-auto">
              <Button
                variant={viewMode === "desktop" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode("desktop")}
              >
                <Monitor className="size-3.5" /> Desktop
              </Button>
              <Button
                variant={viewMode === "mobile" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode("mobile")}
              >
                <Smartphone className="size-3.5" /> Mobile
              </Button>
              <Button
                variant={viewMode === "text" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode("text")}
              >
                <FileText className="size-3.5" /> Plain Text
              </Button>
            </div>
          </div>

          {/* Email Meta Envelope */}
          <div className="mt-3 bg-card rounded-lg border p-3 text-xs space-y-1.5 text-left shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="font-semibold text-muted-foreground w-16 shrink-0">Subject:</span>
                <span className="font-medium text-foreground truncate select-all">{effectiveSubject}</span>
              </div>
              <button
                type="button"
                onClick={handleCopySubject}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground shrink-0 transition"
                title="Copy subject line"
              >
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground w-16 shrink-0">To:</span>
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="size-3" />
                {previewData?.sampleRecipient?.full_name ||
                  (campaign?.isOutreach ? campaign?.name?.replace(/^Outreach to\s*/i, "") : "Sample Recipient") ||
                  "Sample Recipient"}{" "}
                &lt;{previewData?.sampleRecipient?.email || "recipient@example.com"}&gt;
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground w-16 shrink-0">From:</span>
              <span className="text-muted-foreground flex items-center gap-1">
                <Mail className="size-3" />
                {campaign?.sender_name || previewData?.sampleSender?.senderName || "Sunil Kumar"}{" "}
                &lt;{campaign?.sender_email || previewData?.sampleSender?.senderEmail || "skp66235@gmail.com"}&gt;
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Frame Body */}
        <div className="flex-1 overflow-auto bg-muted/40 p-3 md:p-6 flex justify-center items-start min-h-[420px]">
          {loading && !previewData && !campaign ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm">Rendering email preview...</p>
            </div>
          ) : viewMode === "text" ? (
            <div className="w-full max-w-[680px] bg-card rounded-xl border p-5 shadow font-mono text-xs whitespace-pre-wrap text-foreground leading-relaxed">
              {effectivePlainText}
            </div>
          ) : (
            <div
              className={`transition-all duration-300 bg-white rounded-xl shadow-xl border overflow-hidden flex flex-col ${
                viewMode === "mobile" ? "w-[375px] max-w-full" : "w-full max-w-[680px]"
              }`}
            >
              {/* Device Bezel / Header */}
              <div className="bg-slate-100 border-b px-3 py-2 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-red-400" />
                  <div className="size-2 rounded-full bg-amber-400" />
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span className="ml-1 font-sans font-medium text-slate-600">
                    {viewMode === "mobile" ? "iPhone Viewport (375px)" : "Desktop Inbox (680px)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenRaw}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition"
                  title="Open preview in new tab"
                >
                  <ExternalLink className="size-3" />
                  New Tab
                </button>
              </div>

              {/* Email Content Iframe */}
              <iframe
                title="Email Preview"
                srcDoc={effectiveHtml}
                className="w-full h-[520px] border-0 bg-white"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-3 px-4 border-t bg-muted/20 flex flex-row items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleOpenRaw}
            >
              <ExternalLink className="size-3.5" /> Full Screen
            </Button>

            {onSend && campaign ? (
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  onOpenChange(false);
                  onSend(campaign);
                }}
              >
                <Send className="size-3.5" /> {campaign?.status === "completed" ? "Resend" : "Send Campaign"}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
