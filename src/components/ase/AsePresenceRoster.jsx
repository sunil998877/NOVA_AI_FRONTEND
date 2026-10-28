import React from "react";
import { Circle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { useAsePresence } from "../../hooks/useAsePresence";

const DOT = {
  AVAILABLE: "text-emerald-500",
  ON_CALL: "text-rose-500",
  AWAY: "text-amber-500",
  OFFLINE: "text-muted-foreground",
};

function stateLabel(state) {
  if (state === "AVAILABLE") return "Available";
  if (state === "ON_CALL") return "On call";
  if (state === "AWAY") return "Away";
  return "Offline";
}

export default function AsePresenceRoster() {
  const { summary } = useAsePresence();
  const reps = summary.reps || [];

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rep presence
          </p>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">{summary.freeNow} free now</Badge>
            <Badge variant="outline" className="text-[10px]">{summary.onCall} on call</Badge>
            <Badge variant="outline" className="text-[10px]">{summary.freeWithin} free ≤ {summary.transferWindowSeconds}s</Badge>
          </div>
        </div>
        {reps.length === 0 ? (
          <p className="text-xs text-muted-foreground">No ASE sockets connected. Overnight pacing still uses not-on-call reps.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {reps.map((rep) => (
              <div key={rep.userId} className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
                <Circle className={`size-2 fill-current ${DOT[rep.state] || DOT.OFFLINE}`} />
                <span className="font-medium">{rep.name || `Rep ${rep.userId}`}</span>
                <span className="text-muted-foreground">{stateLabel(rep.state)}</span>
                {rep.state === "ON_CALL" && Number(rep.freeWithinSeconds) > 0 ? (
                  <span className="text-muted-foreground">· {rep.freeWithinSeconds}s</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
