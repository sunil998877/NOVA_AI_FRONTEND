import React, { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Eye,
  Send,
  Mail,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { craftEmail } from "../lib/novaChat";

const tones = [
  { id: "professional", label: "Professional", desc: "Formal and business-like" },
  { id: "friendly", label: "Friendly", desc: "Warm and approachable" },
  { id: "urgent", label: "Urgent", desc: "Time-sensitive and compelling" },
  { id: "casual", label: "Casual", desc: "Relaxed and conversational" },
  { id: "promotional", label: "Promotional", desc: "Sales-focused and persuasive" },
];

const templates = [
  { id: 1, name: "Welcome Series", category: "Onboarding", usage: "2.4k" },
  { id: 2, name: "Product Announcement", category: "Launch", usage: "1.8k" },
  { id: 3, name: "Abandoned Cart", category: "E-commerce", usage: "3.1k" },
  { id: 4, name: "Weekly Newsletter", category: "Content", usage: "5.2k" },
  { id: 5, name: "Re-engagement", category: "Retention", usage: "980" },
  { id: 6, name: "Event Invitation", category: "Events", usage: "1.2k" },
];

function MessageCrafter() {
  const [prompt, setPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [generated, setGenerated] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError("");
    try {
      const data = await craftEmail({ prompt, tone: selectedTone });
      setGenerated(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err.message || "Could not generate email");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Message Crafter</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            AI-powered email copy generation for every occasion.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "ai" ? "default" : "outline"} onClick={() => setActiveTab("ai")}>
            AI Generator
          </Button>
          <Button variant={activeTab === "templates" ? "default" : "outline"} onClick={() => setActiveTab("templates")}>
            Templates
          </Button>
        </div>
      </div>

      {activeTab === "ai" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">AI Email Generator</CardTitle>
                  <CardDescription>Describe what you need</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>What is this email about?</Label>
                <Textarea
                  placeholder="e.g., Announce our new AI-powered analytics feature to existing customers..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid gap-2">
                <Label>Select Tone</Label>
                <div className="flex flex-wrap gap-2">
                  {tones.map((tone) => (
                    <Button
                      key={tone.id}
                      type="button"
                      size="sm"
                      variant={selectedTone === tone.id ? "default" : "outline"}
                      title={tone.desc}
                      onClick={() => setSelectedTone(tone.id)}
                    >
                      {tone.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="animate-spin" />
                    Crafting...
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Generate Email
                  </>
                )}
              </Button>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Generated Email</CardTitle>
              {generated && (
                <div className="flex gap-2">
                  <Button size="sm" variant={copied ? "secondary" : "outline"} onClick={handleCopy}>
                    {copied ? <Check /> : <Copy />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button size="sm">
                    <Send />
                    Use
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {generated ? (
                <div className="max-h-[500px] flex-1 overflow-y-auto whitespace-pre-wrap rounded-md border bg-secondary/40 p-4 text-sm leading-relaxed">
                  {generated}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-muted-foreground">
                  <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-secondary">
                    <Sparkles className="size-7" />
                  </div>
                  <p className="text-sm">Your AI-crafted email will appear here</p>
                </div>
              )}
              {generated && (
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <ThumbsUp /> Helpful
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <ThumbsDown /> Not helpful
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={handleGenerate}>
                    <RefreshCw /> Regenerate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="relative overflow-hidden transition-colors hover:border-primary/40">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Mail className="size-5" />
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary">{template.category}</Badge>
              </CardHeader>
              <CardContent>
                <h3 className="mb-1 text-base font-semibold">{template.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">Used {template.usage} times</p>
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    <Pencil /> Use Template
                  </Button>
                  <Button variant="outline" size="icon">
                    <Eye />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default MessageCrafter;
