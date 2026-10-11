import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Flame,
  Phone,
  Mail,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { aseService } from "../../services/ase.service";

const COLUMNS = [
  { key: "NEW", label: "New", color: "border-blue-500" },
  { key: "CONTACTED", label: "Contacted", color: "border-cyan-500" },
  { key: "ENGAGED", label: "Engaged", color: "border-indigo-500" },
  { key: "INTERESTED", label: "Interested", color: "border-emerald-500" },
  { key: "CALLBACK_SCHEDULED", label: "Callback", color: "border-amber-500" },
  { key: "CLOSED_WON", label: "Won", color: "border-green-600" },
  { key: "CLOSED_LOST", label: "Lost", color: "border-slate-400" },
  { key: "SUPPRESSED_DNC", label: "DNC", color: "border-rose-500" },
];

export default function AsePipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await aseService.getLeads();
        setLeads(res.items || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getLeadsByStatus = (status) => leads.filter((l) => l.status === status);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Kanban</h1>
          <p className="text-muted-foreground mt-1">
            Visual progression of leads across autonomous outreach stages and rep handoffs.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/ase/leads">Table View</Link>
        </Button>
      </div>

      {/* Kanban Board Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colLeads = getLeadsByStatus(col.key);
          const isTerminal = ["CLOSED_WON", "CLOSED_LOST", "SUPPRESSED_DNC"].includes(col.key);

          return (
            <div
              key={col.key}
              className={`flex-shrink-0 w-72 rounded-lg border bg-muted/20 flex flex-col max-h-[750px] border-t-4 ${col.color}`}
            >
              <div className="p-3 border-b flex items-center justify-between bg-card rounded-t">
                <span className="font-semibold text-xs tracking-wider uppercase">{col.label}</span>
                <Badge variant="secondary" className="text-xs">{colLeads.length}</Badge>
              </div>

              <div className="p-2 flex-1 overflow-y-auto space-y-2">
                {colLeads.map((lead) => (
                  <Card key={lead.id} className="shadow-none hover:border-primary/50 transition-colors">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <Link
                          to={`/ase/leads/${lead.id}`}
                          className="font-semibold text-xs hover:underline text-primary truncate max-w-[170px]"
                        >
                          {lead.name}
                        </Link>
                        <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                          P-{lead.priority}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-muted-foreground truncate">
                        {lead.company || lead.email}
                      </div>

                      {lead.next_action && !isTerminal && (
                        <div className="text-[10px] text-primary font-medium flex items-center gap-1 bg-primary/5 p-1 rounded">
                          {lead.next_action === "EMAIL" ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                          Next: {lead.next_action}
                        </div>
                      )}

                      {isTerminal && (
                        <div className="text-[10px] text-muted-foreground italic">
                          Outreach Complete
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {colLeads.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
