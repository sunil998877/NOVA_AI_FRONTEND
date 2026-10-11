import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Users,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { useToast } from "../../components/ui/toast";

export default function AseSegments() {
  const [segments, setSegments] = useState([
    {
      id: 1,
      name: "High Priority Tech Prospects",
      criteria: "Priority >= 80 • Industry = Enterprise SaaS",
      leadCount: 42,
      createdAt: "2026-10-01",
    },
    {
      id: 2,
      name: "Hot Callbacks Requiring Human Follow-up",
      criteria: "Status = CALLBACK_SCHEDULED • Health = AMBER / RED",
      leadCount: 5,
      createdAt: "2026-10-03",
    },
    {
      id: 3,
      name: "Website API Inbound",
      criteria: "Source = API • Consent = GRANTED",
      leadCount: 68,
      createdAt: "2026-09-28",
    },
  ]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newSegment, setNewSegment] = useState({ name: "", criteria: "" });
  const { success } = useToast();

  const handleCreate = (e) => {
    e.preventDefault();
    setSegments([
      ...segments,
      {
        id: Date.now(),
        name: newSegment.name,
        criteria: newSegment.criteria || "Custom Rule Criteria",
        leadCount: Math.floor(Math.random() * 30) + 5,
        createdAt: new Date().toISOString().split("T")[0],
      },
    ]);
    success("Segment Created", `Segment "${newSegment.name}" saved.`);
    setCreateOpen(false);
    setNewSegment({ name: "", criteria: "" });
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Segments</h1>
          <p className="text-muted-foreground mt-1">
            Dynamic audience criteria to target autonomous cadences by industry, priority, and source.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Segment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {segments.map((s) => (
          <Card key={s.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">Dynamic Segment</Badge>
                <span className="text-xs text-muted-foreground">{s.createdAt}</span>
              </div>
              <CardTitle className="text-base mt-2">{s.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2">{s.criteria}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between pt-2 border-t text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Users className="w-4 h-4 text-primary" /> {s.leadCount} Matched Leads
                </span>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/ase/leads?segment=${s.id}`}>
                    View Leads <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Segment</DialogTitle>
            <DialogDescription>Define rule criteria to filter target leads.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Segment Name</Label>
              <Input
                required
                value={newSegment.name}
                onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                placeholder="e.g. High Priority US Healthcare"
              />
            </div>
            <div className="space-y-2">
              <Label>Filter Expression / Description</Label>
              <Input
                value={newSegment.criteria}
                onChange={(e) => setNewSegment({ ...newSegment, criteria: e.target.value })}
                placeholder="e.g. Priority >= 75 AND Industry = Healthcare"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Segment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
