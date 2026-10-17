import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Flame,
  AlertCircle,
  RotateCw,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../components/ui/toast";
import { aseService } from "../../services/ase.service";
import { CallbackCard } from "../../components/ase/CallbackCard";
import { CallbackFilters } from "../../components/ase/CallbackFilters";
import { CallbackSkeletonList } from "../../components/ase/CallbackSkeleton";
import { CallbackEmptyState } from "../../components/ase/CallbackEmptyState";
import { CompleteCallModal } from "../../components/ase/CompleteCallModal";
import { CallbackContextDrawer } from "../../components/ase/CallbackContextDrawer";
import { getCallbackUrgency } from "../../components/ase/CallbackStatusBadge";

export default function AseCallbacks() {
  const [callbacks, setCallbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("overdue");

  const [completingCallback, setCompletingCallback] = useState(null);
  const [contextCallback, setContextCallback] = useState(null);

  const { error: toastError } = useToast();

  const fetchCallbacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aseService.getCallbacks();
      setCallbacks(res.items || []);
    } catch (err) {
      setError(err.message || "Failed to load callback queue.");
      toastError("Load Error", "Could not retrieve callback queue from server.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchCallbacks();
  }, [fetchCallbacks]);

  const counts = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let completed = 0;
    let active = 0;

    callbacks.forEach((cb) => {
      const urgency = getCallbackUrgency(cb.due_at, cb.status);
      if (urgency === "COMPLETED") {
        completed += 1;
      } else {
        active += 1;
        if (urgency === "SLA BREACHED") overdue += 1;
        if (urgency === "DUE NOW" || urgency === "DUE IN 30M") dueSoon += 1;
      }
    });

    return { overdue, dueSoon, completed, active, total: callbacks.length };
  }, [callbacks]);

  const filteredCallbacks = useMemo(() => {
    return callbacks
      .filter((cb) => {
        const urgency = getCallbackUrgency(cb.due_at, cb.status);

        if (statusFilter === "overdue") {
          if (urgency !== "SLA BREACHED") return false;
        } else if (statusFilter === "due_now") {
          if (urgency !== "DUE NOW" && urgency !== "DUE IN 30M") return false;
        } else if (statusFilter === "completed") {
          if (urgency !== "COMPLETED") return false;
        } else if (statusFilter === "all") {
          if (urgency === "COMPLETED" || urgency === "CANCELLED") return false;
        }

        const prio = cb.priority ?? cb.lead_priority ?? 50;
        if (priorityFilter === "p90" && prio < 90) return false;
        if (priorityFilter === "p70" && prio < 70) return false;
        if (priorityFilter === "p50" && prio < 50) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (cb.lead_name || "").toLowerCase().includes(q);
          const matchCompany = (cb.lead_company || "").toLowerCase().includes(q);
          const matchPhone = (cb.lead_phone || "").toLowerCase().includes(q);
          const matchNotes = (cb.notes || "").toLowerCase().includes(q);
          const matchRep = (cb.rep_name || cb.assigned_rep_name || "").toLowerCase().includes(q);
          if (!matchName && !matchCompany && !matchPhone && !matchNotes && !matchRep) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const prioA = a.priority ?? a.lead_priority ?? 50;
        const prioB = b.priority ?? b.lead_priority ?? 50;
        const dueA = a.due_at ? new Date(a.due_at).getTime() : Infinity;
        const dueB = b.due_at ? new Date(b.due_at).getTime() : Infinity;
        const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;

        if (sortBy === "overdue") {
          return dueA - dueB;
        }
        if (sortBy === "due_asc") {
          return dueA - dueB;
        }
        if (sortBy === "priority_desc") {
          return prioB - prioA;
        }
        if (sortBy === "newest") {
          return createdB - createdA;
        }
        return 0;
      });
  }, [callbacks, statusFilter, priorityFilter, searchQuery, sortBy]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Autonomous Sales Callback Queue
            </h1>
            {counts.overdue > 0 && (
              <Badge variant="destructive" className="animate-pulse font-semibold gap-1.5 px-2.5 py-0.5">
                <Flame className="w-3.5 h-3.5" />
                {counts.overdue} SLA Breached
              </Badge>
            )}
            {counts.dueSoon > 0 && (
              <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-semibold gap-1 px-2.5 py-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {counts.dueSoon} Due Soon
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Real-time human escalation queue for high-priority inbound lead callbacks with automated SLA monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link to="/ase/team-console">
              <Phone className="w-4 h-4 mr-2 text-primary" />
              Team Console
            </Link>
          </Button>
        </div>
      </div>

      <CallbackFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onRefresh={fetchCallbacks}
        loading={loading}
        counts={counts}
      />

      {error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50/60 dark:bg-rose-950/30 p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200">
            Failed to Load Callbacks
          </h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">
            {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCallbacks}
            className="border-rose-300 text-rose-800 hover:bg-rose-100 dark:text-rose-200 gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Retry
          </Button>
        </div>
      ) : loading ? (
        <CallbackSkeletonList count={4} />
      ) : filteredCallbacks.length === 0 ? (
        <CallbackEmptyState
          onRefresh={fetchCallbacks}
          isFiltered={Boolean(searchQuery || statusFilter !== "all" || priorityFilter !== "all")}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCallbacks.map((cb) => (
            <CallbackCard
              key={cb.id}
              callback={cb}
              onComplete={(item) => setCompletingCallback(item)}
              onOpenContext={(item) => setContextCallback(item)}
            />
          ))}
        </div>
      )}

      {completingCallback && (
        <CompleteCallModal
          callback={completingCallback}
          isOpen={Boolean(completingCallback)}
          onClose={() => setCompletingCallback(null)}
          onSuccess={fetchCallbacks}
        />
      )}

      {contextCallback && (
        <CallbackContextDrawer
          leadId={contextCallback.lead_id}
          isOpen={Boolean(contextCallback)}
          onClose={() => setContextCallback(null)}
        />
      )}
    </div>
  );
}
