import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { aseService } from "../../services/ase.service";
import { useToast } from "../../components/ui/toast";
import { segmentLeadsHref } from "../../lib/aseReports";

export default function AseSegments() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { error: toastError } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await aseService.getSegments();
        if (!cancelled) {
          setSegments(data);
          setFailed(false);
        }
      } catch (err) {
        if (!cancelled) {
          setSegments([]);
          setFailed(true);
          toastError("Segments unavailable", err.message || "Could not load live filters");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Segments</h1>
          <p className="text-muted-foreground mt-1">
            Live counts from real Lead Store filters — priority, status, health, source, consent, DNC.
          </p>
        </div>
      </div>

      {failed && !loading && (
        <p className="text-sm text-rose-600">Segments could not be loaded. No placeholder audiences are shown.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card>
            <CardContent className="py-10 text-sm text-muted-foreground">Loading live segments…</CardContent>
          </Card>
        ) : segments.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-sm text-muted-foreground">
              {failed ? "No segment data." : "No matching leads in any live segment."}
            </CardContent>
          </Card>
        ) : (
          segments.map((s) => (
            <Card key={s.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">Live filter</Badge>
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
                    <Link to={segmentLeadsHref(s)}>
                      View Leads <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
