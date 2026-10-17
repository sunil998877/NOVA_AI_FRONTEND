import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  AlertTriangle,
  Sliders,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { useToast } from "../../components/ui/toast";
import { aseService } from "../../services/ase.service";

export default function AseCompliance() {
  const [suppressions, setSuppressions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: "EMAIL", value: "", reason: "Opt-out request" });
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchSuppressions();
  }, []);

  async function fetchSuppressions() {
    setLoading(true);
    try {
      const data = await aseService.getSuppressions();
      setSuppressions(data || []);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await aseService.addSuppression(newEntry);
      success("Added", `Added ${newEntry.value} to global suppression list`);
      setAddOpen(false);
      setNewEntry({ type: "EMAIL", value: "", reason: "Opt-out request" });
      fetchSuppressions();
    } catch (err) {
      toastError("Error", err.message);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove this entry from the suppression list?")) return;
    try {
      await aseService.removeSuppression(id);
      success("Removed", "Suppression entry removed");
      fetchSuppressions();
    } catch (err) {
      toastError("Error", err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance & Governance</h1>
          <p className="text-muted-foreground mt-1">
            Global DNC suppression, per-channel consent policies, and frequency fatigue safeguards.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Suppression
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            <CardTitle>Autonomous Contact Frequency Safeguards</CardTitle>
          </div>
          <CardDescription>
            Enforced by the Orchestrator to prevent prospect over-contacting across channels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 border rounded-lg bg-card">
              <span className="text-xs text-muted-foreground block">Max Email Touches</span>
              <span className="text-xl font-bold text-foreground">3 Contacts Max</span>
              <span className="text-[11px] text-muted-foreground block mt-1">Per prospect lifetime</span>
            </div>
            <div className="p-3 border rounded-lg bg-card">
              <span className="text-xs text-muted-foreground block">Max Phone Calls</span>
              <span className="text-xl font-bold text-foreground">2 Dials Max</span>
              <span className="text-[11px] text-muted-foreground block mt-1">Autonomous first outreach</span>
            </div>
            <div className="p-3 border rounded-lg bg-card">
              <span className="text-xs text-muted-foreground block">Minimum Gap Between Touches</span>
              <span className="text-xl font-bold text-foreground">24 Hours Minimum</span>
              <span className="text-[11px] text-muted-foreground block mt-1">Durable timer backoff</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Global Suppression & DNC List</CardTitle>
              <CardDescription>
                Suppressed entries immediately override all campaigns and prevent automated dispatching.
              </CardDescription>
            </div>
            <Badge variant="destructive" className="text-xs">
              {suppressions.length} Active Suppressions
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Suppressed Target Value</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading suppression list...
                    </TableCell>
                  </TableRow>
                ) : suppressions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No suppressions active.
                    </TableCell>
                  </TableRow>
                ) : (
                  suppressions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Badge variant="outline">{s.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.value}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.reason}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.created_at || "2026-10-01"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRemove(s.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Global Suppression</DialogTitle>
            <DialogDescription>
              Block an email address, phone number, or domain from all automated contact.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="w-full border rounded p-2 text-sm bg-background"
                value={newEntry.type}
                onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
              >
                <option value="EMAIL">Email Address</option>
                <option value="PHONE">Phone Number</option>
                <option value="DOMAIN">Entire Domain</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                required
                value={newEntry.value}
                onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })}
                placeholder="e.g. prospect@company.com or +1555..."
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={newEntry.reason}
                onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                placeholder="e.g. Unsubscribe / Legal DNC request"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Add Suppression</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
