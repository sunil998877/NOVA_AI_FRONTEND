import React, { useState, useMemo } from "react";
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

function resolvePlaceholders(text, recipient, campaign) {
  if (!text) return "";
  const fullName =
    recipient?.full_name ||
    recipient?.recipientName ||
    recipient?.name ||
    (campaign?.isOutreach ? campaign?.name?.replace(/^Outreach to\s*/i, "") : "") ||
    "Valued Recipient";
  const firstName = fullName.split(/\s+/)[0] || fullName;
  const email = recipient?.email || recipient?.recipientEmail || "recipient@example.com";
  const senderName = campaign?.sender_name || campaign?.senderName || "NOVA AI";
  const campaignTitle = campaign?.name || campaign?.title || "Campaign";

  let resolved = text;
  resolved = resolved.replace(
    /(Best\s+regards,?\s*(?:<br\s*\/?>)?\s*)(?:\{\{\s*(?:recipient_name|recipientName|full_name|fullName|name)\s*\}\}|\[\s*Recipient(?:'s)?\s*Name\s*\]|\[\s*Recipient\s*\])/gi,
    `$1{{senderName}}`
  );

  const namePatterns = [
    /\{\{\s*(?:recipient_name|recipientName|full_name|fullName|name)\s*\}\}/gi,
    /\[\s*Recipient(?:'s)?\s*Name\s*\]/gi,
    /\[\s*Recipient\s*\]/gi,
    /\[\s*Customer\s*Name\s*\]/gi,
    /\[\s*Client\s*Name\s*\]/gi,
  ];
  for (const pattern of namePatterns) {
    resolved = resolved.replace(pattern, fullName);
  }

  resolved = resolved.replace(/\{\{\s*(?:first_name|firstName)\s*\}\}/gi, firstName);
  resolved = resolved.replace(/\{\{\s*(?:recipient_email|recipientEmail|email)\s*\}\}/gi, email);

  const companyPatterns = [
    /\{\{\s*(?:company|organization|org)\s*\}\}/gi,
    /\[\s*(?:Company|Organization)\s*Name\s*\]/gi,
    /\[\s*Your\s*Company\s*\]/gi,
  ];
  for (const pattern of companyPatterns) {
    resolved = resolved.replace(pattern, "NOVA AI");
  }

  resolved = resolved.replace(/\{\{\s*campaign_title\s*\}\}/gi, campaignTitle);

  const senderPatterns = [
    /\{\{\s*(?:sender_name|senderName)\s*\}\}/gi,
    /\[\s*Your\s*Name\s*\]/gi,
    /\[\s*Sender(?:'s)?\s*Name\s*\]/gi,
    /\[\s*Sender\s*\]/gi,
  ];
  for (const pattern of senderPatterns) {
    resolved = resolved.replace(pattern, senderName);
  }

  resolved = resolved.replace(/\[\s*Insert\s*Link\s*\]/gi, "Click here");
  resolved = resolved.replace(/\[\s*(?:Your\s*Title|Title)\s*\]/gi, "Team");
  resolved = resolved.replace(/\[\s*(?:Product|Service)\s*Name\s*\]/gi, campaignTitle);
  resolved = resolved.replace(/,\s*independent(?=[ \t]*(?:\r?\n|$))/gi, "");
  resolved = resolved.replace(/^[ \t]*independent[ \t]*(?:\r?\n|$)/gim, "");

  return resolved;
}

function formatEmailBody(rawBody) {
  if (!rawBody) return "";

  let text = rawBody.replace(/<br\s*\/?>/gi, "\n");
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs
    .map((p) => {
      let content = p.trim();
      if (!content) return "";

      content = content.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #111827; font-weight: 600;">$1</strong>');
      content = content.replace(/\*([^*]+)\*/g, '<em style="color: #4b5563;">$1</em>');

      content = content.replace(/\n/g, "<br/>");

      return `<p style="margin: 0 0 16px 0; color: #374151; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.65; word-break: break-word;">${content}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

function buildNovaEmailHtml(campaign, recipient) {
  const resolvedSubject = resolvePlaceholders(
    campaign?.subject || campaign?.name || campaign?.title || "Campaign Preview",
    recipient,
    campaign
  );
  const resolvedBody = resolvePlaceholders(
    campaign?.body ||
      (campaign?.isOutreach
        ? `Hello {{recipientName}},\n\nWe would love to discuss an exciting collaboration opportunity with you.\n\nBest regards,\n{{senderName}}`
        : `Hello {{recipientName}},\n\nThis is your preview for ${campaign?.name || campaign?.title || "Campaign"}.\n\nBest regards,\n{{senderName}}`),
    recipient,
    campaign
  );

  const styledBody = formatEmailBody(resolvedBody);
  const recipientEmail = recipient?.email || "recipient@example.com";
  const campaignName = campaign?.name || campaign?.title || "NOVA Campaign";
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${resolvedSubject}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f7f5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .content-cell { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f0; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f7f5f0; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${resolvedSubject}
  </div>
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f7f5f0; min-height: 100%;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" role="presentation" style="max-width: 600px; width: 100%;">

          <!-- BRAND / TOP ACCENT -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="vertical-align: middle;">
                    <div style="width: 28px; height: 28px; border-radius: 8px; background-color: #ef5a2e; display: inline-block; vertical-align: middle; text-align: center; line-height: 28px; color: #ffffff; font-weight: bold; font-size: 14px;">N</div>
                    <span style="display: inline-block; vertical-align: middle; margin-left: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.12em; color: #111827;">NOVA</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td class="content-cell" style="background-color: #ffffff; border-radius: 16px; padding: 36px 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); border: 1px solid rgba(0, 0, 0, 0.05);">
              ${styledBody}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding: 24px 16px; color: #9ca3af; font-size: 12px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <p style="margin: 0 0 6px 0;">
                Sent to <span style="color: #6b7280; font-weight: 500;">${recipientEmail}</span> regarding <strong>${campaignName}</strong>
              </p>
              <p style="margin: 0 0 8px 0; color: #9ca3af;">
                &copy; ${currentYear} NOVA AI. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function CampaignPreviewDialog({
  open,
  onOpenChange,
  campaign,
  recipient,
  onSend,
}) {
  const [viewMode, setViewMode] = useState("desktop");
  const [copied, setCopied] = useState(false);

  const effectiveRecipient = useMemo(() => {
    return (
      recipient || {
        full_name: campaign?.isOutreach
          ? campaign?.name?.replace(/^Outreach to\s*/i, "") || "Creator"
          : "Valued Recipient",
        email: "recipient@example.com",
      }
    );
  }, [recipient, campaign]);

  const effectiveSubject = useMemo(() => {
    return resolvePlaceholders(
      campaign?.subject || campaign?.name || campaign?.title || "Campaign Preview",
      effectiveRecipient,
      campaign
    );
  }, [campaign, effectiveRecipient]);

  const effectiveSenderName = campaign?.sender_name || "NOVA AI";
  const effectiveSenderEmail = campaign?.sender_email || "skp66235@gmail.com";

  const effectiveHtml = useMemo(() => {
    return buildNovaEmailHtml(campaign, effectiveRecipient);
  }, [campaign, effectiveRecipient]);

  const effectivePlainText = useMemo(() => {
    const resolvedBody = resolvePlaceholders(
      campaign?.body ||
        `Hello ${effectiveRecipient.full_name},\n\nThis is your preview for ${campaign?.name || campaign?.title || "Campaign"}.\n\nBest regards,\n${effectiveSenderName}`,
      effectiveRecipient,
      campaign
    );
    return `Subject: ${effectiveSubject}\n\n${resolvedBody}`;
  }, [campaign, effectiveRecipient, effectiveSubject, effectiveSenderName]);

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
                {effectiveRecipient?.full_name || "Valued Recipient"} &lt;{effectiveRecipient?.email || "recipient@example.com"}&gt;
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground w-16 shrink-0">From:</span>
              <span className="text-muted-foreground flex items-center gap-1">
                <Mail className="size-3" />
                {effectiveSenderName} &lt;{effectiveSenderEmail}&gt;
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/40 p-3 md:p-6 flex justify-center items-start min-h-[420px]">
          {viewMode === "text" ? (
            <div className="w-full max-w-[680px] bg-card rounded-xl border p-5 shadow font-mono text-xs whitespace-pre-wrap text-foreground leading-relaxed">
              {effectivePlainText}
            </div>
          ) : (
            <div
              className={`transition-all duration-300 bg-white rounded-xl shadow-xl border overflow-hidden flex flex-col ${
                viewMode === "mobile" ? "w-[375px] max-w-full" : "w-full max-w-[680px]"
              }`}
            >
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

              <iframe
                title="Email Preview"
                srcDoc={effectiveHtml}
                className="w-full h-[520px] border-0 bg-white"
              />
            </div>
          )}
        </div>

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
