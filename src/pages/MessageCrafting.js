import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  Copy,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { generateEmail, loadConversationMessages } from "../lib/novaChat";
import { campaignApi, conversationApi } from "../lib/api";
import { parseDraft } from "../lib/draft";

const CHAT_TITLE = "Message Crafting";
const TONES = ["Professional", "Friendly", "Urgent", "Casual", "Promotional"];
const AUDIENCES = ["All Subscribers", "VIP Customers", "New Leads", "Inactive Users"];
const STARTERS = [
  "Announce our summer sale to VIP customers",
  "Welcome new subscribers to our newsletter",
  "Re-engage customers who haven't ordered in a while",
  "Invite leads to a product demo next week",
];
const REVISIONS = [
  "Make it more concise",
  "Make the subject line more urgent",
  "Rewrite with a friendly tone",
  "Add a clear call to action",
];

function MessageCrafting() {
  const [messages, setMessages] = useState([]);
  const [convId, setConvId] = useState(null);
  const [input, setInput] = useState("");
  const [audience, setAudience] = useState("VIP Customers");
  const [tone, setTone] = useState("Professional");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [saveTarget, setSaveTarget] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const bottomRef = useRef(null);
  const toneRef = useRef(tone);
  const audienceRef = useRef(audience);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { conversation, messages: saved } = await loadConversationMessages(CHAT_TITLE);
        if (!mounted) return;
        setConvId(conversation?.id || null);
        setMessages(
          (saved || []).map((item) => ({
            id: item.id,
            role: item.role,
            content: item.content,
          }))
        );
      } catch {
        if (mounted) setError("Could not load previous conversation");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const hasDraft = messages.some((item) => item.role === "assistant");

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setError("");

    let prompt;
    if (!hasDraft) {
      prompt = `Write a complete marketing email with a subject line.\nGoal: ${text}\nAudience: ${audience}\nTone: ${tone}`;
      toneRef.current = tone;
      audienceRef.current = audience;
    } else {
      const parts = [text];
      if (tone !== toneRef.current) {
        parts.push(`Tone: ${tone}`);
        toneRef.current = tone;
      }
      if (audience !== audienceRef.current) {
        parts.push(`Audience: ${audience}`);
        audienceRef.current = audience;
      }
      prompt = parts.join("\n");
    }

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: text },
    ]);
    setBusy(true);
    try {
      const { data, conversation } = await generateEmail({
        prompt,
        context: true,
        conversationTitle: CHAT_TITLE,
      });
      setConvId(conversation?.id || null);
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: "assistant", content: data },
      ]);
    } catch (err) {
      setError(err.message || "Could not generate a reply");
    } finally {
      setBusy(false);
    }
  };

  const resetChat = async () => {
    if (busy) return;
    if (convId) {
      try {
        await conversationApi.remove(convId);
      } catch {

      }
    }
    setConvId(null);
    setMessages([]);
    setInput("");
    setError("");
    setCopiedId(null);
  };

  const copyContent = async (id, content) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const openSaveDialog = async (item) => {
    setSaveError("");
    const parsed = parseDraft(item.content);
    setSaveTarget({
      draftId: item.id,
      content: item.content,
      subject: parsed.subject,
      body: parsed.body || item.content,
    });
    try {
      const res = await campaignApi.list({ limit: 100 });
      setCampaigns(res.data || []);
    } catch {
      setCampaigns([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!saveTarget || !saveTarget.campaignId) {
      setSaveError("Choose a campaign to save this draft to.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        subject: saveTarget.subject || null,
        body: saveTarget.body || null,
        status: "draft",
      };
      await campaignApi.update(saveTarget.campaignId, payload);
      setSaveTarget(null);
    } catch (err) {
      setSaveError(err.message || "Could not save the draft to the campaign.");
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-[calc(100svh-5.5rem)] min-h-[480px] flex-col gap-4 md:h-[calc(100svh-7rem)] lg:h-[calc(100svh-8rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Message crafting</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Chat with NOVA to write and refine your campaign email.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={resetChat} disabled={busy}>
            <Plus />
            New chat
          </Button>
        )}
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col space-y-5 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 && !busy ? (
            <div className="m-auto flex max-w-lg flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="size-7" />
              </div>
              <h3 className="text-lg font-semibold">Draft your next campaign email</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Tell NOVA what to write, then keep chatting below to tweak the subject, tone,
                length, or wording until it feels right.
              </p>
            </div>
          ) : (
            messages.map((item) =>
              item.role === "user" ? (
                <div key={item.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary/10 px-4 py-2.5 text-sm leading-relaxed">
                    {item.content}
                  </div>
                </div>
              ) : (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">NOVA</span>
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          Email draft
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-muted-foreground"
                          onClick={() => copyContent(item.id, item.content)}
                        >
                          {copiedId === item.id ? <Check /> : <Copy />}
                          {copiedId === item.id ? "Copied" : "Copy"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-muted-foreground"
                          onClick={() => openSaveDialog(item)}
                        >
                          <Save />
                          Save to campaign
                        </Button>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap rounded-xl border bg-card p-4 text-sm leading-relaxed shadow-sm">
                      {item.content}
                    </div>
                  </div>
                </div>
              )
            )
          )}

          {busy && (
            <div className="flex items-start gap-3">
              <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  <span
                    className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="space-y-3 border-t p-3 md:p-4">
          <div className="flex flex-wrap gap-2">
            {hasDraft
              ? REVISIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full text-muted-foreground"
                    disabled={busy}
                    onClick={() => send(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))
              : STARTERS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full text-muted-foreground"
                    disabled={busy}
                    onClick={() => send(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                aria-label="Audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {AUDIENCES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={tone === item ? "default" : "outline"}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setTone(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2 rounded-xl border bg-card px-2 py-1.5 shadow-sm focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-ring">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message NOVA — make it shorter, warmer, more urgent…"
              rows={Math.min(6, input.split("\n").length)}
              disabled={busy}
              className="min-h-[44px] max-h-40 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 shadow-none focus-visible:ring-0"
            />
            <Button
              size="icon"
              className="mb-0.5 size-9 shrink-0 rounded-full"
              onClick={() => send()}
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <ArrowUp />
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Card>

      <Dialog
        open={Boolean(saveTarget)}
        onOpenChange={(open) => {
          if (!open) setSaveTarget(null);
        }}
      >
        <DialogContent>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>Save draft to campaign</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="save-campaign">Campaign</Label>
                <select
                  id="save-campaign"
                  value={saveTarget?.campaignId || ""}
                  onChange={(e) =>
                    setSaveTarget((prev) =>
                      prev ? { ...prev, campaignId: e.target.value } : prev
                    )
                  }
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select a campaign…</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title || campaign.name || `Campaign ${campaign.id}`}
                    </option>
                  ))}
                </select>
                {campaigns.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No campaigns found. Create one on the Campaigns page first.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="save-subject">Subject</Label>
                <Input
                  id="save-subject"
                  value={saveTarget?.subject || ""}
                  onChange={(e) =>
                    setSaveTarget((prev) =>
                      prev ? { ...prev, subject: e.target.value } : prev
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="save-body">Body</Label>
                <Textarea
                  id="save-body"
                  rows={8}
                  value={saveTarget?.body || ""}
                  onChange={(e) =>
                    setSaveTarget((prev) =>
                      prev ? { ...prev, body: e.target.value } : prev
                    )
                  }
                />
              </div>
              {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSaveTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !saveTarget?.campaignId}>
                {saving ? "Saving…" : "Save draft"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MessageCrafting;