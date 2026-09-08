import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, Smartphone, Monitor, Mail, User, Send } from "lucide-react";
import { campaignApi } from "../lib/api";

export function CampaignPreviewDialog({ open, onOpenChange, campaign, onSend }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [viewMode, setViewMode] = useState("desktop"); // 'desktop' | 'mobile'

  useEffect(() => {
    if (!open || !campaign?.id) {
      setPreviewData(null);
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    campaignApi
      .preview(campaign.id)
      .then((data) => {
        if (active) {
          setPreviewData(data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Could not load preview");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, campaign?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 md:p-6 pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pr-6">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold">
                  {campaign?.name || campaign?.title || "Campaign"} Preview
                </DialogTitle>
                <Badge variant="outline" className="text-xs">
                  Live Renderer
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Visualizing exact email layout as rendered in recipient inboxes.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg self-start md:self-auto">
              <Button
                variant={viewMode === "desktop" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode("desktop")}
              >
                <Monitor className="size-3.5" /> Desktop
              </Button>
              <Button
                variant={viewMode === "mobile" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode("mobile")}
              >
                <Smartphone className="size-3.5" /> Mobile
              </Button>
            </div>
          </div>

          {previewData && (
            <div className="mt-3 bg-background/80 backdrop-blur rounded-lg border p-3 text-xs space-y-1.5 text-left">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-muted-foreground w-14 shrink-0">Subject:</span>
                <span className="font-medium text-foreground select-all">{previewData.subject}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground w-14 shrink-0">To:</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="size-3" />
                  {previewData.sampleRecipient?.full_name || "Sample Recipient"} &lt;{previewData.sampleRecipient?.email || "recipient@example.com"}&gt;
                </span>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/40 p-4 md:p-6 flex justify-center items-start">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm">Rendering email preview...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-destructive max-w-md">
              <p className="font-semibold">Failed to render preview</p>
              <p className="text-xs mt-1 text-muted-foreground">{error}</p>
            </div>
          ) : previewData?.html ? (
            <div
              className={`transition-all duration-200 bg-white rounded-xl shadow-lg border overflow-hidden ${
                viewMode === "mobile" ? "w-[380px] max-w-full" : "w-full max-w-[660px]"
              }`}
            >
              <iframe
                title="Email Preview"
                srcDoc={previewData.html}
                className="w-full h-[540px] border-0"
                sandbox="allow-same-origin allow-popups"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter className="p-3 border-t bg-muted/20 flex flex-row items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onSend && campaign ? (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onOpenChange(false);
                onSend(campaign);
              }}
            >
              <Send className="size-3.5" /> Send Campaign
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
