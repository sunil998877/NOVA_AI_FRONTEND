import React, { useState, useEffect } from "react";
import { Plus, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { useToast } from "../components/ui/toast";
import { conversationApi } from "../lib/api";

export default function ConversationsManager() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await conversationApi.list();
      setConversations(res.data || []);
    } catch (err) {
      toastError("Error", err.message || "Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await conversationApi.remove(id);
      success("Deleted", "Conversation deleted successfully.");
      fetchConversations();
    } catch (err) {
      toastError("Error", err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Conversations Manager</h1>
          <p className="text-muted-foreground mt-1">Manage underlying conversation data linking Influencers and Campaigns.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Start Conversation
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>All Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Influencer ID</TableHead>
                  <TableHead>Campaign ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : conversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No conversations found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  conversations.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">#{conv.id}</TableCell>
                      <TableCell>{conv.influencer_id || "-"}</TableCell>
                      <TableCell>{conv.campaign_id || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{conv.status}</Badge>
                      </TableCell>
                      <TableCell>{conv.title || "Chat"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(conv.id)}>
                          <Trash2 className="h-4 w-4" />
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

      <AddConversationDialog 
        open={addOpen} 
        onOpenChange={setAddOpen} 
        onSuccess={fetchConversations} 
      />
    </div>
  );
}

function AddConversationDialog({ open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({ influencer_id: "", campaign_id: "", title: "New Chat" });
  const [loading, setLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await conversationApi.create({
        influencer_id: formData.influencer_id ? Number(formData.influencer_id) : null,
        campaign_id: formData.campaign_id ? Number(formData.campaign_id) : null,
        title: formData.title
      });
      success("Created", "Conversation started successfully.");
      onSuccess();
      onOpenChange(false);
      setFormData({ influencer_id: "", campaign_id: "", title: "New Chat" });
    } catch (err) {
      toastError("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogDescription>Manually create a conversation record.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="influencer_id">Influencer ID (Optional)</Label>
            <Input 
              id="influencer_id"
              type="number" 
              placeholder="e.g. 5" 
              value={formData.influencer_id} 
              onChange={(e) => setFormData({ ...formData, influencer_id: e.target.value })} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign_id">Campaign ID (Optional)</Label>
            <Input 
              id="campaign_id"
              type="number" 
              placeholder="e.g. 12" 
              value={formData.campaign_id} 
              onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Conversation Title</Label>
            <Input 
              id="title"
              placeholder="e.g. Outreach - Tech Video" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Start Conversation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
