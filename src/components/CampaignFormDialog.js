import React, { useEffect, useState } from "react";
import { Sparkles, Wand2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { parseDraft } from "../lib/draft";
import { generateEmail } from "../lib/novaChat";

const empty = {
  title: "",
  workMail: "",
  scheduledDate: "",
  subject: "",
  body: "",
};

const TONES = ["Professional", "Friendly", "Urgent", "Casual", "Promotional"];
const CRAFT_TITLE = "Campaign Form Copilot";

export function CampaignFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  error,
  initial,
  title = "Create New Campaign",
  submitLabel = "Create Campaign",
}) {
  const [form, setForm] = useState(empty);
  const [craftOpen, setCraftOpen] = useState(false);
  const [craftPrompt, setCraftPrompt] = useState("");
  const [craftTone, setCraftTone] = useState("Professional");
  const [crafting, setCrafting] = useState(false);
  const [craftError, setCraftError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      title: initial?.title || initial?.name || "",
      workMail: initial?.workMail || "",
      scheduledDate: initial?.scheduledDate
        ? String(initial.scheduledDate).slice(0, 16)
        : "",
      subject: initial?.subject || "",
      body: initial?.body || "",
    });
    setCraftOpen(false);
    setCraftPrompt("");
    setCraftTone("Professional");
    setCraftError("");
  }, [open, initial]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const scheduledDate = form.scheduledDate ? new Date(form.scheduledDate).toISOString() : null;
    onSubmit({
      title: form.title.trim(),
      workMail: form.workMail.trim() || null,
      scheduledDate,
      subject: form.subject.trim() || null,
      body: form.body.trim() || null,
      status: scheduledDate && new Date(scheduledDate) > new Date() ? "scheduled" : "draft",
    });
  };

  const handleCraft = async () => {
    if (!form.title.trim() && !craftPrompt.trim()) {
      setCraftError("Describe the email or give the campaign a name first.");
      return;
    }
    setCrafting(true);
    setCraftError("");
    try {
      const data = await generateEmail({
        prompt: [
          "Write a complete marketing email with a clear subject line.",
          `Purpose: ${craftPrompt.trim() || "General announcement for " + form.title.trim()}`,
          `Campaign name: ${form.title.trim() || "Untitled"}`,
          `Tone: ${craftTone}`,
          'Start the first line with "Subject: " followed by the subject.',
        ]
          .filter(Boolean)
          .join("\n"),
        context: false,
        conversationTitle: CRAFT_TITLE,
      });
      const raw = typeof data?.data === "string" ? data.data : JSON.stringify(data?.data, null, 2);
      const parsed = parseDraft(raw);
      setForm((prev) => ({
        ...prev,
        subject: parsed.subject || prev.subject,
        body: parsed.body || raw || prev.body,
      }));
      setCraftOpen(false);
      setCraftPrompt("");
    } catch (err) {
      setCraftError(err.message || "NOVA could not craft the email right now.");
    } finally {
      setCrafting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder="e.g., Summer Sale 2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="work-mail">Sender Gmail (workMail)</Label>
              <Input
                id="work-mail"
                type="email"
                placeholder="you@gmail.com"
                value={form.workMail}
                onChange={(e) => setForm({ ...form, workMail: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="mb-0">Email content</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="ml-auto h-7 gap-1 text-xs"
                onClick={() => setCraftOpen((prev) => !prev)}
              >
                <Sparkles className="size-3.5" />
                Write with NOVA
                {craftOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </Button>
            </div>

            {craftOpen ? (
              <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
                <div className="grid gap-2">
                  <Label htmlFor="craft-prompt">What should this email say?</Label>
                  <Textarea
                    id="craft-prompt"
                    rows={3}
                    placeholder="e.g., Announce 50% off summer styles and free shipping this weekend"
                    value={craftPrompt}
                    onChange={(e) => setCraftPrompt(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      size="sm"
                      variant={craftTone === item ? "default" : "outline"}
                      className="h-7 px-2.5 text-xs"
                      onClick={() => setCraftTone(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
                {craftError ? <p className="text-sm text-destructive">{craftError}</p> : null}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCraft}
                    disabled={crafting}
                    className="gap-1.5"
                  >
                    {crafting ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                    {crafting ? "Writing…" : "Generate subject & body"}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="email-subject">Email subject</Label>
              <Input
                id="email-subject"
                placeholder="e.g., Summer Sale — Up to 50% off"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-body">Email body</Label>
              <Textarea
                id="email-body"
                rows={7}
                placeholder="Paste or write the email body here…"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="scheduled-date">Schedule (optional)</Label>
              <Input
                id="scheduled-date"
                type="datetime-local"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.title.trim()}>
              {submitting ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
