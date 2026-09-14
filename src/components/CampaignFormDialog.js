import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Wand2, Loader2, ChevronDown, ChevronUp, Pencil, Check } from "lucide-react";
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
  sender_name: "",
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

  const [generatedByNova, setGeneratedByNova] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);

  const subjectInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const initialSubject = initial?.subject || "";
    const initialBody = initial?.body || "";
    setForm({
      title: initial?.title || initial?.name || "",
      sender_name: initial?.sender_name || initial?.senderName || initial?.raw?.sender_name || "",
      scheduledDate: initial?.scheduledDate
        ? String(initial.scheduledDate).slice(0, 16)
        : "",
      subject: initialSubject,
      body: initialBody,
    });
    setCraftOpen(false);
    setCraftPrompt("");
    setCraftTone("Professional");
    setCraftError("");
    setGeneratedByNova(Boolean(initialSubject || initialBody));
    setIsEditingSubject(false);
    setIsEditingBody(false);
  }, [open, initial]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const scheduledDate = form.scheduledDate ? new Date(form.scheduledDate).toISOString() : null;
    onSubmit({
      title: form.title.trim(),
      sender_name: form.sender_name.trim() || null,
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
      setGeneratedByNova(true);
      setIsEditingSubject(false);
      setIsEditingBody(false);
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
              <Label htmlFor="campaign-sender-name">Sender Name</Label>
              <Input
                id="campaign-sender-name"
                placeholder="e.g., Sunil"
                value={form.sender_name}
                onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
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

            {/* Email Subject Section */}
            <div className="grid gap-2">
              <Label htmlFor="email-subject" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Subject
              </Label>

              {generatedByNova ? (
                isEditingSubject ? (
                  <div className="flex items-center gap-2 rounded-xl border border-primary/60 bg-slate-900/40 p-2.5 ring-1 ring-primary/40">
                    <Input
                      ref={subjectInputRef}
                      id="email-subject"
                      placeholder="e.g., Summer Sale — Up to 50% off"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="h-8 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-slate-100 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1"
                      onClick={() => setIsEditingSubject(false)}
                    >
                      <Check className="size-3" /> Done
                    </Button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-2.5 shadow-sm transition-all hover:border-slate-600/80">
                    <button
                      type="button"
                      onClick={() => setIsEditingSubject(true)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white shadow-xs transition-all cursor-pointer"
                      title="Click to edit subject"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <p className="flex-1 text-sm font-semibold text-slate-100 select-text">
                      {form.subject || <span className="text-muted-foreground italic font-normal">No subject generated</span>}
                    </p>
                  </div>
                )
              ) : (
                <Input
                  id="email-subject"
                  placeholder="e.g., Summer Sale — Up to 50% off"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              )}
            </div>

            {/* Email Body Section */}
            <div className="grid gap-2">
              <Label htmlFor="email-body" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Body
              </Label>

              {generatedByNova ? (
                isEditingBody ? (
                  <div className="space-y-2 rounded-xl border border-primary/60 bg-slate-900/40 p-3 ring-1 ring-primary/40">
                    <Textarea
                      ref={bodyTextareaRef}
                      id="email-body"
                      rows={7}
                      placeholder="Paste or write the email body here…"
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      className="min-h-[160px] resize-y border-0 bg-transparent p-0 text-sm leading-relaxed text-slate-200 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                      autoFocus
                    />
                    <div className="flex justify-end pt-2 border-t border-slate-700/40">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => setIsEditingBody(false)}
                      >
                        <Check className="size-3" /> Done Editing
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group flex items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-3.5 shadow-sm transition-all hover:border-slate-600/80">
                    <button
                      type="button"
                      onClick={() => setIsEditingBody(true)}
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white shadow-xs transition-all cursor-pointer"
                      title="Click to edit body"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <div className="flex-1 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap select-text max-h-[260px] overflow-y-auto">
                      {form.body || <span className="text-muted-foreground italic">No email body generated</span>}
                    </div>
                  </div>
                )
              ) : (
                <Textarea
                  id="email-body"
                  rows={7}
                  placeholder="Paste or write the email body here…"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                />
              )}
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
