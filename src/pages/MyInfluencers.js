import React, { useEffect, useState } from "react";
import { Mail, Trash2, Pencil, MessageSquare, ChartBar, EllipsisVertical, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { influencerApi } from "../lib/api";
import { formatDate } from "../lib/auth";
import { useToast } from "../components/ui/toast";

function MyInfluencers() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await influencerApi.list();
      setInfluencers(result.data || []);
    } catch (err) {
      setError(err.message || "Could not load influencers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getStatusBadge = (status) => {
    if (status === "contacted") return <Badge variant="outline" className="border-primary/40 text-primary">Contacted</Badge>;
    if (status === "negotiating") return <Badge>Negotiating</Badge>;
    if (status === "collaborating") return <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/20">Collaborating</Badge>;
    return <Badge variant="outline">{status || "Saved"}</Badge>;
  };

  const handleDelete = async (id) => {
    try {
      await influencerApi.remove(id);
      setInfluencers((prev) => prev.filter((inf) => inf.id !== id));
      toast.success("Influencer removed");
    } catch (err) {
      toast.error("Could not remove influencer", err.message);
    }
  };

  const cycleStatus = async (inf) => {
    const order = ["saved", "contacted", "negotiating", "collaborating"];
    const next = order[(Math.max(order.indexOf(inf.status), 0) + 1) % order.length];
    try {
      const updated = await influencerApi.update(inf.id, { status: next, lastContact: new Date().toISOString() });
      setInfluencers((prev) => prev.map((item) => (item.id === inf.id ? updated : item)));
      toast.info("Status updated", `Moved to ${next}.`);
    } catch (err) {
      toast.error("Could not update status", err.message);
    }
  };

  const stats = [
    { label: "Total Saved", value: influencers.length },
    { label: "Contacted", value: influencers.filter((i) => i.status === "contacted").length },
    { label: "Negotiating", value: influencers.filter((i) => i.status === "negotiating").length },
    { label: "Collaborating", value: influencers.filter((i) => i.status === "collaborating").length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">My Influencers</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage your saved influencer relationships and collaborations.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2">
          <span className="size-2 rounded-full bg-primary" />
          <span className="text-sm font-semibold">{influencers.length} Saved</span>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 text-center">
              <div className="text-2xl font-bold tabular-nums text-primary md:text-3xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Influencer</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {influencers.map((inf) => (
              <TableRow key={inf.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{inf.avatar || (inf.name || "N").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{inf.name}</div>
                      <div className="text-xs text-muted-foreground">{inf.handle}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs capitalize text-muted-foreground">
                    {inf.platform || "—"}
                  </span>
                </TableCell>
                <TableCell className="font-semibold tabular-nums">{inf.followers || "—"}</TableCell>
                <TableCell className="font-semibold text-primary">{inf.engagement || "—"}</TableCell>
                <TableCell>{getStatusBadge(inf.status)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(inf.lastContact)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{inf.notes || "—"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <EllipsisVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={async () => {
                          try {
                            const updated = await influencerApi.update(inf.id, {
                              status: "contacted",
                              lastContact: new Date().toISOString(),
                            });
                            setInfluencers((prev) => prev.map((item) => (item.id === inf.id ? updated : item)));
                          } catch (err) {
                            setError(err.message || "Could not update influencer");
                          }
                        }}
                      >
                        <Mail /> Mark contacted
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => cycleStatus(inf)}>
                        <MessageSquare /> Advance status
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ChartBar /> View Stats
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(inf.id)}
                      >
                        <Trash2 /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {influencers.length === 0 && (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Star className="size-7" />
            </div>
            <h3 className="text-base font-semibold">{loading ? "Loading..." : "No saved influencers yet"}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Go to Find Influencers to discover and save influencers for your campaigns.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default MyInfluencers;
