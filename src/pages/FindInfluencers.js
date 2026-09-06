import React, { useEffect, useState } from "react";
import { Search, Star, Users, Mail, Plus, Globe } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { influencerApi } from "../lib/api";

const platforms = [
  { id: "all", label: "All" },
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "Twitter/X" },
  { id: "youtube", label: "YouTube" },
];

const catalog = [
  { name: "Sarah Chen", handle: "@sarahcreates", platform: "instagram", followers: "2.4M", engagement: "4.8%", niche: "Tech & Lifestyle", location: "San Francisco, CA", avatar: "SC", verified: true },
  { name: "Marcus Johnson", handle: "@marcusj", platform: "youtube", followers: "890K", engagement: "6.2%", niche: "Finance & Investing", location: "New York, NY", avatar: "MJ", verified: true },
  { name: "Emma Wilson", handle: "@emmaw", platform: "twitter", followers: "1.1M", engagement: "3.9%", niche: "Marketing & Growth", location: "London, UK", avatar: "EW", verified: false },
  { name: "David Park", handle: "@davidpark", platform: "instagram", followers: "3.2M", engagement: "5.1%", niche: "Fitness & Health", location: "Los Angeles, CA", avatar: "DP", verified: true },
  { name: "Aisha Patel", handle: "@aishatech", platform: "youtube", followers: "650K", engagement: "7.3%", niche: "AI & Technology", location: "Toronto, CA", avatar: "AP", verified: true },
  { name: "James Miller", handle: "@jamesm", platform: "twitter", followers: "450K", engagement: "5.6%", niche: "SaaS & Startups", location: "Austin, TX", avatar: "JM", verified: false },
  { name: "Lisa Zhang", handle: "@lisaz", platform: "instagram", followers: "1.8M", engagement: "4.2%", niche: "Fashion & Beauty", location: "Miami, FL", avatar: "LZ", verified: true },
  { name: "Ryan Cooper", handle: "@ryancooper", platform: "youtube", followers: "1.5M", engagement: "5.8%", niche: "Gaming & Entertainment", location: "Seattle, WA", avatar: "RC", verified: true },
];

function FindInfluencers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [saved, setSaved] = useState([]);
  const [error, setError] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ name: "", handle: "", platform: "instagram", email: "", niche: "" });
  const [saving, setSaving] = useState(false);

  const loadSaved = async () => {
    try {
      const result = await influencerApi.list();
      setSaved(result.data || []);
    } catch (err) {
      setError(err.message || "Could not load saved influencers");
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const filtered = catalog.filter((inf) => {
    const matchesSearch =
      inf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inf.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inf.niche.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = selectedPlatform === "all" || inf.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  const savedHandle = (handle) => saved.find((item) => item.handle === handle);

  const reachOut = async (inf) => {
    setError("");
    const existing = savedHandle(inf.handle);
    try {
      if (existing) {
        await influencerApi.update(existing.id, {
          status: "contacted",
          lastContact: new Date().toISOString(),
        });
      } else {
        await influencerApi.create({ ...inf, status: "contacted" });
      }
      await loadSaved();
    } catch (err) {
      setError(err.message || "Could not save influencer");
    }
  };

  const toggleSave = async (inf) => {
    setError("");
    const existing = savedHandle(inf.handle);
    try {
      if (existing) {
        await influencerApi.remove(existing.id);
      } else {
        await influencerApi.create({ ...inf, status: "saved" });
      }
      await loadSaved();
    } catch (err) {
      setError(err.message || "Could not update influencer");
    }
  };

  const handleManual = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await influencerApi.create({
        name: manual.name,
        handle: manual.handle,
        platform: manual.platform,
        niche: manual.niche,
        notes: manual.email ? `Reach: ${manual.email}` : "",
        status: "saved",
        avatar: manual.name.slice(0, 2).toUpperCase(),
      });
      setManualOpen(false);
      setManual({ name: "", handle: "", platform: "instagram", email: "", niche: "" });
      await loadSaved();
    } catch (err) {
      setError(err.message || "Could not add influencer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Find Influencers</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Discover and connect with influencers for your campaigns.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Globe /> Filters
          </Button>
          <Button onClick={() => setManualOpen(true)}>
            <Plus /> Add Manually
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, handle, or niche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {platforms.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant={selectedPlatform === p.id ? "default" : "outline"}
              onClick={() => setSelectedPlatform(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Found <span className="font-semibold text-foreground">{filtered.length}</span> influencers · {saved.length} saved
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((inf) => {
          const isSaved = Boolean(savedHandle(inf.handle));
          return (
            <Card key={inf.handle} className="relative overflow-hidden transition-colors hover:border-primary/40">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
              <CardContent className="pt-6">
                <div className="mb-4 flex items-start gap-3">
                  <Avatar className="size-12">
                    <AvatarFallback>{inf.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-semibold">{inf.name}</h3>
                      {inf.verified && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{inf.handle}</p>
                    <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
                      {inf.platform}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isSaved ? "text-primary" : "text-muted-foreground"}
                    onClick={() => toggleSave(inf)}
                  >
                    <Star className={isSaved ? "fill-primary" : ""} />
                  </Button>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 border-y py-3">
                  <div>
                    <div className="text-lg font-bold tabular-nums">{inf.followers}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold tabular-nums text-primary">{inf.engagement}</div>
                    <div className="text-xs text-muted-foreground">Engagement</div>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="border-primary/30 text-primary">{inf.niche}</Badge>
                  <Badge variant="secondary">{inf.location}</Badge>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" size="sm" onClick={() => reachOut(inf)}>
                    <Mail /> Reach Out
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users /> Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center px-4 py-16 text-center">
          <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Search className="size-7" />
          </div>
          <h3 className="text-base font-semibold">No influencers found</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try adjusting your search or filters to discover more influencers.
          </p>
        </div>
      )}

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <form onSubmit={handleManual}>
            <DialogHeader>
              <DialogTitle>Add influencer</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="inf-name">Name</Label>
                <Input id="inf-name" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inf-handle">Handle</Label>
                <Input id="inf-handle" value={manual.handle} onChange={(e) => setManual({ ...manual, handle: e.target.value })} placeholder="@handle" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inf-platform">Platform</Label>
                <select
                  id="inf-platform"
                  value={manual.platform}
                  onChange={(e) => setManual({ ...manual, platform: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter/X</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inf-niche">Niche</Label>
                <Input id="inf-niche" value={manual.niche} onChange={(e) => setManual({ ...manual, niche: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setManualOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FindInfluencers;
