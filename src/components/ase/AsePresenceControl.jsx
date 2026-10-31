import React from "react";
import { Circle } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAsePresence } from "../../hooks/useAsePresence";

const OPTIONS = [
  { id: "AVAILABLE", label: "Available", hint: "Ready for new dials" },
  { id: "ON_CALL", label: "On call", hint: "Free within 12 seconds", freeWithinSeconds: 12 },
  { id: "AWAY", label: "Away", hint: "Not taking new work" },
];

const DOT = {
  AVAILABLE: "text-emerald-500",
  ON_CALL: "text-rose-500",
  AWAY: "text-amber-500",
  OFFLINE: "text-muted-foreground",
};

export default function AsePresenceControl() {
  const { self, summary, isConnected, setPresence } = useAsePresence();
  const state = self?.state || (isConnected ? "AVAILABLE" : "OFFLINE");
  const option = OPTIONS.find((row) => row.id === state);
  const label = option?.label || "Offline";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 px-2.5 text-xs">
          <Circle className={`size-2.5 fill-current ${DOT[state] || DOT.OFFLINE}`} />
          <span className="hidden sm:inline">{label}</span>
          <span className="text-muted-foreground hidden lg:inline">
            {summary.freeNow} free
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Your ASE presence</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map((row) => (
          <DropdownMenuItem
            key={row.id}
            onClick={() => setPresence(row.id, row.freeWithinSeconds || 0)}
          >
            <Circle className={`size-2.5 fill-current ${DOT[row.id]}`} />
            <span>
              {row.label}
              <span className="block text-[11px] text-muted-foreground">{row.hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
